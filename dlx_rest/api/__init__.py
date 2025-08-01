'''
DLX REST API
'''

# external
from http.client import HTTPResponse
from dlx_rest.routes import login, search_files
import os, time, json, re, boto3, mimetypes, jsonschema, threading
from datetime import datetime, timezone
from copy import copy, deepcopy
from urllib.parse import quote, unquote
from flask import Flask, Response, g, url_for, jsonify, request, abort as flask_abort, send_file
from flask_restx import Resource, Api, reqparse, fields
from flask_login import login_required, current_user
from base64 import b64decode
from mongoengine.document import Document
from pymongo.errors import ExecutionTimeout, OperationFailure
from pymongo.collation import Collation
from bson import Regex, SON
from dlx import DB, Config as DlxConfig
from dlx.marc import MarcSet, BibSet, Bib, AuthSet, Auth, Field, Controlfield, Datafield, \
    Query, Condition, Or, InvalidAuthValue, InvalidAuthXref, AuthInUse
from dlx.marc.query import InvalidQueryString, AtlasQuery
from dlx.marc.query import Raw
from dlx.file import File, Identifier, FileExists, FileExistsConflict, FileExistsIdentifierConflict, FileExistsLanguageConflict
from dlx.util import AsciiMap

# internal
from dlx_rest.config import Config
from dlx_rest.app import app, login_manager
from dlx_rest.models import RecordView, User, Basket, requires_permission, register_permission, DoesNotExist
from dlx_rest.api.utils import ClassDispatch, URL, ApiResponse, Schemas, abort, brief_bib, brief_auth, brief_speech, item_locked, has_permission, get_record_files

# Init

# build the auth cache in a non blocking thread
def build_cache(): Auth.build_cache()

threading.Thread(target=build_cache, args=[]).start()

api = Api(app, doc='/api/', authorizations={'basic': {'type': 'basic'}})
ns = api.namespace('api', description='DLX MARC REST API')
    
# Set up the login manager for the API
@login_manager.request_loader
def request_loader(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    if 'Bearer ' in auth_header:
        # Try a token first
        token = auth_header.replace('Bearer ','',1)
        user = User.verify_auth_token(token)
        if user:
            return user
        return None
    elif 'Basic ' in auth_header:
        # Now try username and password in basic http auth
        email,password = b64decode(auth_header.replace('Basic ','',1)).decode('utf-8').split(':')
        try:
            user = User.objects.get(email=email)
            if not user.check_password(password):
                return None
        except:
            return None
        g.user = user
        return user

### Routes

# Authentication
@ns.route('/token')
class AuthToken(Resource):
    @login_required
    def get(self):
        token = g.user.generate_auth_token()        
        return jsonify({ 'token': token.decode('ascii') })

# Schemas
@ns.route('/schemas')
class SchemasList(Resource):
    @ns.doc(description='The schemas of the API\'s JSON resources')
    def get(self):
        names = (
            'api.response',
            'api.urllist',
            'api.basket',
            'api.basket.item.batch',
            'api.basket.item',
            'api.brieflist',
            'jmarc',
            'jmarc.preview',
            'jmarc.workform', 
            'jfile', 
            'jmarc.batch',
            'jmarc.controlfield', 
            'jmarc.datafield', 
            'jmarc.subfield', 
            'jmarc.subfield.value',
            'api.null'
        )
        
        links = {
            '_self': URL('api_schemas_list').to_str()
        }
        meta = {
            'name': 'api_schemas_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }
        response = ApiResponse(links=links, meta=meta, data=[URL('api_schema', schema_name=name).to_str() for name in names])
        
        return response.jsonify()

# Schema
@ns.route('/schemas/<string:schema_name>')
class Schema(Resource):
    @ns.doc(description='Returns an instance of JSON Schema')
    def get(self, schema_name):
        schema = Schemas.get(schema_name)
        
        return jsonify(schema)

# Collections
@ns.route('/marc')
class CollectionsList(Resource):
    @ns.doc(description='Return a list of the collection endpoints')
    def get(self):
        meta = {
            'name': 'api_collections_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }

        links = {
            '_self': URL('api_collections_list').to_str()
        }
        
        response = ApiResponse(links=links, meta=meta, data=[URL('api_collection', collection=col).to_str() for col in ('bibs', 'auths')])
        
        return response.jsonify()

# Collection        
@ns.route('/marc/<string:collection>')
@ns.param('collection', '"bibs" or "auths"')
class Collection(Resource):
    @ns.doc(description='Return information about the available record collections.')
    def get(self, collection):
        collection in ClassDispatch.list_names() or abort(404)

        meta = {
            'name': 'api_collection',
            'returns': URL('api_schema', schema_name='api.null').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }
        links = {
            '_self': URL('api_collection', collection=collection).to_str(),
            'related': {
                'records': URL('api_records_list', collection=collection).to_str(),
                'workforms': URL('api_workforms_list', collection=collection).to_str(),
                'lookup': URL('api_lookup_fields_list', collection=collection).to_str(),
                'logical_fields': URL('api_collection_logical_fields', collection=collection).to_str()
            }
        }
        
        response = ApiResponse(links=links, meta=meta, data={})
        
        return response.jsonify()
    
# Logical Fields
@ns.route('/marc/<string:collection>/logical_fields')
@ns.param('collection', '"bibs" or "auths"')
class CollectionLogicalFields(Resource):
    args = reqparse.RequestParser()
    args.add_argument(
        'subtype',
        type=str,
        choices=['','all','default','speech','vote'],
        help='Record collection subtype',
        default='default'
    )

    @ns.doc(description='Return the logical fields for a collection and optional subtype.')
    @ns.expect(args)
    def get(self, collection):
        collection in ClassDispatch.list_names() or abort(404)
        args = CollectionLogicalFields.args.parse_args()

        # Get the logical field config
        logical_fields = list(getattr(DlxConfig, f"{collection.strip('s')}_logical_fields").keys())
        
        # Remove special fields for default type
        if args.subtype == 'default':
            for f in filter(lambda x: x in logical_fields, ('notes', 'speaker', 'country_org')):
                logical_fields.remove(f)

        # Override for specific subtypes  
        if args.subtype == 'speech':
            logical_fields = ['symbol', 'country_org', 'speaker', 'agenda', 'related_docs', 'bib_creator']
        elif args.subtype == 'vote':
            logical_fields = ['symbol', 'body', 'agenda', 'bib_creator']

        meta = {
            'name': 'api_collection_logical_fields',
            'returns': URL('api_schema', schema_name='api.collection.fields').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }

        links = {
            '_self': URL('api_collection_logical_fields', collection=collection).to_str(),
            'related': {
                'collection': URL('api_collection', collection=collection).to_str()
            }
        }

        response = ApiResponse(links=links, meta=meta, data={"logical_fields": logical_fields})
        
        return response.jsonify()

# Records
@ns.route('/marc/<string:collection>/records')
@ns.param('collection', '"bibs" or "auths"')
class RecordsList(Resource):
    args = reqparse.RequestParser()
    args.add_argument(
        'start', 
        type=int, 
        help='Result to start list at',
        default=1
    )
    args.add_argument(
        'limit', type=int,
        help='Number of results to return. Max is 1000',
        default=100,
    )
    args.add_argument(
        'sort',
        type=str,
        choices=['relevance', 'updated', 'created', 'date', 'symbol', 'title', 'subject', 'heading', 'country_org', 'speaker', 'body', 'agenda'],
    )
    args.add_argument(
        'direction', type=str, 
        choices=['asc', 'desc'],
        help='Sort direction',
        default='asc'
    )
    args.add_argument(
        'format', 
        type=str, 
        choices=['json', 'xml', 'mrk', 'mrc', 'csv', 'tsv', 'brief', 'brief_speech'],
        help='Formats the list as a batch of records in the specified format'
    )
    args.add_argument(
        'search', 
        type=str, 
        help='Consult documentation for query syntax' # todo
    )
    args.add_argument(
        'subtype',
        type=str,
        choices=['default', 'speech', 'vote', 'all', '']
    )
    args.add_argument(
        'fields',
        type=str,
        help='Comma separated list of fields you want returned (e.g., for export)'
    )
     # This is so we can benchmark the two search formats
    args.add_argument(
        'engine',
        type=str,
        choices=['community','atlas'],
        help='Toggle the search type between Atas and Community',
        default='community'
    )
    args.add_argument(
        'search_id',
        type=str,
        help='Use with the "_next" or "_prev" links to access search cache for faster pagination'
    )
    
    @ns.doc(description='Return a list of MARC Bibliographic or Authority Records')
    @ns.expect(args)
    def get(self, collection):
        cls = ClassDispatch.batch_by_collection(collection) or abort(404)
        args = RecordsList.args.parse_args()

        # We can also note some things about the requesting user's basket here, since this route, and all others, require login
        if not current_user.is_anonymous:
            this_u = User.objects.get(id=current_user['id'])
            this_basket = Basket.objects(owner=this_u)[0]
        else:
            this_basket = None

        # Get all of the baskets so we can speed up the fetch/render; note that we could just do a database search here...
        all_basket_objects = []
        for basket in Basket.objects:
            for item in basket.items:
                if item not in all_basket_objects:
                    all_basket_objects.append(item)
        
        # search
        search_string = unquote(args.search) if args.search else None
        # subtype
        type_condition = Raw(
            {'_record_type': {'$in': ['default', 'speech', 'vote']} if args.subtype == 'all' else args.subtype if args.subtype else 'default'}
        )
            
        if args.engine in (None, "community"):
            try:
                query = Query.from_string(search_string, record_type=collection[:-1]) if search_string else Query()
            except InvalidQueryString as e:
                abort(422, str(e))

            query.conditions.append(type_condition)
        elif args.engine == "atlas":
            try:
                query = AtlasQuery.from_string(search_string, record_type=collection[:-1]) if search_string else AtlasQuery()
                
                if hasattr(query, 'match'):
                    if query.match:
                        # todo: fix this in dlx. `query.match.conditions` should be an array instad of tuple
                        query.match.conditions = [*query.match.conditions]
                        query.match.conditions.append(type_condition)
                    else:
                        query.match = Query(type_condition)
                else:
                    query.match = type_condition
            except InvalidQueryString as e:
                abort(422, str(e))
        else:
            query = Query({})

        # start
        start = 1 if args.start is None else int(args.start)
          
        # limit  
        limit = int(args.limit or 100)
        
        # format
        fmt = args['format'] or None

        if limit > 1000:
            abort(404, 'Maximum limit is 1000')
        
        subfield_projection = {}

        if fmt == 'brief':
            tags = ['099', '191', '245', '269', '520', '596', '700', '710', '711', '791', '989', '991', '992'] if collection == 'bibs' \
                else ['100', '110', '111', '130', '150', '151', '190', '191', '400', '410', '411', '430', '450', '451', '490', '491', '591', '667']
            
            # make sure logical fields are available for sorting
            tags += (list(DlxConfig.bib_logical_fields.keys()) + list(DlxConfig.auth_logical_fields.keys()))
            project = dict.fromkeys(tags, True)
        elif fmt == 'brief_speech':
            tags = ['269', '596', '700', '710', '711', '791', '991', '992']
            
            # make sure logical fields are available for sorting
            tags += (list(DlxConfig.bib_logical_fields.keys()) + list(DlxConfig.auth_logical_fields.keys()))
            project = dict.fromkeys(tags, True)
        elif fmt in ['mrk', 'xml', 'csv'] and args.get('fields'):
            tags = []

            for f in [x.strip() for x in args.get("fields").split(',')]:
                if match := re.match(r'(\d{3})(__([a-z0-9]))?', f):
                    tag, code = match.group(1, 3)
                    
                    if code:
                        # use this dict later to filter only the wanted subfields
                        subfield_projection.setdefault(tag, [])
                        subfield_projection[tag].append(code)
                    
                    tags.append(tag)
            
            # make sure logical fields are available for sorting
            tags += (list(DlxConfig.bib_logical_fields.keys()) + list(DlxConfig.auth_logical_fields.keys()))
            project = dict.fromkeys(tags, True)
        elif fmt:
            project = None
        else:
            project = {'_id': 1}
          
        # sort
        sort_by = args.get('sort') or 'updated'
        sort_by = 'symbol' if sort_by == 'meeting record' else sort_by
        sort_by = 'date' if sort_by == 'meeting date' else sort_by
        sort_by = '_id' if sort_by == 'created' else sort_by # all ids have been created sequentially
        sort_object = [(sort_by, -1)] if (args['direction'] or '').lower() == 'desc' else [(sort_by, 1)]

        # collation is not implemented in mongomock
        collation = DlxConfig.marc_index_default_collation if Config.TESTING == False else None

        pipeline = [
            {'$match': query.match.compile()} if isinstance(query, AtlasQuery) else {'$match': query.compile()},
            {'$sort': {sort_by: -1 if args.get('direction').lower() == 'desc' else 1}},
            {'$project': {'_id': 1}}
        ]

        if sort_by != '_id':
            # Add _id to sort fields to ensure no duplicates between pages
            next(filter(lambda x: x.get('$sort'), pipeline)).get('$sort').update({'_id': 1})

        # revert the param name back to created for use in the returned links
        sort_by = 'created' if sort_by == '_id' else sort_by

        # $facet does not perform well when there is no query or the only field is _record_type?
        if not query.conditions or (len(query.conditions) == 1 and query.compile().get('_record_type')):
            pipeline += [{'$skip': start - 1}, {'$limit': limit}] #, {'$replaceWith': {'data': ['$$ROOT']}}]
        else:
            # https://codebeyondlimits.com/articles/pagination-in-mongodb-the-only-right-way-to-implement-it-and-avoid-common-mistakes
            pipeline.append({
                '$facet': {
                    'metadata': [{'$count': 'total'}],
                    'data': [{'$skip': start - 1}, {'$limit': limit}]
                }
            })

        # Use the search ID provided in the params if it exists, otherwise create a new one
        import uuid
        search_id = args.search_id or str(uuid.uuid4())

        # Raw results are expected later to be in a field called data['data']
        data = {}

        try:
            # Create the data structure that is basically a list of records with only the _id field. 
            if doc := DB.handle.get_collection('_search_cache').find_one({'_id': search_id, 'ready': {'gte': start + limit}}): 
                ids = doc.get(ids)[start-1:start+limit-1]
                data['data'] = [{'_id': x} for x in ids]
            elif next(filter(lambda x: x.get('$facet'), pipeline), None):
                data = next(DB.handle[collection].aggregate(pipeline, collation=collation, maxTimeMS=Config.MAX_QUERY_TIME))
            else:
                data['data'] = DB.handle[collection].aggregate(pipeline, collation=collation, maxTimeMS=Config.MAX_QUERY_TIME)
        except ExecutionTimeout as e:
            abort(408, f'Search query timed out ({Config.MAX_QUERY_TIME / 1000} seconds)')
        except Exception as e:
            raise e

        if args.search_id is None and args.search:
            # In a separate thread, populate a cache of all the result IDs. This will be used the next time 
            # a request is made to this route with the the serach_id as a param. 
            # Note: It's possible this should be handled in dlx since it is interacting directly with the DB.

            def savecache():
                from pymongo import UpdateOne

                DB.handle.get_collection('_search_cache').replace_one( # not authorized to use insert_one?
                    {'_id': search_id},
                    {
                        'collection': collection,
                        'search': search_string,
                        'sort': sort_by,
                        'direction': args.direction,
                        'ready': 0
                    },
                    upsert=True
                )
                
                updates = []

                for record in cls.from_query(query, sort=sort_object, projection={'_id': 1}):
                    updates.append(
                        UpdateOne(
                            {'_id': search_id},
                            {'$push': {'ids': record.id}, '$inc': {'ready': 1}},
                        )
                    )

                    if len(updates) == 1000:
                        DB.handle.get_collection('_search_cache').bulk_write(updates)
                        updates = []

                if updates:
                    # catch the rest
                    DB.handle.get_collection('_search_cache').bulk_write(updates)

            threading.Thread(target=savecache, args=[]).start()
        
        if metadata := data.get('metadata'):
            total = metadata[0]['total'], # is a tuple for some reason
        elif args.search:
            # there is no count metadata because there were no results
            total = (0,)
        else:
            # we don't have the count yet becuae we did not use the $facet ag stage
            total = (-1,)

        recordset =  cls.from_query(
            {'_id': {'$in': [x['_id'] for x in ([] if total == 0 else data.get('data'))]}},
            projection=project,
            sort=sort_object,
            collation=collation
        )
        
        if x := subfield_projection:
            # filter only the wanted subfields
            modified = []

            for record in recordset.records:
                for tag, codes in x.items():
                    for field in record.get_fields(tag):
                        field.subfields = [y for y in field.subfields if y.code in codes]

                modified.append(record)

            recordset = cls()
            recordset.records = modified
                        
        # process
        if fmt == 'xml':
            return Response(recordset.to_xml(write_id=True), mimetype='text/xml')
        elif fmt == 'mrk':
            return Response(recordset.to_mrk(write_id=True), mimetype='text/plain')
        elif fmt == 'csv':
            return Response(recordset.to_csv(write_id=True), mimetype='text/csv')
        elif fmt == 'tsv':
            return Response(recordset.to_tsv(write_id=True), mimetype='text/tab-separated-values')
        elif fmt == 'brief':
            schema_name='api.brieflist'
            make_brief = brief_bib if recordset.record_class == Bib else brief_auth
            #data = [make_brief(r) for r in recordset]
            data = []
            for r in recordset:
                this_d = make_brief(r)
                this_d["myBasket"] = False

                lock_status = list(filter(lambda x: x['record_id'] == str(r.id) and x['collection'] == collection, all_basket_objects))
                if len(lock_status) > 0:
                    this_d["locked"] = True

                try:
                    # Determine whether a basket exists for the current user and if the item is in it
                    
                    basket_contains = list(filter(lambda x: x['record_id'] == str(r.id) and x['collection'] == 'bibs', this_basket.items))
                    if len(basket_contains) > 0:
                        this_d["myBasket"] = True
                        this_d["locked"] = False
                    data.append(this_d)
                except AttributeError:
                    # If the user is not logged in, this_basket will be None
                    # In this case, we just append the brief data without basket info
                    data.append(this_d)


        elif fmt == 'brief_speech':
            schema_name='api.brieflist'
            make_brief = brief_speech
            #data = [make_brief(r) for r in recordset]
            data = []
            for r in recordset:
                this_d = make_brief(r)
                this_d["myBasket"] = False
                
                # Determine lock status first, then resolve whether the item is in the current user's basket
                lock_status = list(filter(lambda x: x['record_id'] == str(r.id) and x['collection'] == collection, all_basket_objects))
                if len(lock_status) > 0:
                    this_d["locked"] = True

                basket_contains = list(filter(lambda x: x['record_id'] == str(r.id) and x['collection'] == 'bibs', this_basket.items))
                if len(basket_contains) > 0:
                    this_d["myBasket"] = True
                    this_d["locked"] = False
                data.append(this_d)
        else:
            schema_name='api.urllist'
            data = [URL('api_record', collection=collection, record_id=r.id).to_str() for r in recordset]
            
        new_direction = 'desc' if args.direction in (None, 'asc') else 'asc'
        
        meta = {
            'name': 'api_records_list',
            'returns': URL('api_schema', schema_name=schema_name).to_str(),
            'count': total[0] # total is a tuple
        }
        
        links = {
            '_self': URL('api_records_list', collection=collection, start=start, limit=limit, search=search_string, format=fmt, sort=sort_by, direction=args.direction, subtype=args.subtype).to_str(),
            '_next': URL('api_records_list', collection=collection, start=start+limit, limit=limit, search=search_string, format=fmt, sort=sort_by, direction=args.direction, subtype=args.subtype, search_id=search_id).to_str(),
            '_prev': URL('api_records_list', collection=collection, start=start-limit, limit=limit, search=search_string, format=fmt, sort=sort_by, direction=args.direction, subtype=args.subtype, search_id=search_id).to_str() if start - limit > 0 else None,
            'format': {
                'brief': URL('api_records_list', collection=collection, start=start, limit=limit, search=search_string, format='brief', sort=sort_by, direction=args.direction, subtype=args.subtype, search_id=search_id).to_str(),
                'list': URL('api_records_list', collection=collection, start=start, limit=limit, search=search_string, sort=sort_by, direction=args.direction, subtype=args.subtype, search_id=search_id).to_str(),
                'XML': URL('api_records_list', collection=collection, start=start, limit=limit, search=search_string, format='xml', sort=sort_by, direction=args.direction, subtype=args.subtype, search_id=search_id).to_str(),
                'MRK': URL('api_records_list', collection=collection, start=start, limit=limit, search=search_string, format='mrk', sort=sort_by, direction=args.direction, subtype=args.subtype, search_id=search_id).to_str(),
                'CSV': URL('api_records_list', collection=collection, start=start, limit=limit, search=search_string, format='csv', sort=sort_by, direction=args.direction, subtype=args.subtype, search_id=search_id).to_str(),
                'TSV': URL('api_records_list', collection=collection, start=start, limit=limit, search=search_string, format='tsv', sort=sort_by, direction=args.direction, subtype=args.subtype, search_id=search_id).to_str(),
            },
            'sort': {
                'updated': URL('api_records_list', collection=collection, start=start, limit=limit, search=search_string, format=fmt, sort='updated', direction=new_direction, subtype=args.subtype, search_id=None).to_str()
            },
            'related': {
                #'browse': URL('api_records_list_browse', collection=collection).to_str(),
                'collection': URL('api_collection', collection=collection).to_str(),
                'count': URL('api_records_list_count', collection=collection, search=search_string).to_str()
            }
        }
        
        response = ApiResponse(links=links, meta=meta, data=data)
        
        return response.jsonify()
    
    @ns.doc(description='Create a Bibliographic or Authority Record with the given data.', security='basic')
    @login_required
    def post(self, collection):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        args = RecordsList.args.parse_args()
    
        user = current_user if request_loader(request) is None else request_loader(request)

        if args.format == 'mrk':
            record = cls.from_mrk(request.data.decode())
            if not has_permission(user, "createRecord", record, collection):
                abort(403, f'The current user is not authorized to perform this action.')

            try:    
                result = record.commit(user=user.username)

                if result:
                    data = {'result': URL('api_record', collection=collection, record_id=record.id).to_str()}
                    return data, 201
                else:
                    abort(500, 'POST request failed for unknown reasons')
            
            except Exception as e:
                abort(400, str(e))
        else:
            #try:
            jmarc = json.loads(request.data)
            
            if '_id' in jmarc:
                if jmarc['_id'] is None:
                    del jmarc['_id']
                else:
                    abort(400, f'"_id" {jmarc["_id"]} is invalid for a new record')
                
            record = cls(jmarc, auth_control=True)

            if not has_permission(user, "createRecord", record, collection):
                abort(403, f'The current user is not authorized to perform this action.')


            result = record.commit(user=user.username)
            #except Exception as e:
            #    abort(400, str(e))
        
            if result:
                data = {'result': URL('api_record', collection=collection, record_id=record.id).to_str()}
                
                return data, 201
            else:
                abort(500, 'POST request failed for unknown reasons')

# Records list count
@ns.route('/marc/<string:collection>/records/count')
@ns.param('collection', '"bibs" or "auths"')
class RecordsListCount(Resource):
    @ns.expect(RecordsList.args)
    def get(self, collection):
        cls = ClassDispatch.batch_by_collection(collection) or abort(404)
        args = RecordsList.args.parse_args()
        type_condition = Raw(
            {'_record_type': {'$in': ['default', 'speech', 'vote']} if args.subtype == 'all' else args.subtype if args.subtype else 'default'}
        )

        if args.search:
            search = unquote(args.search)

            if args.engine == "community":
                try:
                    query = Query.from_string(search, record_type=collection[:-1]) if search else Query()
                    query.conditions.append(type_condition)
                except InvalidQueryString as e:
                    abort(422, str(e))
            elif args.engine == "atlas":
                try:
                    query = AtlasQuery.from_string(search, record_type=collection[:-1]) if search else AtlasQuery()

                    if hasattr(query, 'match'):
                        if query.match:
                            # todo: fix this in dlx. `query.match.conditions` should be an array instad of tuple
                            query.match.conditions = [*query.match.conditions] 
                            query.match.conditions.append(type_condition)
                        else:
                            query.match = Query(type_condition)
                    else:
                        query.match = type_condition

                except InvalidQueryString as e:
                    abort(422, str(e))
        else: 
            query = Query(type_condition)
        
        if query:
            if isinstance(query, AtlasQuery):
                pipeline = query.compile()
                pipeline.append({'$count': 'count'})
                data = list(cls().handle.aggregate(pipeline))[0]['count']
            else:
                try:
                    data = cls().handle.count_documents(
                        query.compile(),
                        # collation is not implemented in mongomock
                        collation=Collation(locale='en', strength=1, numericOrdering=True) if Config.TESTING == False else None,
                        maxTimeMS=Config.MAX_QUERY_TIME
                    )
                except ExecutionTimeout as e:
                    abort(408, str(e))
        else:
            data = cls().handle.estimated_document_count()
        
        links = {
            '_self': URL('api_records_list_count', collection=collection, search=args.search).to_str(),
            'related': {
                'records': URL('api_records_list', collection=collection, search=args.search).to_str()
            }
        }
        
        meta = {'name': 'api_records_list_count', 'returns': URL('api_schema', schema_name='api.count').to_str()}

        return ApiResponse(links=links, meta=meta, data=data).jsonify()

# Records list browse
@ns.route('/marc/<string:collection>/records/browse')
@ns.param('collection', '"bibs" or "auths"')
class RecordsListBrowse(Resource):
    args = reqparse.RequestParser()
    args.add_argument(
        'search',
        type=str, 
        help='Consult documentation for query syntax. The logical field to browse by must be the first search term'
    )
    args.add_argument(
        'compare',
        type=str,
        choices=['greater', 'less'],
        help='Return the results "greater than" or "less than" the match, with the matched field first or last last if there is one'
    )
    args.add_argument(
        'start', 
        type=int, 
        help='Result to start list at',
        default=1
    )
    args.add_argument(
        'limit', 
        type=int,
        help='Number of results to return. Max is 100',
        default=10,
    )
    args.add_argument(
        'subtype',
        type=str, 
        choices=['default', 'speech', 'vote']
    )
    
    @ns.doc(description='Return a list of MARC Bibliographic or Authority Records sorted by the "logical field" specified in the search.')
    @ns.expect(args)
    def get(self, collection):
        args = RecordsListBrowse.args.parse_args()
        cls = ClassDispatch.batch_by_collection(collection) or abort(404)
        querystring = request.args.get('search') or abort(400, 'Param "search" required')
        match = re.match('^(\\w+):(.*)', querystring) or abort(400, 'Invalid search string')
        field = match.group(1)
        value = match.group(2)
        logical_fields = DlxConfig.bib_logical_fields if collection == 'bibs' else DlxConfig.auth_logical_fields
        field in logical_fields or abort(400, 'Search must be by "logical field". No recognized logical field was detected')
        operator = '$lt' if args.compare == 'less' else '$gte'
        direction = -1 if args.compare == 'less' else 1
        args.subtype = args.subtype or 'default'
        #subq = {'$and': [{'_record_type': 'default'}, {'_record_type': {'$nin': ['speech', 'vote']}}]}
        from dlx.util import Tokenizer
        #query = {'text': {operator: f' {Tokenizer.scrub(value)} '}, subq}
        query = {'$and': [{'text': {operator: f' {Tokenizer.scrub(value)} '}}]}
        query['$and'].append({'_record_type': args.subtype})
        
        if Config.TESTING:
            # collation is not implemented in mongomock
            collation = None
        else:
            collation = DlxConfig.marc_index_default_collation

        start, limit = int(args.start), int(args.limit)
        values = list(
            DB.handle[f'_index_{field}'].find(
                query, 
                skip=start-1, 
                limit=limit, 
                sort=[('text', direction)], 
                collation=collation
            )
        )

        ''' 
        # using an aggregation. this method is slower and requires specifiying all characters to ignore
        # remove slash, comma, dash and en dash
        to_match = value.replace(',', '').replace('-', ' ').replace('–', ' ').replace('/', ' ')

        values = DB.handle[f'_index_{field}'].aggregate(
            [
                {'$addFields': {'to_sort': {'$replaceAll': {'input': '$_id', 'find': ',', 'replacement': ''}}}},
                {'$project': {'_id': 1, '_record_type': 1, 'to_sort': {'$replaceAll': {'input': '$to_sort', 'find': '-', 'replacement': ' '}}}},
                {'$set': {'to_sort': {'$replaceAll': {'input': '$to_sort', 'find': '–', 'replacement': ' '}}}}, # en dash
                {'$set': {'to_sort': {'$replaceAll': {'input': '$to_sort', 'find': '/', 'replacement': ' '}}}}, # slash
                {'$match': {'to_sort': {operator: to_match}, '_record_type': args.type if args.type in ('speech', 'vote') else 'default'}},
                {'$sort': {'to_sort': 1 if args.compare == 'greater' else -1}},
                {'$skip': start-1},
                {'$limit': limit}
            ],
            collation=None if Config.TESTING else collation
        )
        values = list(values)
        '''
        
        if args.compare == 'less':
            values = list(reversed(list(values)))

        data = [
            {
                'value': x['_id'],
                'search': URL(
                    'api_records_list', 
                    collection=collection,
                    # todo: make record type serachable by query string instead of useing type codes
                    search=f'{field}:\'{x.get("_id")}\'',
                    subtype=args.subtype
                ).to_str(),
                'count': URL(
                    'api_records_list_count', 
                    collection=collection, 
                    search=f'{field}:\'{x.get("_id")}\'',
                    subtype=args.subtype
                ).to_str()
            } for x in values
        ]
        
        links = {
            '_self': URL('api_records_list_browse', collection=collection, start=start, limit=limit, search=args.search, compare=args.compare).to_str(),
            '_next': URL('api_records_list_browse', collection=collection, start=start+limit, limit=limit, search=args.search, compare=args.compare).to_str(),
            '_prev': URL('api_records_list_browse', collection=collection, start=start-limit, limit=limit, search=args.search, compare=args.compare).to_str() if start - limit > 0 else None,
            'format': None,
            'sort': None,
            'related': {
                'collection': URL('api_collection', collection=collection).to_str(),
                'records': URL('api_records_list_count', collection=collection, search=args.search).to_str()
            }
        }
        
        meta = {
            'name': 'api_records_list_browse',
            'returns': URL('api_schema', schema_name='api.browselist').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=data).jsonify()
        
# Record
@ns.route('/marc/<string:collection>/records/<int:record_id>')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class Record(Resource):
    args = reqparse.RequestParser()
    args.add_argument(
        'format', 
        type=str, 
        choices=['xml', 'mrk', 'mrc']
    )
    
    @ns.doc(description='Return the record with the given identifier')
    @ns.expect(args)
    def get(self, collection, record_id):
        args = Record.args.parse_args()
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        
        # remove any unexpected (deprecated) auth-controlled fields
        for field in record.datafields:
            for subfield in filter(lambda x: hasattr(x, 'xref'), field.subfields):
                if DlxConfig.is_authority_controlled(collection[:-1], field.tag, subfield.code) is False:
                    field.subfields = list(filter(lambda x: x != subfield, field.subfields))

        fmt = args.get('format')

        if fmt == 'xml':
            return Response(record.to_xml(write_id=True), mimetype='text/xml')
        elif fmt == 'mrk':
            return Response(record.to_mrk(write_id=True), mimetype='text/plain')
        elif fmt == 'mrc':
            return Response(record.to_mrc(write_id=True), mimetype='text/plain')
        
        # check for files
        # todo: get identifier type mapping from config
        files_data = []

        if collection == 'bibs':
            files_data = [
                {
                    'mimetype': f.mimetype, 
                    'language': f.languages[0].lower(), 
                    'url': URL('api_file_record', record_id=f.id).to_str()
                } for f in get_record_files(record)
            ]
                
        data = record.to_dict()
        data['created'] = record.created
        data['created_user'] = record.created_user
        data['updated'] = record.updated
        data['user'] = record.user
        data['files'] = files_data

        meta = {
            'name': 'api_record',
            'returns':  URL('api_schema', schema_name='jmarc').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }
        links = {
            '_next': None,
            '_prev': None,
            '_self': URL('api_record', collection=collection, record_id=record_id).to_str(),
            'format': {
                'XML': URL('api_record', collection=collection, record_id=record_id, format='xml').to_str(),
                'MRK': URL('api_record', collection=collection, record_id=record_id, format='mrk').to_str()
            },
            'related': {
                'fields': URL('api_record_fields_list', collection=collection, record_id=record_id).to_str(),
                'history': URL('api_record_history', collection=collection, record_id=record_id).to_str(),
                'records': URL('api_records_list', collection=collection).to_str(),
                'subfields': URL('api_record_subfields_list', collection=collection, record_id=record_id).to_str(),
                'files': URL('api_record_files_list', collection=collection, record_id=record_id).to_str()
            }
        }
        
        if collection == "auths": links['related']['use count'] = URL('api_auth_use_count', record_id=record_id, use_type="bibs").to_str()

        response = ApiResponse(links=links, meta=meta, data=data)
        
        return response.jsonify()

    @ns.doc(description='Replace the record with the given data.', security='basic')
    @login_required
    def put(self, collection, record_id):
        user = current_user if request_loader(request) is None else request_loader(request)
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        args = Record.args.parse_args()
        
        if args.format == 'mrk':
            
            record = cls.from_mrk(request.data.decode())
            record.id = record_id

            if not has_permission(user, "updateRecord", record, collection):
                abort(403, f'The current user is not authorized to perform this action.')

            try:
                result = record.commit(user=user.username)
            except Exception as e:
                abort(400, str(e))
        else:
            jmarc = json.loads(request.data)
            record = cls(jmarc, auth_control=True)
            
            if not has_permission(user, "updateRecord", record, collection):
                abort(403, f'The current user is not authorized to perform this action.')

            try:
                result = record.commit(user=user.username)
            except Exception as e:
                abort(400, str(e))
        
        if result:
            data = {'result': URL('api_record', collection=collection, record_id=record.id).to_str()}
            
            return data, 200
        else:
            abort(500)

    @ns.doc(description='Delete the Bibliographic or Authority Record with the given identifier', security='basic')
    @login_required
    def delete(self, collection, record_id):
        #user = 'testing' if current_user.is_anonymous else current_user.email

        user = current_user if request_loader(request) is None else request_loader(request)
        
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)

        if not has_permission(user, "deleteRecord", record, collection):
            abort(403, f'The current user is not authorized to perform this action.')

        try:
            result = record.delete(user=user.username)
        except AuthInUse as e:
            abort(403, 'Authority record in use')
        
        if result:
            # We should make sure this record is removed from any baskets that contained it.
            for basket in Basket.objects:
                # Normally the record_id is an integer, but it's being stored here as a string.
                try:
                    basket_item = basket.get_item_by_coll_and_rid(collection, str(record_id))
                    if basket_item is not None:
                        basket.remove_item(basket_item['id'])
                except IndexError:
                    pass

                #if basket_item = basket.get_item_by_coll_and_rid(collection, str(record_id)):
                #       basket.remove_item(basket_item['id'])

            return Response(status=204)
        else:
            abort(500)

@ns.route('/marc/<string:collection>/records/<int:record_id>/files')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordFilesList(Resource):

    @ns.doc(description='Return the files for record with the given identifier')
    def get(self, collection, record_id):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        
        files_data = [
            {
                'mimetype': f.mimetype, 
                'language': f.languages[0].lower(), 
                'url': URL('api_file_record', record_id=f.id).to_str()
            } for f in get_record_files(record)
        ]

        meta = {
            'name': 'api_record_files_list',
            'returns':  URL('api_schema', schema_name='api.filelist').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }

        links = {
            '_next': None,
            '_prev': None,
            '_self': URL('api_record_files_list', collection=collection, record_id=record_id).to_str(),
            'related': {
                'record': URL('api_record', collection=collection, record_id=record_id).to_str()
            }
        }

        return ApiResponse(links=links, meta=meta, data=files_data).jsonify()

@ns.route('/marc/<string:collection>/records/<int:record_id>/locked')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordLockStatus(Resource):
    @ns.doc(description='Return the lock status of a record with the given record ID in the specified collection.')
    @login_required
    def get(self, collection, record_id):
        lock_status= item_locked(collection, record_id)
        return lock_status, 200

# Record parse
@ns.route('/marc/<string:collection>/parse')
@ns.param('collection', '"bibs" or "auths"')
class RecordParse(Resource):
    args = reqparse.RequestParser()
    args.add_argument(
        'format',
        required=True,
        type=str, 
        choices=['xml', 'mrk', 'csv']
    )

    @ns.doc(description='Parse the string and return a native JSON representation')
    @ns.expect(args)
    def post(self, collection):
        args = RecordParse.args.parse_args()
        cls = ClassDispatch.by_collection(collection) or abort(404)

        if not request.data:
            # how to document the expected payload??
            abort(400, 'Request data not found')

        method = 'from_' + args.format

        try:
            record = getattr(cls, method)(request.data.decode(), auth_control=True)
        except Exception as e:
            abort(400, str(e))

        data = record.to_dict()

        if data.get('_id') is None:
            # Remove the field if there is no ID (new record) so that the data
            # passes type validation.
            del data['_id']

        meta = {
            'name': 'api_record_parse',
            'returns':  URL('api_schema', schema_name='jmarc.preview').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }
        links = {
            '_self': None, # not valid because cannot include the data payload in the link
        }   
        
        return ApiResponse(links=links, meta=meta, data=data).jsonify()

# Fields
'''
The fields and subfields endpoints aren't in active use, and we don't have defined permission sets for them.
Recommendation: Deprecate these API routes.
'''
@ns.route('/marc/<string:collection>/records/<int:record_id>/fields')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordFieldsList(Resource):
    @ns.doc(description='Return a list of the fields in the record with the given record ID')
    def get(self, collection, record_id):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)

        fields_list = []
        
        for tag in record.get_tags():
            for place, field in enumerate(record.get_fields(tag)):
                
                fields_list.append(
                    URL('api_record_field_place',
                        collection=collection,
                        record_id=record.id,
                        field_tag=tag,
                        field_place=place
                    ).to_str()
                )
        
        links = {
            '_self': URL('api_record_fields_list', collection=collection, record_id=record_id).to_str(),
            'related': {
                'subfields': URL('api_record_subfields_list', collection=collection, record_id=record_id).to_str(),
                'record': URL('api_record', collection=collection, record_id=record_id).to_str()
            }
        }  
        
        meta = {
            'name': 'api_record_fields_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }
        
        return ApiResponse(links=links, meta=meta, data=fields_list).jsonify()
   
# Field places
@ns.route('/marc/<string:collection>/records/<int:record_id>/fields/<string:field_tag>')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordFieldPlaceList(Resource):
    @ns.doc(description='Return a list of the instances of the field in the record')
    def get(self, collection, record_id, field_tag):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        places = len(list(record.get_fields(field_tag)))
        field_places = []
        
        for place in range(0, places):
            field_places.append(
                URL('api_record_field_place', collection=collection, record_id=record_id, field_tag=field_tag, field_place=place).to_str()
            )
        
        links = {
            '_self': URL('api_record_field_place_list', collection=collection, record_id=record_id, field_tag=field_tag).to_str(),
            'related': {
                'fields': URL('api_record_fields_list', collection=collection, record_id=record_id).to_str(),
                'subfields': URL('api_record_subfields_list', collection=collection, record_id=record_id).to_str()
            }
        }
        
        meta = {
            'name': 'api_record_field_place_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str(),
            'timestamp': datetime.now(timezone.utc)
        }
        
        return ApiResponse(links=links, meta=meta, data=field_places).jsonify()
    
    @ns.doc(description='Create new field with the given tag', security='basic')
    @login_required
    def post(self, collection, record_id, field_tag):
        #user = 'testing' if current_user.is_anonymous else current_user.email

        user = current_user if request_loader(request) is None else request_loader(request)
        
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        
        try:
            if field_tag[:2] == '00':
                field_data = request.data.decode() #     scalar value
            else:
                field = Datafield.from_json(
                    record_type=cls.record_type, 
                    tag=field_tag,
                    data=request.data.decode(),
                    auth_control=True
                )
                field_data = field.to_dict()
            
            record_data = record.to_dict()
            
            if field_tag not in record_data:
                record_data[field_tag] = []
            
            record_data[field_tag].append(field_data)
            record = cls(record_data, auth_control=True)
        except Exception as e:
            abort(400, str(e))

        if not has_permission(user, "updateRecord", record, collection):
            abort(403, f'The current user is not authorized to perform this action.')

        result = record.commit(user=user.username)
        
        if result:
            url = URL(
                'api_record_field_place',
                collection=collection,
                record_id=record.id,
                field_tag=field_tag,
                field_place=len(record.get_fields(field_tag)) - 1
            )

            return {'result': url.to_str()}, 201
        else:
            abort(500, 'POST request failed for unknown reasons')

# Field    
@ns.route('/marc/<string:collection>/records/<int:record_id>/fields/<string:field_tag>/<int:field_place>')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordFieldPlace(Resource):
    @ns.doc(description='Return the field at the given place in the record')
    def get(self, collection, record_id, field_tag, field_place):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        field = record.get_field(field_tag, place=field_place) or abort(404)
        df = True if isinstance(field, Datafield) else False
        
        links = {
            'related': {
                'fields': URL('api_record_fields_list', collection=collection, record_id=record_id).to_str(),
                'subfields': URL('api_record_field_place_subfield_list', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place).to_str()
            },
            '_self': URL('api_record_field_place', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place).to_str(),
        }
        
        meta = {
            'name': 'api_record_field_place',
            'returns': URL('api_schema', schema_name='jmarc.datafield' if df else 'jmarc.controlfield').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=field.to_dict() if df else field.value).jsonify()

    @ns.doc(description='Replace the field with the given tag at the given place', security='basic')
    @login_required
    def put(self, collection, record_id, field_tag, field_place):
        #user = f'testing' if current_user.is_anonymous else current_user.email
        user = current_user if request_loader(request) is None else request_loader(request)
        
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        record.get_field(field_tag, place=field_place) or abort(404)
        
        try:
            if field_tag[:2] == '00':
                field_data = request.data.decode() # scalar value
            else:
                field = Datafield.from_json(
                    record_type=cls.record_type, 
                    tag=field_tag,
                    data=request.data.decode(),
                    auth_control=True
                )
                field_data = field.to_dict()
            
            record_data = record.to_dict()
            record_data.setdefault(field_tag, [])
            record_data[field_tag][field_place] = field_data

            if not has_permission(user, "updateRecord", record, collection):
                abort(403, f'The current user is not authorized to perform this action.')

            result = cls(record_data, auth_control=True).commit(user=user.username)
        except Exception as e:
            abort(400, str(e))

        if result:
            url = URL(
                'api_record_field_place',
                collection=collection,
                record_id=record.id,
                field_tag=field_tag,
                field_place=field_place
            )

            return {'result': url.to_str()}, 200
        else:
            abort(500, 'PUT request failed for unknown reasons')
    
    @ns.doc(description='Delete the field with the given tag at the given place', security='basic')
    @login_required
    def delete(self, collection, record_id, field_tag, field_place):
        abort(503, 'This route is under construction')

        user = current_user if request_loader(request) is None else request_loader(request)
        
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        
        
        record.get_field(field_tag, place=field_place) or abort(404)

        if not has_permission(user, "updateRecord", record, collection):
            abort(403, f'The current user is not authorized to perform this action.')
        
        record.delete_field(field_tag, place=field_place)
        
        if record.commit(user=user.username):
            return Response(status=204)
        else:
            abort(500, 'DELETE request failed for unknown reasons')

# Field subfields
@ns.route('/marc/<string:collection>/records/<int:record_id>/fields/<string:field_tag>/<int:field_place>/subfields')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordFieldPlaceSubfieldList(Resource):
    @ns.doc(description='Return a list of the subfields in the field')
    def get(self, collection, record_id, field_tag, field_place):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        field = record.get_field(field_tag, place=field_place) or abort(404)
        
        subfields, seen, place = [], {}, 0
        
        for sub in field.subfields:
            if sub.code in seen:
                place += 1
            else:
                place = 0
                seen[sub.code] = True

            subfields.append(
                URL('api_record_field_subfield_value', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place, subfield_place=place, subfield_code=sub.code).to_str()
            )
            
        links = {
            '_self': URL('api_record_field_place_subfield_list', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place).to_str(),
            'related': {
                'field': URL('api_record_field_place', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place,).to_str()
            }
        }

        meta = {
            'name': 'api_record_field_place_subfield_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=subfields).jsonify()

# Subfield places
@ns.route('/marc/<string:collection>/records/<int:record_id>/fields/<string:field_tag>/<int:field_place>/subfields/<string:subfield_code>')
@ns.param('subfield_code', 'The subfield code')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordFieldPlaceSubfieldPlaceList(Resource):
    @ns.doc(description='Return a list of the subfields with the given code')
    def get(self, collection, record_id, field_tag, field_place, subfield_code):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        
        field = record.get_field(field_tag, place=field_place) or abort(404)
        subfields = filter(lambda x: x.code == subfield_code, field.subfields) or abort(404)

        subfield_places = []
        
        for place in range(0, len(list(subfields))):
            subfield_places.append(
                URL('api_record_field_subfield_value', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place, subfield_code=subfield_code, subfield_place=place).to_str()
            )
        
        links = {
            '_self':  URL('api_record_field_place_subfield_place_list', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place, subfield_code=subfield_code, subfield_place=place).to_str(),
            'related': {
                'subfields': URL('api_record_field_place_subfield_list', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place).to_str()
            }
        }
        
        meta = {
            'name': 'api_record_field_place_subfield_place_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=subfield_places).jsonify()

# Subfield value
@ns.route('/marc/<string:collection>/records/<int:record_id>/fields/<string:field_tag>/<int:field_place>/subfields/<string:subfield_code>/<int:subfield_place>')
@ns.param('subfield_place', 'The incidence number of the subfield code in the field, starting wtih 0')
@ns.param('subfield_code', 'The subfield code')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordFieldSubfieldValue(Resource):
    @ns.doc(description='Return the value of the subfield')
    def get(self, collection, record_id, field_tag, field_place, subfield_code, subfield_place):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        value = record.get_value(field_tag, subfield_code, address=[field_place, subfield_place]) or abort(404)
        
        links = {
            '_self': URL('api_record_field_subfield_value', collection=collection, record_id=record_id, field_tag=field_tag, field_place=field_place, subfield_code=subfield_code, subfield_place=subfield_place).to_str(),
            'related': {
                #'record':URL('api_record', collection=collection, record_id=record_id).to_str(),
                'subfields': URL('api_record_field_place_subfield_list', collection=collection, record_id=record_id,field_tag=field_tag, field_place=field_place).to_str()
            }
        }
        
        meta = {
            'name': 'api_record_field_subfield_value',
            'returns': URL('api_schema', schema_name='jmarc.subfield.value').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=value).jsonify()

# Record subfields        
@ns.route('/marc/<string:collection>/records/<int:record_id>/subfields')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class RecordSubfieldsList(Resource):
    @ns.doc(description='Return a list of all the subfields in the record with the given record')
    def get(self, collection, record_id):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        
        subfields = []

        for tag in filter(lambda x: x[0:2] != '00', record.get_tags()): 
            for field_place, field in enumerate(record.get_fields(tag)):        
                subfield_place = 0
                seen = {}
                
                for subfield in field.subfields:
                    if subfield.code in seen:
                        subfield_place = seen[subfield.code]
                        seen[subfield.code] += 1
                    else:
                        subfield_place = 0
                        seen[subfield.code] = 1
                    
                    subfields.append(
                        URL(
                            'api_record_field_subfield_value',
                            collection=collection,
                            record_id=record_id,
                            field_tag=field.tag,
                            field_place=field_place,
                            subfield_code=subfield.code,
                            subfield_place=subfield_place
                        ).to_str()
                    )
                    
        links = {
            '_self': URL('api_record_subfields_list', collection=collection, record_id=record_id).to_str(),
            'related': {
                'record': URL('api_record', collection=collection, record_id=record_id).to_str()
            }
        }
        
        meta = {
            'name': 'api_record_subfields_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=subfields).jsonify()
            
# Auth lookup fields
@ns.route('/marc/<string:collection>/lookup')
@ns.param('collection', '"bibs" or "auths"')
class LookupFieldsList(Resource):
    @ns.doc(description='Return a list of field tags that are authority-controlled')
    def get(self, collection):
        amap = DlxConfig.bib_authority_controlled if collection == 'bibs' else DlxConfig.auth_authority_controlled
        data = [URL('api_lookup_field', collection=collection, field_tag=tag).to_str() for tag in amap.keys()]
        
        links = {
            '_self': URL('api_lookup_fields_list', collection=collection).to_str(),
            'related': {
                'map': URL('api_lookup_map', collection=collection).to_str()
            }
        }
        
        meta = {
            'name': 'api_lookup_fields_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=data).jsonify()
                      
# Auth lookup
@ns.route('/marc/<string:collection>/lookup/<string:field_tag>')
@ns.param('collection', '"bibs" or "auths"')
@ns.param('field_tag', 'The tag of the field value to look up')
class LookupField(Resource):
    args = reqparse.RequestParser()
    
    @ns.doc(description='Return a list of authorities that match a string value')
    @ns.expect(args)
    def get(self, collection, field_tag):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        # args are subfield codes
        codes = list(filter(lambda x: len(x) == 1, request.args.keys()))
        codes or abort(400, 'Subfield codes required as the URL query parameters')
        sparams = {}
        conditions_1, conditions_2, conditions_3 = [], [], []

        for code in codes:
            val = request.args[code]
            sparams[code] = val
            auth_tag = DlxConfig.authority_source_tag(collection[:-1], field_tag, code)

            if not auth_tag:
                continue

            # Return the 682 field so we can check if the record is deprecated
            # see issues #190 and #1628
            # to do: Add this to the dlx configuration
            tags = [auth_tag, '682']

            # exact match
            conditions_1.append(f'{auth_tag}__{code}:\'{val}\'')
            # starts with
            val_regex_checker = ''

            for char in val:
                xchars = []
                
                for k, v in AsciiMap.data.items():
                    if v.lower() not in ('a', 'e', 'i', 'o', 'u'):
                        continue
                        
                    if k in AsciiMap.multi_byte() or ord(k) > 0x0130: # char 'İ' #int(0x017F): # Latin Extended-A
                        continue

                    if v.lower() == char.lower():
                        xchars.append(k)

                if xchars:
                    xchars += char.lower() + char.upper()
                    val_regex_checker += f'[{"".join(xchars)}]'
                else:
                    if char.lower() != char.upper():
                        val_regex_checker += f'[{char.lower() + char.upper()}]'
                    else:
                        val_regex_checker += re.escape(char)

            conditions_2.append(f'{auth_tag}__{code}:/^{val_regex_checker}/')
            # free text
            conditions_3.append(f'{auth_tag}__{code}:{val}')

        querystring = " AND ".join(conditions_1)
        query = Query.from_string(querystring)
        proj = dict.fromkeys(tags, 1)
        start = int(request.args.get('start', 1))
        cln = {'locale': 'en', 'strength': 1, 'numericOrdering': True}
        auths = list(AuthSet.from_query(query, projection=proj, limit=25, skip=start - 1, sort=([('heading', 1)]), collation=cln))

        if len(auths) < 25:
            querystring = " AND ".join(conditions_2)
            query = Query.from_string(querystring)
            more = AuthSet.from_query(query, projection=proj, limit=25 - len(auths), skip=start - 1, sort=([('heading', 1)]), collation=cln)
            auths += list(filter(lambda x: x.id not in map(lambda z: z.id, auths), more))

        if len(auths) < 25:
            querystring = " AND ".join(conditions_3)
            query = Query.from_string(querystring)
            more = AuthSet.from_query(query, projection=proj, limit=25 - len(auths), skip=start - 1, sort=([('heading', 1)]), collation=cln)
            auths += list(filter(lambda x: x.id not in map(lambda z: z.id, auths), more))
        
        processed = []
        
        for auth in auths:
            new = Auth()
            new.id = auth.id
            
            for tag in tags:
                new.fields += auth.get_fields(tag)
            
            processed.append(new.to_dict())
            
        links = {
            '_self': URL('api_lookup_field', collection=collection, field_tag=field_tag, start=start, **sparams).to_str(),
            '_next': URL('api_lookup_field', collection=collection, start=start+25, field_tag=field_tag, **sparams).to_str(),
            '_prev': URL('api_lookup_field', collection=collection, start=start-25 if (start - 25) > 1 else 1, field_tag=field_tag, **sparams).to_str(),
            'related': {
                'fields': URL('api_lookup_fields_list', collection=collection).to_str()
            }
        }
            
        meta = {
            'name': 'api_lookup_field',
            'returns': URL('api_schema', schema_name='jmarc.batch').to_str()
        }
            
        return ApiResponse(links=links, meta=meta, data=processed).jsonify()

# Auth xref map
@ns.route('/marc/<string:collection>/lookup/map')
@ns.param('collection', '"bibs" or "auths"')
class LookupMap(Resource):
    @ns.doc(description='Return a list of field tags that are authority-controlled')
    def get(self, collection):
        amap = DlxConfig.bib_authority_controlled if collection == 'bibs' else DlxConfig.auth_authority_controlled
        
        links = {
            '_self': URL('api_lookup_map', collection=collection).to_str(),
            'related': {
                'lookup': URL('api_lookup_fields_list', collection=collection).to_str() 
            }
        }
        
        meta = {
            'name': 'api_lookup_map',
            'returns': URL('api_schema', schema_name='api.authmap').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=amap).jsonify()

# Auth merge
@ns.route('/marc/auths/records/<int:record_id>/merge')
@ns.param('record_id')
class RecordMerge(Resource):
    @ns.doc(description='Auth merge the target authority record in to this one')
    @login_required
    def get(self, record_id):
        start_time = time.time()
        #user = 'testing' if current_user.is_anonymous else current_user.email
        user = current_user if request_loader(request) is None else request_loader(request)
        gaining = Auth.from_id(record_id) or abort(404)
        losing_id = request.args.get('target') or abort(400, '"target" param required')
        losing_id = int(losing_id)
        losing = Auth.from_id(losing_id) or abort(404, "Target auth not found")

        # To do: add a permssion for mergeRecord?
        if not(has_permission(user, "mergeAuthority", losing, "auths")):
            abort(403, "User does not have permission to merge authorities.")
        
        if losing.heading_field.tag != gaining.heading_field.tag:
            abort(409, "Auth records not of the same type")

        # todo: excute this in a Lambda function
        gaining.merge(user=user.username if user else 'admin', losing_record=losing)

        # todo: update response message when merge is async
        return jsonify({'message': f'Merge complete'})

# Auth usage count
@ns.route('/marc/auths/records/<int:record_id>/use_count')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', '"bibs" or "auths"')
class AuthUseCount(Resource):
    args = reqparse.RequestParser()
    args.add_argument('use_type', type=str, choices=['bibs', 'auths'])
    
    @ns.doc(description='Return the count of records that use the authority')
    @ns.expect(args)
    def get(self, record_id):
        args = AuthUseCount.args.parse_args()
        auth = Auth.from_id(record_id) or abort(404)
        args.use_type in ('bibs', 'auths') or abort(400, 'Query param "use_type" must be set to "bibs" or "auths"')
        #count = auth.in_use(usage_type=args.use_type[:-1]) # returns the number of fields using the auth
        cls = Bib if args.use_type == 'bibs' else Auth
        count = cls.count_documents(Query.from_string(f'xref:{auth.id}').compile()) # the number of records using the auth

        links = {
            '_self': URL('api_auth_use_count', record_id=record_id, use_type=args.use_type).to_str(),
            'related': {
                'record': URL('api_record', collection='auths', record_id=record_id).to_str(),
                'auths': URL('api_records_list', collection='auths').to_str()
            }
        }
        
        meta = {'name': 'api_auth_use_count', 'returns': URL('api_schema', schema_name='api.count').to_str()}
        
        return ApiResponse(links=links, meta=meta, data=count).jsonify()
    
# History
@ns.route('/marc/<string:collection>/records/<int:record_id>/history')
@ns.param('collection', '"bibs" or "auths"')
@ns.param('record_id', 'The record identifier')
class RecordHistory(Resource):
    @ns.doc(description='Returns a list of the record with the given ID\'s previous states')
    def get(self, collection, record_id):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        cls.from_id(record_id) or abort(404)
        
        # temporary implemention
        hcol = collection[:-1] + '_history'
        hrec = DB.handle[hcol].find_one({'_id': record_id}) or {}
        history = hrec.get('history') or []
        
        data = [
            {
                'user': history[i].get('user'),
                'time': history[i].get('updated'),
                'event': URL('api_record_history_event', collection=collection, record_id=record_id, instance=i).to_str()
            } 
                
            for i in range(0, len(history))
        ]

        links = {
            '_self': URL('api_record_history', collection=collection, record_id=record_id).to_str(),
            'related': {
                'record': URL('api_record', collection=collection, record_id=record_id).to_str()
            }
        }
        
        meta = {
            'name': 'api_record_history',
            'returns': URL('api_schema', schema_name='api.history.list').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=data).jsonify()
    
@ns.route('/marc/<string:collection>/records/<int:record_id>/history/<int:instance>')
@ns.param('collection', '"bibs" or "auths"')
@ns.param('record_id', 'The record identifier')
class RecordHistoryEvent(Resource):
    @ns.doc(description='Returns the record from the given record ID in a previous state')
    def get(self, collection, record_id, instance):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        cls.from_id(record_id) or abort(404)
        
        # temporary implemention
        hcol = collection[:-1] + '_history'
        hrec = DB.handle[hcol].find_one({'_id': record_id})
        ins = hrec['history'][instance]
        marc = cls(ins)
        
        data = marc.to_dict()
        data['updated'] = marc.updated
        data['user'] = marc.user
        
        links = {
            '_self': URL('api_record_history_event', collection=collection, record_id=record_id, instance=instance).to_str(),
            'related': {
                'record': URL('api_record', collection=collection, record_id=record_id).to_str(),
                'history': URL('api_record_history', collection=collection, record_id=record_id).to_str()
            }
        }
        
        meta = {
            'name': 'api_record_history_event',
            'returns': URL('api_schema', schema_name='jmarc').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=data).jsonify()
  
# Workforms
@ns.route('/marc/<string:collection>/workforms')
@ns.param('collection', '"bibs" or "auths"')
class WorkformsList(Resource):
    @ns.doc(description='Return a list of workforms for the given collection')
    def get(self, collection):
        # interim implementation
        workform_collection = DB.handle[f'{collection}_templates'] # todo: change name in dlx
        workforms = workform_collection.find({})
        data = [URL('api_workform', collection=collection, workform_name=t['name']).to_str() for t in workforms]
        
        links = {
            '_self': URL('api_workforms_list', collection=collection).to_str()
        }
        
        meta = {
            'name': 'api_workforms_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=data).jsonify()
    
    @ns.doc(description='Create a new temaplate with the given data', security='basic')
    @login_required
    def post(self, collection):
        # interim implementation
        workform_collection = DB.handle[f'{collection}_templates'] # todo: change name in dlx
        data = json.loads(request.data) or abort(400, 'Invalid JSON')
        data.get('_id') and data.pop('_id') # ignore any exisiting _id
        data.get('name') or abort(400, 'workform "name" field required')        
        existing = workform_collection.find_one({'name': data['name']})
        
        if existing:
            abort(400, f'Workform "{data["name"]}" already exists. Use PUT to update it')
            
        schema = Schemas.get('jmarc.workform')

        try:
            jsonschema.validate(instance=data, schema=schema, format_checker=jsonschema.FormatChecker())
        except jsonschema.exceptions.ValidationError as e:
            abort(400, 'Invalid workform')
        except Exception as e:
            raise e
        
        # To do
        #if not has_permission(user, "createWorkform", record, collection):
        #    abort(403, f'The current user is not authorized to perform this action.')

        workform_collection.insert_one(data) or abort(500)
        
        return {'result': URL('api_workform', collection=collection, workform_name=data['name']).to_str()}, 201

# Workform
@ns.route('/marc/<string:collection>/workforms/<string:workform_name>')
@ns.param('collection', '"bibs" or "auths"')
@ns.param('workform_name', 'The name of the workform')
class Workform(Resource):
    @ns.doc(description='Return the the workform with the given name for the given collection')
    def get(self, collection, workform_name):
        # interim implementation
        cls = ClassDispatch.by_collection(collection) or abort(404)
        workform_collection = DB.handle[f'{collection}_templates'] # todo: change name in dlx
        workform = workform_collection.find_one({'name': workform_name}) or abort(404)
        workform.pop('_id')
        workform['name'] = workform_name
        
        links = {
            '_self': URL('api_workform', collection=collection, workform_name=workform_name).to_str(),
            'related': {
                'collection': URL('api_collection', collection=collection).to_str(),
                'workforms': URL('api_workforms_list', collection=collection).to_str()
            }
        }
            
        meta = {
            'name': 'api_workform',
            'returns': URL('api_schema', schema_name='jmarc.workform').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=workform).jsonify()

    @ns.doc(description='Replace a workform with the given name with the given data', security='basic')
    @login_required
    def put(self, collection, workform_name):
        # interim implementation
        workform_collection = DB.handle[f'{collection}_templates'] # todo: change name in dlx
        old_data = workform_collection.find_one({'name': workform_name}) or abort(404, "Existing workform not found")
        new_data = json.loads(request.data) or abort(400, 'Invalid JSON')
        new_data['name'] = old_data['name']
        new_data.get('_id') and new_data.pop('_id') # ignore any exisitng id
        schema = Schemas.get('jmarc.workform')
        
        try:
            jsonschema.validate(instance=new_data, schema=schema, format_checker=jsonschema.FormatChecker())
        except jsonschema.exceptions.ValidationError as e:
            abort(400, 'Invalid workform')
        except Exception as e:
            raise e


        # To do
        #if not has_permission(user, "updateWorkform", record, collection):
        #    abort(403, f'The current user is not authorized to perform this action.')

        result = workform_collection.replace_one({'_id': old_data['_id']}, new_data)
        result or abort(500, 'PUT request failed for unknown reasons')

        return {'result': URL('api_workform', collection=collection, workform_name=workform_name).to_str()}, 201

    @ns.doc(description='Delete a workform with the given name', security='basic')
    @login_required
    def delete(self, collection, workform_name):
        workform_collection = DB.handle[f'{collection}_templates'] # todo: change name in dlx
        workform_collection.find_one({'name': workform_name}) or abort(404)
        workform_collection.delete_one({'name': workform_name}) or abort(500, 'DELETE request failed for unknown reasons')

# Files records list
@ns.route('/files')
class FilesRecordsList(Resource):
    get_args = reqparse.RequestParser()
    get_args.add_argument('start', type=int, default=1)
    get_args.add_argument('limit', type=int, default=100)
    get_args.add_argument('identifier_type', 
        choices=('symbol', 'uri', 'isbn'), 
        help='File content identifier type',
        required=False)
    get_args.add_argument('identifier', 
        help='File content identifier value',
        required=False)
    get_args.add_argument('language', 
        choices=('ar', 'fr', 'de', 'en', 'ru', 'es', 'zh'),
        required=False)

    post_args = reqparse.RequestParser()
    post_args.add_argument('identifier_type',
        type=str,
        choices=('symbol', 'uri', 'isbn'),
        help='File content identifier type',
        required=True,
        location='form')
    post_args.add_argument('identifier',
        type=str,
        help='File content identifier value',
        required=True,
        location='form')
    post_args.add_argument('languages',
        type=str,
        help='Comma-separated list of language codes (e.g., en,fr,es)',
        required=True,
        location='form')
    
    @ns.doc(description='Return a list of file records')
    @ns.expect(get_args)
    def get(self):
        args = FilesRecordsList.get_args.parse_args()
        
        # start
        start = 1 if args.start is None else int(args.start)
          
        # limit
        limit = int(args.limit or 100)
        
        if limit > 1000:
            abort(404, 'Maximum limit is 1000')
        
        if args.identifier:
            if args.identifier_type:
                this_identifier = Identifier(args.identifier_type, args.identifier)

                if args.language:
                    # Get files for identifier by language
                    data = [URL('api_file_record', record_id=f.id).to_str() for f in File.find_by_identifier_language(this_identifier, args.language)]
                else:
                    # Get all files for that identifier
                    data = [URL('api_file_record', record_id=f.id).to_str() for f in File.find_by_identifier(this_identifier)]
            else:
                abort(404, 'Param "identifier_type" required with param "identifier"')
        elif args.identifier_type and not args.identifier:
            abort(404, 'Param "identifier" required with param "identifier_type"')
        else:
            data = [URL('api_file_record', record_id=f.id).to_str() for f in File.find({}, skip=start - 1, limit=limit)]
        
        links = {
            '_self': URL('api_files_records_list', start=start, limit=limit).to_str(),
            '_next': URL('api_files_records_list', start=start + limit, limit=limit).to_str(),
            '_prev': URL('api_files_records_list', start=start - limit, limit=limit).to_str() if start - limit > 0 else None
        }
        
        meta = {
            'name': 'api_files_records_list',
            'returns': URL('api_schema', schema_name='api.urllist').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data=data).jsonify()
    
    @ns.doc(description="Submit a new file to the collection", security='basic')
    @ns.expect(post_args)
    @login_required
    def post(self):
        args = FilesRecordsList.post_args.parse_args()

        if 'file' not in request.files:
            abort(400, 'No file provided in request')

        uploaded_file = request.files['file']

        # Validate and parse languages
        languages = [lang.strip().lower() for lang in args.languages.split(',')]
        valid_langs = ['ar', 'zh', 'en', 'fr', 'ru', 'es', 'de']
        for lang in languages:
            if lang not in valid_langs:
                abort(400, f'Invalid language code: {lang}')

        if uploaded_file.filename == '':
            abort(400, 'No file selected')

        identifier_type = args.get('identifier_type')
        identifier_value = args.get('identifier')
        languages = [lang.strip().lower() for lang in args.get('languages').split(',')]

        try:
            file_identifier = Identifier(identifier_type, identifier_value)

            file_record = File.import_from_handle(
                handle=uploaded_file,
                identifiers=[file_identifier],
                languages=languages,
                mimetype=uploaded_file.mimetype,
                source='dlx-rest',
                filename=uploaded_file.filename,
                user=current_user.email
            )

            if file_record:
                return {
                    'result': URL('api_file_record', record_id=file_record.id).to_str()
                }, 201
            else:
                abort(500, 'File upload failed')

        except FileExists as e:
            abort(409, str(e))
        except FileExistsIdentifierConflict as e:
            abort(409, str(e))
        except FileExistsLanguageConflict as e:
            abort(409, str(e))
        except ValueError as e:
            abort(400, str(e))
        except Exception as e:
            abort(500, str(e))
        
# File
@ns.route('/files/<string:record_id>')
@ns.param('record_id', "The file ID")
class FileRecord(Resource):
    args = reqparse.RequestParser()
    args.add_argument(
        'action', 
        type=str, 
        choices=['open', 'download']
    )
    
    @ns.doc(description='Return the file record for the given ID')
    @ns.expect(args)
    def get(self, record_id):
        args = FileRecord.args.parse_args()
        record = File.from_id(str(record_id)) or abort(404)
            
        if record.filename is None:
            ids = []
        
            for idx in record.identifiers:
                ids.append(idx.value)
        
            langs = []
        
            for lang in record.languages:
                langs.append(lang)

            extension = mimetypes.guess_extension(record.mimetype)
            extension = extension[1:]
            record.filename = File.encode_fn(ids, langs, extension)
        
        action = args.get('action', None)
        
        if action == 'download':
            output_filename = record.filename
            s3 = boto3.client('s3')
            bucket = 'mock_bucket' if 'DLX_REST_TESTING' in os.environ else Config.bucket
        
            try:
                s3_file = s3.get_object(Bucket=bucket, Key=record_id)
            except Exception as e:
                abort(500, str(e))

            return send_file(s3_file['Body'], as_attachment=True, download_name=output_filename)
        elif action == 'open':
            output_filename = record.filename
            s3 = boto3.client('s3')
            bucket = 'mock_bucket' if 'DLX_REST_TESTING' in os.environ else Config.bucket
        
            try:
                s3_file = s3.get_object(Bucket=bucket, Key=record_id)
            except Exception as e:
                abort(500, str(e))

            return send_file(s3_file['Body'], as_attachment=False, download_name=output_filename)
            
        links = {
            '_self': URL('api_file_record', record_id=record_id).to_str(),
            'related': {
                'files': URL('api_files_records_list').to_str(),
                'download': URL('api_file_record', record_id=record_id, action='download').to_str()
            }
        }
        
        meta = {
            'name': 'api_file_record',
            'returns': URL('api_schema', schema_name='api.null').to_str()
        }
        
        return ApiResponse(links=links, meta=meta, data={}).jsonify()

#These routes all require a currently authenticated/authenticatable user.

@ns.route('/userprofile/my_profile')
class MyUserProfileRecord(Resource):
    @ns.doc(description="Get the current user's profile information", security="basic")
    @login_required
    def get(self):        
        return_data = {}

        this_u = User.objects.get(id=current_user.id)
        user_id = this_u['id']
        return_data['email'] = this_u.email
        return_data['shortname'] = this_u.shortname
        return_data['roles'] = []
        return_data['permissions'] = []
        return_data['default_views'] = []
            
        for r in this_u.roles:
            return_data['roles'].append(r.name or '')
            for p in r.permissions:
                if not p.constraint_must and  not p.constraint_must_not:
                    # basic unconstrained permissions
                    return_data['permissions'].append(p.action)
        
        try:
            for v in this_u.default_views:
                return_data['default_views'].append(v.to_json())
        except KeyError:
            pass
            
        my_basket = URL('api_my_basket_record').to_str()

        links = {
            '_self': URL('api_my_user_profile_record').to_str(),
            'related': {
                'baskets': [my_basket]
            }
        }

        meta = {
            'name': 'api_user_profile_record',
            'returns': URL('api_schema', schema_name='api.userprofile').to_str()
        }

        return ApiResponse(links=links, meta=meta, data=return_data).jsonify()

@ns.route('/userprofile/my_profile/basket')
class MyBasketRecord(Resource):
    @ns.doc(description="Get the current user's basket.", security="basic")
    @login_required
    def get(self):
        try:
            this_u = User.objects.get(id=current_user.id)
            user_id = this_u['id']
        except:
            raise

        links = {
            '_self': URL('api_my_basket_record').to_str(),
        }

        meta = {
            'name': 'api_user_basket_record',
            'returns': URL('api_schema', schema_name='api.basket').to_str()
        }

        items = sorted(this_u.my_basket()['items'], key=lambda item: item['id'], reverse=True)

        data = {
            'items': [URL('api_my_basket_item', item_id=item['id']).to_str() for item in items]
        }

        # Recommend to shift return here from URLs of items to just a list of item objects, then let Jmarc do the rest.
        data['item_data'] = []
        for item in this_u.my_basket()['items']:
            data['item_data'].append(
                {'record_id': item['record_id'], 'collection': item['collection'], 'url': URL('api_my_basket_item', item_id=item['id']).to_str()}
            )

        return ApiResponse(links=links, meta=meta, data=data).jsonify()


    @ns.doc("Add an item to the current user's basket. The item data must be in the body of the request.", security="basic")
    @login_required
    def post(self):
        item = json.loads(request.data)
        override = False
        if "override" in item.keys():
            override = item["override"]

        lock_status = item_locked(item['collection'], item['record_id'])
        this_u = User.objects.get(id=current_user.id)
        
        if lock_status["locked"] == True:
            if lock_status["by"] == this_u.email:
                # It's locked, but by the current user
                return {},200
            else:
                # It's locked by someone else
                if override:
                    # Remove it from the other user's basket
                    # Add it to this user's basket
                    for losing_basket in Basket.objects(name=lock_status["in"]):
                        losing_basket.remove_item(lock_status["item_id"])
                    this_u.my_basket().add_item(item)
                    return {},201
                else:
                    return {},403
        else:
            # The item is not locked, so we can add it to our basket
            this_u.my_basket().add_item(item)
            return {},201      

@ns.route('/userprofile/my_profile/basket/addBulk')
class MyBasketAddBulk(Resource):
    @ns.doc("Add a list of records to the user's basket in bulk.", security="basic")
    @login_required
    def post(self):
        try:
            this_u = User.objects.get(id=current_user['id'])
            user_id = this_u['id']
            this_basket = Basket.objects(owner=this_u)[0]
            items = json.loads(request.data)
            if items:
                this_basket.add_items(items)
        except:
            raise
        return 200

@ns.route('/userprofile/my_profile/basket/clear')
class MyBasketClear(Resource):
    @ns.doc("Clear the contents of the basket.", security="basic")
    @login_required
    def post(self):
        try:
            this_u = User.objects.get(id=current_user['id'])
            user_id = this_u['id']
            this_basket = Basket.objects(owner=this_u)[0]
            this_basket.clear()
        except:
            raise

        return 200

@ns.route('/userprofile/my_profile/basket/items/<string:item_id>')
class MyBasketItem(Resource):
    @ns.doc("Get the contents of an item in the current user's basket.", security="basic")
    @login_required
    def get(self, item_id):
        try:
            this_u = User.objects.get(id=current_user['id'])
            user_id = this_u['id']
            this_basket = Basket.objects(owner=this_u)[0]
            item_data_raw = this_basket.get_item_by_id(item_id)
            item_data = item_data_raw
            if isinstance(item_data_raw, list):
                item_data = item_data_raw[0]
            if item_data['collection'] == 'bibs':
                this_m = Bib.from_id(int(item_data['record_id']))
                item_data['title'] = this_m.title() or '...'
                item_data['symbol'] = this_m.get_value('191','a')
            elif item_data['collection'] == 'auths':
                this_m = Auth.from_id(int(item_data['record_id']))
                heading_field = this_m.heading_field.get_value('a') or '...'
                item_data['title'] = heading_field
                item_data['symbol'] = None
        except IndexError:
            abort(404)
        except:
            raise

        links = {
            '_self': URL('api_my_basket_item', item_id=item_id).to_str(),
        }

        meta = {
            'name': 'api_user_basket_item',
            'returns': URL('api_schema', schema_name='api.basket.item').to_str()
        }

        return ApiResponse(links=links, meta=meta, data=item_data).jsonify()

    @ns.doc("Remove an item from the current user's basket. The item data must be in the body of the request.", security="basic")
    @login_required
    def delete(self, item_id):
        try:
            this_u = User.objects.get(id=current_user['id'])
            this_basket = Basket.objects(owner=this_u)[0]
            this_basket.remove_item(item_id)
        except IndexError:
            abort(400)
        except:
            raise

        return 200

@ns.route('/views/<string:coll>')
class ViewList(Resource):
    @ns.doc("List the available record views by collection.")
    def get(self, coll):
        try:
            view_list = RecordView.objects(collection=coll)
        except:
            raise
        
        links = {
            '_self': URL('api_view_list',coll=coll).to_str(),
        }

        meta = {
            'name': 'api_view_list',
            'returns': URL('api_schema', schema_name='api.view.list').to_str()
        }

        '''
        data = {
            'items': [URL('api_view', coll=coll, id=item['id']).to_str() for item in view_list]
        }
        '''

        data = []
        for item in view_list:
            data.append({
                'name': item.name,
                'collection': item.collection,
                'url': URL('api_view', coll=coll, id=item['id']).to_str()
            })

        return ApiResponse(links=links, meta=meta, data=data).jsonify()

        

@ns.route('/views/<string:coll>/<string:id>')
class View(Resource):
    @ns.doc("Get the contents of a record view by collection and id.")
    def get(self, coll, id):
        this_item = RecordView.objects.get(id=id)

        links = {
            '_self': URL('api_view', coll=coll, id=id).to_str(),
        }

        meta = {
            'name': 'api_view',
            'returns': URL('api_schema', schema_name='api.view').to_str()
        }

        data = {
            'name': this_item.name,
            'collection': this_item.collection,
            'fieldsets': []
        }

        for fs in this_item.fieldsets:
            data["fieldsets"].append({
                "field": fs.field,
                "subfields": fs.subfields
            })

        return ApiResponse(links=links, meta=meta, data=data).jsonify()

'''
Search history.

To do: Return as an ApiResponse
'''
@ns.route('/search-history')
class SearchHistory(Resource):
    @ns.doc(description='Get search history for current user', security='basic')
    @login_required
    def get(self):
        user = User.objects.get(email=current_user.email)
        history = user.get_search_history()
        return [{
            'id': str(i),  # Using index as ID since entries are embedded
            'term': h.term,
            'datetime': h.datetime.isoformat()
        } for i, h in enumerate(history)], 200

    @ns.doc(description='Add new search term to history', security='basic')
    @login_required
    def post(self):
        data = request.get_json()
        term = data.get('term')
        if not term:
            return {'error': 'Term is required'}, 400
        
        user = User.objects.get(email=current_user.email)
        user.add_search_term(term)
        
        # Get the updated history to return
        history = user.get_search_history()
        latest_entry = next((h for h in history if h.term == term), None)
        
        return {
            'id': str(history.index(latest_entry)),
            'term': latest_entry.term,
            'datetime': latest_entry.datetime.isoformat()
        }, 200

    @ns.doc(description='Clear all search history for current user', security='basic')
    @login_required
    def delete(self):
        try:
            user = User.objects.get(email=current_user.email)
            user.clear_search_history()
            return {'message': 'Search history cleared'}, 200
        except:
            return {'error': 'There was an error clearing the history.'}, 400

@ns.route('/search-history/<string:id>')
class SearchHistoryItem(Resource):
    @ns.doc(description='Delete a specific search history entry', security='basic')
    @login_required
    def delete(self, id):
        try:
            user = User.objects.get(email=current_user.email)
            history = user.get_search_history()
            if 0 <= int(id) < len(history):
                term_to_delete = history[int(id)].term
                user.delete_search_term(term_to_delete)
                return {'message': 'Search history deleted'}, 200
            return {'error': 'Search history not found'}, 404
        except:
            return {'error': 'Search history not found'}, 404

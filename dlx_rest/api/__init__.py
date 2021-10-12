'''
DLX REST API
'''

# external
import requests
from dlx_rest.routes import login
import os, json, re, boto3, mimetypes, jsonschema
from datetime import datetime, timezone
from copy import copy, deepcopy
from urllib.parse import quote, unquote
from flask import Flask, Response, g, url_for, jsonify, request, abort as flask_abort, send_file
from flask_restx import Resource, Api, reqparse, fields
from flask_login import login_required, current_user
from base64 import b64decode
from mongoengine.document import Document
from pymongo import ASCENDING as ASC, DESCENDING as DESC
from bson import BSON, Regex, objectid
from dlx import DB, Config as DlxConfig
from dlx.marc import MarcSet, BibSet, Bib, AuthSet, Auth, Field, Controlfield, Datafield, \
    Query, Condition, Or, InvalidAuthValue, InvalidAuthXref, AuthInUse
from dlx.file import File, Identifier
from werkzeug import security

# internal
from dlx_rest.config import Config
from dlx_rest.app import app, login_manager
from dlx_rest.models import User, Basket, requires_permission, register_permission, DoesNotExist
from dlx_rest.api.utils import ClassDispatch, URL, ApiResponse, Schemas, abort, brief_bib, brief_auth, validate_data

# Init
authorizations = {
    'basic': {
        'type': 'basic'
    }
}

api = Api(app, doc='/api/', authorizations=authorizations)
ns = api.namespace('api', description='DLX MARC REST API')
DB.connect(Config.connect_string)
    
# Set up the login manager for the API
@login_manager.request_loader
def request_loader(request):
    auth_header = request.headers.get('Authorization')
    #print(f"Auth header: {auth_header}")
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
class Collection(Resource):
    @ns.doc(description='')
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
                'lookup': URL('api_lookup_fields_list', collection=collection).to_str()
            }
        }
        response = ApiResponse(links=links, meta=meta, data={})
        
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
        choices=['updated'],
    )
    args.add_argument(
        'direction', type=str, 
        choices=['asc', 'desc'],
        help='Sort direction', 
    )
    args.add_argument(
        'format', 
        type=str, 
        choices=['json', 'xml', 'mrk', 'mrc', 'brief'],
        help='Formats the list as a batch of records in the specified format'
    )
    args.add_argument(
        'search', 
        type=str, 
        help='Consult documentation for query syntax' # todo
    )
    
    @ns.doc(description='Return a list of MARC Bibliographic or Authority Records')
    @ns.expect(args)
    def get(self, collection):
        route_params = locals()
        route_params.pop('self')
        cls = ClassDispatch.batch_by_collection(collection) or abort(404)
        args = RecordsList.args.parse_args()
        
        # search
        search = unquote(args.search) if args.search else None
        query = Query.from_string(search) if search else {}

        # start
        start = 1 if args.start is None else int(args.start)
          
        # limit  
        limit = int(args.limit or 100)
        
        if limit > 1000:
            abort(404, 'Maximum limit is 1000')
            
        # sort
        if args['sort'] == 'updated':
            sort_by = 'updated'
            sort = [('updated', ASC)] if (args['direction'] or '').lower() == 'asc' else [('updated', DESC)]
        else:
            sort_by = sort = None
        
        # format
        fmt = args['format'] or None
        
        if fmt == 'brief':
            tags = ('191', '245', '269', '700', '710', '791', '989') if collection == 'bibs' \
                else ('100', '110', '111', '130', '150', '151', '190', '191', '400', '410', '411', '430', '450', '451', '490', '491')
            
            project = dict.fromkeys(tags, True)
        elif fmt:
            project = None
        else:
            project = {'_id': 1}

        # exec query
        recordset = cls.from_query(query, projection=project, skip=start - 1, limit=limit, sort=sort)
        
        # process
        if fmt == 'xml':
            return Response(recordset.to_xml(), mimetype='text/xml')
        elif fmt == 'mrk':
            return Response(recordset.to_mrk(), mimetype='text/plain')
        elif fmt == 'brief':
            schema_name='api.brieflist'
            make_brief = brief_bib if recordset.record_class == Bib else brief_auth
            data = [make_brief(r) for r in recordset]
        else:
            schema_name='api.urllist'
            data = [URL('api_record', record_id=r.id, **route_params).to_str() for r in recordset]
            
        new_direction = 'desc' if args.direction in (None, 'asc') else 'asc'
        
        meta = {
            'name': 'api_records_list',
            'returns': URL('api_schema', schema_name=schema_name).to_str()
        }
        
        links = {
            '_self': URL('api_records_list', collection=collection, start=start, limit=limit, search=search, format=fmt, sort=sort_by, direction=args.direction).to_str(),
            '_next': URL('api_records_list', collection=collection, start=start+limit, limit=limit, search=search, format=fmt, sort=sort_by, direction=args.direction).to_str(),
            '_prev': URL('api_records_list', collection=collection, start=start-limit, limit=limit, search=search, format=fmt, sort=sort_by, direction=args.direction).to_str() if start - limit > 0 else None,
            'format': {
                'brief': URL('api_records_list', collection=collection, start=start, limit=limit, search=search, format='brief', sort=sort_by, direction=args.direction).to_str(),
                'list': URL('api_records_list', start=start, limit=limit, search=search, sort=sort_by, direction=args.direction, **route_params).to_str(),
                'XML': URL('api_records_list', start=start, limit=limit, search=search,  format='xml', sort=sort_by, direction=args.direction, **route_params).to_str(),
                'MRK': URL('api_records_list', start=start, limit=limit, search=search,  format='mrk', sort=sort_by, direction=args.direction, **route_params).to_str(),
            },
            'sort': {
                'updated': URL('api_records_list', collection=collection, start=start, limit=limit, search=search, format=fmt, sort='updated', direction=new_direction).to_str()
            },
            'related': {
                'collection': URL('api_collection', collection=collection).to_str(),
                'count': URL('api_records_list_count', collection=collection, search=search).to_str()
            }
        }
        
        response = ApiResponse(links=links, meta=meta, data=data)
        
        return response.jsonify()
    
    @ns.doc(description='Create a Bibliographic or Authority Record with the given data.', security='basic')
    @login_required
    def post(self, collection):
        user = 'testing' if current_user.is_anonymous else current_user.email
        cls = ClassDispatch.by_collection(collection) or abort(404)
        args = RecordsList.args.parse_args()
    
        if args.format == 'mrk':
            try:
                result = cls.from_mrk(request.data.decode()).commit(user=user)
            except Exception as e:
                abort(400, str(e))
        else:
            try:
                jmarc = json.loads(request.data)
                
                if '_id' in jmarc:
                    if jmarc['_id'] is None:
                        del jmarc['_id']
                    else:
                        abort(400, f'"_id" {jmarc["_id"]} is invalid for a new record')
                    
                record = cls(jmarc, auth_control=True)
                validate_data(record)
                result = record.commit(user=user)
            except Exception as e:
                abort(400, str(e))
        
            if result.acknowledged:
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

        if args.search:
            search = unquote(args.search)
            query = Query.from_string(search)
        else:
            query = {}
        
        links = {
            '_self': URL('api_records_list_count', collection=collection, search=args.search).to_str(),
            'related': {
                'records': URL('api_records_list', collection=collection, search=args.search).to_str()
            }
        }
        
        meta = {'name': 'api_records_list_count', 'returns': URL('api_schema', schema_name='api.count').to_str()}
        data = cls.from_query(query).count
        
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
        fmt = args.get('format')

        if fmt == 'xml':
            return Response(record.to_xml(), mimetype='text/xml')
        elif fmt == 'mrk':
            return Response(record.to_mrk(), mimetype='text/plain')
        elif fmt == 'mrc':
            return Response(record.to_mrc(), mimetype='text/plain')
            
        files = []
        
        for lang in ('AR', 'ZH', 'EN', 'FR', 'RU', 'ES', 'DE'):
            f = File.latest_by_identifier_language(
                Identifier('symbol', record.get_value('191', 'a') or record.get_value('191', 'z') or record.get_value('791', 'a')), lang
            )
            
            if f:
                files.append({'mimetype': f.mimetype, 'language': lang.lower(), 'url': URL('api_file_record', record_id=f.id).to_str()})
        
        data = record.to_dict()
        data['updated'] = record.updated
        data['files'] = files
        
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
                #'fields': URL('api_record_fields_list', collection=collection, record_id=record_id).to_str(),
                'records': URL('api_records_list', collection=collection).to_str(),
                #'subfields': URL('api_record_subfields_list', collection=collection, record_id=record_id).to_str()
            }
        }

        response = ApiResponse(links=links, meta=meta, data=data)
        
        return response.jsonify()

    @ns.doc(description='Replace the record with the given data.', security='basic')
    @login_required
    def put(self, collection, record_id):
        user = 'testing' if current_user.is_anonymous else current_user.email
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)
        args = Record.args.parse_args()
        
        if args.format == 'mrk':
            try:
                record = cls.from_mrk(request.data.decode())
                record.id = record_id
                result = record.commit(user=user)
            except Exception as e:
                abort(400, str(e))
        else:
            try:
                jmarc = json.loads(request.data)
                record = cls(jmarc, auth_control=True)
                validate_data(record)
                result = record.commit(user=user)
            except Exception as e:
                abort(400, str(e))
        
        if result.acknowledged:
            data = {'result': URL('api_record', collection=collection, record_id=record.id).to_str()}
            
            return data, 200
        else:
            abort(500)

    @ns.doc(description='Delete the Bibliographic or Authority Record with the given identifier', security='basic')
    @login_required
    def delete(self, collection, record_id):
        user = 'testing' if current_user.is_anonymous else current_user.email
        
        cls = ClassDispatch.by_collection(collection) or abort(404)
        record = cls.from_id(record_id) or abort(404)

        try:
            result = record.delete(user=user)
        except AuthInUse as e:
            abort(403, 'Authority record in use')
        
        if result.acknowledged:
            # We should make sure this record is removed from any baskets that contained it.
            for basket in Basket.objects:
                # Normally the record_id is an integer, but it's being stored here as a string.
                try:
                    basket_item = basket.get_item_by_coll_and_rid(collection, str(record_id))
                    basket.remove_item(basket_item['id'])
                except IndexError:
                    pass

            return Response(status=204)
        else:
            abort(500)
            
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
    @ns.doc(description='Return a list of authorities that match a string value')
    #@ns.expect(list_argparser)
    def get(self, collection, field_tag):
        cls = ClassDispatch.by_collection(collection) or abort(404)
        codes = filter(lambda x: len(x) == 1, request.args.keys())
        conditions = []
        sparams = {}
            
        for code in codes:
            val = request.args[code]
            sparams[code] = val
            auth_tag = DlxConfig.authority_source_tag(collection[:-1], field_tag, code)
            
            if not auth_tag:
                continue
                
            tags = [auth_tag] # [auth_tag, '4' + auth_tag[1:], '5' + auth_tag[1:]]
            
            conditions.append(Or(*[Condition(tag, {code: Regex(val, 'i')}, record_type='auth') for tag in tags]))
            
        if not conditions:
            abort(400, 'Request parameters required')
            pass
            
        query = Query(*conditions)
        proj = dict.fromkeys(tags, 1)
        start = int(request.args.get('start', 1))
        auths = AuthSet.from_query(query, projection=proj, limit=25, skip=start - 1)
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
        user = 'testing' if current_user.is_anonymous else current_user.email
        gaining = Auth.from_id(record_id) or abort(404)
        losing_id = request.args.get('target') or abort(400, '"target" param required')
        losing_id = int(losing_id)
        losing = Auth.from_id(losing_id) or abort(404, "Target auth not found")
        
        if losing.heading_field.tag != gaining.heading_field.tag:
            abort(403, "Auth records not of the same type")

        def update_records(record_type, gaining, losing):
            authmap = getattr(DlxConfig, f'{record_type}_authority_controlled')
            
            conditions = []
                 
            for ref_tag, d in authmap.items():
                for subfield_code, auth_tag in d.items():
                    if auth_tag == losing.heading_field.tag:
                        val = losing.heading_field.get_value(subfield_code)
                        
                        if val:
                            conditions.append(Condition(ref_tag, {subfield_code: losing_id}, record_type=record_type))
            
            
            cls = BibSet if record_type == 'bib' else AuthSet
            query = Query(Or(*conditions))
            changed = 0

            for record in cls.from_query(query):
                state = record.to_bson()
                
                for i, field in enumerate(record.fields):
                    if isinstance(field, Datafield):
                        for subfield in field.subfields:
                            if hasattr(subfield, 'xref') and subfield.xref == losing_id:
                                subfield.xref = gaining.id
                        
                                if field in record.fields[0:i] + record.fields[i+1:]:
                                    del record.fields[i] # duplicate field
                        
                if record.to_bson() != state:    
                    record.commit(user=user)
                    changed += 1
                    
            return changed
        
        changed = 0
        
        for record_type in ('bib', 'auth'):
            changed += update_records(record_type, gaining, losing)    
        
        losing.delete(user=user)
        
        return jsonify({'message': f'updated {changed} records and deleted auth# {losing_id}'}) 
        
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
        history = hrec.get('history')
        
        if history:
            data = [URL('api_record_history_event', collection=collection, record_id=record_id, instance=i).to_str() for i in range(0, len(history))]
        else:
            data = None
        
        links = {
            '_self': URL('api_record_history', collection=collection, record_id=record_id).to_str(),
            'related': {
                'record': URL('api_record', collection=collection, record_id=record_id).to_str()
            }
        }
        
        meta = {
            'name': 'api_record_history',
            'returns': URL('api_schema', schema_name='api.urllist').to_str()
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
        print(data)
        data.get('_id') and data.pop('_id') # ignore any exisiting _id
        data.get('name') or print("missing workform name") and abort(400, 'workform "name" field required')        
        existing = workform_collection.find_one({'name': data["name"]})
        
        if existing:
            abort(400, f'Workform {data["name"]} already exists. Use PUT to update it')
            
        schema = Schemas.get('jmarc.workform')

        try:
            jsonschema.validate(instance=data, schema=schema, format_checker=jsonschema.FormatChecker())
        except jsonschema.exceptions.ValidationError as e:
            print(e)
            abort(400, 'Invalid workform')
        except Exception as e:
            print(e)
            raise e
        
        workform_collection.insert_one(data) or abort(500)
        
        return {'result': URL('api_workform', collection=collection, workform_name=data["name"]).to_str()}, 201

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

        result = workform_collection.replace_one({'_id': old_data['_id']}, new_data)
        result.acknowledged or abort(500, 'PUT request failed for unknown reasons')

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
    args = reqparse.RequestParser()
    args.add_argument('start')
    args.add_argument('limit')
    
    @ns.doc(description='Return a list of file records')
    def get(self):
        args = FilesRecordsList.args.parse_args()
        
        # start
        start = 1 if args.start is None else int(args.start)
          
        # limit
        limit = int(args.limit or 100)
        
        if limit > 1000:
            abort(404, 'Maximum limit is 1000')

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
        print(args)
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
        print(action)
        
        if action == 'download':
            output_filename = record.filename
            s3 = boto3.client('s3')
            bucket = 'mock_bucket' if 'DLX_REST_TESTING' in os.environ else Config.bucket
        
            try:
                s3_file = s3.get_object(Bucket=bucket, Key=record_id)
                print(s3_file)
            except Exception as e:
                abort(500, str(e))

            return send_file(s3_file['Body'], as_attachment=True, download_name=output_filename)
        elif action == 'open':
            output_filename = record.filename
            s3 = boto3.client('s3')
            bucket = 'mock_bucket' if 'DLX_REST_TESTING' in os.environ else Config.bucket
        
            try:
                s3_file = s3.get_object(Bucket=bucket, Key=record_id)
                print(s3_file)
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

        try:
            this_u = User.objects.get(id=current_user.id)
            user_id = this_u['id']
            return_data['email'] = this_u.email
            return_data['roles'] = []
            for r in this_u.roles:
                return_data['roles'].append(r.name)
            
            my_basket = URL('api_my_basket_record').to_str()
        except:
            raise

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

        data = {
            'items': [URL('api_my_basket_item', item_id=item['id']).to_str() for item in this_u.my_basket()['items']]
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
        try:
            this_u = User.objects.get(id=current_user.id)
            item = json.loads(request.data)
            if 'collection' in item and 'record_id' in item:
                this_u.my_basket().add_item(item)
            else:
                abort(500)
        except:
            raise

        my_item = this_u.my_basket().get_item_by_coll_and_rid(item['collection'], item['record_id'])
        #print(my_item)
        item_id = my_item['id']

        return {"id": item_id}, 200

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
            item_data = this_basket.get_item_by_id(item_id)
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
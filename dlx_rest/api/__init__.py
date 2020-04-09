from flask import Flask, Response, g, url_for, jsonify, request, abort as flask_abort
from flask_restx import Resource, Api, reqparse
from flask_httpauth import MultiAuth, HTTPBasicAuth, HTTPTokenAuth
from pymongo import ASCENDING as ASC, DESCENDING as DESC
from flask_cors import CORS
from dlx import DB
from dlx.marc import MarcSet, BibSet, Bib, AuthSet, Auth, Controlfield, Datafield, QueryDocument
from dlx_rest.config import Config
from dlx_rest.app import app
from dlx_rest.models import User
import json

#authorizations  
authorizations = {
    'basic': {
        'type': 'basic'
    }
}

DB.connect(Config.connect_string)
api = Api(app, doc='/api/', authorizations=authorizations)
ns = api.namespace('api', description='DLX MARC REST API')
basic_auth = HTTPBasicAuth()
token_auth = HTTPTokenAuth('Bearer')
auth = MultiAuth(basic_auth, token_auth)

# Set some api-wide arguments

list_argparser = reqparse.RequestParser()
list_argparser.add_argument('start', type=int, help='Number of record results to skip for pagination. Default is 0.')
list_argparser.add_argument('limit', type=int, help='Number of results to return. Default is 100 for record lists and 0 (unlimited) for field and subfield lists.')
list_argparser.add_argument('sort', type=str, help='Valid strings are "date"')
list_argparser.add_argument('direction', type=str, help='Valid strings are "asc", "desc". Default is "desc"')
list_argparser.add_argument('format', type=str, help='Valid strings are "xml", "mrc", "mrk", "txt"')
list_argparser.add_argument('search', type=str, help='Consult documentation for query syntax')

resource_argparser = reqparse.RequestParser()
resource_argparser.add_argument('format', type=str, help='Return format. Valid strings are "json", "xml", "mrc", "mrk", "txt". Default is "json"')

# Custom error messages
def abort(code, message=None):
    msgs = {
        404: 'Requested resource not found'
    }

    flask_abort(code, message or msgs.get(code, None))

### Utility classes

class ClassDispatch():
    index = {
        Config.BIB_COLLECTION: Bib,
        Config.AUTH_COLLECTION: Auth
    }
    
    batch_index = {
        Config.BIB_COLLECTION: BibSet,
        Config.AUTH_COLLECTION: AuthSet
    }
    
    @classmethod
    def list_names(cls):
        return cls.index.keys()

    @classmethod
    def by_collection(cls, name):
        return cls.index[name]
        
    @classmethod
    def batch_by_collection(cls, name):
        return cls.batch_index[name]

class ListResponse():
    def __init__(self, endpoint, items, **kwargs):
        self.url = URL(endpoint, **kwargs).to_str()
        self.start = kwargs.pop('start', 0)
        self.limit = kwargs.pop('limit', 0)
        self.items = items

    def json(self):
        data = {
            '_links': {
                'self': self.url
            },
            'start': self.start,
            'limit': self.limit,
            'results': self.items
        }

        return jsonify(data)

class BatchResponse():
    def __init__(self, records):
        assert isinstance(records, MarcSet)
        self.records = records
        
    def xml(self):
        return Response(self.records.to_xml(), mimetype='text/xml')

    def mrc(self):
        return Response(self.records.to_mrc(), mimetype='application/marc')

    def mrk(self):
        return Response(self.records.to_mrk(), mimetype='text/plain')

    def txt(self):
        return Response(self.records.to_str(), mimetype='text/plain')

class RecordResponse():
    def __init__(self, endpoint, record, **kwargs):
        self.record = record
        self.url = URL(endpoint, **kwargs).to_str()

    def json(self):
        data = {
            '_links': {
                'self': self.url
            },
            'result': self.record.to_dict()
        }

        return jsonify(data)

    def xml(self):
        return Response(self.record.to_xml(), mimetype='text/xml')

    def mrc(self):
        return Response(self.record.to_mrc(), mimetype='application/marc')

    def mrk(self):
        return Response(self.record.to_mrk(), mimetype='text/plain')

    def txt(self):
        return Response(self.record.to_str(), mimetype='text/plain')

class ValueResponse():
    def __init__(self, endpoint, value, **kwargs):
        self.value = value
        self.url = URL(endpoint, **kwargs).to_str()

    def json(self):
        data = {
            '_links': {
                'self': self.url
            },
            'result': self.value
        }

        return jsonify(data)

class URL():
    def __init__(self, endpoint, **kwargs):
        self.endpoint = endpoint
        self.kwargs = kwargs

    def to_str(self, **kwargs):
        self.kwargs.setdefault('_external', True)
        return url_for(self.endpoint, **self.kwargs)

### Routes

# Authentication
@ns.route('/token')
class AuthToken(Resource):
    @auth.login_required
    def get(self):
        token = g.user.generate_auth_token()
        return jsonify({ 'token': token.decode('ascii') })

@basic_auth.verify_password
def verify_password(email, password):
    # try to authenticate with username/password
    try:
        user = User.objects.get(email=email)
        if not user.check_password(password):
            return False
    except:
        return False
    g.user = user
    return True

@token_auth.verify_token
def verify_token(token):
    user = User.verify_auth_token(token)
    if user:
        return True
    else:
        return False


@ns.route('/collections')
class CollectionsList(Resource):
    @ns.doc(description='Return a list of the collection endpoints.')
    def get(self):
        collections = ClassDispatch.list_names()

        results = [
            URL('api_records_list', collection=col).to_str() for col in collections
        ]

        response = ListResponse(
            'api_collections_list',
            results
        )

        return response.json()

# Lists of records

@ns.route('/<string:collection>')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordsList(Resource):
    @ns.doc(description='Return a list of MARC Bibliographic or Authority Records')
    @ns.expect(list_argparser)
    def get(self, collection):
        try:
            cls = ClassDispatch.batch_by_collection(collection)
        except KeyError:
            abort(404)

        args = list_argparser.parse_args()
        search = args['search']
        start = args['start'] or 0
        limit = args['limit'] or 100
        sort_by = args['sort']
        direction = args['direction'] or ''
        fmt = args['format'] or ''
        
        if search:
            try:
                json.loads(search)
            except:
                abort(400, 'Search string is invalid JSON')
                
            query = QueryDocument.from_string(search)
        else:
            query = {}
        
        if sort_by == 'date':
            if direction.lower() == 'asc':
                sort = [('updated', ASC)]
            else:
                sort = [('updated', DESC)]
        else:
            sort = None
        
        project = None if fmt else {'_id': 1}
        
        rset = cls.from_query(query, projection=project, skip=start, limit=limit, sort=sort)
        
        if fmt == 'xml':
            return BatchResponse(rset).xml()
        elif fmt == 'mrk':
            return BatchResponse(rset).mrk()
        elif fmt == 'mrc':
            return BatchResponse(rset).mrc()
        elif fmt == 'txt':
            return BatchResponse(rset).txt()
            
        records_list = [
            URL('api_record', collection=collection, record_id=r.id).to_str() for r in rset
        ]

        response = ListResponse(
            'api_records_list',
            records_list,
            collection=collection,
            start=start,
            limit=limit,
            sort=sort_by
        )

        return response.json()

@ns.route('/<string:collection>/<int:record_id>/fields')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldsList(Resource):
    @ns.doc(description='Return a list of the Fields in the Record with the given record identifier')
    def get(self, collection, record_id):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)

        record = cls.match_id(record_id) or abort(404)

        fields_list = []
        for tag in sorted(set(record.get_tags())):
            fields_list.append(
                URL('api_record_field_place_list',
                    collection=collection,
                    record_id=record.id,
                    field_tag=tag
                ).to_str()
            )

        response = ListResponse(
            'api_record_fields_list',
            fields_list,
            collection=collection,
            record_id=record.id,
        )

        return response.json()
        
@ns.route('/<string:collection>/<int:record_id>/subfields')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordSubfieldsList(Resource):
    @ns.doc(description='Return a list of all the subfields in the record with the given record identifier')
    def get(self, collection, record_id):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)

        record = cls.match_id(record_id) or abort(404)
        subfields_list = []
        
        for tag in record.get_tags():
            field_place = 0
            
            for field in record.get_fields(tag):        
                if type(field) == Controlfield:
                    # todo: do something with Datafields
                    continue
                    
                subfield_place = 0
                seen = {}
                
                for subfield in field.subfields:
                    if subfield.code in seen:
                        subfield_place = seen[subfield.code]
                        seen[subfield.code] += 1
                    else:
                        subfield_place = 0
                        seen[subfield.code] = 1
                    
                    subfields_list.append(
                        URL(
                            'api_record_field_place_subfield_place',
                            collection=collection,
                            record_id=record.id,
                            field_tag=field.tag,
                            field_place=field_place,
                            subfield_code=subfield.code,
                            subfield_place=subfield_place
                        ).to_str()
                    )    
   
                field_place += 1

        response = ListResponse(
            'api_record_subfields_list',
            subfields_list,
            collection=collection,
            record_id=record.id,
        )
        
        return response.json()
    
@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldPlaceList(Resource):
    @ns.doc(description='Return a list of the instances of the field in the record with the given identifier')
    def get(self, collection, record_id, field_tag):
        route_params = locals()
        route_params.pop('self')

        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)

        record = cls.match_id(record_id) or abort(404)
        places = len(list(record.get_fields(field_tag)))

        field_places = []
        for place in range(0, places):
            route_params['field_place'] = place

            field_places.append(
                URL('api_record_field_place_subfield_list', **route_params).to_str()
            )

        response = ListResponse(
            'api_record_field_place_list',
            field_places,
            **route_params
        )

        return response.json()

@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>/<int:field_place>')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldPlaceSubfieldList(Resource):
    @ns.doc(description='Return a list of the subfields of the field in the given place in the record with the given identifier')
    def get(self, collection, record_id, field_tag, field_place):
        route_params = locals()
        route_params.pop('self')

        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)

        record = cls.match_id(record_id) or abort(404)
        field = record.get_field(field_tag, place=field_place) or abort(404)
        subfield_places = []

        for sub in field.subfields:
            route_params['subfield_code'] = sub.code

            subfield_places.append(
                URL('api_record_field_place_subfield_place_list', **route_params).to_str()
            )

        response = ListResponse(
            'api_record_field_place_subfield_list',
            subfield_places,
            **route_params
        )

        return response.json()

@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>/<int:field_place>/<string:subfield_code>')
@ns.param('subfield_code', 'The subfield code')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldPlaceSubfieldPlaceList(Resource):
    @ns.doc(description='Return a list of the subfields of the field in the given place in the record with the given identifier')
    def get(self, collection, record_id, field_tag, field_place, subfield_code):
        route_params = locals()
        route_params.pop('self')

        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)

        record = cls.match_id(record_id) or abort(404)
        field = record.get_field(field_tag, place=field_place) or abort(404)
        subfields = filter(lambda x: x.code == subfield_code, field.subfields) or abort(404) # dlx needs a 'get_subfields' method

        subfield_places = []
        for place in range(0, len(list(subfields))):
            route_params['subfield_place'] = place

            subfield_places.append(
                URL('api_record_field_place_subfield_place', **route_params).to_str()
            )

        response = ListResponse(
            'api_record_field_place_subfield_place_list',
            subfield_places,
            **route_params
        )

        return response.json()

# Single records

@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>/<int:field_place>/<string:subfield_code>/<int:subfield_place>')
@ns.param('subfield_place', 'The incidence number of the subfield code in the field, starting wtih 0')
@ns.param('subfield_code', 'The subfield code')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldPlaceSubfieldPlace(Resource):
    @ns.doc(description='Return the value of a subfield in the given place in the field in the given place in the record with the given identifier')
    def get(self, collection, record_id, field_tag, field_place, subfield_code, subfield_place):
        route_params = locals()
        route_params.pop('self')

        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)

        record = cls.match_id(record_id) or abort(404)
        field = record.get_field(field_tag, place=field_place) or abort(404)
        subfields = filter(lambda x: x.code == subfield_code, field.subfields) or abort(404)

        try:
            value = [sub.value for sub in subfields][subfield_place]
        except:
            abort(404)

        response = ValueResponse(
            'api_record_field_place_subfield_place',
            value,
            **route_params
        )

        return response.json()

@ns.route('/<string:collection>/<int:record_id>')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class Record(Resource):
    @ns.doc(description='Return the Bibliographic or Authority Record with the given identifier')
    @ns.expect(resource_argparser)
    def get(self, collection, record_id):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)

        record = cls.match_id(record_id) or abort(404)

        response = RecordResponse(
            'api_record',
            record,
            collection=collection,
            record_id=record_id,
        )

        args = resource_argparser.parse_args()
        fmt = args.get('format', None)
        
        if fmt:
            try:
                return getattr(response, fmt)()
            except AttributeError:
                abort(400)
            except:
                abort(500)
        else:
            return response.json()
    

    @ns.doc(description='Create a Bibliographic or Authority Record with the given data.', security='basic')
    @auth.login_required
    def post(self, collection, data):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        pass

        # To do: validate data and create the record

    @ns.doc(description='Update/replace a Bibliographic or Authority Record with the given data.', security='basic')
    @auth.login_required
    def put(self, collection, record_id, data):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        pass

        record = cls.match_id(record_id) or abort(404)

        # To do: Validate data and update the record

    @ns.doc(description='Delete the Bibliographic or Authority Record with the given identifier', security='basic')
    @auth.login_required
    def delete(self, collection, record_id):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        
        record = cls.match_id(record_id) or abort(404)
        result = record.delete(user='?')
        
        if result.acknowledged:
            return Response(status=200)
        else:
            abort(500)
        
        

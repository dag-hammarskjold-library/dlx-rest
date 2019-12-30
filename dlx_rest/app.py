from flask import url_for, Flask, abort, jsonify, Response
from flask_restplus import Resource, Api, reqparse
from dlx_rest.config import Config
from dlx_rest.utils import make_list, make_singleton

app = Flask(__name__)
app.config.from_object(Config)
api = Api(app)
ns = api.namespace('api', description='DLX MARC REST API')
db = app.config.get('DB')

collections = app.config.get('COLLECTIONS')

# Set some api-wide arguments.
parser = reqparse.RequestParser()
parser.add_argument('start', type=int, help='Number of record results to skip for pagination. Default is 0.')
parser.add_argument('limit', type=int, help='Number of results to return. Default is 100 for record lists and 0 (unlimited) for field and subfield lists.')

### Utility classes

from dlx import DB 
from dlx.marc import BibSet, Bib, AuthSet, Auth

DB.connect(Config.connect_string)

class ClassDispatch(object):
    index = {
        Config.BIB_COLLECTION: Bib,
        Config.AUTH_COLLECTION: Auth
    }
    
    @classmethod
    def list_names(cls):
        return cls.index.keys()
        
    @classmethod
    def by_collection(cls,name):
        return cls.index[name]
        
class ListResponse(object):
    def __init__(self,endpoint,items,**kwargs):
        self.url = URL(endpoint,**kwargs).to_str()
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
        
class ItemResponse(object):
    def __init__(self,endpoint,record,**kwargs):
        self.record = record
        self.url = URL(endpoint,**kwargs).to_str()
        self.start = kwargs.pop('start', 0)
        self.limit = kwargs.pop('limit', 0)
       
    def json(self):
        data = {
            '_links': {
                'self': self.url
            },
            'result': self.record.to_dict()
        }
        
        return jsonify(data)
        
    def xml(self):
        xml = self.record.to_xml()
        return Response(xml, mimetype='text/xml')
        
    def mrc(self):
        mrc = self.record.to_mrc()    
        return Response(mrc, mimetype='application/marc')
        
    def mrk(self):
        mrc = self.record.to_str()
        return Response(mrc, mimetype='text/plain')
        
class URL(object):
    def __init__(self,endpoint,**kwargs):
        self.endpoint = endpoint
        self.kwargs = kwargs
        
    def to_str(self,**kwargs):
        self.kwargs.setdefault('_external',True)

        return url_for(self.endpoint,**self.kwargs)

### Routes
    
@ns.route('/collections')
class CollectionsList(Resource):
    @ns.doc(description='Return a list of the collection endpoints.')
    
    def get(self):
        collections = ClassDispatch.list_names()

        results = [
            URL('api_records_list',collection=col).to_str() for col in collections
        ]
        
        response = ListResponse(
            'api_collections_list',
            results
        )
        
        return response.to_json()
    
# Lists of records
@ns.route('/<string:collection>')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordsList(Resource):
    @ns.doc(description='Return a list of MARC Bibliographic or Authority Records')
    @ns.expect(parser)
    
    def get(self,collection):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 100
        
        from dlx.marc import Condition
        from bson import Regex
        
        #cond = Condition(tag='191',subfields={'a': Regex('^A/RES/')})
        records = cls.handle().find({}, {'_id': 1}, skip = start, limit = limit)  
        records_list = [
            URL('api_record', collection = collection, record_id = r['_id']).to_str() for r in records
        ]
            
        response = ListResponse(
            'api_records_list',
            records_list,
            collection = collection,
            start = start, 
            limit = limit
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
                    collection = collection, 
                    record_id = record.id, 
                    field_tag = tag
                ).to_str()
            )
                
        response = ListResponse(
            'api_record_fields_list',
            fields_list,
            collection = collection,
            record_id = record.id,
        )
        
        return response.json()

        
@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>')
#@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldPlaceList(Resource):
    @ns.doc(description='Return a list of the instances of the field in the record with the given identifier')
    
    def get(self, collection, record_id, field_tag):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        
        record = cls.match_id(record_id) or abort(404)        
        places = len(list(record.get_fields(field_tag)))

        field_places = []
        for place in range(0,places):
            field_places.append(
                URL('api_record_field_place_subfield_list', 
                    collection = collection, 
                    record_id = record.id, 
                    field_tag = field_tag, 
                    field_place = place
                ).to_str()
            )
                
        response = ListResponse(
            'api_record_field_place_list',
            field_places,
            collection = collection,
            record_id = record_id,
            field_tag = field_tag
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
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        
        record = cls.match_id(record_id) or abort(404)
        field = record.get_field(field_tag,place=field_place) or abort(404)
        subfield_places = []
        
        for sub in field.subfields:
            subfield_places.append(
                URL('api_record_field_place_subfield_place_list', 
                    collection = collection, 
                    record_id = record.id, 
                    field_tag = field_tag, 
                    field_place = field_place,
                    subfield_code = sub.code
                ).to_str()
            )
                
        response = ListResponse(
            'api_record_field_place_subfield_list',
            subfield_places,
            collection = collection,
            record_id = record_id,
            field_tag = field_tag,
            field_place = field_place
        )
        
        return response.json()


@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>/<int:field_place>/<string:subfield_code>')
@ns.param('subfield_code', 'Hi')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldPlaceSubfieldPlaceList(Resource):
    @ns.doc(description='Return a list of the subfields of the field in the given place in the record with the given identifier')
    
    def get(self, collection, record_id, field_tag, field_place, subfield_code):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        
        record = cls.match_id(record_id) or abort(404)
        field = record.get_field(field_tag,place=field_place) or abort(404)
        subfields = filter(lambda x: x.code == subfield_code, field.subfields) or abort(404) # dlx needs a 'get_subfields' method
        
        subfield_places = []    
        for place in range(0,len(list(subfields))):
            subfield_places.append(
                URL(
                    'api_record_field_place_subfield_place',
                    collection = collection, 
                    record_id = record.id, 
                    field_tag = field_tag, 
                    field_place = field_place,
                    subfield_code = subfield_code,
                    subfield_place = place
                ).to_str()
            )
            
        response = ListResponse(
            'api_record_field_place_subfield_place_list',
            subfield_places,
            collection = collection, 
            record_id = record.id, 
            field_tag = field_tag, 
            field_place = field_place,
            subfield_code = subfield_code
        )
        
        return response.json()

# end

@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>/<int:field_place>/<string:subfield_code>/<int:subfield_place>')
@ns.param('subfield_place', 'The incidence number of the subfield code in the field')
@ns.param('subfield_code', 'The subfield code')
@ns.param('field_place', 'The incidence number of the field in the record, starting with 0')
@ns.param('field_tag', 'The MARC tag identifying the field')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldPlaceSubfieldPlace(Resource):
    @ns.doc(description='Return the value of a subfield in the given place in the field in the given place in the record with the given identifier')
    
    def get(self, collection, record_id, field_tag, field_place, subfield_code, subfield_place):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
            
        record = cls.match_id(record_id) or abort(404)
        field = record.get_field(field_tag,place=field_place) or abort(404)
        subfields = filter(lambda x: x.code == subfield_code, field.subfields) or abort(404)
        
        try:
            value = [sub.value for sub in subfields][subfield_place]
        except:
            abort(404)
            
        return Response(value, mimetype='text/plain')
        
# Single records

record_parser = reqparse.RequestParser()
record_parser.add_argument('format',type=str, help='Return format. Valid strings are "json", "xml", "mrc", "mrk". Default is "json"')

@ns.route('/<string:collection>/<int:record_id>')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class Record(Resource):
    @ns.doc(description='Return the Bibliographic or Authority Record with the given identifier')
    @ns.expect(record_parser)
    
    def get(self, collection, record_id):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        
        record = cls.match_id(record_id) or abort(404)
        
        response = ItemResponse(
            'api_record',
            record,
            collection = collection,
            record_id = record_id, 
        )
        
        args = record_parser.parse_args()
        fmt = args.get('format',None)
        
        if fmt:
            return getattr(response,fmt)()
        else:
            return response.json()

      
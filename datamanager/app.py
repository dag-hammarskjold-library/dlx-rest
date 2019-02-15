from flask import url_for, Flask, abort
from flask_restplus import Resource, Api, reqparse
from marctools.pymarcer import make_json
from marctools import jmarc
from pymarc import JSONReader
# replace DevelopmentConfig with ProductionConfig when deploying to production
from .config import DevelopmentConfig

# App initialization
app = Flask(__name__)
app.config.from_object(DevelopmentConfig)
api = Api(app)
ns = api.namespace('api', description='DLX MARC REST API')

# Get some configs we need
db = app.config.get('DB')
collections = app.config.get('COLLECTIONS')

# Set some api-wide arguments.
parser = reqparse.RequestParser()
parser.add_argument('start', type=int, help='Number of record results to skip for pagination. Default is 0.')
parser.add_argument('limit', type=int, help='Number of results to return. Default is 10 for record lists and 0 (unlimited) for field and subfield lists.')

def make_list(endpoint, results, **kwargs):
    '''
    Makes a list of records, fields, whatever, and stores them in results.
    '''
    return_data = {
        '_links': {
            'self': url_for(endpoint, **kwargs)
        },
        'start': kwargs.pop('start', 0),
        'limit': kwargs.pop('limit', 0),
        'results': results
    }
    return return_data

def make_singleton(endpoint, record_id, record, **kwargs):
    '''
    Makes a single record result and stores it in result.
    '''
    return_data = {
        '_links': {
            'self': url_for(endpoint, record_id=record_id, **kwargs)
        },
        'result': record
    }
    return return_data

# Descriptions are in-line below and are used by flask_restplus to make swagger docs.
# Lists
@ns.route('/collections')
class CollectionsList(Resource):
    @ns.doc(description='Return a list of the collection endpoints.')
    def get(self):
        this_collections = []
        for c in collections:
            this_collections.append(url_for('api_records_list', collection=c, _external=True))
        return make_list('api_collections_list', results=this_collections, _external=True)

# MARC Records. Will this work with files as well?
@ns.route('/<string:collection>')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordsList(Resource):
    @ns.doc(description='Return a list of MARC Bibliographic or Authority Records')
    @ns.expect(parser)
    def get(self, collection):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 10
        results = getattr(db, collection, db.bibs).find({}).skip(start).limit(limit)
        this_results = []
        for res in results:
            this_results.append(
            url_for('api_record', collection=collection, record_id=res['_id'], _external=True)
        )
        return make_list('api_records_list', results=this_results, collection=collection, start=start, limit=limit, _external=True)

@ns.route('/<string:collection>/<int:record_id>/fields')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordFieldsList(Resource):
    @ns.doc(description='Return a list of the Fields in the Bibliographic Record with the given record identifier')
    def get(self, collection, record_id):
        found_record = getattr(db, collection, db.bibs).find_one({'_id': record_id}) or abort(404)
        record = jmarc.JMARC(found_record)
        fields = []
        for field in record.get_fields():
            url = url_for('api_record_field', record_id=record.id, collection=collection, field_tag=field.tag, _external=True)
            if url not in fields:
                fields.append(url)
        print(fields)
        return make_list(endpoint='api_record_fields_list', results=fields, collection=collection, record_id=record_id, _external=True)

# Single records
@ns.route('/<string:collection>/<int:record_id>')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class Record(Resource):
    @ns.doc(description='Return the Bibliographic or Authority Record with the given identifier')
    def get(self, collection, record_id):
        found_record = getattr(db, collection, db.bibs).find_one({'_id': record_id}) or abort(404)
        record = jmarc.JMARC(found_record)
        return make_singleton('api_record', record_id=record_id, record=record.to_dict(), collection=collection, _external=True)

@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordField(Resource):
    @ns.doc(description='Return the contents of the field in the Bibliographic or Authority Record with the given field tag and record identifier')
    def get(self, collection, record_id, field_tag):
        found_record = getattr(db, collection, db.bibs).find_one({'_id': record_id}) or abort(404)
        record = jmarc.JMARC(found_record)
        fields = []
        for field in record.get_fields(field_tag):
            fields.append(field.to_bson())
        return make_singleton('api_record_field', record_id=record_id, collection=collection, record=fields, field_tag=field_tag, _external=True)

@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>/<int:index>')
@ns.param('index', 'In case the record has more than one instance of a MARC tag, return only the instance with the given index.')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
class RecordFieldIndex(Resource):
    @ns.doc(description='Return the contents of the field in the Bibliographic or Authority Record with the given field tag and record identifier')
    def get(self, collection, record_id, field_tag, index):
        found_record = getattr(db, collection, db.bibs).find_one({'_id': record_id}) or abort(404)
        record = jmarc.JMARC(found_record)
        fields = list(record.get_fields(field_tag))[index].to_bson()
        return make_singleton('api_record_field_index', collection=collection, record_id=record_id, record=fields, field_tag=field_tag, index=index, _external=True)

# This probably belongs in config.
special_routes = [
    '/bibs/{record_id}/auths',
    '/bibs/{record_id}/files',
    '/auths/{record_id}/auths',
    '/auths/{record_id}/bibs',
    '/files/{record_id}/bibs',
]
# Special, generalized endpoints: /<from>/<id>/<to>
# Can this handle files or no?
@ns.route('/<string:from_collection>/<int:record_id>/<string:to_collection>')
@ns.param('to_collection', 'The collection containing the target records that are related to the source record.')
@ns.param('record_id', 'The record identifier')
@ns.param('from_collection', 'The collection containing the source record from which you want to search for relationships.')
class RecordRelationsList(Resource):
    @ns.doc(description="""
    Returns relationships based on the pattern /api/{from_collection}/{record_id}/{to_collection} where record_id is a record in from_collection and the collections represent available collection endpoints.
    \nValid special routes are:\n %s

    Examples:
    
    To get the list of authorities referenced in the bibliographic record with record id 72764: /api/bibs/72764/auths
    To get the list of files associated with the bibliographic record with record id 72764: /api/bibs/72764/files
    """ % '\n'.join(special_routes)
    )
    def get(self, from_collection, record_id, to_collection):
        constructed_route = '/' + '/'.join([from_collection,'{record_id}',to_collection])
        print(constructed_route)
        if constructed_route not in special_routes:
            abort(400)
        found_record = getattr(db, from_collection, db.bibs).find_one({'_id': record_id}) or abort(404)
        record = jmarc.JMARC(found_record)
        relations = []
        for f in record.get_fields():
            if isinstance(f, jmarc.Datafield):
                for sf in f.subfield:
                    if sf.code == "0":
                        relations.append({
                            'field': url_for(
                                'api_record_field', 
                                collection=from_collection, 
                                record_id=record_id, 
                                field_tag=f.tag, 
                                _external=True
                            ),
                            'xref': url_for('api_record', collection='auths', record_id=sf.value, _external=True)
                        })
            # 856? other?
        return make_list('api_record_relations_list', results=relations, from_collection=from_collection, record_id=record_id, to_collection=to_collection, _external=True)
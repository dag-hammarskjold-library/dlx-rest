from flask import url_for, Flask, abort
from flask_restplus import Resource, Api, reqparse
from dlx import Bib, Auth
from datamanager.config import Config
from datamanager.utils import make_list, make_singleton

app = Flask(__name__)
app.config.from_object(Config)
api = Api(app)
ns = api.namespace('api', description='DLX MARC REST API')
db = app.config.get('DB')

collections = app.config.get('COLLECTIONS')

# Set some api-wide arguments.
parser = reqparse.RequestParser()
parser.add_argument('start', type=int, help='Number of record results to skip for pagination. Default is 0.')
parser.add_argument('limit', type=int, help='Number of results to return. Default is 10 for record lists and 0 (unlimited) for field and subfield lists.')

@ns.route('/collections')
class CollectionsList(Resource):
    @ns.doc(description='Return a list of the collection endpoints.')
    def get(self):
        this_collections = []
        for c in collections:
            this_collections.append(url_for('api_records_list', collection=c, _external=True))
        return make_list('api_collections_list', results=this_collections, _external=True)

# Lists of records
@ns.route('/<string:collection>')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordsList(Resource):
    @ns.doc(description='Return a list of MARC Bibliographic or Authority Records')
    @ns.expect(parser)
    def get(self, collection):
        try:
            this_collection = collections[collection]
        except KeyError:
            abort(404)
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

# Single records
@ns.route('/<string:collection>/<int:record_id>')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class Record(Resource):
    @ns.doc(description='Return the Bibliographic or Authority Record with the given identifier')
    def get(self, collection, record_id):
        #found_record = getattr(db, collection, db.bibs).find_one({'_id': record_id}) or abort(404)
        try:
            this_collection = collections[collection]
        except KeyError:
            abort(404)
        record = getattr(this_collection['instance_class'], 'match_id')(record_id)
        if record:
            return make_singleton('api_record', record_id=record_id, record=record.to_dict(), collection=collection, _external=True)
        else:
            abort(404)

@ns.route('/<string:collection>/<int:record_id>/fields/<string:field_tag>')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
@ns.param('collection', 'The name of the collection. Valid values are "bibs" and "auths".')
class RecordField(Resource):
    @ns.doc(description='Return the contents of the field in the Bibliographic or Authority Record with the given field tag and record identifier')
    def get(self, collection, record_id, field_tag):
        found_record = getattr(db, collection, db.bibs).find_one({'_id': record_id}) or abort(404)
        #record = jmarc.JMARC(found_record)
        record = {}
        fields = []
        for field in record.get_fields(field_tag):
            fields.append(field.to_bson())
        return make_singleton('api_record_field', record_id=record_id, collection=collection, record=fields, field_tag=field_tag, _external=True)
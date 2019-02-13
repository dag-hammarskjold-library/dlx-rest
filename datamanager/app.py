from flask import url_for, Flask
from flask_restplus import Resource, Api, reqparse
#from marctools.jmarc import JMARC
# replace DevelopmentConfig with ProductionConfig when deploying to production
from .config import DevelopmentConfig as Config

app = Flask(__name__)
app.config.from_object(Config)
api = Api(app)

ns = api.namespace('api', description='dlx REST API')

parser = reqparse.RequestParser()
parser.add_argument('start', type=int, help='Number of record results to skip for pagination. Default is 0.')
parser.add_argument('limit', type=int, help='Number of results to return. Default is 10 for record lists and 0 (unlimited) for field and subfield lists.')

def make_list(endpoint, **kwargs):
    return_data = {
        '_links': {
            'self': url_for(endpoint, **kwargs)
        },
        'start': kwargs.pop('start', ''),
        'limit': kwargs.pop('limit', ''),
        'results': []
    }

    return return_data

def make_singleton(endpoint, **kwargs):
    return {
        '_links': {
            'self': url_for(endpoint, **kwargs)
        },
        'result': {}
    }

# Bib Records
@ns.route('/bibs')
class BibsList(Resource):
    @ns.doc(description='Return a list of Bibliographic Records')
    @ns.expect(parser)
    def get(self, start=0, limit=10):
        return make_list('api_bibs_list', start=start, limit=limit, _external=True)

@ns.route('/bibs/<int:record_id>')
@ns.param('record_id', 'The record identifier')
class Bib(Resource):
    @ns.doc(description='Return the Bibliographic Record with the given identifier')
    def get(self, record_id):
        return make_singleton('api_bib', record_id=record_id, _external=True)

@ns.route('/bibs/<int:record_id>/fields')
@ns.param('record_id', 'The record identifier')
class BibFieldsList(Resource):
    @ns.doc(description='Return a list of the Fields in the Bibliographic Record with the given record identifier')
    def get(self, record_id):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 0
        return make_list('api_bib_fields_list', record_id=record_id, start=start, limit=limit, _external=True)

@ns.route('/bibs/<int:record_id>/fields/<string:field_tag>')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
class BibField(Resource):
    @ns.doc(description='Return the contents of the field in the Bibliographic Record with the given field tag and record identifier')
    def get(self, record_id, field_tag):
        return make_singleton('api_bib_field', record_id=record_id, field_tag=field_tag, _external=True)

@ns.route('/bibs/<int:record_id>/fields/<string:field_tag>/subfields')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
class BibSubFieldsList(Resource):
    @ns.doc(description='Return a list of the subfields in the identified field for this record')
    def get(self, record_id, field_tag):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 0
        return make_list('api_bib_sub_fields_list', record_id=record_id, field_tag=field_tag, start=start, limit=limit, _external=True)

@ns.route('/bibs/<int:record_id>/fields/<string:field_tag>/subfields/<string:subfield_code>')
@ns.param('subfield_code', 'The code for a MARC tag\'s subfield. Example: a is a common subfield code.')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
class BibSubField(Resource):
    @ns.doc(description='Return the contents of a subfield for an identified record and field.')
    def get(self, record_id, field_tag, subfield_code):
        return make_singleton('api_bib_sub_field', record_id=record_id, field_tag=field_tag, subfield_code=subfield_code, _external=True)

# Authorities
# Lots of this is duplicative. Consider ways to refactor.
@ns.route('/auths')
class AuthsList(Resource):
    @ns.doc(description='Return a list of Authority Records')
    @ns.expect(parser)
    def get(self):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 10
        return make_list('api_auths_list', start=start, limit=limit, _external=True)

@ns.route('/auths/<int:record_id>')
@ns.param('record_id', 'The record identifier')
class Auth(Resource):
    @ns.doc(description='Return the Authority Record with the given identifier')
    def get(self, record_id):
        return make_singleton('api_auth', record_id=record_id, _external=True)

@ns.route('/auths/<int:record_id>/fields')
@ns.param('record_id', 'The record identifier')
class AuthFieldsList(Resource):
    @ns.doc(description='Return a list of the Fields in the Authority Record with the given record identifier')
    def get(self, record_id):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 0
        return make_list('api_auth_fields_list', record_id=record_id, start=start, limit=limit, _external=True)

@ns.route('/auths/<int:record_id>/fields/<string:field_tag>')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
class AuthField(Resource):
    @ns.doc(description='Return the contents of the field in the Authority Record with the given field tag and record identifier')
    def get(self, record_id, field_tag):
        return make_singleton('api_auth_field', record_id=record_id, field_tag=field_tag, _external=True)

@ns.route('/auths/<int:record_id>/fields/<string:field_tag>/subfields')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
class AuthSubFieldsList(Resource):
    @ns.doc(description='Return a list of the subfields in the identified field for this record')
    def get(self, record_id, field_tag):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 0
        return make_list('api_auth_sub_fields_list', record_id=record_id, field_tag=field_tag, start=start, limit=limit, _external=True)

@ns.route('/auths/<int:record_id>/fields/<string:field_tag>/subfields/<string:subfield_code>')
@ns.param('subfield_code', 'The code for a MARC tag\'s subfield. Example: a is a common subfield code.')
@ns.param('field_tag', 'The MARC tag identifying the field. Example: 245 is usually the tag for a title in MARC.')
@ns.param('record_id', 'The record identifier')
class AuthSubField(Resource):
    @ns.doc(description='Return the contents of a subfield for an identified record and field.')
    def get(self, record_id, field_tag, subfield_code):
        return make_singleton('api_auth_sub_field', record_id=record_id, field_tag=field_tag, subfield_code=subfield_code, _external=True)

# Files
# /api/files
@ns.route('/files')
class FilesList(Resource):
    @ns.doc(description='Return a list of files')
    def get(self):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 10
        return make_list('api_files_list', start=start, limit=limit, _external=True)

# /api/files/<id>
@ns.route('/files/<string:file_id>')
@ns.param('file_id', 'The file identifier')
class File(Resource):
    @ns.doc(description='Return the file with the given identifier')
    def get(self, file_id):
        return make_singleton('api_file', file_id=file_id, _external=True)


# Cross-queries
# /api/bibs/<id>/auths
@ns.route('/bibs/<int:record_id>/auths')
@ns.param('record_id', 'The record identifier')
class BibAuthsList(Resource):
    @ns.doc(description='Return a list of the authority records referenced by this bibliographic record')
    def get(self, record_id):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 10
        return make_list('api_bib_auths_list', record_id=record_id, start=start, limit=limit, _external=True)

# /api/auths/<id>/auths
@ns.route('/auths/<int:record_id>/auths')
@ns.param('record_id', 'The record identifier')
class AuthAuthsList(Resource):
    @ns.doc(description='Return a list of the authority records referenced by this authority record')
    def get(self, record_id):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 10
        return make_list('api_auth_auths_list', record_id=record_id, start=start, limit=limit, _external=True)

# harder
# /api/auths/<id>/bibs
@ns.route('/auths/<int:record_id>/bibs')
@ns.param('record_id', 'The record identifier')
class AuthBibsList(Resource):
    @ns.doc(description='Return a list of the bibliographic records that reference this authority record')
    def get(self, record_id):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 10
        return make_list('api_auth_bibs_list', record_id=record_id, start=start, limit=limit, _external=True)

# /api/files/<id>/bibs
@ns.route('/files/<int:file_id>/bibs')
@ns.param('record_id', 'The file identifier')
class FileBibsList(Resource):
    @ns.doc(description='Return a list of the the bibliographic records that reference this file')
    def get(self, file_id):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 10
        return make_list('api_auth_auths_list', file_id=file_id, start=start, limit=limit, _external=True)

# /api/bibs/<id>/files
@ns.route('/bibs/<int:record_id>/files')
@ns.param('record_id', 'The record identifier')
class BibFilesList(Resource):
    @ns.doc(description='Return a list of the files attached to this bibliographic record')
    def get(self, record_id):
        args = parser.parse_args()
        start = args['start'] or 0
        limit = args['limit'] or 0
        return make_list('api_bib_files_list', record_id=record_id, start=start, limit=limit, _external=True)

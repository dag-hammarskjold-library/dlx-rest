from flask_restx import Resource, reqparse
from dlx.file import File, Identifier, FileExists, FileExistsIdentifierConflict, FileExistsLanguageConflict
from dlx_rest.api import ns, ClassDispatch, ListResponse, BatchResponse, login_required, abort, URL
from dlx_rest.models import File as DBFile

list_argparser = reqparse.RequestParser()
list_argparser.add_argument('start', type=int, help='Number of record results to skip for pagination. Default is 0.')
list_argparser.add_argument('limit', type=int, help='Number of results to return. Default is 100 for record lists and 0 (unlimited) for field and subfield lists.')
list_argparser.add_argument('sort', type=str, help='Valid strings are "timestamp"')
list_argparser.add_argument('direction', type=str, help='Valid strings are "asc", "desc". Default is "desc"')
list_argparser.add_argument('format', type=str, help='Valid strings are "xml" and "json". Default is "json"')
list_argparser.add_argument('search', type=str, help='Consult documentation for query syntax')

resource_argparser = reqparse.RequestParser()
resource_argparser.add_argument('format', type=str, help='Return format. Valid strings are "json", "xml", "mrc", "mrk", "txt". Default is "json"')


# files is a special collection and doesn't use MARC by itself
@ns.route('/files')
class FilesList(Resource):
    @ns.doc(description='Return a list of File Records')
    @ns.expect(list_argparser)
    def get(self):

        args = list_argparser.parse_args()
        search = args['search']
        start = args['start'] or 0
        limit = args['limit'] or 100
        sort_by = args['sort']
        direction = args['direction'] or ''
        fmt = args['format'] or ''
        
        if sort_by == 'timestamp':
            if direction.lower() == 'asc':
                sort = [('timestamp', ASC)]
            else:
                sort = [('timestamp', DESC)]
        else:
            sort = None
        
        project = None if fmt else {'_id': 1}
        
        #rset = cls.from_query(query, projection=project, skip=start, limit=limit, sort=sort)
        rset = DBFile.objects()
        
        if fmt:
            return getattr(BatchResponse(rset), fmt)()

        records_list = [
            URL('api_record', collection='files', record_id=str(r.id)).to_str() for r in rset
        ]

        response = ListResponse(
            'api_files_list',
            records_list,
            collection='files',
            start=start,
            limit=limit,
            sort=sort_by
        )

        return response.json()
        
    @ns.doc(description='Create a Bibliographic or Authority Record with the given data.', security='basic')
    @login_required
    def post(self, collection):
        try:
            cls = ClassDispatch.by_collection(collection)
        except KeyError:
            abort(404)
        pass

        try:
            jmarc = json.loads(request.data)
            result = cls(jmarc).commit()
        except:
            abort(400, 'Invalid JMARC')
        
        if result.acknowledged:
            return Response(status=200)
        else:
            abort(500)

@ns.route('/files/<string:id>')
class FileRecord(Resource):
    def get(self):
        pass
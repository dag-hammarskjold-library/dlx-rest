import io, os
os.environ['DLX_REST_TESTING'] = 'True'

import pytest, json, re
from dlx import DB
from dlx.marc import Bib, Auth
from dlx.file import File, Identifier, S3
from dlx_rest.app import app
from dlx_rest.config import Config
from moto import mock_s3

API = 'http://localhost/api'

# make sure the db is mocked before committing test data
if Config.connect_string != 'mongomock://localhost':
    raise Exception
    
@pytest.fixture
def marc():
    auths = []
    
    for i in range(1, 3):
        auth = Auth()
        auth.id = i
        auth.set('100', 'a', f'Heading {i}')
        auth.commit()
        auths.append(auth)
    
    bibs = []
    for i in range(1, 3):
        bib = Bib()
        bib.id = i
        bib.set('245', 'a', 'Title').set('700', 'a', i)
        bib.commit()
        bibs.append(bib)
        
    for col in ('bibs', 'auths'):
        template = Bib() if col == 'bibs' else Auth()
        template.id = 1
        template.set('035', 'a', 'ID')   
        d = template.to_dict()
        d['name'] = 'test'
        DB.handle[f'{col}_templates'].insert_one(d)
        
    yield {'auths': auths, 'bibs': bibs}
    
    # TODO handle test data in dlx
    for col in ('bibs', 'auths', 'bibs_templates', 'auths_templates', 'bib_history', 'auth_history'):
        Auth._cache = {}
        DB.handle[col].drop()
     
@pytest.fixture 
def files():
    with mock_s3():
        S3.connect(bucket='mock_bucket')
        S3.client.create_bucket(Bucket=S3.bucket)
        
        File.import_from_handle(
            io.BytesIO(b'test file'),
            filename='test.txt',
            identifiers=[Identifier('isbn', 'x')],
            languages=['en'],
            mimetype='text/plain',
            source='test'
        )
        
        yield
        
        DB.files.drop()
    
# tests
# TODO test put, post, delete reqs

def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'
    
def test_app(client):
    assert type(client).__name__ == 'FlaskClient'

def test_api_collections_list(client):
    res = client.get(f'{API}/marc')
    data = check_response(res)
    assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
    assert data['data'] == [
        f'{API}/marc/bibs',
        f'{API}/marc/auths'
    ]
    
def test_api_collection(client):
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/marc/{col}')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.null'
        assert data['data'] == {}
        
def test_api_records_list(client, marc):
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/marc/{col}/records')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
        
        for i in (1, 2):
            assert f'{API}/marc/{col}/records/{i}' in data['data']
        
def test_api_record(client, marc):
    for col in ('bibs', 'auths'):
        for i in (1, 2):
            res = client.get(f'{API}/marc/{col}/records/{i}')
            data = check_response(res)
            assert data['_meta']['returns'] == f'{API}/schemas/jmarc'
            
def test_api_record_fields_list(client, marc):
    for col in ('bibs', 'auths'):
        for i in (1, 2):
            res = client.get(f'{API}/marc/{col}/records/{i}/fields')
            data = check_response(res)
            assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'

def test_api_record_field_place_list(client, marc):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/marc/{col}/records/{i}/fields/{tag}')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'

def test_api_record_field_place(client, marc):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/marc/{col}/records/{i}/fields/{tag}/0')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/jmarc.datafield'
                
def test_api_record_field_place_subfield_list(client, marc):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/marc/{col}/records/{i}/fields/{tag}/0/subfields')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
                
def test_api_record_field_place_subfield_place_list(client, marc):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/marc/{col}/records/{i}/fields/{tag}/0/subfields/a')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
                
def test_api_record_field_subfield_value(client, marc):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/marc/{col}/records/{i}/fields/{tag}/0/subfields/a/0')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/jmarc.subfield.value'
                
def test_api_record_subfield_list(client, marc):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/marc/{col}/records/{i}/subfields')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
                
def test_api_lookup_field_list(client, marc):
    res = client.get(f'{API}/marc/bibs/lookup')
    data = check_response(res)
    assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
    
def test_api_lookup_field(client, marc):
    res = client.get(f'{API}/marc/bibs/lookup/700')
    assert res.status_code == 400
    
    res = client.get(f'{API}/marc/bibs/lookup/700?a=heading')
    data = check_response(res)
    assert data['_meta']['returns'] == f'{API}/schemas/jmarc.batch'
    
    for r in marc['auths']:
        assert r.to_dict() in data['data']
        
def test_api_lookup_map(client, marc):
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/marc/{col}/lookup/map')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.authmap'

def test_api_record_history(client, marc):
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/marc/{col}/records/1/history')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
    
def test_api_record_history(client, marc):
    for col in ('bibs', 'auths'):    
        res = client.get(f'{API}/marc/{col}/records/1/history/0')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/jmarc'

def test_api_template_list(client, marc):
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/marc/bibs/templates')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
        
def test_api_template(client, marc):
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/marc/bibs/templates/test')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/jmarc.template'
     
def test_api_files(client, files):
    res = client.get(f'{API}/files')
    data = check_response(res)
    assert f'{API}/files/f20d9f2072bbeb6691c0f9c5099b01f3' in data['data']

def test_api_file(client, files):
    res = client.get(f'{API}/files/f20d9f2072bbeb6691c0f9c5099b01f3')
    data = check_response(res)
    
    res = client.get(f'{API}/files/f20d9f2072bbeb6691c0f9c5099b01f3?action=download')
    assert res.status_code == 200
        
# util

def check_response(response):
    client = app.test_client()
    data = json.loads(response.data)
    
    assert response.status_code == 200
    
    for _ in ('_links', '_meta', 'data'):
        assert _ in data
    
    for linktype in ('_next', '_prev', '_self'):
          link = data['_links'].get(linktype)
          
          if link:
             res = client.get(link)
             assert res.status_code == 200
    
    for links in ('related', 'format', 'sort'):
        sublinks = data['_links'].get(links)
        
        if sublinks:
            for linktype in sublinks:
                res = client.get(sublinks[linktype])
                assert res.status_code == 200
                
    return data    




        
        
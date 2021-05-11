import os
os.environ['DLX_REST_TESTING'] = 'True'

import pytest, json, re
from dlx import DB
from dlx.marc import Bib, Auth
from dlx_rest.app import app
from dlx_rest.config import Config

API = 'http://localhost/api'

# make sure the db is mocked before committing test data
if Config.connect_string != 'mongomock://localhost':
    raise Exception
    
@pytest.fixture
def records_new():
    for i in range(1, 3):
        auth = Auth()
        auth.id = i
        auth.set('100', 'a', f'Heading {i}')
        auth.commit()
    
    
    for i in range(1, 3):
        bib = Bib()
        bib.id = i
        bib.set('245', 'a', 'Title').set('700', 'a', i)
        bib.commit()
    
    yield
    
    for col in ('bibs', 'auths'):
        Auth._cache = {}
        getattr(DB, col).drop()

# tests

def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'
    
def test_app(client):
    assert type(client).__name__ == 'FlaskClient'
    
def test_api_collections_list(client):
    res = client.get(f'{API}/collections')
    data = check_response(res)
    assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
    assert data['data'] == [
        f'{API}/collections/bibs',
        f'{API}/collections/auths'
    ]
    
def test_api_collection(client):
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/collections/{col}')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.null'
        assert data['data'] == {}
        
def test_api_records_list(client, records_new):
    from dlx import DB
    from dlx.marc import Bib, Auth
    
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/collections/{col}/records')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
        
        for i in (1, 2):
            assert f'{API}/collections/{col}/records/{i}' in data['data']
        
def test_api_record(client, records_new):
    for col in ('bibs', 'auths'):
        for i in (1, 2):
            res = client.get(f'{API}/collections/{col}/records/{i}')
            data = check_response(res)
            assert data['_meta']['returns'] == f'{API}/schemas/jmarc'
            
def test_api_record_fields_list(client, records_new):
    for col in ('bibs', 'auths'):
        for i in (1, 2):
            res = client.get(f'{API}/collections/{col}/records/{i}/fields')
            data = check_response(res)
            assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'

def test_api_record_field_place_list(client, records_new):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/collections/{col}/records/{i}/fields/{tag}')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
            

def test_api_record_field_place(client, records_new):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/collections/{col}/records/{i}/fields/{tag}/0')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/jmarc.datafield'
                
def test_api_record_subfield_list(client, records_new):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/collections/{col}/records/{i}/subfields')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
                
def test_api_record_field_place_subfield_list(client, records_new):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/collections/{col}/records/{i}/fields/{tag}/0/subfields')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
                
def test_api_record_field_place_subfield_place_list(client, records_new):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/collections/{col}/records/{i}/fields/{tag}/0/subfields/a')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
                
def test_api_record_field_subfield_value(client, records_new):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/collections/{col}/records/{i}/fields/{tag}/0/subfields/a/0')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/jmarc.subfield.value'
                
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




        
        
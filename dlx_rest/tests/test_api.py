import os
os.environ['DLX_REST_TESTING'] = 'True'

import pytest 
import json, re
from dlx_rest.config import Config

PRE = 'http://localhost/api'

# make sure the db is mocked before committing test data
if Config.connect_string != 'mongomock://localhost':
    raise Exception
  
# fixtures

@pytest.fixture
def client():
    from dlx_rest.app import app
    return app.test_client()
    
@pytest.fixture
def records():
    from dlx import DB
    from dlx.marc import Bib, Auth
    from random import randrange
    DB.connect(Config.connect_string)
    
    for x in range(1,51):
        bib = Bib({'_id': x})
        bib.set('245', 'a', str(randrange(1, 100)))
        bib.set('500', 'a', '1x')
        bib.set('500', 'a', '2x', address=['+'])
        bib.set('500', 'a', '3x', address=[1, '+'])
        bib.commit()
        
        auth = Auth({'_id': x})
        auth.set('100', 'a', str(randrange(1, 100))),
        auth.set('400', 'a', '1x'),
        auth.set('400', 'a', '2x', address=['+'])
        auth.set('400', 'a', '3x', address=[1, '+'])
        auth.commit()

# tests
    
def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'
    
def test_app(client):
    assert type(client).__name__ == 'FlaskClient'

def test_collections_list(client):
    data = json.loads(client.get(PRE+'/collections').data)
    assert len(data['results']) == 2
    assert PRE+'/bibs' in data['results']
    assert PRE+'/auths' in data['results']
    
def test_records_list(client,records):
    data = json.loads(client.get(PRE+'/bibs').data)
    assert len(data['results']) == 50
    
    data = json.loads(client.get(PRE+'/auths').data)
    assert len(data['results']) == 50
    
    data = json.loads(client.get(PRE+'/bibs?sort=date&direction=desc').data)
    assert len(data['results']) == 50
    assert data['results'][0] == PRE+'/bibs/50'
    
    data = json.loads(client.get(PRE+'/bibs?sort=date&direction=asc').data)
    assert data['results'][0] == PRE+'/bibs/1'
    
    response = client.get(PRE+'/bibs?format=xml')
    assert response.headers["Content-Type"] == 'text/xml; charset=utf-8'
    
    response = client.get(PRE+'/bibs?format=mrc')
    assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'
    
    response = client.get(PRE+'/bibs?format=txt')
    assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'
    
    response = client.get(PRE+'/bibs?format=mrk')
    assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'

def test_record(client,records):
    data = json.loads(client.get(PRE+'/bibs/1').data)
    assert data['result']['_id'] == 1
    
    data = json.loads(client.get(PRE+'/auths/1').data)
    assert data['result']['_id'] == 1
    
def test_record_formats(client, records):
    for col in ('bibs', 'auths'):
        response = client.get('{}/{}/1?format=xml'.format(PRE, col))  
        assert response.headers["Content-Type"] == 'text/xml; charset=utf-8'
        
        response = client.get('{}/{}/1?format=mrk'.format(PRE, col))
        assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'
        
        response = client.get('{}/{}/1?format=mrc'.format(PRE, col))
        assert response.headers["Content-Type"] == 'application/marc'
        
        response = client.get('{}/{}/1?format=txt'.format(PRE, col))
        assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'

def test_records_fields_list(client, records):
    data = json.loads(client.get(PRE+'/bibs/1/fields').data)
    # this may change if future dlx version sets a 001 field automatically with the id
    assert len(data['results']) == 2
    assert PRE+'/bibs/1/fields/245' in data['results']
    assert PRE+'/bibs/1/fields/500' in data['results']
    
    data = json.loads(client.get(PRE+'/auths/1/fields').data)
    # this may change if future dlx version sets a 001 field automatically with the id
    assert len(data['results']) == 2
    assert PRE+'/auths/1/fields/100' in data['results']
    assert PRE+'/auths/1/fields/400' in data['results']
    
def test_record_field_place_list(client, records):
    data = json.loads(client.get(PRE+'/bibs/1/fields/500').data)
    assert len(data['results']) == 2
    assert PRE+'/bibs/1/fields/500/0' in data['results']
    assert PRE+'/bibs/1/fields/500/1' in data['results']
    
    data = json.loads(client.get(PRE+'/auths/1/fields/400').data)
    assert len(data['results']) == 2
    assert PRE+'/auths/1/fields/400/0' in data['results']
    assert PRE+'/auths/1/fields/400/1' in data['results']
    
def test_record_field_place_subfield_list(client, records):
    data = json.loads(client.get(PRE+'/bibs/1/fields/500/0').data)
    assert len(data['results']) == 1
    assert PRE+'/bibs/1/fields/500/0/a' in data['results']
    
    data = json.loads(client.get(PRE+'/auths/1/fields/400/0').data)
    assert len(data['results']) == 1
    assert PRE+'/auths/1/fields/400/0/a' in data['results']
    
def test_record_field_place_subfield_place_list(client, records):
    data = json.loads(client.get(PRE+'/bibs/1/fields/500/0/a').data)
    assert len(data['results']) == 1
    data = json.loads(client.get(PRE+'/bibs/1/fields/500/1/a').data)
    assert len(data['results']) == 2
    assert PRE+'/bibs/1/fields/500/1/a/0' in data['results']
    assert PRE+'/bibs/1/fields/500/1/a/1' in data['results']
    
    data = json.loads(client.get(PRE+'/auths/1/fields/400/0/a').data)
    assert len(data['results']) == 1
    data = json.loads(client.get(PRE+'/auths/1/fields/400/1/a').data)
    assert len(data['results']) == 2
    assert PRE+'/auths/1/fields/400/1/a/0' in data['results']
    assert PRE+'/auths/1/fields/400/1/a/1' in data['results']
    
def test_record_field_place_subfield_place(client, records):
    data = json.loads(client.get(PRE+'/bibs/1/fields/500/1/a/1').data)
    assert data['result'] == '3x'
    
    data = json.loads(client.get(PRE+'/auths/1/fields/400/1/a/1').data)
    assert data['result'] == '3x'
    

    
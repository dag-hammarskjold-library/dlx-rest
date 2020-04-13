import os
os.environ['DLX_REST_TESTING'] = 'True'

import pytest 
import json, re
from dlx_rest.config import Config

PRE = 'http://localhost/api'

# make sure the db is mocked before committing test data
if Config.connect_string != 'mongomock://localhost':
    raise Exception

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
    
def test_record_field_subfields_list(client, records):
    data = json.loads(client.get(PRE+'/bibs/1/subfields').data)
    assert len(data['results']) == 7
    assert PRE+'/bibs/1/fields/245/0/a/0' in data['results']
    assert PRE+'/bibs/1/fields/500/1/a/0' in data['results']
    assert PRE+'/bibs/1/fields/500/1/a/1' in data['results']
    
def test_create_record(client, records):
    data = {"245": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "A new record"}]}]}    
    response = client.post(PRE+'/bibs', headers={}, data=json.dumps(data))
    assert response.status_code == 200

def test_delete_record(client, records):
    assert client.delete(PRE+'/bibs/1').status_code == 200
    assert client.get(PRE+'/bibs/1').status_code == 404
    
def test_update_record(client, records):
    data = '{"_id": 1, "invalid": 1}'
    response = client.put(PRE+'/bibs/1', headers={}, data=json.dumps(data))
    assert response.status_code == 400

    data = {"_id": 1, "245": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "An updated title"}]}]}    
    response = client.put(PRE+'/bibs/1', headers={}, data=json.dumps(data))
    assert response.status_code == 200
    
    data = json.loads(client.get(PRE+'/bibs/1/fields/245/0/a/0').data)
    assert data['result'] == "An updated title"
    assert client.get(PRE+'/bibs/1/fields/500/0/a/0').status_code == 404
    
    

import os
os.environ['DLX_REST_TESTING'] = 'True'

import pytest 
import json, re
from dlx_rest.config import Config
from dlx.marc import Bib, Auth

API = 'http://localhost/api'

# make sure the db is mocked before committing test data
if Config.connect_string != 'mongomock://localhost':
    raise Exception

# tests

#setup()
    
def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'
    
def test_app(client):
    assert type(client).__name__ == 'FlaskClient'

def test_all_routes(client):
    pass

def test_collections_list(client, records):
    data = json.loads(client.get(f'{API}/collections').data)
<<<<<<< HEAD
    assert len(data['data']) == 2
    assert f'{API}/collections/bibs' in data['data']
    assert f'{API}/collections/auths' in data['data']
=======
    assert len(data['results']) == 3
    assert f'{API}/bibs' in data['results']
    assert f'{API}/auths' in data['results']
>>>>>>> master
    
def test_records_list(client, records):
    data = json.loads(client.get(f'{API}/collections/bibs').data)
    assert len(data['data']) == 10
    
    data = json.loads(client.get(f'{API}/collections/auths').data)
    assert len(data['data']) == 11
    
    data = json.loads(client.get(f'{API}/collections/bibs?sort=updated&direction=desc').data)
    assert len(data['data']) == 10
    assert data['data'][0] == f'{API}/collections/bibs/records/10'
    
    data = json.loads(client.get(f'{API}/collections/bibs?sort=updated&direction=asc').data)
    assert data['data'][0] == f'{API}/collections/bibs/records/1'
    
    response = client.get(f'{API}/collections/bibs?format=xml')
    assert response.headers["Content-Type"] == 'text/xml; charset=utf-8'

    response = client.get(f'{API}/collections/bibs?format=mrk')
    assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'
    
    response = client.get(f'{API}/collections/bibs?format=mrc')
    assert response.headers["Content-Type"] == 'application/marc'
    
    response = client.get(f'{API}/collections/bibs?format=txt')
    assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'
    
    response = client.get(f'{API}/collections/bibs?format=brief')
    results = json.loads(response.data)['data']
    for field in ('_id', 'symbol', 'title', 'date', 'types'):
        assert field in results[0]
    
    response = client.get(f'{API}/collections/auths?format=brief')
    results = json.loads(response.data)['data']
    for field in ('_id', 'heading', 'alt'):
        assert field in results[0]
    
def test_search(client, records):
    res = client.get(f'{API}/collections/bibs?search=' + '900__a:10')
    assert res.status_code == 200
    data = json.loads(res.data)
    assert len(data['data']) == 1
    
    res = client.get(f'{API}/collections/auths?search=' + '400__a:1x')
    data = json.loads(res.data)
    assert len(data['data']) == 10

def test_record(client, records):
    data = json.loads(client.get(f'{API}/collections/bibs/records/1').data)
    assert data['data']['_id'] == 1
    
    data = json.loads(client.get(f'{API}/collections/auths/records/1').data)
    assert data['data']['_id'] == 1
    
def test_record_formats(client, records):
    for col in ('bibs', 'auths'):
        response = client.get('{}/collections/{}/1?format=xml'.format(API, col))  
        assert response.headers["Content-Type"] == 'text/xml; charset=utf-8'
        
        response = client.get('{}/collections/{}/1?format=mrk'.format(API, col))
        assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'
        
        response = client.get('{}/collections/{}/1?format=mrc'.format(API, col))
        assert response.headers["Content-Type"] == 'application/marc'
        
        response = client.get('{}/collections/{}/1?format=txt'.format(API, col))
        assert response.headers["Content-Type"] == 'text/plain; charset=utf-8'

def test_records_fields_list(client, records):
    data = json.loads(client.get(f'{API}/collections/bibs/records/1/fields').data)
    # this may change if future dlx version sets a 001 field automatically with the id
    assert len(data['data']) == 5
    assert f'{API}/collections/bibs/records/1/fields/245/0' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/500/0' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/500/1' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/900/0' in data['data']
    
    data = json.loads(client.get(f'{API}/collections/auths/records/1/fields').data)
    # this may change if future dlx version sets a 001 field automatically with the id
    assert len(data['data']) == 4
    assert f'{API}/collections/auths/records/1/fields/100/0' in data['data']
    assert f'{API}/collections/auths/records/1/fields/400/0' in data['data']
    assert f'{API}/collections/auths/records/1/fields/400/1' in data['data']
    assert f'{API}/collections/auths/records/1/fields/900/0' in data['data']
    
def test_record_field_place_list(client, records):
    data = json.loads(client.get(f'{API}/collections/bibs/records/1/fields/500').data)
    assert len(data['data']) == 2
    assert f'{API}/collections/bibs/records/1/fields/500/0' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/500/1' in data['data']
    
    data = json.loads(client.get(f'{API}/collections/auths/records/1/fields/400').data)
    assert len(data['data']) == 2
    assert f'{API}/collections/auths/records/1/fields/400/0' in data['data']
    assert f'{API}/collections/auths/records/1/fields/400/1' in data['data']
    
def test_record_field_place_subfield_list(client, records):
    data = json.loads(client.get(f'{API}/collections/bibs/records/1/fields/500/0/subfields').data)
    assert len(data['data']) == 1
    assert f'{API}/collections/bibs/records/1/fields/500/0/subfields/a/0' in data['data']
    
    data = json.loads(client.get(f'{API}/collections/auths/records/1/fields/400/0/subfields').data)
    assert len(data['data']) == 1
    assert f'{API}/collections/auths/records/1/fields/400/0/subfields/a/0' in data['data']
    
def test_record_field_place_subfield_place_list(client, records):
    data = json.loads(client.get(f'{API}/collections/bibs/records/1/fields/500/0/subfields/a').data)
    assert len(data['data']) == 1
    data = json.loads(client.get(f'{API}/collections/bibs/records/1/fields/500/1/subfields/a').data)
    assert len(data['data']) == 2
    assert f'{API}/collections/bibs/records/1/fields/500/1/subfields/a/0' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/500/1/subfields/a/1' in data['data']
    
    data = json.loads(client.get(f'{API}/collections/auths/records/1/fields/400/0/subfields/a').data)
    assert len(data['data']) == 1
    data = json.loads(client.get(f'{API}/collections/auths/records/1/fields/400/1/subfields/a').data)
    assert len(data['data']) == 2
    assert f'{API}/collections/auths/records/1/fields/400/1/subfields/a/0' in data['data']
    assert f'{API}/collections/auths/records/1/fields/400/1/subfields/a/1' in data['data']
    
def test_record_field_place_subfield_place(client, records):
    data = json.loads(client.get(f'{API}/collections/bibs/records/1/fields/500/1/subfields/a/1').data)
    assert data['data'] == '3x'
    
    data = json.loads(client.get(f'{API}/collections/auths/records/1/fields/400/1/subfields/a/1').data)
    assert data['data'] == '3x'
    
def test_record_field_subfields_list(client, records):
    data = json.loads(client.get(f'{API}/collections/bibs/records/1/subfields').data)
    assert len(data['data']) == 7
    assert f'{API}/collections/bibs/records/1/fields/245/0/subfields/a/0' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/500/1/subfields/a/0' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/500/1/subfields/a/1' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/500/1/subfields/a/1' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/900/0/subfields/a/0' in data['data']
    assert f'{API}/collections/bibs/records/1/fields/900/0/subfields/b/0' in data['data']
    
def test_create_record(client, records):
    data = '{"_id": 1, "invalid": 1}'
    response = client.post(f'{API}/collections/bibs', headers={}, data=json.dumps(data))
    assert response.status_code == 400
    
    data = {"245": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "A new record"}]}]}
    response = client.post(f'{API}/collections/bibs', headers={}, data=json.dumps(data))
    assert response.status_code == 201
    assert client.get(f'{API}/collections/bibs/records/11').status_code == 200
    
<<<<<<< HEAD
    data = '{"000": ["leader"], "710": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "Name"}]}]}'
    response = client.post(f'{API}/collections/bibs', headers={}, data=data)
=======
    
    data = '{"000": ["leader"], "245": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "Title"}]}], "710": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "Name"}]}]}'
    response = client.post(f'{API}/bibs', headers={}, data=data)
>>>>>>> master
    assert response.status_code == 201
    
    response = client.get(f'{API}/collections/bibs/records/12?format=mrk')
    assert response.status_code == 200
    assert response.data.decode() == '=000  leader\n=245  \\\\$aTitle\n=710  \\\\$aName\n'

def test_create_record_mrk(client, records):
    data = 'invalid'
    response = client.post(f'{API}/collections/bibs', headers={}, data=data)
    assert response.status_code == 400
    
    data = '=000  leader\n=245  \\\\$aYet another title$bsubtitle\n=269  \\\\$a2020'
    response = client.post(f'{API}/collections/bibs?format=mrk', headers={}, data=data)
    assert response.status_code == 200
    
    response = client.get(f'{API}/collections/bibs/records/13')
    assert json.loads(response.data)['data'] == {
            "_id": 13,
            "000": ['leader'],
            "245": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "Yet another title"}, {'code': 'b', 'value': 'subtitle'}]}],
            "269": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "2020"}]}]
        }
    
def test_delete_record(client, records):
    assert client.delete(f'{API}/collections/bibs/records/1').status_code == 200
    assert client.get(f'{API}/collections/bibs/records/1').status_code == 404
    
def test_update_record(client, records):
    data = '{"_id": 1, "invalid": 1}'
    response = client.put(f'{API}/collections/bibs/records/2', headers={}, data=json.dumps(data))
    assert response.status_code == 400

    data = '{"_id": 2, "245": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "An updated title"}]}]}'    
    response = client.put(f'{API}/collections/bibs/records/2', headers={}, data=data)
    assert response.status_code == 201
    
    data = json.loads(client.get(f'{API}/collections/bibs/records/2/fields/245/0/subfields/a/0').data)
    assert data['data'] == "An updated title"
    assert client.get(f'{API}/collections/bibs/records/1/fields/500/0/subfields/a/0').status_code == 404
    
def test_update_record_mrk(client, records):
    data = 'invalid'
    response = client.put(f'{API}/collections/bibs/records/2?format=mrk', headers={}, data=data)
    assert response.status_code == 400
    
    data = '=000  leader\n=245  \\\\$aUpdated by MRK$bsubtitle\n=269  \\\\$a2020'
    response = client.put(f'{API}/collections/bibs/records/7?format=mrk', headers={}, data=data)
    assert response.status_code == 201
    
    response = client.get(f'{API}/collections/bibs/records/7')
    assert json.loads(response.data)['data'] == {
        "_id": 7,
        "000": ['leader'],
        "245": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "Updated by MRK"}, {'code': 'b', 'value': 'subtitle'}]}],
        "269": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "2020"}]}]
    }

def test_create_field(client, records):
    data = '{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "Name"}]}'
    response = client.post(f'{API}/collections/bibs/records/3/fields/610', headers={}, data=data)
    assert response.status_code == 201
    
    response = client.get(f'{API}/collections/bibs/records/3/fields/610/0/subfields/a/0')
    assert response.status_code == 200
    assert json.loads(response.data)['data'] == 'Name'
    
    #controlfield
    response = client.post(f'{API}/collections/bibs/records/4/fields/007', headers={}, data='controlfield data')
    assert response.status_code == 201
    response = client.get(f'{API}/collections/bibs/records/4')
    assert json.loads(response.data)['data']['007'] == ['controlfield data']
  
def test_update_field(client, records):
    data = '{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "Put on field"}]}'
    response = client.put(f'{API}/collections/bibs/records/8/fields/245/0', headers={}, data=data)
    assert response.status_code == 201
    
    response = client.get(f'{API}/collections/bibs/records/8/fields/245/0/subfields/a/0')
    assert response.status_code == 200 
    assert json.loads(response.data)['data'] == 'Put on field'
    
    data = '{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "New name"}]}'
    response = client.put(f'{API}/collections/auths/records/11/fields/110/0', headers={}, data=data)
    assert response.status_code == 201
    response = client.put(f'{API}/collections/bibs/records/9/fields/610/0', headers={}, data=data)
    assert response.status_code == 201
    
    #controlfield
    response = client.post(f'{API}/collections/bibs/records/4/fields/006', headers={}, data='controlfield data')
    response = client.put(f'{API}/collections/bibs/records/4/fields/006/0', headers={}, data='updated controlfield data')
    response = client.get(f'{API}/collections/bibs/records/4')
    assert json.loads(response.data)['data']['006'] == ['updated controlfield data']

def test_delete_field(client, records):
    response = client.delete(f'{API}/collections/bibs/records/8/fields/245/0')
    assert response.status_code == 200
    
    response = client.get(f'{API}/collections/bibs/records/8/fields/245/0')
    assert response.status_code == 404
    
def test_files(client, records):
    response = client.get(f'{API}/collections/bibs/records/8')
    assert isinstance(json.loads(response.data)['files'], list)

def test_list_templates(client, templates):
    # Auths
    response = client.get(f'{API}/collections/auths/templates')
    assert response.status_code == 200
    assert json.loads(response.data)['data'][0] == f'{API}/collections/auths/templates/auth_template_1'
    
    # Bibs
    response = client.get(f'{API}/collections/bibs/templates')
    assert response.status_code == 200
    assert json.loads(response.data)['data'][0] == f'{API}/collections/bibs/templates/bib_template_1'

def test_template_CRUD(client, templates):   
    # get
    response = client.get(f'{API}/collections/auths/templates/auth_template_1')
    assert response.status_code == 200
    assert json.loads(response.data)['data']['100'][0]['subfields'][0]['value'] == 'Name'

    # post
    data = {"100": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "New value"}]}]}
    data['name'] = 'auth_template_2'
    response = client.post(f'{API}/collections/auths/templates', headers={}, data=json.dumps(data))
    assert response.status_code == 201
    assert json.loads(response.data)['data'] == f'{API}/collections/auths/templates/auth_template_2'
    
    response = client.get(f'{API}/collections/auths/templates/auth_template_2')
    assert response.status_code == 200
    assert json.loads(response.data)['data']['100'][0]['subfields'][0]['value'] == 'New value'
    
    # put
    new_data = {"100": [{"indicators": [" ", " "], "subfields": [{"code": "a", "value": "Updated value"}]}]}
    response = client.put(f'{API}/collections/auths/templates/auth_template_1', headers={}, data=json.dumps(new_data))
    assert response.status_code == 201
    assert json.loads(response.data)['data'] == f'{API}/collections/auths/templates/auth_template_1'
    
    response = client.get(f'{API}/collections/auths/templates/auth_template_1')
    assert response.status_code == 200
    assert json.loads(response.data)['data']['100'][0]['subfields'][0]['value'] == 'Updated value'
    
    # delete 
    response = client.delete(f'{API}/collections/auths/templates/auth_template_1')
    assert response.status_code == 200
    
    response = client.get(f'{API}/collections/auths/templates/auth_template_1')
    assert response.status_code == 404

def test_auth_lookup(client, recordset_2):  
    response = client.get(f'{API}/collections/bibs/lookup/610?a=giant&b=sub')
    assert response.status_code == 200
    assert json.loads(response.data)[0]['subfields'][0]['value'] == 'Giant organization'
    assert json.loads(response.data)[0]['subfields'][0]['xref']
    
    response = client.get(f'{API}/collections/bibs/lookup/610?a=small&b=sub')
    assert response.status_code == 200
    assert json.loads(response.data)[0]['subfields'][0]['value'] == 'Small organization'
    assert json.loads(response.data)[0]['subfields'][0]['xref']
    
def test_data_validation(client):
    bib = Bib()
    bib.set('246', 'a', 'No 245')
    response = client.post(f'{API}/bibs', headers={}, data=bib.to_json())
    assert response.status_code == 400
    assert 'Bib field 245 is required' in json.loads(response.data)['message']
    
    auth = Auth()
    auth.set('400', 'a', 'No heading field')
    response = client.post(f'{API}/auths', headers={}, data=auth.to_json())
    assert response.status_code == 400
    assert 'Auth heading field is required' in json.loads(response.data)['message']
    

    

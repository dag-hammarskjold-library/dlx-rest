import io, os
os.environ['DLX_REST_TESTING'] = 'True'

import pytest, json, re
from dlx import DB
from dlx.marc import Bib, Auth, Datafield
from dlx.file import File, Identifier, S3
from dlx_rest.app import app
from dlx_rest.config import Config
from moto import mock_s3
from base64 import b64encode

API = 'http://localhost/api'
PRE = 'http://localhost/'

# make sure the db is mocked before committing test data
if Config.connect_string != 'mongomock://localhost':
    raise Exception

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
        
def test_api_records_list(client, marc, users, roles, default_users):
    from dlx.marc import Bib, Auth

    # NY Bib Record
    bibNY = Bib()
    bibNY.set('245', 'a', 'AAA')
    bibNY.set('040', 'a', 'NNUN')

    # GE Bib Record
    bibGE = Bib()
    bibGE.set('245', 'a', 'AAA')
    bibGE.set('040', 'a', 'SzGeBNU')
    

    # NY Auth Record
    authNY = Auth()
    authNY.set('100', 'a', 'Heading')
    authNY.set('040', 'a', 'NNUN')

    # GE Auth Record
    authGE = Auth()
    authGE.set('100', 'a', 'Heading')
    authGE.set('040', 'a', 'SzGeBNU')

    # Global administrator
    username = default_users['admin']['email']
    password = default_users['admin']['password']
    credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")

    # POST NY bib record by global administrator == 200
    res = client.post(f'{API}/marc/bibs/records', data=bibNY.to_json(), headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 201

    # POST NY auth record by global administrator == 200
    res = client.post(f'{API}/marc/auths/records', data=authNY.to_json(), headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 201

    # POST GE bib record by global administrator == 200
    res = client.post(f'{API}/marc/bibs/records', data=bibGE.to_json(), headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 201

    # POST GE auth record by global administrator == 200
    res = client.post(f'{API}/marc/auths/records', data=authGE.to_json(), headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 201

    # global bib administrator
    username = default_users['bib-admin']['email']
    password = default_users['bib-admin']['password']
    credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")

    # POST NY bib record by global bib administrator == 200
    res = client.post(f'{API}/marc/bibs/records', data=bibNY.to_json(), headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 201

    # POST GE bib record by glbal bib administrator == 200
    res = client.post(f'{API}/marc/bibs/records', data=bibGE.to_json(), headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 201

    # global auth administrator
    username = default_users['auth-admin']['email']
    password = default_users['auth-admin']['password']
    credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")

    # POST NY auth record by global auth administrator == 200
    res = client.post(f'{API}/marc/auths/records', data=authNY.to_json(), headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 201

    # POST GE auth record by global auth administrator == 200
    res = client.post(f'{API}/marc/auths/records', data=authGE.to_json(), headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 201

    # POST NY bib record by global auth administrator == 403
    # POST GE bib record by glbal auth administrator == 403
    # POST NY auth record by global bib administrator == 403
    # POST GE auth record by global bib administrator == 403

    # POST NY bib record by NY bib administrator == 200
    # POST GE bib record by NY bib administrator == 403
    # POST NY auth record by NY auth administrator == 200
    # POST GE auth record by NY auth administrator == 403

    # Other tests to be developed: Roles that can POST and PUT but not DELETE; roles that have permissions with must_not constraints.
        
    # post
    '''
    if col == 'bibs':    
        cls = Bib
        bib = Bib()
        bib.set('245', 'a', 'AAA')
        res = client.post(f'{API}/marc/{col}/records', data=bib.to_json())
    else:
        cls = Auth
        auth = Auth()
        auth.set('100', 'a', 'Heading')
        res = client.post(f'{API}/marc/{col}/records', data=auth.to_json())
        
    assert res.status_code == 201
    '''

    # GET methods, only read is necessary here
    for col in ['bibs', 'auths']:
        res = client.get(f'{API}/marc/{col}/records')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
        
        for i in (1, 2):
            assert f'{API}/marc/{col}/records/{i}' in data['data']

    
        # search
        res = client.get(f'{API}/marc/{col}/records?search=title:\'AAA\'')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
        assert len(data['data']) == (1 if col == 'bibs' else 0)
        
        # sort
        res = client.get(f'{API}/marc/{col}/records?sort=title&direction=asc')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
        
        if col == 'bibs':
            assert '/records/3' in data['data'][0]
            
        # format
        for fmt in ['mrk', 'xml']:
            res = client.get(f'{API}/marc/{col}/records?format={fmt}')
            assert type(res.data) == bytes
            assert type(res.data.decode()) == str
            
        res = client.get(f'{API}/marc/{col}/records?format=brief')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.brieflist'

def test_api_records_list_browse(client, marc):
    return # to be updated in a different branch

    res = client.get(f'{API}/marc/bibs/records/browse?search=\'title\':Title&compare=greater')
    data = check_response(res)
    
    res = client.get(f'{API}/marc/auths/records/browse?search=heading:Heading&compare=less')
    data = check_response(res)

def test_api_records_list_count(client, marc):
    for col in ('bibs', 'auths'):
        res = client.get(f'{API}/marc/{col}/records/count')
        data = json.loads(res.data)
        assert data['data'] == 2
        
def test_api_record(client, marc):
    # get
    for col in ('bibs', 'auths'):
        for i in (1, 2):
            res = client.get(f'{API}/marc/{col}/records/{i}')
            data = check_response(res)
            assert data['_meta']['returns'] == f'{API}/schemas/jmarc'

    # PUT NY bib record by global administrator == 200
    # PUT NY auth record by global administrator == 200
    # PUT GE bib record by global administrator == 200
    # PUT GE auth record by global administrator == 200

    # PUT NY bib record by global bib administrator == 200
    # PUT GE bib record by glbal bib administrator == 200
    # PUT NY auth record by global auth administrator == 200
    # PUT GE auth record by global auth administrator == 200

    # PUT NY bib record by global auth administrator == 403
    # PUT GE bib record by glbal auth administrator == 403
    # PUT NY auth record by global bib administrator == 403
    # PUT GE auth record by global bib administrator == 403

    # PUT NY bib record by NY bib administrator == 200
    # PUT GE bib record by NY bib administrator == 403
    # PUT NY auth record by NY auth administrator == 200
    # PUT GE auth record by NY auth administrator == 403

    # Other tests to be developed: Roles that can POST and PUT but not DELETE; roles that have permissions with must_not constraints.          
    # put
    if col == 'bibs':    
        cls = Bib
        bib = Bib()
        bib.id = 1
        bib.set('245', 'a', 'Title')
        res = client.put(f'{API}/marc/{col}/records/{bib.id}', data=bib.to_json())
    else:
        cls = Auth
        auth = Auth()
        auth.id = 1
        auth.set('100', 'a', 'Heading 2')
        res = client.put(f'{API}/marc/{col}/records/{auth.id}', data=auth.to_json())
        
    assert res.status_code == 200
    
    # DELETE NY bib record by global administrator == 200
    # DELETE NY auth record by global administrator == 200
    # DELETE GE bib record by global administrator == 200
    # DELETE GE auth record by global administrator == 200

    # DELETE NY bib record by global bib administrator == 200
    # DELETE GE bib record by glbal bib administrator == 200
    # DELETE NY auth record by global auth administrator == 200
    # DELETE GE auth record by global auth administrator == 200

    # DELETE NY bib record by global auth administrator == 403
    # DELETE GE bib record by glbal auth administrator == 403
    # DELETE NY auth record by global bib administrator == 403
    # DELETE GE auth record by global bib administrator == 403

    # DELETE NY bib record by NY bib administrator == 200
    # DELETE GE bib record by NY bib administrator == 403
    # DELETE NY auth record by NY auth administrator == 200
    # DELETE GE auth record by NY auth administrator == 403

    # Other tests to be developed: Roles that can POST and PUT but not DELETE; roles that have permissions with must_not constraints.      


    # delete
    res = client.delete(f'{API}/marc/bibs/records/1')
    assert res.status_code == 204
    
    print(Auth.from_id(2).in_use())
    
    res = client.delete(f'{API}/marc/auths/records/2')
    assert res.status_code == 403 # auth in use
    
    res = client.delete(f'{API}/marc/auths/records/1')
    assert res.status_code == 204
             
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
                
        # post
        if col == 'bibs':    
            field = Datafield(record_type="bib", tag="245")
            field.set("a", "Edited")
            res = client.post(f'{API}/marc/{col}/records/1/fields/245', data=field.to_json())
        else:
            field = Datafield(record_type="auth", tag="100")
            field.set("a", "Heading 2")
            res = client.post(f'{API}/marc/{col}/records/1/fields/100', data=field.to_json())
            
        assert res.status_code == 201

def test_api_record_field_place(client, marc):
    for col in ('bibs', 'auths'):
        tags = ['245', '700'] if col == 'bibs' else ['100']
        
        for i in (1, 2):
            for tag in tags:
                res = client.get(f'{API}/marc/{col}/records/{i}/fields/{tag}/0')
                data = check_response(res)
                assert data['_meta']['returns'] == f'{API}/schemas/jmarc.datafield'
                
        # put
        if col == 'bibs':    
            field = Datafield(record_type="bib", tag="245")
            field.set("a", "Edited")
            res = client.put(f'{API}/marc/{col}/records/1/fields/245/0', data=field.to_json())
        else:
            field = Datafield(record_type="auth", tag="100")
            field.set("a", "Heading 2")
            res = client.put(f'{API}/marc/{col}/records/1/fields/100/0', data=field.to_json())
            
        assert res.status_code == 200
        
    # delete
    res = client.delete(f'{API}/marc/bibs/records/1/fields/245/0')
    assert res.status_code == 204
    
    res = client.delete(f'{API}/marc/auths/records/1/fields/100/0')
    assert res.status_code == 204
                
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

def test_api_workform_list(client, marc):
    for col in ('bibs', 'auths'):
        # get
        res = client.get(f'{API}/marc/bibs/workforms')
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/api.urllist'
        
        # post
        data = {'245': [{'subfields': [{'code': 'a', 'value': 'Val'}]}]}
        res = client.post(f'{API}/marc/bibs/workforms', data=json.dumps(data))
        assert res.status_code == 400 # name not set
        
        data['name'] = 'test workform'
        res = client.post(f'{API}/marc/{col}/workforms', data=json.dumps(data))
        assert res.status_code == 201
        
def test_api_workform(client, marc):
    for col in ('bibs', 'auths'):
        # get
        res = client.get(f'{API}/marc/bibs/workforms/test') # from marc fixture
        data = check_response(res)
        assert data['_meta']['returns'] == f'{API}/schemas/jmarc.workform'
        
        # put
        workform = data['data']
        res = client.put(f'{API}/marc/{col}/workforms/test', data=json.dumps(workform))
        assert res.status_code == 201
        
def test_api_files(client, files):
    res = client.get(f'{API}/files')
    data = check_response(res)
    assert f'{API}/files/f20d9f2072bbeb6691c0f9c5099b01f3' in data['data']

def test_api_file(client, files):
    res = client.get(f'{API}/files/f20d9f2072bbeb6691c0f9c5099b01f3')
    data = check_response(res)
    
    res = client.get(f'{API}/files/f20d9f2072bbeb6691c0f9c5099b01f3?action=download')
    assert res.status_code == 200

    res = client.get(f'{API}/files/f20d9f2072bbeb6691c0f9c5099b01f3?action=open')
    assert res.status_code == 200

def test_api_auth_merge(client, marc):
    res = client.get(f'{API}/marc/auths/records/1/merge?target=2')
    assert res.status_code == 200
    
    res = client.get(f'{API}/marc/auths/records/2')
    assert res.status_code == 404
    
    res = client.get(f'{API}/marc/bibs/records/2/fields/700/0/subfields/a/0')
    assert json.loads(res.data)['data'] == "Heading 1"

def test_api_auth_use_count(client, marc):
    res = client.get(f'{API}/marc/auths/records/1/use_count?use_type=bibs')
    data = check_response(res)
    
    assert data['data'] == 1
    
# User profile testing
def test_api_userprofile(client, default_users, users):
    username = default_users['admin']['email']
    password = default_users['admin']['password']
    
    credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")
    res = client.get("/api/userprofile/my_profile", headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 200
    data = json.loads(res.data)
    assert data['_meta']['returns'] == f'{API}/schemas/api.userprofile'

# User basket testing
def test_api_userbasket(client, default_users, users, marc):
    # Get the current user's basket, which should be created if it doesn't exist
    username = default_users['admin']['email']
    password = default_users['admin']['password']
    
    credentials = b64encode(bytes(f"{username}:{password}", "utf-8")).decode("utf-8")

    # GET the basket. It should have zero items.
    res = client.get("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 200
    data = json.loads(res.data)
    #print(data)
    assert data['_meta']['returns'] == f'{API}/schemas/api.basket'
    assert len(data['data']['items']) == 0

    # POST an item to the basket
    payload = {
        'collection': 'bibs',
        'record_id': '1'
    }
    res = client.post("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"}, data=json.dumps(payload))
    assert res.status_code == 201

    # GET the basket again. Now it should have one item.
    res = client.get("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"})
    data = json.loads(res.data)
    #print(data)
    assert len(data['data']['items']) == 1

    # GET the basket item. Its collection and record_id should match what we POSTed.
    item_url = data['data']['items'][0]
    print(item_url)
    res = client.get(item_url, headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 200
    data = json.loads(res.data)
    #print(data)
    assert data['data']['collection'] == 'bibs'
    assert data['data']['record_id'] == '1'

    # Try to POST a duplicate. This shoudl fail silently, and the basket should still contain only one item.
    res = client.post("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"}, data=json.dumps(payload))
    assert res.status_code == 200
    res = client.get("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"})
    data = json.loads(res.data)
    #print(data)
    assert len(data['data']['items']) == 1

    # Now DELETE the item from the basket and verify the basket contains zero items.
    res = client.delete(item_url, headers={"Authorization": f"Basic {credentials}"})
    assert res.status_code == 200
    res = client.get("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"})
    data = json.loads(res.data)
    assert len(data['data']['items']) == 0

    # Add an item, then clear the basket, testing to make sure there are zero records after.
    res = client.post("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"}, data=json.dumps(payload))
    res = client.get("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"})
    data = json.loads(res.data)
    assert len(data['data']['items']) == 1
    res = client.post("/api/userprofile/my_profile/basket/clear", headers={"Authorization": f"Basic {credentials}"})
    res = client.get("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"})
    data = json.loads(res.data)
    assert len(data['data']['items']) == 0

    # Add an item to the basket, then delete the item, testing to make sure there are zero items in the basket afterward.
    # This test should be extended to cover multiple users with the same item in their baskets...
    res = client.post("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"}, data=json.dumps(payload))
    res = client.get("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"})
    data = json.loads(res.data)
    assert len(data['data']['items']) == 1

    # Before we delete it though let's test if it's locked
    np_username = default_users['non-admin']['email']
    np_password = default_users['non-admin']['password']
    np_credentials = b64encode(bytes(f"{np_username}:{np_password}", "utf-8")).decode("utf-8")

    res = client.get(f'{API}/marc/bibs/records/1/locked', headers={"Authorization": f"Basic {np_credentials}"})
    data = json.loads(res.data)
    assert data['locked'] == True

    # We know it's locked. Let's try adding it to our non-admin basket anyway, but don't override
    payload["override"] = False
    res = client.post("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {np_credentials}"}, data=json.dumps(payload))
    assert res.status_code == 403

    # We know it's locked. Let's try adding it to our non-admin basket anyway, but DO override
    payload["override"] = True
    res = client.post("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {np_credentials}"}, data=json.dumps(payload))
    assert res.status_code == 201


    # delete; this should be the same record as in the payload
    res = client.delete(f'{API}/marc/bibs/records/1')
    assert res.status_code == 204
    res = client.get("/api/userprofile/my_profile/basket", headers={"Authorization": f"Basic {credentials}"})
    data = json.loads(res.data)
    assert len(data['data']['items']) == 0

    # Now it should not be locked
    res = client.get(f'{API}/marc/bibs/records/1/locked', headers={"Authorization": f"Basic {np_credentials}"})
    data = json.loads(res.data)
    assert data['locked'] == False

#def test_record_lock(client, default_users):
    
    
### util

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




        
        
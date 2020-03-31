import os
os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import json, re
from dlx_rest.config import Config

PRE = 'http://localhost/'

def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'

# Index page
def test_index(client):
    response = client.get(PRE)
    assert response.status_code == 200

# User session management
def test_register(client):
    response = client.get(PRE + '/register')
    assert response.status_code == 200

def test_login(client):
    response = client.get(PRE + '/login')
    assert response.status_code == 200

def test_logout(client):
    response = client.get(PRE + '/logout')
    assert response.status_code == 200

# User administration
# All of these should work only if authenticated.
def test_list_users(client):
    response = client.get(PRE + '/users')
    assert response.status_code == 200

def test_create_user(client):
    # To do: mock a new user, /users/1
    response = client.get(PRE + '/users/new')
    assert response.status_code == 200
    response = client.post(PRE + '/users/new')
    assert response.status_code == 200

def test_update_user(client):
    # To do: Users fixture, POST data
    response = client.get(PRE + '/users/1/edit')
    assert response.status_code == 200
    response = client.post(PRE + '/users/1/edit')
    assert response.status_code == 200

def test_delete_user(client):
    response = client.post(PRE + '/users/1/delete')
    assert response.status_code == 200

# Records
def test_get_records_list(client):
    for col in ['bibs','auths']:
        response = client.get(PRE + '/records/{}'.format(col))
        assert response.status_code == 200

def test_get_record(client):
    for col in ['bibs','auths']:
        response = client.get(PRE + '/records/{}/{}'.format(coll, 1))
        assert response.status_code == 200

# This should behave differently, unless we don't need this route.
'''
def test_edit_record(client):
    for col in ['bibs','auths']:
        response = client.get(PRE + '/records/{}/{}'.format(coll, 1))
        assert response.status_code == 200
'''
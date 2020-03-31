import os
os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import json, re
from dlx_rest.config import Config

PRE = 'http://localhost/'

def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'

def test_index(client):
    response = client.get(PRE)
    assert response.status_code == 200

def test_register(client):
    response = client.get(PRE + '/register')
    assert response.status_code == 200

def test_login(client):
    response = client.get(PRE + '/login')
    assert response.status_code == 200

def test_logout(client):
    response = client.get(PRE + '/logout')
    assert response.status_code == 200

def test_get_records_list(client):
    for col in ['bibs','auths']:
        response = client.get(PRE + '/records/{}'.format(col))
        assert response.status_code == 200

#def test_get_record()
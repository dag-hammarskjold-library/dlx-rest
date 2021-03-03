import os
os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import json, re
from dlx_rest.config import Config
from dlx_rest.forms import LoginForm
from flask_login import LoginManager, current_user, login_user, login_required, logout_user

PRE = 'http://localhost/'

def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'

# Index page
def test_index(client):
    response = client.get(PRE)
    assert response.status_code == 200

# User session management
'''
def test_get_register_page(client):
    response = client.get(PRE + '/register')
    assert response.status_code == 200
'''
'''
def test_post_register_data(client):
    email
    response = client.post(PRE + '/register', data={
        'email'
    })
'''
def login(client, username, password):
    return client.post(PRE + '/login', data = {'email': username, 'password': password}, follow_redirects=True)

def logout(client):
    return client.get(PRE + '/logout', follow_redirects=True)

def test_login(client, app_context, users):
    # Get the login form
    response = client.get(PRE + '/login')
    assert response.status_code == 200

    rv = login(client, Config.username, Config.password)
    assert rv.status_code == 200
    print(rv.data)
    assert b'Logged in successfully' in rv.data

    logout(client)

    # Incorrect login
    rv = login(client, 'invalid-user@un.org', 'password')
    assert rv.status_code == 200
    assert b'Invalid username or password' in rv.data

def test_logout(client):
    #response = client.get(PRE + '/logout')
    # Logout should always redirect
    #assert response.status_code == 302
    rv = logout(client)
    assert rv.status_code == 200
    assert b'Logged out successfully' in rv.data

# Administration
# All of these should work only if authenticated.
# Authentication is disabled during unit testing
def test_admin(client):
    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get(PRE + '/admin')
    assert response.status_code == 403

    # Authenticated, non-admin user
    login(client, 'user@un.org', 'password')
    response = client.get(PRE + '/admin')
    assert response.status_code == 403

    logout(client)

    # Authenticated, admin user
    login(client, Config.username, Config.password)
    response = client.get(PRE + '/admin')
    assert response.status_code == 200

'''
def test_list_users(client):
    response = client.get(PRE + '/admin/users')
    assert response.status_code == 200

def test_create_user(client):
    from dlx_rest.models import User

    response = client.get(PRE + '/admin/users/new')
    assert response.status_code == 200

    response = client.post(PRE + '/admin/users/new', data={
        'email': 'new_test_user@un.org', 'password': 'password'
    })
    assert response.status_code == 302
    user = User.objects.first()
    assert user.email == 'new_test_user@un.org'

def test_update_user(client, users):
    from dlx_rest.models import User
    user = User.objects.first()

    response = client.get(PRE + '/admin/users/{}/edit'.format(str(user.id)))
    assert response.status_code == 200

    response = client.post(PRE + '/admin/users/{}/edit'.format(str(user.id)), data={
        'email':'foo@bar.com', 'password': 'password'
    })
    assert response.status_code == 302
    user = User.objects.first()
    assert user.email == 'foo@bar.com' 

def test_delete_user(client, users):
    from dlx_rest.models import User
    user = User.objects.first()

    response = client.get(PRE + '/admin/users/{}/delete'.format(str(user.id)))
    assert response.status_code == 302

    assert len(User.objects) == 0
'''

#def test_sync(client):

# Records
'''
def test_get_records_list(client):
    for col in ['bibs','auths']:
        response = client.get(PRE + '/records/{}'.format(col))
        assert response.status_code == 200

def test_get_record(client, coll):
    for col in ['bibs','auths']:
        response = client.get(PRE + '/records/{}/{}'.format(coll, 1))
        assert response.status_code == 200
'''

# This should behave differently, unless we don't need this route.
'''
def test_edit_record(client):
    for col in ['bibs','auths']:
        response = client.get(PRE + '/records/{}/{}'.format(coll, 1))
        assert response.status_code == 200
'''
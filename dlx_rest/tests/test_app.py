import os
os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import json, re, time
#from flask import session
from dlx_rest.config import Config
from dlx_rest.forms import LoginForm
from flask_login import LoginManager, current_user, login_user, login_required, logout_user

#PRE = 'http://localhost/'

def test_testing():
    assert Config.TESTING == True
    assert Config.connect_string == 'mongomock://localhost'

# Index page
def test_index(client):
    response = client.get('/')
    assert response.status_code == 302

# User session management
def login(client, username, password):
    response = client.post('/login', data = {'email': username, 'password': password}, follow_redirects=True)
    return response

def logout(client):
    response = client.get('/logout', follow_redirects=True)
    return response

def test_login(client, default_users):
    # Get the login form
    response = client.get('/login')
    assert response.status_code == 200

    user = default_users['admin']
    rv = login(client, user['email'], user['password'])
    assert rv.status_code == 200
    #assert b'Logged in successfully' in rv.data

    logout(client)

    # Incorrect login
    user = default_users['invalid']
    rv = login(client, user['email'], user['password'])
    assert rv.status_code == 200
    print(rv.data)
    #assert b'Invalid username or password' in rv.data

def test_logout(client):
    #response = client.get('/logout')
    # Logout should always redirect
    #assert response.status_code == 302
    rv = logout(client)
    assert rv.status_code == 200
    #assert b'Logged out successfully' in rv.data

def test_session_timeout(client, default_users):
    # The timeout is lowered to 5 seconds for testing, so we'll sleep just
    # long enough to ensure the session is timed out.
    # Also, it turns out that the session from above was still active...
    time.sleep(7)
    with client.session_transaction() as session:
        response = client.get('/records/bibs/search')
        #print(session)
        assert session.get('_fresh') == None

    # A new session should be completely empty.
    #with client.session_transaction() as session:
    #    response = client.get('/records/bibs/search')
    #    print(session)
    #    assert session.get('_fresh') == None
        
    # While an existing session should have some data in it.
    with client.session_transaction() as session:
        user = default_users['admin']
        rv = login(client, user['email'], user['password'])
        response = client.get('/records/bibs/search')
        #print(session)
        assert session.get('_fresh') == False

    # Sleep a short amount of time, then try again to make sure the session
    # is still active.
    time.sleep(2)
    with client.session_transaction() as session:
        response = client.get('/records/bibs/search')
        #print(session)
        assert session.get('_fresh') == False
    
    

# Administration
# All of these should work only if authenticated.
def test_admin(client, default_users):
    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin')
    assert response.status_code == 403

    # Authenticated, non-admin user
    user = default_users['non-admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin')
    assert response.status_code == 403

    logout(client)

    # Authenticated, admin user
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin')
    assert response.status_code == 200

    logout(client)

def test_list_users(client, default_users):
    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin/users')
    assert response.status_code == 403

    # Authenticated, non-admin user
    user = default_users['non-admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/users')
    assert response.status_code == 403

    logout(client)

    # Authenticated, admin user
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/users')
    assert response.status_code == 200

    logout(client)

def test_create_user(client, default_users):
    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin/users/new')
    assert response.status_code == 403

    response = client.post('/admin/users/new', data={
        'email': 'new_test_user@un.org', 'shortname': 'ntu', 'password': 'password'
    })
    assert response.status_code == 403

    # Authenticated, unauthorized user.
    user = default_users['non-admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/users/new')
    assert response.status_code == 403

    response = client.post('/admin/users/new', data={
        'email': 'new_test_user@un.org', 'shortname': 'ntu', 'password': 'password'
    })
    assert response.status_code == 403

    logout(client)

    # Authenticated, authorized user
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/users/new')
    assert response.status_code == 200

    new_user = default_users['new']
    response = client.post('/admin/users/new', data={
        'email': new_user['email'], 'username': new_user['username'], 'shortname': new_user['shortname'], 'password': new_user['password']
    })
    assert response.status_code == 302

    logout(client)

    # Verify our newly created user
    from dlx_rest.models import User
    user = User.objects.filter(email=new_user['email'])
    assert len(user) > 0
    assert user[0].email == new_user['email']


def test_update_user(client, default_users):
    from dlx_rest.models import User
    admin_user = default_users['admin']
    edited_user = User.objects.get(email=default_users['non-admin']['email'])

    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin/users/{}/edit'.format(str(edited_user.id)))
    assert response.status_code == 403

    response = client.post('/admin/users/{}/edit'.format(str(edited_user.id)), data={
        'email':'foo@bar.com', 'shortname': 'foo', 'password': 'password'
    })
    assert response.status_code == 403

    # Authenticated, but unauthorized.
    user = default_users['non-admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/users/{}/edit'.format(str(edited_user.id)))
    assert response.status_code == 403

    response = client.post('/admin/users/{}/edit'.format(str(edited_user.id)), data={
        'email':'foo@bar.com', 'shortname': 'foo', 'password': 'password'
    })
    assert response.status_code == 403
    logout(client)

    # Authenticated, authorized
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/users/{}/edit'.format(str(edited_user.id)))
    assert response.status_code == 200

    response = client.post('/admin/users/{}/edit'.format(str(edited_user.id)), data={
        'email':'foo@bar.com', 'shortname': 'foo', 'password': 'password'
    })
    assert response.status_code == 302
    logout(client)

    user = User.objects.filter(email='foo@bar.com')
    assert len(user) > 0
    assert user[0].email == 'foo@bar.com'

def test_delete_user(client, default_users):
    from dlx_rest.models import User
    deleted_user = User.objects.get(email=default_users['new']['email'])
    current_user_count = len(User.objects)

    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin/users/{}/delete'.format(str(deleted_user.id)))
    assert response.status_code == 403

    # Authenticated, unauthorized
    user = default_users['new']
    login(client, user['email'], user['password'])
    response = client.get('/admin/users/{}/delete'.format(str(deleted_user.id)))
    assert response.status_code == 403
    logout(client)

    # Authenticated, authorized
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/users/{}/delete'.format(str(deleted_user.id)))
    assert response.status_code == 302
    logout(client)

    assert len(User.objects) == current_user_count - 1
    user = User.objects.filter(email=deleted_user['email'])
    assert len(user) == 0

def test_list_roles(client, default_users):
    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin/roles')
    assert response.status_code == 403

    # Authenticated, non-admin user
    user = default_users['non-admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/roles')
    assert response.status_code == 403

    logout(client)

    # Authenticated, admin user
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/roles')
    assert response.status_code == 200

    logout(client)

def test_create_role(client, default_users):
    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin/roles/new')
    assert response.status_code == 403

    response = client.post('/admin/roles/new', data={
        'name': 'testRole'
    })
    assert response.status_code == 403

    # Authenticated, unauthorized user.
    user = default_users['non-admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/roles/new')
    assert response.status_code == 403

    response = client.post('/admin/roles/new', data={
        'name': 'testRole'
    })
    assert response.status_code == 403


    logout(client)

    # Authenticated, authorized user
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/roles/new')
    assert response.status_code == 200

    response = client.post('/admin/roles/new', data={
        'name': 'testRole'
    })
    assert response.status_code == 302

    logout(client)

    # Verify our newly created role
    from dlx_rest.models import Role, Permission
    role = Role.objects.filter(name='testRole')
    assert len(role) > 0
    assert len(role[0].permissions) == 0
    role[0].add_permission_by_name('testPermission')
    assert len(role[0].permissions) == 1

def test_update_role(client, default_users):
    from dlx_rest.models import Role
    admin_user = default_users['admin']
    edited_role = Role.objects.get(name='testRole')

    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin/roles/{}'.format(str(edited_role.name)))
    assert response.status_code == 403

    response = client.post('/admin/roles/{}'.format(str(edited_role.name)), data={
        'name':'testRole', 'permissions': []
    })
    assert response.status_code == 403

    # Authenticated, but unauthorized.
    user = default_users['non-admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/roles/{}'.format(str(edited_role.name)))
    assert response.status_code == 403

    response = client.post('/admin/roles/{}'.format(str(edited_role.name)), data={
        'name':'testRole', 'permissions': []
    })
    assert response.status_code == 403
    logout(client)

    # Authenticated, authorized
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/roles/{}'.format(str(edited_role.name)))
    assert response.status_code == 200

    response = client.post('/admin/roles/{}'.format(str(edited_role.name)), data={
        'name':'testRole', 'permissions': []
    })
    assert response.status_code == 302
    logout(client)

    role = Role.objects.filter(name='testRole')
    assert len(role[0].permissions) == 0

def test_delete_role(client, default_users):
    from dlx_rest.models import Role
    deleted_role = Role.objects.get(name='testRole')
    current_role_count = len(Role.objects)

    # Unauthenticated. This should give a 403 for unauthorized users.
    response = client.get('/admin/roles/{}/delete'.format(str(deleted_role.name)))
    assert response.status_code == 403

    # Authenticated, unauthorized
    user = default_users['new']
    login(client, user['email'], user['password'])
    response = client.get('/admin/roles/{}/delete'.format(str(deleted_role.name)))
    assert response.status_code == 403
    logout(client)

    # Authenticated, authorized
    user = default_users['admin']
    login(client, user['email'], user['password'])
    response = client.get('/admin/roles/{}/delete'.format(str(deleted_role.name)))
    assert response.status_code == 302
    logout(client)

    assert len(Role.objects) == current_role_count - 1
    role = Role.objects.filter(name='testRole')
    assert len(role) == 0

'''
Next: Add tests to manage permissions
'''

# Test search listings sort ascending/descending
def test_sort(client):
    pass

# Test changing number of results per page in search listings
def test_rpp(client):
    pass

# Test page forward and backward
# Also test that pagination preserves other options (namely sort direction)
def test_pagination(client):
    pass
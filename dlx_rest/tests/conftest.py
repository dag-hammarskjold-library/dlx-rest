import os
os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import json, re
from datetime import datetime
from dlx_rest.config import Config

# Move fixtures here so they can be reused in all tests.

@pytest.fixture(scope='module')
def default_users():
    return {
        'admin': {
            'email':'test_user@un.org',
            'password': 'password',
            'role': 'admin'
        },
        'non-admin': {
            'email':'user@un.org',
            'password': 'password',
            'role': 'user'
        },
        'invalid': {
            'email':'invalid@un.org',
            'password': 'password'
        },
        'new': {
            'email': 'new_test_user@un.org',
            'password': 'password',
            'role': 'user'
        }
    }


@pytest.fixture(scope='module')
def app_context():
    from dlx_rest.app import app
    with app.app_context():
        yield

@pytest.fixture(scope='module')
def client():
    from dlx_rest.app import app
    return app.test_client()
    
@pytest.fixture(scope='module')
def db():
    from dlx import DB
    # ?

@pytest.fixture(scope='module')
def permissions():
    from dlx_rest.models import Permission
    for perm in ['readAdmin','readUser','createUser','updateUser','deleteUser']:
        p = Permission(action=perm)
        p.save()
    
    return Permission

@pytest.fixture(scope='module')
def roles(permissions):
    from dlx_rest.models import Role

    r = Role(name='admin')
    r.permissions = permissions.objects()
    r.save()

    r = Role(name='user')
    r.permissions = []
    r.save()

    return Role
    
@pytest.fixture(scope='module')
def users(roles, default_users):
    from dlx_rest.models import User
    
    for utype in ['admin','non-admin']:
        u = default_users[utype]
        user = User(email = u['email'], created=datetime.now())
        user.set_password(u['password'])
        user.add_role_by_name(u['role'])
        user.save()

    return User
    
@pytest.fixture(scope='module')
def records():
    from dlx import DB
    from dlx.marc import Bib, Auth
    from random import randrange

    for x in range(1, 11):
        auth = Auth({'_id': x})
        auth.set('100', 'a', str(randrange(1, 100))),
        auth.set('400', 'a', '1x'),
        auth.set('400', 'a', '2x', address=['+'])
        auth.set('400', 'a', '3x', address=[1, '+'])
        auth.set('900', 'a', str(x)).set('900', 'b', str(x))
        auth.commit()
        
        Auth({'_id': 11}).set('110', 'a', 'Name').commit(),
        
        bib = Bib({'_id': x})
        bib.set('245', 'a', str(randrange(1, 100)))
        bib.set('500', 'a', '1x')
        bib.set('610', 'a', 'Name')
        bib.set('500', 'a', '2x', address=['+'])
        bib.set('500', 'a', '3x', address=[1, '+'])
        bib.set('900', 'a', str(x)).set('900', 'b', str(x))
        bib.commit()
        
@pytest.fixture(scope='module')
def auths():
    from dlx import DB
    from dlx.marc import Bib, Auth
    from random import randrange
    
    auths = []
    auths.append(Auth({'_id': 11}).set('110', 'a', 'Name'))

    for x in range(1, 11):
        auth = Auth({'_id': x})
        auth.set('100', 'a', str(randrange(1, 100))),
        auth.set('400', 'a', '1x'),
        auth.set('400', 'a', '2x', address=['+'])
        auth.set('400', 'a', '3x', address=[1, '+'])
        auth.set('900', 'a', str(x)).set('900', 'b', str(x))
        auths.append(auth)
        
    return auths

@pytest.fixture(scope='module')
def bibs():
    from dlx import DB
    from dlx.marc import Bib, Auth
    from random import randrange
    
    bibs = []
    
    for x in range(1, 11):
        bib = Bib({'_id': x})
        bib.set('245', 'a', str(randrange(1, 100)))
        bib.set('500', 'a', '1x')
        bib.set('610', 'a', 'Name')
        bib.set('500', 'a', '2x', address=['+'])
        bib.set('500', 'a', '3x', address=[1, '+'])
        bib.set('900', 'a', str(x)).set('900', 'b', str(x))
        bibs.append(bib)
    
    return bibs

@pytest.fixture(scope='module')    
def templates():
    from dlx import DB
    from dlx.marc import Bib, Auth
    
    template = Bib()
    template.set('245', 'a', 'Title')
    data = template.to_dict()
    data['name'] = 'bib_template_1'
    data['_id'] = 1
    DB.handle['bibs_templates'].insert_one(data)
    
    template = Auth()
    template.set('100', 'a', 'Name')
    data = template.to_dict()
    data['name'] = 'auth_template_1'
    data['_id'] = 1
    DB.handle['auths_templates'].insert_one(data)
    
@pytest.fixture(scope='module')
def recordset_2():
    from dlx import DB
    from dlx.marc import Bib, Auth
    
    DB.handle['bibs'].drop()
    DB.handle['auths'].drop()
    
    auth = Auth()
    auth.set('110', 'a', 'Giant organization')
    auth.set('110', 'b', 'subsidiary')
    auth.commit()
    
    auth = Auth()
    auth.set('110', 'a', 'Small organization')
    auth.set('110', 'b', 'subsidiary')
    auth.commit()
    
    
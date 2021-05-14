import os
os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import io, json, re
from datetime import datetime
from moto import mock_s3
from dlx import DB
from dlx.marc import Bib, Auth
from dlx.file import File, Identifier, S3
from dlx_rest.config import Config

# Move fixtures here so they can be reused in all tests.

assert Config.TESTING == True
assert Config.connect_string == 'mongomock://localhost'
    
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
def client():
    from dlx_rest.app import app
    
    app.TESTING = True
    #app.config.update(SERVER_NAME='0.0.0.0:80')
    
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

@pytest.fixture
def marc():
    auths = []
    
    for i in range(1, 3):
        auth = Auth()
        auth.id = i
        auth.set('100', 'a', f'Heading {i}')
        auth.commit()
        auths.append(auth)
    
    bibs = []
    for i in range(1, 3):
        bib = Bib()
        bib.id = i
        bib.set('245', 'a', 'Title').set('700', 'a', i)
        bib.commit()
        bibs.append(bib)
        
    for col in ('bibs', 'auths'):
        template = Bib() if col == 'bibs' else Auth()
        template.id = 1
        template.set('035', 'a', 'ID')   
        d = template.to_dict()
        d['name'] = 'test'
        DB.handle[f'{col}_templates'].insert_one(d)
        
    yield {'auths': auths, 'bibs': bibs}
    
    # TODO handle test data in dlx
    for col in ('bibs', 'auths', 'bibs_templates', 'auths_templates', 'bib_history', 'auth_history'):
        Auth._cache = {}
        DB.handle[col].drop()
     
@pytest.fixture 
def files():
    with mock_s3():
        S3.connect(bucket='mock_bucket')
        S3.client.create_bucket(Bucket=S3.bucket)
        
        File.import_from_handle(
            io.BytesIO(b'test file'),
            filename='test.txt',
            identifiers=[Identifier('isbn', 'x')],
            languages=['en'],
            mimetype='text/plain',
            source='test'
        )
        
        yield
        
        DB.files.drop()
  
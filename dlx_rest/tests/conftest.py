import os

from dlx_rest.models import Constraint, Permission
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

print(Config.connect_string)

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
            'password': 'password'
        },
        'invalid': {
            'email':'invalid@un.org',
            'password': 'password'
        },
        'new': {
            'email': 'new_test_user@un.org',
            'password': 'password'
        },
        'bib-admin': {
            'email': 'bib_admin@un.org',
            'password': 'password',
            'role': 'bibs-admin'
        },
        'auth-admin': {
            'email': 'auth_admin@un.org',
            'password': 'password',
            'role': 'auths-admin'
        },
        'file-admin': {
            'email': 'file_admin@un.org',
            'password': 'password',
            'role': 'files-admin'
        },
        'bib-NY-admin': {
            'email': 'bib_ny_admin@un.org',
            'password': 'password',
            'role': 'bibs-NY-admin'
        },
        'auth-NY-admin': {
            'email': 'auth_ny_admin@un.org',
            'password': 'password',
            'role': 'auths-NY-admin'
        },
        'bib-GE-admin': {
            'email': 'bib_ge_admin@un.org',
            'password': 'password',
            'role': 'bibs-GE-admin'
        },
        'auth-GE-admin': {
            'email': 'auth_ge_admin@un.org',
            'password': 'password',
            'role': 'auths-GE-admin'
        },

        # Once we have file tests and location data ready, we can enable these users
        #'file-NY-admin': {
        #    'email': 'file_ny_admin@un.org',
        #    'password': 'password',
        #    'role': 'file-NY-admin'
        #},
        #'file-GE-admin': {
        #    'email': 'file_ge_admin@un.org',
        #    'password': 'password',
        #    'role': 'file-GE-admin'
        #},

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
def constraints():
    from dlx_rest.models import Constraint
    # Collection and Location Constraints
    for coll in ["bibs","auths","files"]:
        col_c = Constraint(name=f'constraint-{coll}', collection=coll)
        col_c.save()
        for c in [{'loc': 'NY', 'code': 'NNUN'}, {'loc': 'GE', 'code': 'SzGeBNU'}]:
            this_c = Constraint(name=f'constraint-{coll}-{c["loc"]}', collection=coll, field='040', subfield='a', value=c['code'])
            this_c.save()

@pytest.fixture(scope='module')
def permissions():
    from dlx_rest.models import Permission, Constraint
    # Global Administrator permissions
    for a in ['create','read','update','delete']:
        for comp in ['Admin', 'User', 'Role', 'Permission', 'File', 'Record']:
            this_p = Permission(action=f'{a}{comp}')
            this_p.save()
    
    # Collection and location permissions
    for a in ['create','read','update','delete']:
        for comp in ['File', 'Record']:
            for coll in ["bibs","auths", "files"]:    
                col_p = Permission(action=f'{a}{comp}')
                #col_p.constraint_must.append(Constraint(collection=coll))
                col_p.constraint_must = list(filter(lambda x: x['collection'] == coll and not x['field'], Constraint.objects))
                col_p.save()
                for loc in ['NNUN', 'SzGeBNU']:
                    if comp == "File" or comp == "Record":
                        loc_p = Permission(action=f'{a}{comp}')
                        #loc_p.constraint_must.append(Constraint(collection=coll, field='040', subfield='a', value=loc))
                        loc_p.constraint_must = list(filter(lambda x: x['collection'] == coll and x['field'] == '040', Constraint.objects))
                        loc_p.save()
    
    return Permission

@pytest.fixture(scope='module')
def roles(permissions):
    from dlx_rest.models import Role

    r = Role(name='admin')
    r.permissions = Permission.objects(constraint_must=[], constraint_must_not=[])
    r.save()

    # Collection admin roles
    for coll in ["bibs","auths","files"]:
        admin_r = Role(name=f'{coll}-admin')
        constraints = Constraint.objects(collection=coll, field=None)
        permissions = Permission.objects(constraint_must__in=constraints)
        admin_r.permissions = permissions
        admin_r.save()

    # Collection location admin roles
    for coll in ["bibs","auths","files"]:
        for c in [{'loc': 'NY', 'code': 'NNUN'}, {'loc': 'GE', 'code': 'SzGeBNU'}]:
            admin_r = Role(name=f'{coll}-{c["loc"]}-admin')
            constraints = Constraint.objects(collection=coll, field='040', subfield='a', value=c["code"])
            permissions = Permission.objects(constraint_must__in=constraints)
            admin_r.permissions = permissions
            admin_r.save()

    return Role
    
@pytest.fixture(scope='module')
def users(roles, default_users):
    from dlx_rest.models import User
    
    for utype in default_users:
        u = default_users[utype]
        print(u)
        user = User(email = u['email'], created=datetime.now())
        user.set_password(u['password'])
        try:
            user.add_role_by_name(u['role'])
        except KeyError:
            pass
        user.save()

    return User

@pytest.fixture
def marc():
    '''
    To do: Create default bibs, auths, and templates with location data for location-based permissions testing.
    '''
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
        bib.set('245', 'a', 'Title {i}').set('700', 'a', f'Heading {i}')
        bib.commit()
        bibs.append(bib)
    
    # templates
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
  
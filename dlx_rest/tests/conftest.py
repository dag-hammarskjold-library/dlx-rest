import os

os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import io, json, re
from datetime import datetime
from moto import mock_aws
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
            'username': 'admcat',
            'shortname': 'adm',
            'password': 'password',
            'role': 'admin'
        },
        'non-admin': {
            'email':'user@un.org',
            'username': 'nacat',
            'shortname': 'na',
            'password': 'password'
        },
        'invalid': {
            'email':'invalid@un.org',
            'username': 'invcat',
            'shortname': 'inv',
            'password': 'password'
        },
        'new': {
            'email': 'new_test_user@un.org',
            'username': 'ntucat',
            'shortname': 'ntu',
            'password': 'password'
        },
        'bib-admin': {
            'email': 'bib_admin@un.org',
            'username': 'bibcat',
            'shortname': 'bib',
            'password': 'password',
            'role': 'bibs-admin'
        },
        'auth-admin': {
            'email': 'auth_admin@un.org',
            'username': 'authcat',
            'shortname': 'aut',
            'password': 'password',
            'role': 'auths-admin'
        },
        'file-admin': {
            'email': 'file_admin@un.org',
            'username': 'filecat',
            'shortname': 'fil',
            'password': 'password',
            'role': 'files-admin'
        },
        'bib-NY-admin': {
            'email': 'bib_ny_admin@un.org',
            'username': 'bibnycat',
            'shortname': 'bna',
            'password': 'password',
            'role': 'bibs-NY-admin'
        },
        'auth-NY-admin': {
            'email': 'auth_ny_admin@un.org',
            'username': 'authnycat',
            'shortname': 'ana',
            'password': 'password',
            'role': 'auths-NY-admin'
        },
        'bib-GE-admin': {
            'email': 'bib_ge_admin@un.org',
            'username': 'bibgecat',
            'shortname': 'bga',
            'password': 'password',
            'role': 'bibs-GE-admin'
        },
        'auth-GE-admin': {
            'email': 'auth_ge_admin@un.org',
            'username': 'authgecat',
            'shortname': 'aga',
            'password': 'password',
            'role': 'auths-GE-admin'
        },
        'bib-NY-indexer': {
            'email': 'bib_ny_indexer@un.org',
            'username': 'bibnyicat',
            'shortname': 'bni',
            'password': 'password',
            'role': 'bibs-NY-indexer'
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
    return app.test_client()

@pytest.fixture(scope='module')
def db():
    from dlx import DB
    # ?
@pytest.fixture(scope='module')
def permissions():
    from dlx_rest.models import Permission

    return Permission

@pytest.fixture(scope='module')
def roles(permissions):
    from dlx_rest.models import Role, Permission

    # basic admin permissions
    admin_permissions = []
    for action in ["create", "read", "update", "delete"]:
        for comp in ["Record", "File", "Workform", "Admin", "Role", "Permission", "User", "View"]:
            this_permission = Permission(action=f'{action}{comp}')
            this_permission.save()
            admin_permissions.append(this_permission)

    # Special case that doesn't fit the above
    merge_auth = Permission(action="mergeAuthority")
    merge_auth.save()
    admin_permissions.append(merge_auth)

    import_marc = Permission(action="importMarc")
    import_marc.save()
    admin_permissions.append(import_marc)
    
    admin_role = Role(name="admin")
    admin_role.permissions = admin_permissions
    admin_role.save()

    # Collection admins
    for coll in ["bibs", "auths", "files"]:
        coll_perms = []
        for action in ["create", "read", "update", "delete"]:
            this_permission = Permission(action=f'{action}Record', constraint_must=[f'{coll}'])
            this_permission.save()
            coll_perms.append(this_permission)
        if coll == "auths":
            auth_review = Permission(action="reviewAuths", constraint_must=['auths'])
            auth_review.save()
            merge_auth = Permission(action="mergeAuthority", constraint_must=["auths"])
            merge_auth.save()
            coll_perms.append(auth_review)
            coll_perms.append(merge_auth)
        # collection role
        coll_admin = Role(name=f'{coll}-admin')
        coll_admin.permissions = coll_perms
        coll_admin.save()

    # Location based collection admins
    # NY
    for coll in ["bibs","auths", "files"]:
        coll_perms = []
        for action in ["create", "read", "update", "delete"]:
            ny_permission = Permission(action=f'{action}Record', constraint_must=[f'{coll}|040|a|NNUN'])
            ny_permission.save()
            coll_perms.append(ny_permission)
        # collection role
        coll_admin = Role(name=f'{coll}-NY-admin')
        coll_admin.permissions = coll_perms
        coll_admin.save()

    # GE
    for coll in ["bibs","auths", "files"]:
        coll_perms = []
        for action in ["create", "read", "update", "delete"]:
            ge_permission = Permission(action=f'{action}Record', constraint_must=[f'{coll}|040|a|SzGeBNU'])
            ge_permission.save()
            coll_perms.append(ge_permission)
        # collection role
        coll_admin = Role(name=f'{coll}-GE-admin')
        coll_admin.permissions = coll_perms
        coll_admin.save()

    # TO DO: Add these to commands.py under init-roles
    # Local Indexer - Not admin
    # NY
    coll_perms = []
    for action in ["create", "read", "update", "delete"]:
        ny_permission = Permission(
            action=f'{action}Record', 
            constraint_must=[f'bibs|040|a|NNUN'], 
            constraint_must_not=[f'biba|999|c|t'])
        ny_permission.save()
        coll_perms.append(ny_permission)
    # collection role
    coll_admin = Role(name=f'bibs-NY-indexer')
    coll_admin.permissions = coll_perms
    coll_admin.save()

    # Local Indexing Assistant
    
        
    return Role
    
@pytest.fixture(scope='module')
def users(roles, default_users):
    from dlx_rest.models import User
    
    for utype in default_users:
        if utype not in ["invalid","new"]:
            u = default_users[utype]
            user = User(email = u['email'], username=u['username'], shortname=u["shortname"], created=datetime.now())
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
    To do: Create default templates with location data for location-based permissions testing.
    '''
    auths = []
    for i in range(1, 3):
        auth = Auth()
        auth.id = i
        auth.set('100', 'a', f'Heading {i}')
        auth.commit()
        auths.append(auth)

    nyAuth = Auth()
    nyAuth.id = 4
    nyAuth.set('100', 'a', 'New York Auth Record')
    nyAuth.set('040', 'a', 'NNUN')
    nyAuth.commit()

    auths.append(nyAuth)

    geAuth = Auth()
    geAuth.id = 5
    geAuth.set('100', 'a', 'Geneva Auth Record')
    geAuth.set('040', 'a', 'SzGeBNU')
    geAuth.commit()

    auths.append(geAuth)
    
    bibs = []
    
    for i in range(1, 3):
        bib = Bib()
        bib.id = i
        bib.set('245', 'a', 'Title {i}').set('700', 'a', f'Heading {i}')
        bib.commit()
        bibs.append(bib)

    nyBib = Bib()
    nyBib.id = 4
    nyBib.set('245', 'a', 'New York Bib Record')
    nyBib.set('040', 'a', 'NNUN')
    nyBib.commit()

    bibs.append(nyBib)

    geBib = Bib()
    geBib.id = 5
    geBib.set('245', 'a', 'Geneva Bib Record')
    geBib.set('040', 'a', 'SzGeBNU')
    geBib.commit()

    bibs.append(geBib)

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
    with mock_aws():
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
  

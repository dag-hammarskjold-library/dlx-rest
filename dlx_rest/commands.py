from dlx_rest.app import app
from dlx_rest.models import User, Role, Permission
from bson.objectid import ObjectId
import click
import string
import secrets

def generate_password():
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for i in range(20))
    return password

@app.cli.command('create-user')
@click.argument('email')
@click.argument('username')
#@click.argument('password', required=False, default=None)
#@click.argument('role', required=False, default='user')
def create_user(email, username):
    my_password = generate_password()
    try:
        user = User(email=email, username=username)
        user.set_password(my_password)
        user.save()
        print(f"User {email} has been created. Password: {my_password}")
        print("Copy the password from here, because this is the only time it will be displayed.")
    except:
        raise

@app.cli.command('make-admin')
@click.argument('email')
def make_admin(email):
    try:
        user = User.objects.get(email=email)

        user.roles = []
        # But only admins should have this one.
        user.add_role_by_name('admin')
        user.save()
    except:
        print("The user doesn't exist or couldn't be saved. You should use the create-user command first.")

@app.cli.command('init-usernames')
def init_usernames():
    for user in User.objects():
        username = user.email.split('@')[0]
        #print(user.email, username)
        user.username = username
        user.save()

@app.cli.command('init-roles')
def init_roles():
    pass
    print("Collecting existing user roles.")
    user_roles = []
    for user in User.objects():
        print(user.email)
        user_role = {'email': user.email, 'roles': []}
        if len(user.roles) > 0:
            for role in user.roles:
                user_role['roles'].append(role)
        user_roles.append(user_role)


    print("Dropping Role and Permission collections.")
    Permission.drop_collection()
    Role.drop_collection()

    # These are only for use by the admin, which has no constraints
    auth_review = Permission(action="reviewAuths")
    auth_review.save()
    merge_auth = Permission(action="mergeAuthority")
    merge_auth.save()

    # basic admin permissions
    admin_permissions = []
    for action in ["create", "read", "update", "delete"]:
        for comp in ["Record", "File", "Workform", "Admin", "Role", "Permission", "User", "View"]:
            this_permission = Permission(action=f'{action}{comp}')
            this_permission.save()
            admin_permissions.append(this_permission)

    import_marc = Permission(action='importMarc')
    batch_delete = Permission(action='batchDelete')
    
    admin_permissions.append(auth_review)
    admin_permissions.append(merge_auth)
    admin_permissions.append(import_marc)
    admin_permissions.append(batch_delete)
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
            # These are the correct, constrained permissions for auth admins
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

    # To do: init the batch admin role

    # Resetting previously existing roles
    for r in user_roles:
        this_u = User.objects.get(email=r["email"])
        this_u.roles = r["roles"]
        this_u.save()

@app.cli.command('create-permission')
@click.argument('action')
@click.option('--constraint_must', default=None, help='Constraints that must be met for this permission to apply, e.g., "bibs|040|a|NNUN"')
@click.option('--constraint_must_not', default=None, help='Constraints that must not be met for this permission to apply, e.g., "biba|999|c|t"')
def create_permission(action, constraint_must=None, constraint_must_not=None):
    try:
        permission = Permission(action=action)
        if constraint_must:
            permission.constraint_must = constraint_must.split(',')
        if constraint_must_not:
            permission.constraint_must_not = constraint_must_not.split(',')
        permission.save()
        print(f"Permission {action} has been created.")
    except Exception as e:
        print(f"Error creating permission: {e}")

'''
This command ensures that all basket items are reflected in the record data.
It also removes baskets whose ownership can no longer be ascertained (e.g., in 
case a user is deleted without clearing their basket first.)
'''
@app.cli.command('align-baskets')
def align_baskets():
    from dlx import DB
    from dlx_rest.models import Basket, User
    import mongoengine

    for b in Basket.objects:
        try:
            owner = b.owner.username
        except mongoengine.errors.DoesNotExist:
            # The user doesn't exist anymore, so we should delete this basket in case it has any records in it
            b.delete()
        except error as e:
            raise e

        print("Aligning basket for", owner)
        for i in b.items:
            print("\tSetting", i['collection'], i['record_id'])
            getattr(DB, i['collection']).update_one(
                {'_id': int(i['record_id'])},
                {'$set': {'basket': owner}}
            )
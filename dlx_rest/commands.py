from dlx_rest.app import app
from dlx_rest.models import User, Role, Permission, Constraint
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
#@click.argument('password', required=False, default=None)
#@click.argument('role', required=False, default='user')
def create_user(email):
    my_password = generate_password()
    try:
        user = User(email=email)
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

@app.cli.command('init-roles')
def init_roles():
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
    Constraint.drop_collection()
    '''
    print("Setting up global admin role.")
    r = Role(name='admin')
    for a in ['create','read','update','delete']:
        for comp in ['Admin', 'User', 'Role', 'Permission', 'File', 'Record']:
            this_p = Permission(action=f'{a}{comp}')
            this_p.save()
    for p in Permission.objects:
        r.permissions.append(p)
    r.save()
    '''
    # Collection and Location Constraints
    for coll in ["bibs","auths","files"]:
        col_c = Constraint(name=f'constraint-{coll}', collection=coll)
        col_c.save()
        for c in [{'loc': 'NY', 'code': 'NNUN'}, {'loc': 'GE', 'code': 'SzGeBNU'}]:
            this_c = Constraint(name=f'constraint-{coll}-{c["loc"]}', collection=coll, field='040', subfield='a', value=c['code'])
            this_c.save()

    # Global Administrator permissions
    for a in ['create','read','update','delete']:
        for comp in ['Admin', 'User', 'Role', 'Permission', 'File', 'Record']:
            this_p = Permission(action=f'{a}{comp}')
            this_p.save()
    
    # Collection and location permissions
    for a in ['create','read','update','delete']:
        for comp in ['File', 'Record']:
            for coll in ["bibs", "auths", "files"]:    
                col_p = Permission(action=f'{a}{comp}')
                #col_p.constraint_must.append(Constraint(collection=coll))
                col_p.constraint_must = list(filter(lambda x: x['collection'] == coll and not x['field'], Constraint.objects))
                col_p.save()
                for loc in ['NNUN', 'SzGeBNU']:
                    if comp == "File" or comp == "Record":
                        loc_p = Permission(action=f'{a}{comp}')
                        #loc_p.constraint_must.append(Constraint(collection=coll, field='040', subfield='a', value=loc))
                        loc_p.constraint_must = list(filter(lambda x: x['collection'] == coll and x['field'] == '040' and x['value'] != loc, Constraint.objects))
                        loc_p.save()

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

    print("Resetting roles for existing users.")
    for user_role in user_roles:
        user = User.objects.get(email=user_role['email'])
        user.roles = []
        user.save()
        user.reload()
        for role in user_role['roles']:
            user.add_role_by_name(role.name)
        user.save()

    print('''
Done. If none of the original users were admin users, you should use the make-admin 
command to associate at least one user with an admin account.
    ''')
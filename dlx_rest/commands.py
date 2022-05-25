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

    
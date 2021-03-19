# Imports from requirements.txt
from flask import url_for, Flask, abort, g, jsonify, request, redirect, render_template, flash
from flask_login import LoginManager, current_user, login_user, login_required, logout_user
from mongoengine import connect, disconnect
from datetime import datetime
import json, requests

#Local app imports
from dlx_rest.app import app, login_manager
from dlx_rest.config import Config
from dlx_rest.models import User, SyncLog, Permission, Role, requires_permission, register_permission
from dlx_rest.forms import LoginForm, RegisterForm, CreateUserForm, UpdateUserForm, CreateRoleForm, UpdateRoleForm
from dlx_rest.utils import is_safe_url

# Main app routes
@app.route('/')
def index():
    return render_template('index.html', title="Home")

# Authentication
@login_manager.user_loader
def load_user(id):
    # To do: make an init script that creates an admin user
    # Also make a test for this
    try:
        user = User.objects.get(id=id)
    except:
        return False
    # Hopefully this re-generates every 10 minutes of activity...
    user.token = user.generate_auth_token().decode('UTF-8')
    return user

@app.route('/login', methods=['GET','POST'])
def login():
    next_url = request.args.get('next')
    form = LoginForm()

    if current_user.is_authenticated:
        if not is_safe_url(request, next_url):
            return abort(400)
        flash("Already authenticated")
        return redirect(next_url or url_for('index'), code=302)
    if request.method == 'POST':
        next_url = request.args.get('next')
        if Config.TESTING:
            # Special case for testing environments. 
            user = User.objects(email=form.email.data).first()
            password = form.password.data
            if user and user.check_password(password):
                login_user(user, remember=form.remember_me.data)
                if not is_safe_url(request, next_url):
                    return abort(400)
                flash('Logged in successfully.')
                return redirect(next_url or url_for('index'), code=302)
            else:
                flash('Invalid username or password.')
                return redirect(url_for('login'), code=302)
        if form.validate_on_submit():
            user = User.objects(email=form.email.data).first()
            password = form.password.data
            if user and user.check_password(password):
                login_user(user, remember=form.remember_me.data)
                if not is_safe_url(request, next_url):
                    return abort(400)
                flash('Logged in successfully.')
                return redirect(next_url or url_for('index'), code=302)
            else:
                flash('Invalid username or password.')
                return redirect(url_for('login'), code=302)
        else:
            flash("Unable to validate the form.")
            return redirect(url_for('login'), code=302)
    #flash("Login first.")
    return render_template('login.html', title='Sign In', form=form)

@app.route('/logout')
def logout():
    logout_user()
    flash("Logged out successfully.")
    return redirect(url_for('login'))


# Admin section
@app.route('/admin')
@login_required
@requires_permission(register_permission('readAdmin'))
def admin_index():
    return render_template('admin/index.html', title="Admin")

@app.route('/admin/sync_log')
@login_required
@requires_permission(register_permission('readSync'))
def get_sync_log():
    items = SyncLog.objects().order_by('-time')
    return render_template('admin/sync_log.html', title="Sync Log", items=items)

# Users Admin
# Not sure if we should make any of this available to the API
@app.route('/admin/users')
@login_required
@requires_permission(register_permission('readUser'))
def list_users():
    users = User.objects
    return render_template('admin/users.html', title="Users", users=users)

@app.route('/admin/users/new', methods=['GET','POST'])
@login_required
@requires_permission(register_permission('createUser'))
def create_user():
    # To do: add a create user form; separate GET and POST
    form = CreateUserForm()
    form.roles.choices = [(r.id, r.id) for r in Role.objects()]
    if request.method == 'POST':
        email = request.form.get('email')
        roles = form.roles.data
        password = request.form.get('password')
        created = datetime.now()

        user = User(email=email, created=created)
        user.set_password(password)
        for role in roles:
            print(role)
            try:
                r = Role.objects.get(name=role)
                user.roles.append(r)
            except:
                pass
        # This still allows submission of a blank user document. We need more validation.
        try:
            user.save(validate=True)
            flash("The user was created successfully.")
            return redirect(url_for('list_users'))
        except:
            raise
            flash("An error occurred trying to create the user. Please review the information and try again.")
            return redirect(url_for('create_user'))
    else:
        return render_template('admin/createuser.html', title="Create User", form=form)

@app.route('/admin/users/<id>/edit', methods=['GET','POST'])
@login_required
@requires_permission(register_permission('updateUser'))
def update_user(id):
    try:
        user = User.objects.get(id=id)
    except IndexError:
        flash("The user was not found.")
        return redirect(url_for('list_users'))

    form = UpdateUserForm()
    form.roles.choices = [(r.id, r.id) for r in Role.objects()]
    form.roles.process_data([r.id for r in user.roles])

    if request.method == 'POST':
        user = User.objects.get(id=id)
        email = request.form.get('email', user.email)
        roles = request.form.getlist('roles')

        user.email = email  #unsure if this is a good idea
        user.roles = []
        for role in roles:
            print(role)
            try:
                r = Role.objects.get(name=role)
                user.roles.append(r)
            except:
                pass
        user.updated = datetime.now()
        
        try:
            user.save(validate=True)
            flash("The user was updated successfully.")
            return redirect(url_for('list_users'))
        except:
            flash("An error occurred trying to update the user. Please review the information and try again.")
            raise
            return render_template('admin/edituser.html', title="Edit User", user=user, form=form)
    else:
        return render_template('admin/edituser.html', title="Edit User", user=user, form=form)

@app.route('/admin/users/<id>/delete')
@login_required
@requires_permission(register_permission('deleteUser'))
def delete_user(id):
    user = User.objects.get(id=id)
    if user:
        user.delete()
        flash("User was deleted successfully.")
    else:
        flash("The user could not be found.")

    return redirect(url_for('list_users'))

'''Roles and permissions admin'''
@app.route('/admin/roles', methods=['GET'])
@login_required
@requires_permission(register_permission('readRole'))
def get_roles():
    roles = Role.objects
    return render_template('admin/roles.html', title="Roles", roles=roles)

@app.route('/admin/roles/new', methods=['GET', 'POST'])
@login_required
@requires_permission(register_permission('createRole'))
def create_role():
    form = CreateRoleForm()
    form.permissions.choices = [(p.action, p.action) for p in Permission.objects()]
    if request.method == 'POST':
        name = request.form.get('name')
        permissions = request.form.getlist('permissions')

        role = Role(name=name)
        role.permissions = []
        for permission in permissions:
            print(permission)
            try:
                p = Permission.objects.get(action=permission)
                role.permissions.append(p)
            except:
                pass

        try:
            role.save(validate=True)
            flash("The role was created successfully.")
            return redirect(url_for('get_roles'))
        except:
            flash("An error occurred trying to create the role. Please review the information and try again.")
            return redirect(url_for('create_role'))
    else:
        return render_template('admin/createrole.html', title="Create Role", form=form)


@app.route('/admin/roles/<id>', methods=['GET', 'POST'])
@login_required
@requires_permission(register_permission('updateRole'))
def update_role(id):
    try:
        role = Role.objects.get(name=id)
    except IndexError:
        flash("The role was not found.")
        return redirect(url_for('list_rolees'))

    form = UpdateRoleForm()
    form.permissions.choices = [(p.action, p.action) for p in Permission.objects()]
    form.permissions.process_data([p.action for p in role.permissions])

    if request.method == 'POST':
        role = Role.objects.get(name=id)
        name = request.form.get('name', role.name)
        permissions = request.form.getlist('permissions')

        role.permissions = []
        for permission in permissions:
            try:
                p = Permission.objects.get(action=permission)
                role.permissions.append(p)
            except:
                pass
        
        try:
            role.save(validate=True)
            print("I am here")
            flash("The role was updated successfully.")
            return redirect(url_for('get_roles'), 302)
        except:
            flash("An error occurred trying to update the role. Please review the information and try again.")
            raise
            return render_template('admin/editrole.html', title="Update Role", role=role, form=form)
    else:
        return render_template('admin/editrole.html', title="Update Role", form=form, role=role)

@app.route('/admin/roles/<id>/delete')
@login_required
@requires_permission(register_permission('deleteRole'))
def delete_role(id):
    role = Role.objects.get(name=id)
    if role:
        role.delete()
        flash("Role was deleted successfully.")
    else:
        flash("The role could not be found.")
    return redirect(url_for('get_roles'))

'''
Permissions aren't included here because they are created in the course of 
defining new routes. Their only purpose in the database is to be visibile to the
user interface and for assignment to specific roles.
'''

# Records: Need a list of the routes necessary.
@app.route('/records/<coll>')
def get_records_list(coll):
    '''Collect arguments'''
    limit = request.args.get('limit', 10)
    sort = request.args.get('sort', 'updated')
    direction = request.args.get('direction', 'desc')
    start = request.args.get('start', 0)
    search = request.args.get('search', '')

    endpoint = url_for('api_records_list', collection=coll, start=start, limit=limit, sort=sort, direction=direction, search=search, _external=True, format='brief')
    data = requests.get(endpoint).json()
    records = []
    for r in data['results']:
        if coll == 'bibs':
            second_line = []
            if len(r['symbol']) > 1:
                second_line.append(r['symbol'])
            if len(r['date']) > 1:
                second_line.append(r['date'])
            if len(r['types']) > 1:
                second_line.append(r['types'])
            record = {
                'id': r['_id'],
                'title_line': r['title'],
                'second_line': " | ".join(second_line)
            }
            records.append(record)
        elif coll == 'auths':
            second_line = []
            if len(r['alt']) > 1:
                second_line.append(r['alt'])
            record = {
                'id': r['_id'],
                'title_line': r['heading'],
                'second_line': " | ".join(second_line)
            }
            records.append(record)
    
    return render_template('list_records.html', coll=coll, records=records, start=start, limit=limit, sort=sort, direction=direction, search=search)

@app.route('/records/<coll>/search')
def search_records(coll):
    '''Collect arguments'''
    limit = request.args.get('limit', 10)
    sort = request.args.get('sort', 'updated')
    direction = request.args.get('direction', 'desc')
    start = request.args.get('start', 0)
    q = request.args.get('q', '')

    endpoint = url_for('api_records_list', collection=coll, start=start, limit=limit, sort=sort, direction=direction, search=q, _external=True, format='brief')
    data = requests.get(endpoint).json()
    records = []
    for r in data['results']:
        if coll == 'bibs':
            second_line = []
            if len(r['symbol']) > 1:
                second_line.append(r['symbol'])
            if len(r['date']) > 1:
                second_line.append(r['date'])
            if len(r['types']) > 1:
                second_line.append(r['types'])
            record = {
                'id': r['_id'],
                'title_line': r['title'],
                'second_line': " | ".join(second_line)
            }
            records.append(record)
        elif coll == 'auths':
            second_line = []
            if len(r['alt']) > 1:
                second_line.append(r['alt'])
            record = {
                'id': r['_id'],
                'title_line': r['heading'],
                'second_line': " | ".join(second_line)
            }
            records.append(record)
    
    return render_template('list_records.html', coll=coll, records=records, start=start, limit=limit, sort=sort, direction=direction, q=q)


@app.route('/records/<coll>/<id>', methods=['GET'])
def get_record_by_id(coll,id):
    this_prefix = url_for('doc', _external=True)
    return render_template('record.html', coll=coll, record_id=id, prefix=this_prefix)

@app.route('/records/<coll>/new')
@login_required
def create_record(coll):
    return render_template('record.html')
# Imports from requirements.txt
from flask import url_for, Flask, abort, g, jsonify, request, redirect, render_template, flash
from flask_login import LoginManager, current_user, login_user, login_required, logout_user
from mongoengine import connect, disconnect
from datetime import datetime
import json, requests
#import dlx_dl

#Local app imports
from dlx_rest.app import app, login_manager
from dlx_rest.config import Config
from dlx_rest.models import User, SyncLog
from dlx_rest.forms import LoginForm, RegisterForm, CreateUserForm, UpdateUserForm
from dlx_rest.utils import is_safe_url

connect(host=Config.connect_string,db=Config.dbname)



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


# Main app routes
@app.route('/')
def index():
    return render_template('index.html', title="Home")

# Users
# Registration in case we need it.
'''
@app.route('/register', methods=['GET','POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        email = request.form.get('email')
        password = request.form.get('password')
        created = datetime.now()
        user = User(email=email, created=created)
        user.set_password(password)
        try:
            user.save(validate=True)
            flash("Registration was successful.")
            return redirect(url_for('login'))
        except:
            flash("An error occurred during registration. Please review the information and try again.")
            return redirect(url_for('register'))
    return render_template('register.html', title="Register", form=form)
'''

@app.route('/login', methods=['GET','POST'])
def login():
    next_url = request.args.get('next')
    if current_user.is_authenticated:
        if not is_safe_url(request, next_url):
            return abort(400)
        return redirect(next_url or url_for('index'))
    form = LoginForm()
    if request.method == 'POST':
        next_url = request.args.get('next')
        if form.validate_on_submit():
            user = User.objects(email=form.email.data).first()
            password = form.password.data
            if user and user.check_password(password):
                login_user(user, remember=form.remember_me.data)
                flash('Logged in successfully.')
                print(next_url)
                if not is_safe_url(request, next_url):
                    return abort(400)
                return redirect(next_url or url_for('index'))
            else:
                flash('Invalid username or password.')
                return render_template('login.html', title='Sign In', form=form)
    return render_template('login.html', title='Sign In', form=form)

@app.route('/logout')
#@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


# Admin section
@app.route('/admin')
@login_required
def admin_index():
    return render_template('admin/index.html', title="Admin")

@app.route('/admin/sync_log')
@login_required
def get_sync_log():
    items = SyncLog.objects().order_by('-time')
    return render_template('admin/sync_log.html', title="Sync Log", items=items)

'''
@app.route('/admin/_sync')
@login_required
'''

# Users Admin
# Not sure if we should make any of this available to the API
@app.route('/admin/users')
@login_required
def list_users():
    users = User.objects
    return render_template('admin/users.html', title="Users", users=users)

@app.route('/admin/users/new', methods=['GET','POST'])
@login_required
def create_user():
    # To do: add a create user form; separate GET and POST
    form = CreateUserForm()
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        created = datetime.now()

        user = User(email=email, created=created)
        user.set_password(password)
        # This still allows submission of a blank user document. We need more validation.
        try:
            user.save(validate=True)
            flash("The user was created successfully.")
            return redirect(url_for('list_users'))
        except:
            flash("An error occurred trying to create the user. Please review the information and try again.")
            return redirect(url_for('create_user'))
    else:
        return render_template('admin/createuser.html', title="Create User", form=form)

@app.route('/admin/users/<id>/edit', methods=['GET','POST'])
@login_required
def update_user(id):
    try:
        user = User.objects.get(id=id)
    except IndexError:
        flash("The user was not found.")
        return redirect(url_for('list_users'))

    form = UpdateUserForm()

    if request.method == 'POST':
        user = User.objects.get(id=id)
        email = request.form.get('email', user.email)
        password = request.form.get('password')
        admin = request.form.get('admin', user.admin)

        user.email = email  #unsure if this is a good idea
        user.updated = datetime.now()
        if admin:
            user.admin = True
        else:
            user.admin = False
        user.set_password(password)

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
def delete_user(id):
    user = User.objects.get(id=id)
    if user:
        user.delete()
        flash("User was deleted successfully.")
    else:
        flash("The user could not be found.")

    return redirect(url_for('list_users'))

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
    
    return render_template('list_records.html', coll=coll, records=data['results'], start=start, limit=limit, sort=sort, direction=direction, search=search)

@app.route('/records/<coll>/search')
def search_records(coll):
    '''Collect arguments'''
    limit = request.args.get('limit', 10)
    sort = request.args.get('sort', 'updated')
    direction = request.args.get('direction', 'desc')
    start = request.args.get('start', 0)
    q = request.args.get('q', '')

    endpoint = url_for('api_records_list', collection=coll, start=start, limit=limit, sort=sort, direction=direction, search=q, _external=True, format='brief')
    print(endpoint)
    records_data = requests.get(endpoint).json()
    records = []
    try:
        for url, symbol, title, date in records_data["results"]:
            rid = url.split("/")[-1]
            record = {
                'id': rid,
                'symbol': symbol,
                'title': title,
                'date': date
            }
            records.append(record)
    except:
        pass

    return render_template('list_records.html', coll=coll, records=records, start=start, limit=limit, sort=sort, direction=direction, q=q)

@app.route('/records/<coll>/<id>', methods=['GET'])
def get_record_by_id(coll,id):
    return render_template('record.html', coll=coll, record_id=id)

@app.route('/records/<coll>/new')
@login_required
def create_record(coll):
    return render_template('record.html')

'''
@app.route('/records/<coll>/<id>/edit', methods=['GET'])
#@login_required
def edit_record_by_id(coll, id):
    pass
'''
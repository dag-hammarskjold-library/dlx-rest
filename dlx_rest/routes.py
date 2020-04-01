# Imports from requirements.txt
from flask import url_for, Flask, abort, g, jsonify, request, redirect, render_template, flash
from flask_login import LoginManager, current_user, login_user, login_required, logout_user
from mongoengine import connect, disconnect
from datetime import datetime

#Local app imports
from dlx_rest.app import app
from dlx_rest.config import Config
from dlx_rest.models import User
from dlx_rest.forms import LoginForm, RegisterForm, CreateUserForm
from dlx_rest.utils import is_safe_url

connect(host=Config.connect_string,db=Config.dbname)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
login_manager.login_message =""

@login_manager.user_loader
def load_user(id):
    # To do: make an init script that creates an admin user
    # Also make a test for this
    return User.objects.get(id=id)


# Main app routes
@app.route('/')
def index():
    return render_template('index.html')

# Users
@app.route('/register')
def register():
    # To do: add a register form
    return render_template('register.html')

@app.route('/login', methods=['GET','POST'])
def login():
    # To do: add a login form
    if current_user.is_authenticated:
        return redirect(request.referrer)
    form = LoginForm()
    if form.validate_on_submit():
        login_user(user)
        flash('Logged in successfully.')
        next_url = request.args.get('next')
        if not is_safe_url(next_url):
            return abort(400)

        return redirect(next_url or url_for('index'))
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


# Users Admin
# Not sure if we should make any of this available to the API
@app.route('/users')
#@login_required
def list_users():
    users = User.objects
    return render_template('users.html', users=users)

@app.route('/users/new', methods=['GET','POST'])
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
        return render_template('createuser.html', form=form)

@app.route('/users/<id>/edit', methods=['GET','POST'])
@login_required
def update_user(id):
    try:
        user = User.objects.get(id=id)
    except IndexError:
        flash("The user was not found.")
        return redirect(url_for('list_users'))

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user.email = email  #unsure if this is a good idea
        user.updated = datetime.now()
        user.set_password(password)

        try:
            user.save(validate=True)
            flash("The user was updated successfully.")
            return redirect(url_for('list_users'))
        except:
            flash("An error occurred trying to create the user. Please review the information and try again.")
            return render_template('edituser.html',user=user)
    else:
        return render_template('edituser.html',user=user)

@app.route('/users/<id>/delete', methods=['POST'])
@login_required
def delete_user(id):
    user = User.objects.get(id=id)
    if user:
        user.delete()
        flash("User was deleted successfully.")
    else:
        flash("The user could not be found.")

    return redirect(request.referrer)


# Records: Need a list of the routes necessary.
@app.route('/records/<coll>')
def get_records_list(coll):
    return render_template('list_records.html', coll=coll)

@app.route('/records/<coll>/<id>', methods=['GET'])
def get_record_by_id(coll,id):
    return render_template('record.html', coll=coll, id=id)

'''
@app.route('/records/<coll>/<id>/edit', methods=['GET'])
#@login_required
def edit_record_by_id(coll, id):
    pass
'''
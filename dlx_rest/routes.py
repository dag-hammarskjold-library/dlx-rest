from flask import url_for, Flask, abort, g, jsonify, request, redirect
from flask_login import LoginManager, current_user, login_user, login_required, logout_user
from mongoengine import connect,disconnect
from dlx_rest.app import app
from dlx_rest.config import Config
from dlx_rest.models import User

connect(host=Config.connect_string,db=Config.dbname)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
login_manager.login_message =""

# Main app routes
@app.route('/')
def index():
    return f'Index'

@login_manager.user_loader
def load_user(id):
    return User.objects.get(id=id)

# Users
@app.route('/register')
def register():
    pass

@app.route('/login')
def login():
    """ Default route of the application (Login) """
    if current_user.is_authenticated:
        return redirect(request.referrer)
    else:
        return render_template('login.html')
    '''
    form = LoginForm()
    if form.validate_on_submit():
        user = Itpp_user.objects(email=form.email.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        return redirect(url_for('main'))
    return render_template('login.html', title='Sign In', form=form)
    '''

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
    print(users)
    if users:
        return jsonify(users)
    else:
        return f'None'

@app.route('/users/new', methods=['GET','POST'])
@login_required
def create_user():
    pass

@app.route('/users/<id>/edit', methods=['GET','POST'])
@login_required
def update_user(id):
    pass

@app.route('/users/<id>/delete', methods=['POST'])
@login_required
def delete_user(id):
    pass


# Records: Need a list of the routes necessary.
@app.route('/records/<coll>')
def get_records_list(coll):
    pass

@app.route('/records/<coll>/<id>', methods=['GET'])
def get_record_by_id(coll,id):
    pass

'''
@app.route('/records/<coll>/<id>/edit', methods=['GET'])
#@login_required
def edit_record_by_id(coll, id):
    pass
'''
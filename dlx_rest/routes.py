from functools import wraps
from flask import url_for, Flask, abort, g, jsonify, request
from urllib import request as web_request
from jose import jwt
from dlx_rest.app import app
from dlx_rest.models import User

# Utility Functions
def authentication_required(view):
    '''
    Use this to wrap your authenticated functions.
    '''
    @wraps(view)
    def wrap(*args, **kwargs):
        token = request.headers.get('Authorization')
        auth_error = (jsonify({'message': 'User not loggeed in. Please authenticate.'}))

        if not token:
            return auth_error
        
        user = get_identity(token)

        if user:
            request.user = user
            return view(*args, **kwargs)
        else:
            return auth_error
    return wrap

def get_identity(jwt_token):
    payload = decode_token(jwt_token)
    user = User.objects(username=payload['cognito:username']).first()
    if not user:
        new_user = User(username=payload['cognito:username'])
        new_user.save()
        user = User.objects(username=payload['cognito:username']).first()
    return user

def decode_token(jwt_token):
    # To do: set up Cognito pool and add it to config
    jwks = web_request.urlopen(Config.cognito_pool_id + '/.well-known/jwks.json')
    issuer = Config.cognito_pool_url + '/' + Config.cognito_pool_id
    audience = Config.cognito_client_id

    payload = jwt.decode(
        jwt_token,
        jwks.read(),
        algorithms=['RS256'],
        audience=audience,
        issuer=issuer,
        options={'verify_at_hash': False}
    )

    return payload


# Main app routes
@app.route('/')
def index():
    pass


# Users
@app.route('/register')
def register():
    pass

@app.route('/login')
def login():
    pass

@app.route('/logout')
#@authentication_required
def logout():
    pass


# Users Admin
# Not sure if we should make any of this available to the API
@app.route('/users')
#@authentication_required
def list_users():
    pass

@app.route('/users/new', methods=['GET','POST'])
#@authentication_required
def create_user():
    pass

@app.route('/users/<id>/edit', methods=['GET','POST'])
#@authentication_required
def update_user(id):
    pass

@app.route('/users/<id>/delete', methods=['POST'])
#@authentication_required
def delete_user(id):
    pass


# Records: Need a list of the routes necessary.
@app.route('/records/<coll>')
def get_records_list(coll):
    pass

@app.route('/records/<coll>/<id>', methods=['GET'])
def get_record_by_id(coll,id):
    pass

@app.route('/records/<coll>/<id>/edit', methods=['GET'])
#@authentication_required
def edit_record_by_id(coll, id):
    pass
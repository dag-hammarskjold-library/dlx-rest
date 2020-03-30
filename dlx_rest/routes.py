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
        auth_error = (jsonify())

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



# Main app routes
@app.route('/')
def index():
    return jsonify({"foo": "bar"})


# Users
@app.route('/register')
def register():
    return jsonify({"foo": "bar"})

@app.route('/login')
def login():
    return jsonify({"foo": "bar"})

@app.route('/logout')
@authentication_required
def logout():
    return jsonify({"foo": "bar"})



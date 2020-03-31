from functools import wraps
from flask import url_for, Flask, abort, g, jsonify, request, redirect
from urllib import request as web_request
from jose import jwt
from dlx_rest.app import app
from dlx_rest.config import Config
from dlx_rest.models import User

# To do: 
# Implement flask-login
# Implement an authentication_required wrapper for flask-login

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
    return redirect(aws_auth.get_sign_in_url())

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
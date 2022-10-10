from flask import Flask, Response, url_for, jsonify, abort as flask_abort, session
#from flask_restx import Resource, Api, reqparse
from flask_login import LoginManager
from pymongo import ASCENDING as ASC, DESCENDING as DESC
from mongoengine import connect, disconnect
from flask_cors import CORS
from dlx import DB
from dlx.marc import BibSet, Bib, AuthSet, Auth
from dlx_rest.config import Config

#DB.connect(Config.connect_string)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
login_manager.login_message =""

connect(host=Config.connect_string,db=Config.dbname)
DB.connect(Config.connect_string)

try:
    app.secret_key=Config.secret_key
except AttributeError:
    app.secret_key='top secret!'

# Main app routes
from dlx_rest.routes import *

# Load the API route
from dlx_rest.api import api

# Load the commands
from dlx_rest.commands import *
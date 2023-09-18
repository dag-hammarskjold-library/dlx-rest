from flask import Flask, Response, url_for, jsonify, abort as flask_abort, session
#from flask_restx import Resource, Api, reqparse
from flask_login import LoginManager
from mongoengine import connect, disconnect
from flask_cors import CORS
from dlx import DB
from dlx_rest.config import Config
import certifi, sentry_sdk
#DB.connect(Config.connect_string)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
login_manager.login_message =""

# dlx connect
DB.connect(Config.connect_string, database=Config.dbname)

sentry_sdk.init(
    dsn="https://59d4551b9d8744f180a98776d8fe3422@o4504922831060992.ingest.sentry.io/4504922841939968",

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0,
)
# mongoengine connect
if Config.ssl:
    connect(host=Config.connect_string,db=Config.dbname, tlsCAFile=certifi.where())
else:
    connect(host=Config.connect_string,db=Config.dbname)

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
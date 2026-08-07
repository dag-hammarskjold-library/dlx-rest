from flask import Flask, Response, url_for, jsonify, abort as flask_abort, session, send_from_directory
#from flask_restx import Resource, Api, reqparse
from flask_login import LoginManager
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.middleware.proxy_fix import ProxyFix
from mongoengine import connect, disconnect
from mongomock import MongoClient as MockClient
from flask_cors import CORS
from dlx import DB
from dlx_rest.config import Config
import certifi, sentry_sdk
import mimetypes
import os

# Add .mjs MIME type
mimetypes.add_type('application/javascript', '.mjs')

app = Flask(__name__)
app.config.from_object(Config)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
CORS(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
login_manager.login_message =""

# Custom route for .mjs files
@app.route('/static/js/<path:filename>')
def serve_mjs(filename):
    if filename.endswith('.mjs'):
        return send_from_directory(os.path.join(app.root_path, 'static', 'js'),
                                 filename,
                                 mimetype='application/javascript')
    return send_from_directory(os.path.join(app.root_path, 'static', 'js'), filename)


# dlx connect
DB.connect(Config.connect_string, database=Config.dbname)

# mongoengine connect
if Config.ssl:
    connect(host=Config.connect_string, db=Config.dbname, tlsCAFile=certifi.where())
else:
    if 'mongomock://' in Config.connect_string:
        # mongoengine noew requires connect to mock db using `mongo_client_class`
        connect('testing', host='mongodb://localhost', mongo_client_class=MockClient)
    else:
        connect(host=Config.connect_string, db=Config.dbname)

try:
    app.secret_key=Config.secret_key
except AttributeError:
    app.secret_key='top secret!'

# Dummy root routes for deployment environments
prod_app = DispatcherMiddleware(Flask('dummy_root'), {
    '/editor': app,
})
dev_app = DispatcherMiddleware(Flask('dummy_root'), {
    '/dev-editor': app,
})
uat_app = DispatcherMiddleware(Flask('dummy_root'), {
    '/uat-editor': app,
})

# Main app routes
from dlx_rest.routes import *

# Load the API route
from dlx_rest.api import api

# Load the commands
from dlx_rest.commands import *
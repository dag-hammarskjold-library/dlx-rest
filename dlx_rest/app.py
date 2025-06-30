from flask import Flask, Response, url_for, jsonify, abort as flask_abort, session, send_from_directory
#from flask_restx import Resource, Api, reqparse
from flask_login import LoginManager
from werkzeug.middleware.dispatcher import DispatcherMiddleware
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

try: 
    sentry_dsn = Config.sentry_dsn
    # Sentry setup
    sentry_sdk.init(
        dsn=sentry_dsn,
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        traces_sample_rate=1.0,
        # Set profiles_sample_rate to 1.0 to profile 100%
        # of sampled transactions.
        # We recommend adjusting this value in production.
        profiles_sample_rate=1.0,
    )

    @app.context_processor
    def inject_sentry_url():
        return dict(sentry_js_url = Config.sentry_js_url)
except AttributeError:
    pass


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

# Dummy root routes for dev and uat environments
dev_app = DispatcherMiddleware(Flask('dummy_root'), {
    '/dev-editor': app,
})
uat_app = DispatcherMiddleware(Flask('dummy_root'), {
    '/uat-editor': app,
})

dev_app.config['PREFERRED_URL_SCHEME'] = 'https'
uat_app.config['PREFERRED_URL_SCHEME'] = 'https'

# Main app routes
from dlx_rest.routes import *

# Load the API route
from dlx_rest.api import api

# Load the commands
from dlx_rest.commands import *
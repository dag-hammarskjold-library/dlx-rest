from flask import Flask, Response, url_for, jsonify, abort as flask_abort
from flask_restx import Resource, Api, reqparse
from pymongo import ASCENDING as ASC, DESCENDING as DESC
from flask_cors import CORS
from dlx import DB
from dlx.marc import BibSet, Bib, AuthSet, Auth
from dlx_rest.config import Config

DB.connect(Config.connect_string)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Main app routes
from dlx_rest.routes import *

# Load the API route
from dlx_rest.api import api



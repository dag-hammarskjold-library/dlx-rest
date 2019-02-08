from flask import Flask, render_template, jsonify, request, redirect, abort, Response
from .config import DevelopmentConfig
from bson.objectid import ObjectId
from bson.json_util import dumps, loads
from jsonpath_ng import jsonpath, parse
from pymarc import JSONReader, Record
from marctools.pymarcer import make_json
from jinja2 import filters
from flask_restful import Resource, Api
from .api import Root, AuthoritiesList, BibsList, Authority, Bib
import json, bson

app = Flask(__name__)
api = Api(app)

# REST API routes defined in api.py
api.add_resource(Root, '/api')
api.add_resource(AuthoritiesList, '/api/auths')
api.add_resource(Authority, '/api/auths/<int:identifier>')
api.add_resource(BibsList, '/api/bibs')
api.add_resource(Bib, '/api/bibs/<int:identifier>')


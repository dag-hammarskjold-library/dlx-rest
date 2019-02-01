from flask import Flask, render_template, jsonify, request, redirect, abort, Response
from .config import DevelopmentConfig
from bson.objectid import ObjectId
from bson.json_util import dumps, loads
from jsonpath_ng import jsonpath, parse
from pymarc import JSONReader, Record
from marctools.pymarcer import make_json
from jinja2 import filters
from flask_restful import Resource, Api
from .api.auths import AuthoritiesList, Authority
from .api.bibs import BibsList, Bib
import json, bson

app = Flask(__name__)
api = Api(app)

config = DevelopmentConfig
collections = config.collections
formats = config.formats
rpp = config.RPP

class Root(Resource):
    def get(self):
        return_collections = []
        for c in collections:
            return_collections.append(c)
        return return_collections

api.add_resource(Root, '/')
api.add_resource(AuthoritiesList, '/api/auths')
api.add_resource(Authority, '/api/auths/<int:identifier>')
api.add_resource(BibsList, '/api/bibs')
api.add_resource(Bib, '/api/bibs/<int:identifier>')
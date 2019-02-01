"""
API
====================================
The core module of the API.
"""
from flask_restful import Resource
from datamanager.config import DevelopmentConfig

collections = DevelopmentConfig.collections

class Root(Resource):
    """ Return a list of the other endpoints. """
    def get(self):
        return_collections = []
        for c in collections:
            return_collections.append(c)
        return return_collections
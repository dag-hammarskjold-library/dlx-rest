"""
This is the auths module and supports all the defined ReST actions for the
Authority Data collection
"""

from flask import make_response, abort
from marctools.pymarcer import make_json
from pymarc import JSONReader
from datamanager.config import DevelopmentConfig
from flask_restful import Resource, reqparse

config = DevelopmentConfig
auths = config.collections['auth']
parser = reqparse.RequestParser()
parser.add_argument('rpp')

class AuthoritiesList(Resource): 
    """
    This returns a list of Authority Records.
    The limit can be increased or decreased with the rpp query parameter.
    """
    def get(self):
        args = parser.parse_args()
        try:
            rpp = int(args['rpp'])
        except TypeError:
            rpp = 10
        records = auths['name'].find({}).limit(rpp)
        return_records = []
        for record in records:
            return_records.append(str(record['_id']))
        return return_records

class Authority(Resource):
    """
    This returns a JSON serialization of a MARC Authority Record identified by the given identifier.
    """
    def get(self, identifier):
        found_record = auths['name'].find_one({'_id': identifier})
        if found_record is None:
            abort(404)
        pm = make_json(found_record)
        reader = JSONReader(pm)
        for record in reader:
            record.force_utf8 = True
            return record.as_dict()
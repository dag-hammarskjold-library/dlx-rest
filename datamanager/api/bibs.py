"""
This is the bibs modules and supports all the defined ReST actions for the
Bibliographic Data collection
"""

from flask import make_response, abort
from marctools.pymarcer import make_json
from pymarc import JSONReader
from datamanager.config import DevelopmentConfig
from flask_restful import Resource, reqparse

config = DevelopmentConfig
bibs = config.collections['bib']
parser = reqparse.RequestParser()
parser.add_argument('rpp')

class BibsList(Resource):
    """
    This returns a list of Bibliographic Records. 
    The limit can be increased or decreased with the rpp query parameter.
    """
    def get(self):
        args = parser.parse_args()
        try:
            rpp = int(args['rpp'])
        except TypeError:
            rpp = 10
        records = bibs['name'].find({}).limit(rpp)
        return_records = []
        for record in records:
            return_records.append(str(record['_id']))
        return return_records

class Bib(Resource):
    """
    This returns a JSON serialization of a MARC Bibliographic Record identified by the given identifier.
    """
    def get(self, identifier):
        found_record = bibs['name'].find_one({'_id': identifier})
        if found_record is None:
            abort(404)
        pm = make_json(found_record)
        reader = JSONReader(pm)
        for record in reader:
            record.force_utf8 = True
            return record.as_dict()
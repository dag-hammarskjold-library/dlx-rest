"""
API
====================================
The core module of the API.
"""

from flask import make_response, abort, url_for
from marctools.pymarcer import make_json
from pymarc import JSONReader
from datamanager.config import DevelopmentConfig
from flask_restful import Resource, reqparse
import math

# Initialize things
config = DevelopmentConfig
collections = config.collections
auths = config.collections['auth']
bibs = config.collections['bib']

# Add some arguments in case we need them
parser = reqparse.RequestParser()
parser.add_argument('limit')
parser.add_argument('start')
#parser.add_argument('jsonp')

def paginate(args):
    pages = {}
    try:
        pages['limit'] = int(args['limit'])
    except TypeError:
        pages['limit'] = 10

    try:
        pages['start'] = int(args['start'])
    except TypeError:
        pages['start'] = 0

    return pages

class Root(Resource):
    """ Return a list of the collection endpoints. """
    def get(self):
        return_data = {
            "_links": {
                "self": url_for('root', _external=True)
            },
            "collections": []
        }
        for c in collections:
            record_count = collections[c]['name'].count()
            return_data["collections"].append(
                {
                    "path": url_for(collections[c]['list_target'], _external=True),
                    "label": collections[c]['label'],
                    "records": record_count
                }
            )
        return return_data

class AuthoritiesList(Resource): 
    """
    This returns a list of Authority Records.
    The limit can be increased or decreased with the limit query parameter.
    TO DO: Paginate, Sort?, Filter?
    """
    def get(self):
        args = parser.parse_args()
        pages = paginate(args)
        records = auths['name'].find({}).skip(pages['start']).limit(pages['limit'])
        return_data = {
            "_links": {
                "self": url_for('authoritieslist', _external=True)
            },
            "limit": pages['limit'],
            "start": pages['start'],
            "size": records.count(),
            "authorities": []
        }
        
        for record in records:
            #return_data["authorities"].append(str(record['_id']))
            return_data["authorities"].append(url_for('authority',identifier=str(record['_id']), _external=True))

        previous_set = pages['start'] - pages['limit']
        if previous_set >= 0:
            # we can include a previous
            return_data['_links']['previous'] = url_for('authoritieslist', _external=True, start=previous_set, limit=pages['limit'])

        next_set = pages['start'] + pages['limit']
        if next_set < records.count():
            return_data['_links']['next'] = url_for('authoritieslist', _external=True, start=next_set, limit=pages['limit'])

        return return_data

class BibsList(Resource):
    """
    This returns a list of Bibliographic Records. 
    The limit can be increased or decreased with the limit query parameter.
    TO DO: Paginate, Sort?, Filter?
    """
    def get(self):
        args = parser.parse_args()
        pages = paginate(args)
        records = bibs['name'].find({}).skip(pages['start']).limit(pages['limit'])
        return_data = {
            "_links": {
                "self": url_for('bibslist', _external=True)
            },
            "limit": pages['limit'],
            "start": pages['start'],
            "size": records.count(),
            "bibs": []
        }
        for record in records:
            #return_records.append(str(record['_id']))
            return_data["bibs"].append(url_for('bib',identifier=str(record['_id']), _external=True))

        previous_set = pages['start'] - pages['limit']
        if previous_set >= 0:
            # we can include a previous
            return_data['_links']['previous'] = url_for('bibslist', _external=True, start=previous_set, limit=pages['limit'])

        next_set = pages['start'] + pages['limit']
        if next_set < records.count():
            return_data['_links']['next'] = url_for('bibslist', _external=True, start=next_set, limit=pages['limit'])

        return return_data

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
        return_record = {
            "_links": {
                "self": url_for('authority', identifier=identifier, _external=True),
                "authorities": []
            },
            "record": ""
        }
        for record in reader:
            record.force_utf8 = True
            return_record["record"] = record.as_dict()
            for f in record.fields:
                this_0 = f.get_subfields('0')
                for sf in this_0:
                    return_record["_links"]["authorities"].append(url_for('authority', identifier=sf, _external=True))
            return return_record


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
        return_record = {
            "_links": {
                "self": url_for('bib', identifier=identifier, _external=True),
                "authorities": []
            },
            "record": ""
        }
        for record in reader:
            record.force_utf8 = True
            return_record["record"] = record.as_dict()
            for f in record.fields:
                this_0 = f.get_subfields('0')
                for sf in this_0:
                    return_record["_links"]["authorities"].append(url_for('authority', identifier=sf, _external=True))
            return return_record
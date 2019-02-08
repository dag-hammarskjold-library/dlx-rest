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
import math, six

# Initialize things
config = DevelopmentConfig
collections = config.collections
auths = config.collections['auth']
bibs = config.collections['bib']

izip_longest = six.moves.zip_longest

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

class Listable():
    """
    Superclass for lists of records
    """
    def __init__(self, db_collection, name, endpoint, singleton, req):
        self.db_collection = db_collection
        self.req = req
        self.args = parser.parse_args(req=self.req)
        self.pages = paginate(self.args)
        self.records = db_collection.find({}).skip(self.pages['start']).limit(self.pages['limit'])
        self.data = {
            "_links": {
                "self": url_for(endpoint, _external=True)
            },
            "limit": self.pages['limit'],
            "size": self.records.count(),
            "start": self.pages['start'],
            name: []
        }

        # collect the records
        for record in self.records:
            self.data[name].append(url_for(singleton, identifier=str(record['_id']), _external=True))
        
        previous_set = self.pages['start'] - self.pages['limit']
        if previous_set >= 0:
            # we can include a previous
            self.data['_links']['previous'] = url_for(endpoint, _external=True, start=previous_set, limit=self.pages['limit'])

        next_set = self.pages['start'] + self.pages['limit']
        if next_set < self.records.count():
            self.data['_links']['next'] = url_for(endpoint, _external=True, start=next_set, limit=self.pages['limit'])

class Singleton():
    """
    Superclass for a single instance of a record
    """
    def __init__(self, db_collection, name, endpoint, identifier):
        self.db_collection = db_collection
        self.identifier = identifier
        found_record = db_collection.find_one({'_id': self.identifier})
        if found_record is None:
            abort(404)
        pm = make_json(found_record)
        reader = JSONReader(pm)
        self.data = {
            "_links": {
                "self": url_for(endpoint, identifier=self.identifier, _external=True),
                "authorities": []
            },
            name: ""
        }
        for record in reader:
            record.force_utf8 = True
            self.data["record"] = record.as_dict()
            for f in record.fields:
                this_0 = f.get_subfields('0')
                for sf in this_0:
                    self.data["_links"]["authorities"].append(url_for('authority', identifier=sf, _external=True))
            

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
    Pagination is handled via the start parameter.
    """
    def get(self):
        record_list = Listable(
            db_collection=auths['name'], 
            name='auths', 
            endpoint='authoritieslist', 
            singleton='authority', 
            req=self
        )

        return record_list.data

class BibsList(Resource):
    """
    This returns a list of Bibliographic Records. 
    The limit can be increased or decreased with the limit query parameter.
    Pagination is handled via the start parameter
    """
    def get(self):
        record_list = Listable(
            db_collection=bibs['name'], 
            name='bibs', 
            endpoint='bibslist', 
            singleton='bib', 
            req=self
        )
        return record_list.data

class Authority(Resource):
    """
    This returns a JSON serialization of a MARC Authority Record identified by the given identifier.
    """
    def get(self, identifier):
        return_record = Singleton(db_collection=auths['name'], name='record', endpoint='authority', identifier=identifier)
        return return_record.data


class Bib(Resource):
    """
    This returns a JSON serialization of a MARC Bibliographic Record identified by the given identifier.
    """
    def get(self, identifier):
        return_record = Singleton(db_collection=bibs['name'], name='record', endpoint='bib', identifier=identifier)
        return return_record.data

class BibField(Resource):
    """
    API piece to return a specific tag for a given Bibliographic Record.
    """
    def get(self, identifier, field):
        found_record = bibs['name'].find_one({'_id': identifier})
        if found_record is None:
            abort(404)
        pm = make_json(found_record)
        reader = JSONReader(pm)
        return_record = {
            "_links": {
                "self": url_for('bibfield', identifier=identifier, field=field, _external=True),
            },
            "subfields": {}
        }
        for record in reader:
            record.force_utf8 = True
            #return_record["record"] = record.as_dict()
            this_field = record[field]
            if this_field.is_control_field():
                return_record["subfields"] = this_field.data
            else:
                #return_record["data"][tags] = {}
                for t, v in izip_longest(*[iter(this_field.subfields)] * 2):
                    return_record["subfields"][t] = v

            return return_record
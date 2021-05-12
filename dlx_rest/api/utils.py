'''
DLX REST API utilities
'''

import requests, json, jsonschema
from datetime import datetime, timezone
from dlx_rest.config import Config
from dlx.marc import Bib, BibSet, Auth, AuthSet
from flask import abort as flask_abort, url_for, jsonify
from flask_restx import reqparse

class ClassDispatch():
    index = {
        'bibs': Bib,
        'auths': Auth
    }
    
    batch_index = {
        'bibs': BibSet,
        'auths': AuthSet
    }
    
    @classmethod
    def list_names(cls):
        return cls.index.keys()

    @classmethod
    def by_collection(cls, name):
        return cls.index.get(name)
        
    @classmethod
    def batch_by_collection(cls, name):
        return cls.batch_index.get(name)

class URL():
    def __init__(self, endpoint, **kwargs):
        self.endpoint = endpoint
        self.kwargs = kwargs

    def to_str(self, **kwargs):
        self.kwargs.setdefault('_external', False)
        return url_for(self.endpoint, **self.kwargs)

class RecordsListArgs():
    args = reqparse.RequestParser()
    
    args.add_argument(
        'start', 
        type=int, 
        help='Number of record results to skip for pagination. Default is 0'
    )
    args.add_argument(
        'limit', type=int,
        help='Number of results to return. Default is 100. Max is 1000'
    )
    args.add_argument(
        'sort',
        type=str,
        choices=['updated'],
        help='Valid strings are "updated"'
    )
    args.add_argument(
        'direction', type=str, 
        choices=['asc', 'desc'],
        help='Valid strings are "asc", "desc". Default is "desc"', 
    )
    args.add_argument(
        'format', 
        type=str, 
        choices=['json', 'xml', 'mrk', 'mrc', 'brief'],
        help='Formats the list as a batch of records instead of URLs. Valid formats are "json", "xml", "mrc", "mrk", "brief"'
    )
    args.add_argument(
        'search', 
        type=str, 
        help='Consult documentation for query syntax' # todo
    )

class URL():
    def __init__(self, endpoint, **kwargs):
        self.endpoint = endpoint
        self.kwargs = kwargs

    def to_str(self, **kwargs):
        self.kwargs.setdefault('_external', True)
        return url_for(self.endpoint, **self.kwargs)

class ApiResponse():
    def __init__(self, *, links, meta, data):
        self.links = links
        self.meta = meta
        self.data = data
        
        for _ in ('_prev', '_next', '_self', 'related', 'format', 'sort'):
            self.links.setdefault(_, None)
            
        for _ in ('name', 'returns'):
            assert _ in self.meta
            
        self.meta.setdefault('timestamp', datetime.now(timezone.utc))

        if Config.TESTING:
            schema = {}
        else:
            schema = json.loads(requests.get(self.meta['returns']).content)

        jsonschema.validate(instance=self.data, schema=schema, format_checker=jsonschema.FormatChecker())

    def jsonify(self):
        return jsonify(
            {
                '_links': self.links,
                '_meta': self.meta,
                'data': self.data
            }
        )
        
###

def abort(code, message=None):
    msgs = {
        400: 'Bad request',
        404: 'Requested resource not found'
    }

    flask_abort(code, message or msgs.get(code, None))
    
def brief_bib(record):
    ctypes = ['::'.join(field.get_values('a', 'b', 'c')) for field in record.get_fields('989')]
    
    if record.get_value('245', 'a'):
        head = ' '.join(record.get_values('245', 'a', 'b', 'c'))
    elif record.get_value('710', 'a'):
        head, member = record.get_value('700', 'a'), record.get_value('710', 'a')
        
        if member:
            head += f' ({member})'
    else:
        head = None

    return {
        '_id': record.id,
        'url': URL('api_record', collection='bibs', record_id=record.id).to_str(),
        'symbol': '; '.join(record.get_values('191', 'a') or record.get_values('791', 'a')),
        'title': head or '[No Title]',
        'date': record.get_value('269', 'a'),
        'types': '; '.join(ctypes)
    }


def brief_auth(record):
    digits = record.heading_field.tag[1:3]
    alt_tag = '4' + digits
    
    return {
        '_id': record.id,
        'url': URL('api_record', collection='auths', record_id=record.id).to_str(),
        'heading': '; '.join(map(lambda x: x.value, record.heading_field.subfields)),
        'alt': '; '.join(record.get_values(alt_tag, 'a'))
    }

def validate_data(record):
    if type(record) == Bib:
        if record.get_field('245') is None:
            abort(400, 'Bib field 245 is required')
    else:
        if record.heading_field is None:
            abort(400, 'Auth heading field is required')

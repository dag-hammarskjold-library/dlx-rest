'''
DLX REST API utilities
'''

import requests, json, jsonschema
from copy import deepcopy
from datetime import datetime, timezone
from dlx import Config as DlxConfig
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
        self.kwargs.setdefault('_external', True)
        return url_for(self.endpoint, **self.kwargs)

class ApiResponse():
    def __init__(self, *, links, meta, data):
        self.links = links
        self.meta = meta
        self.data = data
        
        assert '_self' in links 
        
        for _ in ('_prev', '_next', 'related', 'format', 'sort'):
            self.links.setdefault(_, None)
            
        for _ in ('name', 'returns'):
            assert _ in self.meta
            
        self.meta.setdefault('timestamp', datetime.now(timezone.utc))
           
        schema = Schemas.get(self.meta['returns'].split('/')[-1])
        
        try:
            jsonschema.validate(instance=self.data, schema=schema, format_checker=jsonschema.FormatChecker())
        except jsonschema.exceptions.ValidationError as e:
            abort(500, f'Server data does not match expected JSON schema "{schema}"')

    def jsonify(self):
        return jsonify(
            {
                '_links': self.links,
                '_meta': self.meta,
                'data': self.data
            }
        )
   
class Schemas():
    def get(schema_name):
        if schema_name == 'api.urllist':
            data = {'type': 'array', 'items': {'type': 'string', 'format': 'uri'}}
        elif schema_name == 'api.response':
            data = {
                'required' : ['_links', '_meta', 'data'],
            	'additionalProperties': False,
                'properties' : {
                    '_links': {
                        'properties': {
                            '_next': {'type': 'string', 'format': 'uri'},
                            '_prev': {'type': 'string', 'format': 'uri'},
                            '_self': {'type': 'string', 'format': 'uri'},
                            'related': {'type': 'object', 'items': {'type': 'string', 'format': 'uri'}},
                            'format': {'type': 'object', 'items': {'type': 'string', 'format': 'uri'}}
                        }
                    },
                    '_meta': {
                        'properties': {
                            'name': {'type': 'string'},
                            'returns': {'type': 'string', 'format': 'uri'},
                            'timestamp': {'bsonType': 'date'}
                        }
                    },
                    'data': {}
                },
            }
        elif schema_name == 'jmarc':
            data = deepcopy(DlxConfig.jmarc_schema)
            data['properties']['files'] = {
                'type': 'array', 
                'items': {
                    'type': 'object', 
                    'properties': {
                        'mimetype': {'type': 'string', 'pattern': '^(text|application)/'}, 
                        'language': {'type': 'string', 'pattern': '^[a-z]{2}$'},
                        'url': {'type': 'string', 'format': 'uri'}
                    }
                }
            }
        elif schema_name == 'jmarc.workform':
            data = deepcopy(DlxConfig.jmarc_schema)
            del data['properties']['_id']
            data['required'].remove('_id')
            data['properties']['name'] = {'type': 'string'}
            data['properties']['description'] = {'type': 'string'}
            data['required'].append('name')
        elif schema_name == 'jmarc.controlfield':
            data = DlxConfig.jmarc_schema['.controlfield']
        elif schema_name == 'jmarc.datafield':
            data = DlxConfig.jmarc_schema['.datafield']
            data['properties']['subfields']['items'] = DlxConfig.jmarc_schema['.subfield']
        elif schema_name == 'jmarc.subfield':
            data = DlxConfig.jmarc_schema['.subfield']
        elif schema_name == 'jmarc.subfield.value':
            data = DlxConfig.jmarc_schema['.subfield']['properties']['value']
        elif schema_name == 'jmarc.batch':
            df = DlxConfig.jmarc_schema['.datafield']
            df['properties']['subfields']['items'] = DlxConfig.jmarc_schema['.subfield']
            data = {'type': 'array', 'items': df}
        elif schema_name == 'api.authmap':
            data = {'_notes': 'Not yet specified'}
        elif schema_name == 'api.brieflist':
            data = {'type': 'array'}
        elif schema_name == 'api.browselist':
            data = {'type': 'array'}
        elif schema_name == 'jfile':
            data = DlxConfig.jfile_schema
        elif schema_name == 'api.null':
            data = {'type': 'object', 'properties': {}, 'additionalProperties': False}
        elif schema_name == 'api.count':
            data = {'type': 'integer'}
        elif schema_name == 'api.userprofile':
            data = {'type': 'object'}
        elif schema_name == 'api.basket':
            data = {'type': 'object'}
        elif schema_name == 'api.basket.item.batch':
            data = {'type': 'array'}
        elif schema_name == 'api.basket.item':
            data = {'type': 'object'}
        else:
            abort(404)
        
        return data
         
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
        'alt': '; '.join(record.get_values(alt_tag, 'a')),
        'heading_tag': record.heading_field.tag
    }

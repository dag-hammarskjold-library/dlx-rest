import os
#from dlx import DB
from dlx.marc import Bib, Auth
import boto3

class Config(object):
    DEBUG = False
    TESTING = False
    
    if 'DLX_REST_TESTING' in os.environ:
        connect_string = 'mongomock://localhost'
        TESTING = True
        LOGIN_DISABLED = True
        dbname = 'dlx'
        sync_log_collection = 'sync_log'
    elif 'DLX_REST_DEV' in os.environ:
        client = boto3.client('ssm')
        secret_key = client.get_parameter(Name='metadata_cache_key')['Parameter']['Value']
        connect_string = client.get_parameter(Name='dev-dlx-connect-string')['Parameter']['Value']
        dbname = 'dev_undlFiles'
        sync_log_collection = 'sync_log'
    elif 'DLX_REST_QAT' in os.environ:
        client = boto3.client('ssm')
        secret_key = client.get_parameter(Name='metadata_cache_key')['Parameter']['Value']
        connect_string = client.get_parameter(Name='qat-dlx-connect-string')['Parameter']['Value']
        dbname = 'qat_undlFiles'
        sync_log_collection = 'sync_log'
    elif 'DLX_REST_UAT' in os.environ:
        client = boto3.client('ssm')
        secret_key = client.get_parameter(Name='metadata_cache_key')['Parameter']['Value']
        connect_string = client.get_parameter(Name='uat-dlx-connect-string')['Parameter']['Value']
        dbname = 'uat_undlFiles'
        sync_log_collection = 'sync_log'
    elif 'DLX_REST_PRODUCTION' in os.environ:
        client = boto3.client('ssm')
        secret_key = client.get_parameter(Name='metadata_cache_key')['Parameter']['Value']
        #connect_string = client.get_parameter(Name='dlx-prod-connect-string')['Parameter']['Value']
        connect_string = client.get_parameter(Name='connect-string')['Parameter']['Value']
        dbname = 'undlFiles'
        sync_log_collection = 'dlx_dl_log'
    else:
        raise Exception('One of the environment variables "DLX_REST_TESTING", "DLX_REST_DEV", "DLX_REST_QAT", "DLX_REST_UAT", or "DLX_REST_PRODUCTION" must return a true value in order to initialize the runtime environment')

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", os.urandom(24))
    BIB_COLLECTION = 'bibs'
    AUTH_COLLECTION = 'auths'
    
    # Instances of JSON Schema
    URLLIST_SCHEMA = {'type': 'array', 'items': {'type': 'string', 'format': 'uri'}}
    RESPONSE_SCHEMA = {
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

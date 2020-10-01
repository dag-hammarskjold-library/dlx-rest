import os
from dlx import DB
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
        dbname = 'dev_dlx'
        sync_log_collection = 'sync_log'
    elif 'DLX_REST_PRODUCTION' in os.environ:
        client = boto3.client('ssm')
        secret_key = client.get_parameter(Name='metadata_cache_key')['Parameter']['Value']
        #connect_string = client.get_parameter(Name='dlx-prod-connect-string')['Parameter']['Value']
        connect_string = client.get_parameter(Name='connect-string')['Parameter']['Value']
        dbname = 'undlFiles'
        sync_log_collection = 'dlx_dl_log'
    else:
        raise Exception('One of the environment variables "DLX_REST_TESTING", "DLX_REST_DEV", or "DLX_REST_PRODUCTION" must return a true value in order to initialize the runtime environment')

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", os.urandom(24))
    BIB_COLLECTION = 'bibs'
    AUTH_COLLECTION = 'auths'

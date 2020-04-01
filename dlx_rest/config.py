import os
from dlx import DB
from dlx.marc import Bib, Auth
import boto3

class Config(object):
    DEBUG = False
    TESTING = False

    client = boto3.client('ssm')
    secret_key = client.get_parameter(Name='metadata_cache_key')['Parameter']['Value']
    
    if 'DLX_REST_TESTING' in os.environ:
        connect_string = 'mongomock://localhost'
        TESTING = True
        LOGIN_DISABLED = True
        dbname = 'dlx'
    elif 'DLX_REST_DEV' in os.environ:
        connect_string = client.get_parameter(Name='dlx-dev-connect-string')['Parameter']['Value']
        dbname = 'dev_dlx'
    elif 'DLX_REST_PRODUCTION' in os.environ:
        connect_string = client.get_parameter(Name='dlx-prod-connect-string')['Parameter']['Value']
        dbname = 'dlx'
    else:
        raise Exception('One of the environment variables "DLX_REST_TESTING", "DLX_REST_DEV", or "DLX_REST_PRODUCTION" must return a true value in order to initialize the runtime environment')

   
    BIB_COLLECTION = 'bibs'
    AUTH_COLLECTION = 'auths'

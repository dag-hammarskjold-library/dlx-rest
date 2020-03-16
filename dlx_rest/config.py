import os
from dlx import DB
from dlx.marc import Bib, Auth
import boto3

class Config(object):
    DEBUG = False
    TESTING = False
    
    if 'DLX_REST_TESTING' in os.environ:
        client = None
        connect_string = 'mongomock://localhost'
        TESTING = True
    elif 'DLX_REST_DEV' in os.environ:
        client = boto3.client('ssm')
        connect_string = client.get_parameter(Name='dev-connect-string')['Parameter']['Value']
    elif 'DLX_REST_PRODUCTION' in os.environ:
        client = boto3.client('ssm')
        connect_string = client.get_parameter(Name='production-connect-string')['Parameter']['Value']
    else:
        raise Exception('One of the environment variables "DLX_REST_TESTING", "DLX_REST_DEV", or "DLX_REST_PRODUCTION" must return a true value in order to initialize the runtime environment')

    BIB_COLLECTION = 'bibs'
    AUTH_COLLECTION = 'auths'

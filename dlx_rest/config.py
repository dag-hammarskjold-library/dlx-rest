import os
from dlx import DB
from dlx.marc import Bib, Auth
import boto3

class Config(object):
    DEBUG = False
    TESTING = False
    
    if 'FLASK_TEST' in os.environ:
        client = None
        connect_string = 'mongomock://localhost'
        TESTING = True
    else:
        client = boto3.client('ssm')
        connect_string = client.get_parameter(Name='connect-string')['Parameter']['Value']

    BIB_COLLECTION = 'bibs'
    AUTH_COLLECTION = 'auths'

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

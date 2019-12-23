from dlx import DB
from dlx.marc import Bib, Auth
import boto3

class Config(object):
    DEBUG = False
    TESTING = False

    client = boto3.client('ssm')
    connect_string = client.get_parameter(Name='connect-string')['Parameter']['Value']
    
    DB = DB.connect(connect_string)

    COLLECTIONS = {
        'bibs': {
            'endpoint': 'bibs',
            'instance_class': Bib
        },
        'auths': {
            'endpoint': 'auths',
            'instance_class': Auth
        }
    }

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
import os
from dlx import DB
from dlx.marc import Bib, Auth
import boto3

class Config(object):
    DEBUG = False
    TESTING = False
    
    if 'DLX_REST_TESTING' in os.environ:
        client = boto3.client('ssm')
        connect_string = 'mongomock://localhost'
        TESTING = True
        cognito_pool_id = client.get_parameter(Name='dev-dlx-cognito-pool-id')['Parameter']['Value']
        cognito_client_id = client.get_parameter(Name='dev-dlx-cognito-client-id')['Parameter']['Value']
        cognito_signin_url = 'https://dev-dlx-rest.auth.us-east-1.amazoncognito.com'
    elif 'DLX_REST_DEV' in os.environ:
        client = boto3.client('ssm')
        connect_string = client.get_parameter(Name='dlx-dev-connect-string')['Parameter']['Value']
        cognito_pool_id = client.get_parameter(Name='dev-dlx-cognito-pool-id')['Parameter']['Value']
        cognito_client_id = client.get_parameter(Name='dev-dlx-cognito-client-id')['Parameter']['Value']
    elif 'DLX_REST_PRODUCTION' in os.environ:
        client = boto3.client('ssm')
        connect_string = client.get_parameter(Name='dlx-prod-connect-string')['Parameter']['Value']
        cognito_pool_id = client.get_parameter(Name='dlx-cognito-pool-id')['Parameter']['Value']
        cognito_client_id = client.get_parameter(Name='dlx-cognito-client-id')['Parameter']['Value']
    else:
        raise Exception('One of the environment variables "DLX_REST_TESTING", "DLX_REST_DEV", or "DLX_REST_PRODUCTION" must return a true value in order to initialize the runtime environment')

    cognito_pool_url = 'https://cognito-idp.us-east-1.amazonaws.com'
    BIB_COLLECTION = 'bibs'
    AUTH_COLLECTION = 'auths'

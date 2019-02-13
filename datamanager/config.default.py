from pymongo import MongoClient

class DLX(object):
    def __init__(self, client):
        self.db = client['your_db']
        self.auths = self.db['your_authorities_collection']
        self.bibs = self.db['your_bib_collection']
        self.files = self.db['your_files_collection']

class Config(object):
    DEBUG = False
    TESTING = False

    client = MongoClient(
        'your_host',
        port=8080,
        username='your_username',
        password='your_password',
        authSource='your_authorization_db',
        authMechanism='SCRAM-SHA-256'
    )

    dlx = DLX(client)

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
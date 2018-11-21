from pymongo import MongoClient

FILES_BUCKET = ''

DB_CLIENT = MongoClient(
    '<your_host_here>',
    port=27017,
    username='<username>',
    password='<password>',
    authSource='<athentication_database>',
    authMechanism='SCRAM-SHA-256'
)

DB = DB_CLIENT['<database_name>']
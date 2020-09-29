import os
os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import json, re
from datetime import datetime
from dlx_rest.config import Config

# Move fixtures here so they can be reused in all tests.

@pytest.fixture(scope='module')
def client():
    from dlx_rest.app import app
    return app.test_client()
    
@pytest.fixture(scope='module')
def db():
    from dlx import DB
    # ?
    
@pytest.fixture(scope='module')
def records():
    from dlx import DB
    from dlx.marc import Bib, Auth
    from random import randrange

    for x in range(1,51):
        bib = Bib({'_id': x})
        bib.set('245', 'a', str(randrange(1, 100)))
        bib.set('500', 'a', '1x')
        bib.set('500', 'a', '2x', address=['+'])
        bib.set('500', 'a', '3x', address=[1, '+'])
        bib.set('900', 'a', str(x)).set('900', 'b', str(x))
        bib.commit()
        
        auth = Auth({'_id': x})
        auth.set('100', 'a', str(randrange(1, 100))),
        auth.set('400', 'a', '1x'),
        auth.set('400', 'a', '2x', address=['+'])
        auth.set('400', 'a', '3x', address=[1, '+'])
        auth.set('900', 'a', str(x)).set('900', 'b', str(x))
        auth.commit()
        
   
@pytest.fixture(scope='module')
def users():
    from mongoengine import connect, disconnect
    from dlx_rest.models import User

    disconnect()
    connect('dbtest', host=Config.connect_string)
    
    user = User(email = 'test_user@un.org', created=datetime.now())
    user.set_password('password')
    user.save()
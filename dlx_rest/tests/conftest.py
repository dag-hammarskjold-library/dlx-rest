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

    for x in range(1, 11):
        auth = Auth({'_id': x})
        auth.set('100', 'a', str(randrange(1, 100))),
        auth.set('400', 'a', '1x'),
        auth.set('400', 'a', '2x', address=['+'])
        auth.set('400', 'a', '3x', address=[1, '+'])
        auth.set('900', 'a', str(x)).set('900', 'b', str(x))
        auth.commit()
        
        Auth({'_id': 11}).set('110', 'a', 'Name').commit(),
        
        bib = Bib({'_id': x})
        bib.set('245', 'a', str(randrange(1, 100)))
        bib.set('500', 'a', '1x')
        bib.set('610', 'a', 'Name')
        bib.set('500', 'a', '2x', address=['+'])
        bib.set('500', 'a', '3x', address=[1, '+'])
        bib.set('900', 'a', str(x)).set('900', 'b', str(x))
        bib.commit()
        
@pytest.fixture(scope='module')
def auths():
    from dlx import DB
    from dlx.marc import Bib, Auth
    from random import randrange
    
    auths = []
    auths.append(Auth({'_id': 11}).set('110', 'a', 'Name'))

    for x in range(1, 11):
        auth = Auth({'_id': x})
        auth.set('100', 'a', str(randrange(1, 100))),
        auth.set('400', 'a', '1x'),
        auth.set('400', 'a', '2x', address=['+'])
        auth.set('400', 'a', '3x', address=[1, '+'])
        auth.set('900', 'a', str(x)).set('900', 'b', str(x))
        auths.append(auth)
        
    return auths

@pytest.fixture(scope='module')
def bibs():
    from dlx import DB
    from dlx.marc import Bib, Auth
    from random import randrange
    
    bibs = []
    
    for x in range(1, 11):
        bib = Bib({'_id': x})
        bib.set('245', 'a', str(randrange(1, 100)))
        bib.set('500', 'a', '1x')
        bib.set('610', 'a', 'Name')
        bib.set('500', 'a', '2x', address=['+'])
        bib.set('500', 'a', '3x', address=[1, '+'])
        bib.set('900', 'a', str(x)).set('900', 'b', str(x))
        bibs.append(bib)
    
    return bibs

@pytest.fixture(scope='module')    
def templates():
    from dlx import DB
    from dlx.marc import Bib, Auth
    
    template = Bib()
    template.set('245', 'a', 'Title')
    data = template.to_dict()
    data['name'] = 'bib_template_1'
    data['_id'] = 1
    DB.handle['bibs_templates'].insert_one(data)
    
    template = Auth()
    template.set('100', 'a', 'Name')
    data = template.to_dict()
    data['name'] = 'auth_template_1'
    data['_id'] = 1
    DB.handle['auths_templates'].insert_one(data)

@pytest.fixture(scope='module')
def users():
    from mongoengine import connect, disconnect
    from dlx_rest.models import User

    disconnect()
    connect('dbtest', host=Config.connect_string)
    
    user = User(email = 'test_user@un.org', created=datetime.now())
    user.set_password('password')
    user.save()
import os
os.environ['DLX_REST_TESTING'] = 'True'
import pytest 
import json, re
from dlx_rest.config import Config

# Move fixtures here so they can be reused in all tests.

@pytest.fixture(scope='module')
def client():
    from dlx_rest.app import app
    return app.test_client()
    
@pytest.fixture(scope='module')
def records():
    from dlx import DB
    from dlx.marc import Bib, Auth
    from random import randrange
    DB.connect(Config.connect_string)
    
    for x in range(1,51):
        bib = Bib({'_id': x})
        bib.set('245', 'a', str(randrange(1, 100)))
        bib.set('500', 'a', '1x')
        bib.set('500', 'a', '2x', address=['+'])
        bib.set('500', 'a', '3x', address=[1, '+'])
        bib.commit()
        
        auth = Auth({'_id': x})
        auth.set('100', 'a', str(randrange(1, 100))),
        auth.set('400', 'a', '1x'),
        auth.set('400', 'a', '2x', address=['+'])
        auth.set('400', 'a', '3x', address=[1, '+'])
        auth.commit()
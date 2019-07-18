from flask import url_for, Flask, abort

def make_list(endpoint, results, **kwargs):
    '''
    Makes a list of records, fields, whatever, and stores them in results.
    '''
    return_data = {
        '_links': {
            'self': url_for(endpoint, **kwargs)
        },
        'start': kwargs.pop('start', 0),
        'limit': kwargs.pop('limit', 0),
        'results': results
    }
    return return_data

def make_singleton(endpoint, record_id, record, **kwargs):
    '''
    Makes a single record result and stores it in result.
    '''
    return_data = {
        '_links': {
            'self': url_for(endpoint, record_id=record_id, **kwargs)
        },
        'result': record
    }
    return return_data
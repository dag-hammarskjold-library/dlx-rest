"""Simple Mongo-backed worker that claims queued MergeJobs and runs them.

Run this in a separate process: `python -m dlx_rest.worker` or `python dlx_rest/worker.py`
"""
import certifi
import time
import logging
from mongoengine import connect, disconnect
from mongomock import MongoClient as MockClient
from pymongo import ReturnDocument
from dlx_rest.models import MergeJob
from dlx_rest.tasks import run_merge_job
from dlx_rest.config import Config

logger = logging.getLogger(__name__)



def claim_and_run_one():
    # Atomically find and claim a queued job
    col = MergeJob._get_collection()
    doc = col.find_one_and_update(
        {'status': 'queued'},
        {'$set': {'status': 'claimed'}},
        return_document=ReturnDocument.AFTER
    )

    if not doc:
        return False

    job_id = doc['_id'] if '_id' in doc else doc.get('job_id')
    # Normalize to our job_id field (we use job_id as primary key)
    if isinstance(job_id, int):
        job_id = str(job_id)

    try:
        # Mark as running properly
        MergeJob.objects(job_id=job_id).update_one(set__status='running', set__started=__import__('datetime').datetime.utcnow())
        run_merge_job(job_id)
    except Exception:
        logger.exception('Error running merge job %s', doc.get('job_id'))

    return True


def run_loop(sleep_seconds=2):
    while True:
        try:
            found = claim_and_run_one()
            if not found:
                time.sleep(sleep_seconds)
        except KeyboardInterrupt:
            break
        except Exception:
            logger.exception('Worker encountered an error, sleeping before retry')
            time.sleep(sleep_seconds)


if __name__ == '__main__':
    if Config.ssl:
        connect(host=Config.connect_string, db=Config.dbname, tlsCAFile=certifi.where())
    else:
        if 'mongomock://' in Config.connect_string:
            # mongoengine noew requires connect to mock db using `mongo_client_class`
            connect('testing', host='mongodb://localhost', mongo_client_class=MockClient)
        else:
            connect(host=Config.connect_string, db=Config.dbname)
            
    logging.basicConfig(level=logging.INFO)
    run_loop()

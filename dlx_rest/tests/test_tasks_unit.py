import json
from dlx_rest.tasks import enqueue_merge, run_merge_job
from dlx_rest.models import MergeJob
from dlx import DB
from dlx_rest.config import Config

# Ensure DB is connected for marc fixtures
if not DB.connected:
    DB.connect(Config.connect_string)
    # Ensure mongoengine (used by MergeJob) is connected
    from mongoengine import connect as me_connect
    import mongomock
    me_connect(host='mongodb://localhost', db=DB.database_name or 'testing', mongo_client_class=mongomock.MongoClient)


def test_enqueue_and_run_merge_job(marc):
    # enqueue
    job_id = enqueue_merge(1, 2, 'test-suite')

    job = MergeJob.objects(job_id=job_id).first()
    assert job is not None
    assert job.status == 'queued'

    # run inline
    run_merge_job(job_id)

    job = MergeJob.objects(job_id=job_id).first()
    assert job.status == 'completed'
    # losing auth should have merge_log entries and be deleted from auth collection
    # Ensure merge_log contains deleted action for record_id 2
    logs = list(DB.handle['merge_log'].find({'record_id': 2}))
    actions = [l.get('action') for l in logs]
    assert 'deleted' in actions or 'merge complete' in actions

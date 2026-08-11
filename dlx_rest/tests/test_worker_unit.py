from dlx_rest.worker import claim_and_run_one
from dlx_rest.tasks import enqueue_merge
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


def test_claim_and_run_one_processes_job(marc):
    # enqueue a job
    job_id = enqueue_merge(1, 2, 'worker-test')

    # claim and run one should return True and process the job
    found = claim_and_run_one()
    assert found is True

    job = MergeJob.objects(job_id=job_id).first()
    assert job is not None
    assert job.status == 'completed'


def test_claim_and_run_one_no_job_returns_false():
    # Ensure no queued jobs exist
    # claim_and_run_one should return False
    found = claim_and_run_one()
    assert found is False

import datetime
from dlx_rest.supervisor import write_supervisor_status
from dlx_rest.models import WorkerSupervisor
from dlx import DB
from dlx_rest.config import Config

# Ensure DB is connected for supervisor tests
if not DB.connected:
    DB.connect(Config.connect_string)
    # Ensure mongoengine (used by WorkerSupervisor) is connected
    from mongoengine import connect as me_connect
    import mongomock
    me_connect(host='mongodb://localhost', db=DB.database_name or 'testing', mongo_client_class=mongomock.MongoClient)


def test_write_supervisor_status_creates_and_updates():
    sup = write_supervisor_status(pid=12345, status='running')
    assert sup is not None
    assert sup.pid == 12345
    assert sup.status == 'running'
    assert sup.last_heartbeat is not None

    # update status to restarting
    sup2 = write_supervisor_status(pid=None, status='restarting')
    assert sup2.status == 'restarting'

    # verify stored document
    sup_doc = WorkerSupervisor.objects(name='merge_worker_supervisor').first()
    assert sup_doc is not None
    assert sup_doc.status in ('running', 'restarting', 'stopped')

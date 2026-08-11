"""Supervisor that runs `worker.py`, restarts on crash, and updates supervisor status in MongoDB."""
import subprocess
import time
import os
import signal
import logging
from dlx_rest.models import WorkerSupervisor
import datetime

logger = logging.getLogger(__name__)


def write_supervisor_status(pid=None, status='running'):
    now = datetime.datetime.utcnow()
    sup = WorkerSupervisor.objects(name='merge_worker_supervisor').modify(
        upsert=True,
        new=True,
        set__pid=pid,
        set__status=status,
        set__started=now if status == 'running' and not WorkerSupervisor.objects(name='merge_worker_supervisor') else None,
        set__last_heartbeat=now
    )
    return sup


def run_supervisor(worker_cmd=None):
    worker_cmd = worker_cmd or ['python', 'dlx_rest/worker.py']

    backoff = 1
    sup = write_supervisor_status(pid=None, status='running')

    while True:
        try:
            logger.info('Starting worker: %s', worker_cmd)
            proc = subprocess.Popen(worker_cmd)
            write_supervisor_status(pid=proc.pid, status='running')

            # Heartbeat loop
            while True:
                time.sleep(5)
                # update heartbeat
                WorkerSupervisor.objects(name='merge_worker_supervisor').update_one(set__last_heartbeat=datetime.datetime.utcnow(), set__pid=proc.pid)
                ret = proc.poll()
                if ret is not None:
                    logger.warning('Worker exited with code %s', ret)
                    break

            # worker exited; restart with backoff
            write_supervisor_status(pid=None, status='restarting')
            time.sleep(backoff)
            backoff = min(backoff * 2, 60)
        except KeyboardInterrupt:
            logger.info('Supervisor received KeyboardInterrupt, stopping')
            write_supervisor_status(pid=None, status='stopped')
            try:
                proc.terminate()
            except Exception:
                pass
            break
        except Exception:
            logger.exception('Supervisor error; restarting worker after short delay')
            write_supervisor_status(pid=None, status='restarting')
            time.sleep(backoff)
            backoff = min(backoff * 2, 60)


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run_supervisor()

import os
import traceback
import datetime
import logging
from pymongo import ReturnDocument
from dlx_rest.models import MergeJob
from dlx.marc import Auth as DLXAuth
from dlx_rest.config import Config
from dlx_rest.models import MergeJob
from dlx import DB

logger = logging.getLogger(__name__)


def enqueue_merge(gaining_id: int, losing_id: int, user: str):
    """Create a MergeJob document and return the job_id. A separate worker polls the DB."""
    job_doc = MergeJob(
        job_id=str(datetime.datetime.utcnow().timestamp()).replace('.', ''),
        gaining=gaining_id,
        losing=losing_id,
        user=user,
        status='queued',
        progress=0,
    )
    job_doc.save()

    return job_doc.job_id


def run_merge_job(job_id: str):
    """Run the merge for the given job_id (used by the worker)."""
    job = MergeJob.objects(job_id=job_id).first()
    if not job:
        return

    job.status = 'running'
    job.started = datetime.datetime.utcnow()
    job.save()

    try:
        gaining = DLXAuth.from_id(job.gaining)
        losing = DLXAuth.from_id(job.losing)

        if not gaining or not losing:
            raise Exception('Gaining or losing record not found')

        gaining.merge(user=job.user or 'system', losing_record=losing)

        # Capture merge_log entries for the losing record for diagnosis
        try:
            logs = list(DB.handle['merge_log'].find({'record_id': losing.id}))
            actions = [l.get('action') for l in logs]
            job.message = f"Merge completed; merge_log actions: {actions}"
        except Exception:
            job.message = 'Merge completed; could not read merge_log'

        job.progress = 100
        job.status = 'completed'
    except Exception as e:
        job.status = 'failed'
        job.error = traceback.format_exc()
        job.message = str(e)
    finally:
        job.finished = datetime.datetime.utcnow()
        # Log job message for diagnostics (visible in pytest output when logging configured)
        try:
            logger.info("MergeJob %s status=%s message=%s error=%s", job.job_id, job.status, job.message, job.error)
        except Exception:
            pass
        job.save()

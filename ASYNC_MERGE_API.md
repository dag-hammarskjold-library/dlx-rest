# Authority Merge API - Async Mode

## Overview

The authority merge endpoints now support both **synchronous** (default, backward-compatible) and **asynchronous** execution modes. This allows long-running merge operations to be queued and tracked.

## Endpoints

### Synchronous Merge (Default Behavior)

```
GET /api/marc/auths/records/<gaining_id>/merge?target=<losing_id>
```

**Response:** `200 OK`
```json
{
  "message": "Merge complete"
}
```

**Behavior:**
- Merges authority records synchronously
- Returns immediately after merge is complete
- Fully backward compatible with existing clients

### Asynchronous Merge (New)

```
GET /api/marc/auths/records/<gaining_id>/merge?target=<losing_id>&async=true
```

**Response:** `202 Accepted`
```json
{
  "message": "Merge queued: auths/123 → auths/456",
  "job_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "queued",
  "status_url": "/api/marc/auths/merge_jobs/01ARZ3NDEKTSV4RRFFQ69G5FAV"
}
```

**Behavior:**
- Creates a merge job record in MongoDB
- Returns immediately with job ID  
- Merge executes in the response (synchronously for now, ready for async task queue in future)
- Client can poll job status endpoint for completion

### Merge Job Status

```
GET /api/marc/auths/merge_jobs/<job_id>
```

**Response:** `200 OK`
```json
{
  "_links": {
    "_self": "/api/marc/auths/merge_jobs/01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "related": {
      "gaining": "/api/marc/auths/records/456",
      "losing": "/api/marc/auths/records/123"
    }
  },
  "_meta": {
    "name": "api_record_merge_status",
    "returns": "/api/schemas/api.merge_job"
  },
  "data": {
    "job_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "status": "completed|queued|running|failed",
    "gaining_id": 456,
    "losing_id": 123,
    "user": "user@example.com",
    "message": "Merge complete: auths/123 merged into auths/456",
    "error": null,
    "created_at": "2026-03-30T12:00:00+00:00",
    "started_at": "2026-03-30T12:00:01+00:00",
    "finished_at": "2026-03-30T12:00:02+00:00"
  }
}
```

## JavaScript Client

### New Methods

```javascript
// Synchronous merge (existing behavior)
const result = await Jmarc.mergeAuthorities(gainingId, losingId)
// Returns 200 with "Merge complete" message

// Asynchronous merge (new)
const result = await Jmarc.mergeAuthorities(gainingId, losingId, { async: true })
// Returns 202 with job_id and status_url

// Check merge job status
const status = await Jmarc.getMergeJobStatus(jobId)
// Returns: { jobId, status, message, error, createdAt, startedAt, finishedAt, ... }

// Poll until completion
const completed = await Jmarc.pollMergeJobStatus(jobId, maxAttempts=60, delayMs=1000)
// Returns completed job status or throws on timeout
```

## Database Model

New `MergeJob` document type stored in `merge_jobs` collection:

```python
{
  _id: ObjectId,
  job_id: str (primary key, ULID),
  status: str (queued | running | completed | failed),
  gaining_id: int,
  losing_id: int,
  user: str,
  message: str,
  error: str (optional),
  created_at: datetime,
  started_at: datetime,
  finished_at: datetime
}
```

Indexes on: `gaining_id`, `losing_id`, `user`, `created_at`

## Backward Compatibility

✓ **Fully backward compatible** — existing synchronous clients work unchanged.
- Old clients ignore new `async` query parameter
- Old code receives `200 OK` with merge-complete message as before
- New job tracking is opt-in via `async=true` query parameter

## Future Enhancements

1. **Async Task Queue** — dispatch to Celery/RQ instead of executing synchronously
2. **Completion Webhooks** — notify client when merge completes
3. **Server-Sent Events** — real-time job status stream for UI
4. **Bulk Merge** — queue multiple merges with single request
5. **Merge History** — audit trail of all merge operations

import assert from 'node:assert/strict'
import test from 'node:test'

import { Jmarc } from '../../static/js/api/jmarc.mjs'

test('Jmarc mergeAuthorities validates numeric and distinct IDs', async () => {
  Jmarc.apiUrl = '/api'

  await assert.rejects(
    () => Jmarc.mergeAuthorities('x', '2'),
    /must be numeric/
  )

  await assert.rejects(
    () => Jmarc.mergeAuthorities('2', '2'),
    /must be different/
  )
})

test('Jmarc mergeAuthorities returns status and job metadata on success', async () => {
  Jmarc.apiUrl = '/api'

  const originalFetch = globalThis.fetch
  const calls = []

  globalThis.fetch = async (url, options) => {
    calls.push([String(url), options])
    return {
      ok: true,
      status: 202,
      async json() {
        return {
          message: 'Merge queued',
          job_id: 'job-1',
          status_url: '/api/marc/auths/merge_jobs/job-1'
        }
      }
    }
  }

  try {
    const result = await Jmarc.mergeAuthorities(100, 200, { async: true })
    assert.equal(result.status, 202)
    assert.equal(result.jobId, 'job-1')
    assert.equal(result.statusUrl, '/api/marc/auths/merge_jobs/job-1')
  } finally {
    globalThis.fetch = originalFetch
  }

  assert(calls[0][0].includes('target=200'))
  assert(calls[0][0].includes('async=true'))
})

test('Jmarc getMergeJobStatus validates jobId and maps wrapped payload', async () => {
  Jmarc.apiUrl = '/api'

  await assert.rejects(
    () => Jmarc.getMergeJobStatus(''),
    /jobId is required/
  )

  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        data: {
          job_id: 'job-2',
          status: 'completed',
          gaining_id: 100,
          losing_id: 200,
          message: 'done'
        }
      }
    }
  })

  try {
    const status = await Jmarc.getMergeJobStatus('job-2')
    assert.equal(status.jobId, 'job-2')
    assert.equal(status.status, 'completed')
    assert.equal(status.gainingId, 100)
    assert.equal(status.losingId, 200)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc getMergeJobStatus throws helpful error on non-ok response', async () => {
  Jmarc.apiUrl = '/api'

  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    async json() {
      return { message: 'Not found' }
    }
  })

  try {
    await assert.rejects(
      () => Jmarc.getMergeJobStatus('missing-job'),
      /Not found/
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc listWorkforms maps trailing URL names', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    async json() {
      return {
        data: [
          '/api/marc/bibs/workforms/default',
          '/api/marc/bibs/workforms/agenda'
        ]
      }
    }
  })

  try {
    const names = await Jmarc.listWorkforms('bibs')
    assert.deepEqual(names, ['default', 'agenda'])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc fromWorkform throws when response is not ok', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false })

  try {
    await assert.rejects(
      () => Jmarc.fromWorkform('bibs', 'missing-form'),
      /not found/
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc deleteWorkform resolves true after successful delete', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    async json() {
      return { ok: true }
    }
  })

  try {
    const result = await Jmarc.deleteWorkform('bibs', 'wf')
    assert.equal(result, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc get validates required params before fetch', async () => {
  Jmarc.apiUrl = '/api/'
  await assert.rejects(() => Jmarc.get('', 1), /Collection required/)
  await assert.rejects(() => Jmarc.get('bibs', null), /Record ID required/)
})

test('Jmarc get returns populated record on 200 response', async () => {
  Jmarc.apiUrl = '/api/'

  const originalFetch = globalThis.fetch
  const originalParse = Jmarc.prototype.parse
  const originalUpdateSavedState = Jmarc.prototype.updateSavedState

  Jmarc.prototype.parse = function (data) {
    this.parsedData = data
  }
  Jmarc.prototype.updateSavedState = function () {
    this._savedFlag = true
  }

  globalThis.fetch = async () => ({
    status: 200,
    async json() {
      return {
        data: {
          files: ['f1'],
          fields: []
        }
      }
    }
  })

  try {
    const record = await Jmarc.get('bibs', 55)
    assert.equal(record.recordId, 55)
    assert.deepEqual(record.files, ['f1'])
    assert.equal(record._savedFlag, true)
  } finally {
    globalThis.fetch = originalFetch
    Jmarc.prototype.parse = originalParse
    Jmarc.prototype.updateSavedState = originalUpdateSavedState
  }
})

test('Jmarc get returns undefined on 404', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    status: 404,
    async json() {
      return { message: 'missing' }
    }
  })

  try {
    const record = await Jmarc.get('bibs', 999999)
    assert.equal(record, undefined)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc get throws on non-200 non-404 responses', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    status: 500,
    async json() {
      return { message: 'boom' }
    }
  })

  try {
    await assert.rejects(() => Jmarc.get('bibs', 1), /boom/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc workforms aggregates listWorkforms + fromWorkform', async () => {
  const originalList = Jmarc.listWorkforms
  const originalFrom = Jmarc.fromWorkform

  Jmarc.listWorkforms = async () => ['wf1', 'wf2']
  Jmarc.fromWorkform = async (_collection, name) => ({ name })

  try {
    const workforms = await Jmarc.workforms('bibs')
    assert.deepEqual(workforms, [{ name: 'wf1' }, { name: 'wf2' }])
  } finally {
    Jmarc.listWorkforms = originalList
    Jmarc.fromWorkform = originalFrom
  }
})

test('Jmarc pollMergeJobStatus resolves when job reaches terminal state', async () => {
  const originalGetStatus = Jmarc.getMergeJobStatus
  const originalSetTimeout = globalThis.setTimeout
  const statuses = ['queued', 'running', 'completed']

  Jmarc.getMergeJobStatus = async () => ({ status: statuses.shift() })
  globalThis.setTimeout = fn => {
    fn()
    return 1
  }

  try {
    const result = await Jmarc.pollMergeJobStatus('job-x', 5, 1)
    assert.equal(result.status, 'completed')
  } finally {
    Jmarc.getMergeJobStatus = originalGetStatus
    globalThis.setTimeout = originalSetTimeout
  }
})

test('Jmarc pollMergeJobStatus throws timeout error when max attempts reached', async () => {
  const originalGetStatus = Jmarc.getMergeJobStatus
  const originalSetTimeout = globalThis.setTimeout

  Jmarc.getMergeJobStatus = async () => ({ status: 'running' })
  globalThis.setTimeout = fn => {
    fn()
    return 1
  }

  try {
    await assert.rejects(
      () => Jmarc.pollMergeJobStatus('job-y', 2, 1),
      /did not complete/
    )
  } finally {
    Jmarc.getMergeJobStatus = originalGetStatus
    globalThis.setTimeout = originalSetTimeout
  }
})

test('Jmarc saveAsWorkform returns true when POST succeeds', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { message: 'ok' }
    }
  })

  const jmarc = new Jmarc('bibs')
  jmarc.compile = () => ({ _id: 1, fields: [] })

  try {
    const result = await jmarc.saveAsWorkform('wf1', 'desc')
    assert.equal(result, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc saveAsWorkform throws message when POST fails', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    async json() {
      return { message: 'cannot save' }
    }
  })

  const jmarc = new Jmarc('bibs')
  jmarc.compile = () => ({ _id: 1, fields: [] })

  try {
    await assert.rejects(
      () => jmarc.saveAsWorkform('wf1', 'desc'),
      /cannot save/
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc pollMergeJobStatus requires jobId', async () => {
  await assert.rejects(
    () => Jmarc.pollMergeJobStatus(''),
    /jobId is required/
  )
})

test('Jmarc post rejects existing record and validation errors', async () => {
  Jmarc.apiUrl = '/api/'
  const existing = new Jmarc('bibs')
  existing.recordId = 1
  await assert.rejects(() => existing.post(), /Can't POST existing record/)

  const invalid = new Jmarc('bibs')
  invalid.validate = () => { throw new Error('invalid') }
  await assert.rejects(() => invalid.post(), /invalid/)
})

test('Jmarc post success sets record metadata and returns fetched record', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  const originalGet = Jmarc.get

  const jmarc = new Jmarc('bibs')
  jmarc.validate = () => {}
  jmarc.runSaveActions = () => {}
  jmarc.stringify = () => '{}'
  jmarc.updateSavedState = function () { this._saved = true }

  Jmarc.get = async (_collection, id) => ({ id, fetched: true })
  globalThis.fetch = async () => ({
    status: 201,
    async json() {
      return { result: '/api/marc/bibs/records/42' }
    }
  })

  try {
    const result = await jmarc.post()
    assert.equal(jmarc.recordId, 42)
    assert.equal(jmarc.url, '/api/marc/bibs/records/42')
    assert.equal(jmarc._saved, true)
    assert.deepEqual(result, { id: 42, fetched: true })
  } finally {
    globalThis.fetch = originalFetch
    Jmarc.get = originalGet
  }
})

test('Jmarc put rejects new record and non-200 responses', async () => {
  Jmarc.apiUrl = '/api/'

  const fresh = new Jmarc('bibs')
  await assert.rejects(() => fresh.put(), /Can't PUT new record/)

  const originalFetch = globalThis.fetch
  const jmarc = new Jmarc('bibs')
  jmarc.recordId = 5
  jmarc.url = '/api/marc/bibs/records/5'
  jmarc.validate = () => {}
  jmarc.runSaveActions = () => {}
  jmarc.stringify = () => '{}'

  globalThis.fetch = async () => ({
    status: 500,
    async json() {
      return { message: 'put failed' }
    }
  })

  try {
    await assert.rejects(() => jmarc.put(), /put failed/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Jmarc put success returns refreshed record', async () => {
  Jmarc.apiUrl = '/api/'
  const originalFetch = globalThis.fetch
  const originalGet = Jmarc.get

  const jmarc = new Jmarc('bibs')
  jmarc.recordId = 9
  jmarc.url = '/api/marc/bibs/records/9'
  jmarc.validate = () => {}
  jmarc.runSaveActions = () => {}
  jmarc.stringify = () => '{}'
  jmarc.updateSavedState = function () { this._saved = true }

  Jmarc.get = async (_collection, id) => ({ id, refreshed: true })
  globalThis.fetch = async () => ({
    status: 200,
    async json() {
      return { ok: true }
    }
  })

  try {
    const result = await jmarc.put()
    assert.equal(jmarc._saved, true)
    assert.deepEqual(result, { id: 9, refreshed: true })
  } finally {
    globalThis.fetch = originalFetch
    Jmarc.get = originalGet
  }
})

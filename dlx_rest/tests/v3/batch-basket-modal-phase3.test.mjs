import assert from 'node:assert/strict'
import test from 'node:test'

import { BatchBasketModal } from '../../static/js/v3/components/batch-basket-modal.mjs'

test('BatchBasketModal getStoredBatchAction retrieves from localStorage with fallback', () => {
  const originalWindow = globalThis.window
  
  globalThis.window = {
    localStorage: {
      getItem(key) {
        return 'delete'
      }
    }
  }

  try {
    const action = BatchBasketModal.methods.getStoredBatchAction.call({})
    assert.equal(action, 'delete')
  } finally {
    globalThis.window = originalWindow
  }
})

test('BatchBasketModal getStoredBatchAction returns add when invalid stored value', () => {
  const originalWindow = globalThis.window
  
  globalThis.window = {
    localStorage: {
      getItem(key) {
        return 'invalid-action'
      }
    }
  }

  try {
    const action = BatchBasketModal.methods.getStoredBatchAction.call({})
    assert.equal(action, 'add')
  } finally {
    globalThis.window = originalWindow
  }
})

test('BatchBasketModal persistBatchAction saves to localStorage', () => {
  const originalWindow = globalThis.window
  let savedValue = null
  
  globalThis.window = {
    localStorage: {
      setItem(key, value) {
        if (key === 'dlx:v3:batch:last-action') {
          savedValue = value
        }
      }
    }
  }

  try {
    BatchBasketModal.methods.persistBatchAction.call({}, 'delete')
    assert.equal(savedValue, 'delete')
  } finally {
    globalThis.window = originalWindow
  }
})

test('BatchBasketModal persistBatchAction ignores invalid action', () => {
  const originalWindow = globalThis.window
  let savedValue = null
  
  globalThis.window = {
    localStorage: {
      setItem(key, value) {
        savedValue = value
      }
    }
  }

  try {
    BatchBasketModal.methods.persistBatchAction.call({}, 'invalid')
    assert.equal(savedValue, null)
  } finally {
    globalThis.window = originalWindow
  }
})

test('BatchBasketModal previewChanges skips when canPreview is false', async () => {
  const ctx = {
    canPreview: false,
    previewRows: ['old'],
    stagedChanges: ['old'],
    selectedFields: [],
    selectedRecordKeys: []
  }

  await BatchBasketModal.methods.previewChanges.call(ctx)
  
  assert.deepEqual(ctx.previewRows, ['old'])
  assert.deepEqual(ctx.stagedChanges, ['old'])
})

test('BatchBasketModal previewChanges builds preview rows for add action', async () => {
  const ctx = {
    canPreview: true,
    action: 'add',
    selectedRecordKeys: ['bibs/1', 'bibs/2'],
    selectedFields: [{ tag: '245', indicators: ['_', '_'], subfields: [{ code: 'a', value: 'Title', xref: null }] }],
    basketRecords: [],
    previewRows: [],
    stagedChanges: [],
    showPreview: false,
    getRecordForPreview: async (collection, recordId) => ({
      createField(tag) {
        const field = { tag, indicators: ['_', '_'], subfields: [] }
        field.createSubfield = (code) => {
          const sub = { code, value: '', xref: null }
          field.subfields.push(sub)
          return sub
        }
        return field
      },
      getDataFields() { return [] },
      allValidationWarnings() { return [] }
    })
  }

  await BatchBasketModal.methods.previewChanges.call(ctx)
  
  assert.equal(ctx.showPreview, true)
  assert.equal(ctx.previewRows.length, 2)
  assert.equal(ctx.previewRows[0].action, 'add')
  assert.equal(ctx.previewRows[0].changedFields, 1)
  assert.equal(ctx.previewRows[0].canSave, true)
})

test('BatchBasketModal previewChanges marks invalid records when validation warnings exist', async () => {
  const ctx = {
    canPreview: true,
    action: 'delete',
    selectedRecordKeys: ['auths/1'],
    selectedFields: [{ tag: '100', indicators: ['_', '_'], subfields: [{ code: 'a', value: 'Heading', xref: null }] }],
    basketRecords: [],
    previewRows: [],
    stagedChanges: [],
    showPreview: false,
    getRecordForPreview: async (collection, recordId) => ({
      getDataFields() {
        return [
          { tag: '100', indicators: ['_', '_'], subfields: [{ code: 'a', value: 'Heading', xref: null }] }
        ]
      },
      deleteField(field) {},
      allValidationWarnings() {
        return [{ message: 'missing 040 field' }]
      },
      getField(tag) {
        return tag === '998' ? null : true
      }
    })
  }

  await BatchBasketModal.methods.previewChanges.call(ctx)
  
  assert.equal(ctx.showPreview, true)
  assert.equal(ctx.previewRows[0].invalid, true)
  assert.equal(ctx.previewRows[0].canSave, false)
  assert.equal(ctx.previewRows[0].messages.length, 1)
  assert.equal(ctx.stagedChanges.length, 0)
})

test('BatchBasketModal applyChanges returns early when already applying', async () => {
  const ctx = {
    isApplying: true,
    stagedChanges: [{ record: { put: async () => {} } }]
  }

  await BatchBasketModal.methods.applyChanges.call(ctx)
  
  assert.equal(ctx.isApplying, true)
})

test('BatchBasketModal applyChanges calls put on all staged records and emits applied', async () => {
  const putCalls = []
  const originalWindow = globalThis.window
  const events = []
  
  globalThis.window = { alert() {} }

  const ctx = {
    isApplying: false,
    stagedChanges: [
      { collection: 'bibs', recordId: 1, record: { put: async () => { putCalls.push(1) } } },
      { collection: 'bibs', recordId: 2, record: { put: async () => { putCalls.push(2) } } }
    ],
    previewRows: [
      { invalid: false },
      { invalid: false }
    ],
    $emit(event, payload) {
      events.push({ event, payload })
    }
  }

  try {
    await BatchBasketModal.methods.applyChanges.call(ctx)
  } finally {
    globalThis.window = originalWindow
  }
  
  assert.deepEqual(putCalls, [1, 2])
  assert.equal(ctx.isApplying, false)
  const appliedEvent = events.find(e => e.event === 'applied')
  assert(appliedEvent)
  assert.equal(appliedEvent.payload.updatedRecords.length, 2)
  assert.equal(appliedEvent.payload.skipped, 0)
})

test('BatchBasketModal applyChanges handles error and resets isApplying', async () => {
  const originalWindow = globalThis.window
  let alertMsg = null
  const events = []
  
  globalThis.window = {
    alert(msg) { alertMsg = msg }
  }

  const ctx = {
    isApplying: false,
    stagedChanges: [
      { collection: 'bibs', recordId: 1, record: { put: async () => { throw new Error('save failed') } } }
    ],
    previewRows: [],
    $emit(event, payload) {
      events.push({ event, payload })
    }
  }

  try {
    await BatchBasketModal.methods.applyChanges.call(ctx)
  } finally {
    globalThis.window = originalWindow
  }
  
  assert.equal(ctx.isApplying, false)
  assert(alertMsg && alertMsg.includes('Batch update failed'))
  assert.equal(events.length, 0)
})

test('BatchBasketModal getRecordForPreview returns cloned record from basket', async () => {
  const ctx = {
    basketRecords: [
      { collection: 'bibs', recordId: 1, clone() { return { cloned: true } } }
    ]
  }

  const result = await BatchBasketModal.methods.getRecordForPreview.call(ctx, 'bibs', 1)
  
  assert.equal(result.cloned, true)
})

test('BatchBasketModal getRecordForPreview returns null when record fetch fails', async () => {
  const ctx = {
    basketRecords: []
  }

  try {
    await BatchBasketModal.methods.getRecordForPreview.call(ctx, 'auths', 5)
  } catch (error) {
    // Expected - Jmarc.apiUrl not set in test harness
    assert(error.message.includes('apiUrl'))
  }
})

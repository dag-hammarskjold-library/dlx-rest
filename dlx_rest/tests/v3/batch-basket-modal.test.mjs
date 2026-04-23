import assert from 'node:assert/strict'
import test from 'node:test'

import { BatchBasketModal } from '../../static/js/v3/components/batch-basket-modal.mjs'

test('BatchBasketModal canPreview and saveable counters reflect current state', () => {
  const ctx = {
    selectedRecordKeys: ['bibs/1'],
    selectedFields: [{ tag: '245' }],
    previewRows: [{ canSave: true }, { canSave: false }, { canSave: true }]
  }

  assert.equal(BatchBasketModal.computed.canPreview.call(ctx), true)
  assert.equal(BatchBasketModal.computed.saveableCount.call(ctx), 2)
  assert.equal(BatchBasketModal.computed.unsaveableCount.call(ctx), 1)
})

test('BatchBasketModal ensureSourceSelectionRule includes/excludes source key', () => {
  const ctx = {
    includeSourceRecord: true,
    sourceRecordKey: 'bibs/1',
    selectedRecordKeys: ['auths/2']
  }

  BatchBasketModal.methods.ensureSourceSelectionRule.call(ctx)
  assert.deepEqual(ctx.selectedRecordKeys.sort(), ['auths/2', 'bibs/1'])

  ctx.includeSourceRecord = false
  BatchBasketModal.methods.ensureSourceSelectionRule.call(ctx)
  assert.deepEqual(ctx.selectedRecordKeys, ['auths/2'])
})

test('BatchBasketModal toggleSelectAll honors includeSourceRecord flag', () => {
  const ctx = {
    includeSourceRecord: false,
    sourceRecordKey: 'bibs/1',
    basketOptions: [
      { key: 'bibs/1' },
      { key: 'auths/2' },
      { key: 'bibs/9' }
    ],
    selectedRecordKeys: []
  }

  BatchBasketModal.methods.toggleSelectAll.call(ctx, true)
  assert.deepEqual(ctx.selectedRecordKeys.sort(), ['auths/2', 'bibs/9'])

  BatchBasketModal.methods.toggleSelectAll.call(ctx, false)
  assert.deepEqual(ctx.selectedRecordKeys, [])
})

test('BatchBasketModal persists and restores action from localStorage', () => {
  const originalWindow = globalThis.window
  const state = { action: 'delete' }

  globalThis.window = {
    localStorage: {
      getItem() {
        return state.action
      },
      setItem(_k, v) {
        state.action = v
      }
    }
  }

  const read = BatchBasketModal.methods.getStoredBatchAction.call({})
  assert.equal(read, 'delete')

  BatchBasketModal.methods.persistBatchAction.call({}, 'add')
  assert.equal(state.action, 'add')

  globalThis.window = originalWindow
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { HistoryManager } from '../../static/js/v3/services/HistoryManager.mjs'

function createRecord(initialFields = []) {
  return {
    fields: [...initialFields],
    compile() {
      return { fields: [...this.fields] }
    },
    parse(data) {
      this.fields = Array.isArray(data?.fields) ? [...data.fields] : []
    }
  }
}

test('HistoryManager captures snapshots and supports undo/redo', () => {
  const record = createRecord([{ tag: '245' }])
  const manager = new HistoryManager(record)

  assert.equal(manager.captureSnapshot(), true)
  assert.equal(manager.captureSnapshot(), false)

  record.fields = [{ tag: '245' }, { tag: '500' }]
  assert.equal(manager.captureSnapshot(), true)
  assert.equal(manager.canUndo, true)
  assert.equal(manager.canRedo, false)

  assert.equal(manager.undo(), true)
  assert.deepEqual(record.fields, [{ tag: '245' }])
  assert.equal(manager.canRedo, true)

  assert.equal(manager.redo(), true)
  assert.deepEqual(record.fields, [{ tag: '245' }, { tag: '500' }])
})

test('HistoryManager trims redo branch after new snapshot', () => {
  const record = createRecord([{ tag: '100' }])
  const manager = new HistoryManager(record)

  manager.captureSnapshot()
  record.fields = [{ tag: '100' }, { tag: '245' }]
  manager.captureSnapshot()
  record.fields = [{ tag: '100' }, { tag: '245' }, { tag: '500' }]
  manager.captureSnapshot()

  assert.equal(manager.undo(), true)
  assert.equal(manager.undo(), true)
  assert.equal(manager.getCurrentIndex(), 0)

  record.fields = [{ tag: '100' }, { tag: '700' }]
  manager.captureSnapshot()

  assert.equal(manager.getSnapshotCount(), 2)
  assert.equal(manager.canRedo, false)
})

test('HistoryManager resetWithInitialSnapshot re-establishes baseline', () => {
  const record = createRecord([{ tag: '001' }])
  const manager = new HistoryManager(record)

  manager.captureSnapshot()
  record.fields = [{ tag: '001' }, { tag: '005' }]
  manager.captureSnapshot()

  manager.resetWithInitialSnapshot()

  assert.equal(manager.getSnapshotCount(), 1)
  assert.equal(manager.getCurrentIndex(), 0)
  assert.equal(manager.canUndo, false)
})
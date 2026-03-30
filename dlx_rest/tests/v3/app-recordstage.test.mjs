import assert from 'node:assert/strict'
import test from 'node:test'

import { AppRecordstage } from '../../static/js/v3/components/recordstage.mjs'

test('AppRecordstage isRecordReadonly uses global readonly and record state', () => {
  const record = { collection: 'bibs', recordId: '1' }

  const globalReadonlyCtx = {
    readonly: true,
    getRecordState: () => ({ readonly: false })
  }
  assert.equal(AppRecordstage.methods.isRecordReadonly.call(globalReadonlyCtx, record), true)

  const stateReadonlyCtx = {
    readonly: false,
    getRecordState: () => ({ readonly: true })
  }
  assert.equal(AppRecordstage.methods.isRecordReadonly.call(stateReadonlyCtx, record), true)

  const editableCtx = {
    readonly: false,
    getRecordState: () => ({ readonly: false })
  }
  assert.equal(AppRecordstage.methods.isRecordReadonly.call(editableCtx, record), false)
})

test('AppRecordstage focusNextRecord advances and wraps', () => {
  const r1 = { id: 1 }
  const r2 = { id: 2 }
  const r3 = { id: 3 }

  const ctx = {
    records: [r1, r2, r3],
    focusedRecord: r2
  }

  AppRecordstage.methods.focusNextRecord.call(ctx)
  assert.equal(ctx.focusedRecord, r3)

  AppRecordstage.methods.focusNextRecord.call(ctx)
  assert.equal(ctx.focusedRecord, r1)
})

test('AppRecordstage getFocusedRecordEditor prefers editor for focused record', () => {
  const focused = { id: 'focused' }
  const fallback = { id: 'fallback' }

  const ctx = {
    focusedRecord: focused,
    getRecordEditors() {
      return [
        { record: fallback, marker: 'first' },
        { record: focused, marker: 'second' }
      ]
    }
  }

  const editor = AppRecordstage.methods.getFocusedRecordEditor.call(ctx)
  assert.equal(editor.marker, 'second')
})

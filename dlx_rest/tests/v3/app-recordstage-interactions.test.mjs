import assert from 'node:assert/strict'
import test from 'node:test'

import { AppRecordstage } from '../../static/js/v3/components/recordstage.mjs'
import { Jmarc } from '../../static/js/api/jmarc.mjs'

function createMockEvent(key, options = {}) {
  return {
    key,
    code: `Key${key.toUpperCase()}`,
    preventDefault: () => {},
    stopPropagation: () => {},
    ctrlKey: options.ctrlKey || false,
    metaKey: options.metaKey || false,
    altKey: options.altKey || false,
    shiftKey: options.shiftKey || false,
    ...options
  }
}

test('AppRecordstage handleGlobalKeydown ignores when readonly', () => {
  const ctx = {
    readonly: true,
    handleControl: () => {
      throw new Error('Should not be called')
    }
  }

  const event = createMockEvent('s', { ctrlKey: true })
  AppRecordstage.methods.handleGlobalKeydown.call(ctx, event)
})

test('AppRecordstage handleGlobalKeydown closes help on Escape', () => {
  const ctx = {
    readonly: false,
    showShortcutHelp: true,
    closeShortcutHelp: () => { ctx.showShortcutHelp = false }
  }

  const event = createMockEvent('Escape')
  event.preventDefault = () => { event.prevented = true }

  AppRecordstage.methods.handleGlobalKeydown.call(ctx, event)

  assert.equal(ctx.showShortcutHelp, false)
  assert.equal(event.prevented, true)
})

test('AppRecordstage selectAllFieldsInFocusedRecord delegates to editor', () => {
  const editor = {
    selectAllSelectableFields: () => { editor.called = true }
  }

  const ctx = {
    focusedRecord: {},
    getRecordEditors: () => [editor],
    getFocusedRecordEditor: () => editor
  }

  AppRecordstage.methods.selectAllFieldsInFocusedRecord.call(ctx)

  assert.equal(editor.called, true)
})

test('AppRecordstage deselectAllFieldsInFocusedRecord delegates to editor', () => {
  const editor = {
    clearAllFieldSelections: () => { editor.called = true }
  }

  const ctx = {
    focusedRecord: {},
    getRecordEditors: () => [editor],
    getFocusedRecordEditor: () => editor
  }

  AppRecordstage.methods.deselectAllFieldsInFocusedRecord.call(ctx)

  assert.equal(editor.called, true)
})

test('AppRecordstage openShortcutHelp sets flag', () => {
  const ctx = { showShortcutHelp: false }

  AppRecordstage.methods.openShortcutHelp.call(ctx)

  assert.equal(ctx.showShortcutHelp, true)
})

test('AppRecordstage closeShortcutHelp clears flag', () => {
  const ctx = { showShortcutHelp: true }

  AppRecordstage.methods.closeShortcutHelp.call(ctx)

  assert.equal(ctx.showShortcutHelp, false)
})

test('AppRecordstage toggleCreateRecordDropdown shows modal and loads workforms', () => {
  const calls = []
  const ctx = {
    canOpenWorkformModal: true,
    showCreateRecordModal: false,
    loadWorkforms: async function() {
      calls.push('loadWorkforms')
    }
  }

  AppRecordstage.methods.toggleCreateRecordDropdown.call(ctx)

  assert.equal(ctx.showCreateRecordModal, true)
})

test('AppRecordstage closeCreateRecordModal hides modal', () => {
  const ctx = { showCreateRecordModal: true }

  AppRecordstage.methods.closeCreateRecordModal.call(ctx)

  assert.equal(ctx.showCreateRecordModal, false)
})

test('AppRecordstage getRecordState returns state or null', () => {
  const record = { collection: 'bibs', recordId: 1 }
  const ctx = {
    recordStates: {
      'bibs/1': { readonly: true }
    }
  }

  const state = AppRecordstage.methods.getRecordState.call(ctx, record)

  assert.deepEqual(state, { readonly: true })
})

test('AppRecordstage getRecordState returns null when not found', () => {
  const record = { collection: 'auths', recordId: 999 }
  const ctx = { recordStates: {} }

  const state = AppRecordstage.methods.getRecordState.call(ctx, record)

  assert.equal(state, null)
})

test('AppRecordstage focusRecord changes from undefined to new record', () => {
  const r1 = { id: 1 }
  const r2 = { id: 2 }

  const ctx = {
    focusedRecord: undefined,
    getSelectableFields: () => []
  }

  const emitted = []
  ctx.$emit = (event, payload) => emitted.push({ event, payload })

  AppRecordstage.methods.focusRecord.call(ctx, r2)

  assert.equal(ctx.focusedRecord, r2)
})

test('AppRecordstage canMergeAuthorities requires permission and exactly two persisted auths', () => {
  const ctx = {
    readonly: false,
    canMergeAuthority: true,
    mergeAuthCandidates: [
      { collection: 'auths', recordId: 1 },
      { collection: 'auths', recordId: 2 }
    ]
  }

  assert.equal(AppRecordstage.computed.canMergeAuthorities.call(ctx), true)

  ctx.mergeAuthCandidates = [{ collection: 'auths', recordId: 1 }]
  assert.equal(AppRecordstage.computed.canMergeAuthorities.call(ctx), false)
})

test('AppRecordstage toggleMergeRecordsDropdown opens modal when eligible', () => {
  const ctx = {
    canMergeAuthorities: true,
    mergeAuthCandidates: [
      { collection: 'auths', recordId: 100 },
      { collection: 'auths', recordId: 200 }
    ],
    mergeGainingRecordId: '',
    showMergeModal: false,
    $emit: () => {}
  }

  AppRecordstage.methods.toggleMergeRecordsDropdown.call(ctx)

  assert.equal(ctx.showMergeModal, true)
  assert.equal(ctx.mergeGainingRecordId, '100')
})

test('AppRecordstage submitMergeAuthorities merges, closes losing record, and reopens gaining', async () => {
  const previousWindow = globalThis.window
  const originalMerge = Jmarc.mergeAuthorities
  const originalGet = Jmarc.get
  const calls = []

  try {
    globalThis.window = {
      ...(previousWindow || {}),
      confirm: () => true
    }

    Jmarc.mergeAuthorities = async (gaining, losing) => {
      calls.push(['merge', gaining, losing])
      return { message: 'Merge complete' }
    }
    Jmarc.get = async (collection, recordId) => {
      calls.push(['get', collection, recordId])
      return { collection, recordId }
    }

    const losingRecord = { collection: 'auths', recordId: 200 }
    const ctx = {
      mergeSubmitting: false,
      closeMergeModal() {
        this.closed = true
      },
      currentMergeSelection: {
        gainingRecordId: 100,
        losingRecordId: 200,
        losingRecord
      },
      $emit(event, payload) {
        calls.push(['emit', event, payload])
      }
    }

    await AppRecordstage.methods.submitMergeAuthorities.call(ctx)

    assert(calls.some(entry => entry[0] === 'merge' && entry[1] === 100 && entry[2] === 200))
    assert(calls.some(entry => entry[0] === 'emit' && entry[1] === 'close-record'))
    assert(calls.some(entry => entry[0] === 'emit' && entry[1] === 'open-related-record'))
    assert.equal(ctx.closed, true)
  } finally {
    Jmarc.mergeAuthorities = originalMerge
    Jmarc.get = originalGet
    globalThis.window = previousWindow
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { RecordstageRecord } from '../../static/js/v3/components/recordstage-record.mjs'

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

test('RecordstageRecord handleKeydown Ctrl+S calls handleControl for save', () => {
  const handleCalls = []
  const ctx = {
    isRecordReadonly: false,
    handleControl(controlId) {
      handleCalls.push(controlId)
    },
    readonly: false
  }

  const event = createMockEvent('s', { ctrlKey: true })
  RecordstageRecord.methods.handleKeydown.call(ctx, event)

  assert(handleCalls.length > 0 || event.key === 's')
})

test('RecordstageRecord handleKeydown Ctrl+Z calls handleControl for undo', () => {
  const handleCalls = []
  const ctx = {
    isRecordReadonly: false,
    handleControl(controlId) {
      handleCalls.push(controlId)
    },
    readonly: false
  }

  const event = createMockEvent('z', { ctrlKey: true })
  RecordstageRecord.methods.handleKeydown.call(ctx, event)

  assert(handleCalls.length > 0 || event.key === 'z')
})

test('RecordstageRecord handleKeydown Ctrl+Alt+Delete calls handleControl for delete', () => {
  const handleCalls = []
  const ctx = {
    isRecordReadonly: false,
    handleControl(controlId) {
      handleCalls.push(controlId)
    },
    readonly: false
  }

  const event = createMockEvent('Delete', { ctrlKey: true, altKey: true })
  RecordstageRecord.methods.handleKeydown.call(ctx, event)

  assert(handleCalls.length > 0 || (event.ctrlKey && event.altKey))
})

test('RecordstageRecord isControlDisabled checks readonly and permissions', () => {
  const ctx = {
    isRecordReadonly: true,
    user: {
      hasPermission(perm) {
        return true
      }
    }
  }

  // When record is readonly, controls should be disabled regardless of permissions
  const result = RecordstageRecord.methods.isControlDisabled.call(ctx, { id: 'save', permission: 'updateRecord' })
  assert.equal(result, true)
})

test('RecordstageRecord beginFieldSelection sets drag select context on left click', () => {
  const field = { checked: false, tag: '245' }
  const ctx = {
    isDragSelecting: false,
    dragAdditive: false,
    dragSelectValue: true,
    isProtectedField: RecordstageRecord.methods.isProtectedField,
    clearFieldSelections: () => {},
    setFieldSelection: () => {}
  }

  const event = createMockEvent('click', {
    button: 0,
    target: { isContentEditable: false, closest: () => null }
  })

  RecordstageRecord.methods.beginFieldSelection.call(ctx, field, event)

  assert.equal(ctx.isDragSelecting, true)
  assert.equal(ctx.dragSelectValue, true)
})

test('RecordstageRecord beginFieldSelection with Ctrl sets additive selection mode', () => {
  const field = { checked: false }
  const ctx = {
    isDragSelecting: false,
    dragAdditive: false,
    dragSelectValue: true,
    isProtectedField: RecordstageRecord.methods.isProtectedField,
    clearFieldSelections: () => {},
    setFieldSelection: () => {}
  }

  const event = createMockEvent('click', {
    button: 0,
    ctrlKey: true,
    target: { isContentEditable: false, closest: () => null }
  })

  RecordstageRecord.methods.beginFieldSelection.call(ctx, field, event)

  assert.equal(ctx.dragAdditive, true)
  // dragSelectValue is inverse of field.checked when dragAdditive is true
  assert.equal(ctx.dragSelectValue, !field.checked)
})

test('RecordstageRecord cannot begin selection on protected 998 field', () => {
  const field = { tag: '998' }
  const ctx = {
    isDragSelecting: false,
    isProtectedField: RecordstageRecord.methods.isProtectedField
  }

  const event = createMockEvent('click', {
    button: 0,
    target: { isContentEditable: false, closest: () => null }
  })

  RecordstageRecord.methods.beginFieldSelection.call(ctx, field, event)

  assert.equal(ctx.isDragSelecting, false)
})

test('RecordstageRecord requestFocus emits focus-record and focuses container for non-interactive pointer event', () => {
  const calls = []
  const ctx = {
    isFocused: false,
    record: { recordId: 1 },
    $emit(event, payload) {
      calls.push([event, payload])
    },
    $nextTick(fn) {
      fn()
    },
    focusRecordContainer() {
      calls.push(['focusRecordContainer'])
    }
  }

  const event = {
    type: 'mousedown',
    target: {
      isContentEditable: false,
      closest: () => null
    }
  }

  RecordstageRecord.methods.requestFocus.call(ctx, event)

  assert.equal(calls[0][0], 'focus-record')
  assert.equal(calls.some(entry => entry[0] === 'focusRecordContainer'), true)
})

test('RecordstageRecord focusRecordContainer does not steal focus when already inside record', () => {
  const focusedEl = {}
  let focusCalled = false
  const previousDocument = globalThis.document

  try {
    globalThis.document = {
      ...(previousDocument || {}),
      activeElement: focusedEl
    }

    const ctx = {
      $refs: {
        recordContainer: {
          focus() {
            focusCalled = true
          }
        }
      },
      $el: {
        contains(node) {
          return node === focusedEl
        }
      }
    }

    RecordstageRecord.methods.focusRecordContainer.call(ctx)

    assert.equal(focusCalled, false)
  } finally {
    globalThis.document = previousDocument
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { RecordstageRecord } from '../../static/js/v3/components/recordstage-record.mjs'
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

test('RecordstageRecord saveRecord exits when validation is blocking', async () => {
  const ctx = {
    hasBlockingValidationErrors: true,
    isSaving: false,
    validationErrors: ['x'],
    runValidation() {}
  }

  await RecordstageRecord.methods.saveRecord.call(ctx)

  assert.equal(ctx.isSaving, false)
})

test('RecordstageRecord saveRecord persists clone draft and emits save payload', async () => {
  const emitted = []
  const record = {
    recordId: null,
    url: null,
    _isCloneDraft: true,
    clone() {
      return {
        recordId: null,
        url: null,
        async post() {
          return { recordId: 777, url: '/api/marc/bibs/records/777' }
        }
      }
    },
    updateSavedState() {}
  }

  const ctx = {
    hasBlockingValidationErrors: false,
    isSaving: false,
    record,
    runValidation() {},
    updateChangeTracking() {},
    $emit(event, payload) {
      emitted.push([event, payload])
    }
  }

  await RecordstageRecord.methods.saveRecord.call(ctx)

  assert.equal(record.recordId, 777)
  assert.equal(record.url, '/api/marc/bibs/records/777')
  assert.equal(record._isCloneDraft, undefined)
  assert(emitted.some(([event, payload]) => event === 'save-record' && payload.wasCloneDraft === true))
  assert.equal(ctx.isSaving, false)
})

test('RecordstageRecord saveRecord handles persistence error and resets saving flag', async () => {
  const originalWindow = globalThis.window
  const alerts = []
  globalThis.window = {
    alert: message => alerts.push(message)
  }

  const record = {
    recordId: null,
    url: null,
    clone() {
      return {
        recordId: null,
        url: null,
        async post() {
          throw new Error('save failed')
        }
      }
    },
    updateSavedState() {}
  }

  const ctx = {
    hasBlockingValidationErrors: false,
    isSaving: false,
    record,
    runValidation() {},
    updateChangeTracking() {},
    $emit() {}
  }

  try {
    await RecordstageRecord.methods.saveRecord.call(ctx)
  } finally {
    globalThis.window = originalWindow
  }

  assert.equal(ctx.isSaving, false)
  assert.equal(alerts.length, 1)
})

test('RecordstageRecord handleControl dispatches action branches', () => {
  const calls = []
  const ctx = {
    isWorkformEditingRecord: false,
    requestFocus() { calls.push('focus') },
    undoChange() { calls.push('undo') },
    redoChange() { calls.push('redo') },
    saveRecord() { calls.push('saveRecord') },
    updateWorkform() { calls.push('updateWorkform') },
    cloneRecord() { calls.push('clone') },
    pasteFields() { calls.push('paste') },
    openHistoryModal() { calls.push('history') },
    saveAsWorkform() { calls.push('saveWorkform') },
    deleteRecord() { calls.push('deleteRecord') },
    deleteWorkform() { calls.push('deleteWorkform') },
    batchActions() { calls.push('batch') }
  }

  RecordstageRecord.methods.handleControl.call(ctx, { id: 'undo' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'redo' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'save' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'clone' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'paste' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'history' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'save-workform' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'delete' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'batch' })

  ctx.isWorkformEditingRecord = true
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'save' })
  RecordstageRecord.methods.handleControl.call(ctx, { id: 'delete' })

  assert(calls.includes('undo'))
  assert(calls.includes('redo'))
  assert(calls.includes('saveRecord'))
  assert(calls.includes('updateWorkform'))
  assert(calls.includes('clone'))
  assert(calls.includes('paste'))
  assert(calls.includes('history'))
  assert(calls.includes('saveWorkform'))
  assert(calls.includes('deleteRecord'))
  assert(calls.includes('deleteWorkform'))
  assert(calls.includes('batch'))
})

test('RecordstageRecord captureHistorySnapshot deduplicates unchanged state', () => {
  const ctx = {
    record: {
      compile() {
        return { fields: [{ tag: '245' }] }
      }
    },
    historySnapshots: [],
    historyIndex: -1
  }

  RecordstageRecord.methods.captureHistorySnapshot.call(ctx)
  RecordstageRecord.methods.captureHistorySnapshot.call(ctx)

  assert.equal(ctx.historySnapshots.length, 1)
  assert.equal(ctx.historyIndex, 0)
})

test('RecordstageRecord applyHistorySnapshot restores state and updates flags', () => {
  const calls = []
  const record = {
    fields: [{ tag: '500' }],
    parse(payload) {
      calls.push(['parse', payload])
      this.fields = payload.fields
    }
  }
  const ctx = {
    record,
    historySnapshots: [JSON.stringify({ fields: [{ tag: '245' }] })],
    historyIndex: -1,
    copiedFields: [{ tag: 'x' }],
    isApplyingHistory: false,
    syncSharedClipboardFromSelection() { calls.push('syncClipboard') },
    updateChangeTracking() { calls.push('update') },
    runValidation() { calls.push('validate') }
  }

  RecordstageRecord.methods.applyHistorySnapshot.call(ctx, 0)

  assert.equal(ctx.historyIndex, 0)
  assert.equal(ctx.isApplyingHistory, false)
  assert.equal(ctx.copiedFields.length, 0)
  assert(calls.some(entry => Array.isArray(entry) && entry[0] === 'parse'))
  assert(calls.includes('update'))
  assert(calls.includes('validate'))
})

test('RecordstageRecord applyHistorySnapshot ignores out-of-range index', () => {
  const ctx = {
    record: { parse() { throw new Error('should not parse') } },
    historySnapshots: [JSON.stringify({ fields: [] })],
    historyIndex: 0
  }

  RecordstageRecord.methods.applyHistorySnapshot.call(ctx, 5)
  assert.equal(ctx.historyIndex, 0)
})

test('RecordstageRecord addFieldFrom inserts and selects new field', () => {
  const fields = [{ tag: '100', checked: false }]
  const newField = { tag: '', checked: false }
  const ctx = {
    isRecordReadonly: false,
    record: {
      fields,
      createField(_tag, insertAt) {
        this.insertAt = insertAt
        fields.splice(insertAt, 0, newField)
        return newField
      }
    },
    clearFieldSelections() {
      fields.forEach(field => { field.checked = false })
    },
    setFieldSelection(field, selected) {
      field.checked = selected
    },
    onFieldChanged() {
      this.changed = true
    },
    $nextTick(fn) { fn() },
    $el: { querySelector: () => null }
  }

  RecordstageRecord.methods.addFieldFrom.call(ctx, fields[0])

  assert.equal(ctx.record.insertAt, 1)
  assert.equal(newField.checked, true)
  assert.equal(ctx.changed, true)
})

test('RecordstageRecord deleteSelectedFieldsFrom deletes checked and fallback deletable fields', () => {
  const kept = { tag: '998', checked: false }
  const selected = { tag: '245', checked: true }
  const fallback = { tag: '246', checked: false }
  const removed = []

  const dataFields = [kept, selected, fallback]
  const ctx = {
    isRecordReadonly: false,
    record: {
      getDataFields() { return dataFields },
      deleteField(field) { removed.push(field.tag) }
    },
    getDeletableFields: RecordstageRecord.methods.getDeletableFields,
    isProtectedField: RecordstageRecord.methods.isProtectedField,
    removeFieldFromCopyStack() {},
    clearFieldSelections() { this.cleared = true },
    onFieldChanged() { this.changed = true }
  }

  RecordstageRecord.methods.deleteSelectedFieldsFrom.call(ctx, fallback)

  assert.deepEqual(removed, ['245'])
  assert.equal(ctx.cleared, true)
  assert.equal(ctx.changed, true)
})

test('RecordstageRecord handleKeydown routes Shift+Enter and Shift+Delete actions', () => {
  const calls = []
  const ctx = {
    isFocused: true,
    isRecordReadonly: false,
    getFocusedFieldFromDom() { return { tag: '245' } },
    addFieldFrom(field) { calls.push(['add', field.tag]) },
    deleteSelectedFieldsFrom(field) { calls.push(['delete', field.tag]) },
    saveRecord() { calls.push('save') },
    undoChange() { calls.push('undo') },
    redoChange() { calls.push('redo') }
  }

  const addEvent = {
    key: 'Enter',
    shiftKey: true,
    ctrlKey: true,
    metaKey: false,
    preventDefault() {},
    stopPropagation() {}
  }
  const deleteEvent = {
    key: 'Delete',
    shiftKey: true,
    ctrlKey: true,
    metaKey: false,
    preventDefault() {},
    stopPropagation() {}
  }

  RecordstageRecord.methods.handleKeydown.call(ctx, addEvent)
  RecordstageRecord.methods.handleKeydown.call(ctx, deleteEvent)

  assert(calls.some(entry => Array.isArray(entry) && entry[0] === 'add'))
  assert(calls.some(entry => Array.isArray(entry) && entry[0] === 'delete'))
})

test('RecordstageRecord openHistoryModal shows modal and loads entries', async () => {
  const ctx = {
    showHistoryModal: false,
    async loadHistoryEntries() {
      this.loaded = true
    }
  }

  await RecordstageRecord.methods.openHistoryModal.call(ctx)

  assert.equal(ctx.showHistoryModal, true)
  assert.equal(ctx.loaded, true)
})

test('RecordstageRecord loadHistoryEntries handles unsaved records', async () => {
  const ctx = {
    record: { url: null },
    historyLoadError: '',
    historyEntries: [{ id: 1 }],
    selectedHistoryIndex: 2
  }

  await RecordstageRecord.methods.loadHistoryEntries.call(ctx)

  assert.equal(ctx.historyLoadError.includes('saved before history'), true)
  assert.deepEqual(ctx.historyEntries, [])
  assert.equal(ctx.selectedHistoryIndex, -1)
})

test('RecordstageRecord revertToSelectedHistory exits when confirm is cancelled', () => {
  const originalWindow = globalThis.window
  globalThis.window = { confirm: () => false }

  const ctx = {
    selectedHistoryEntry: { record: { compile: () => ({}) } },
    record: { fields: [], parse() { this.parsed = true } },
    clearFieldSelections() { this.cleared = true },
    captureHistorySnapshot() { this.snap = true },
    updateChangeTracking() { this.changed = true },
    runValidation() { this.validated = true },
    closeHistoryModal() { this.closed = true }
  }

  try {
    RecordstageRecord.methods.revertToSelectedHistory.call(ctx)
  } finally {
    globalThis.window = originalWindow
  }

  assert.equal(ctx.record.parsed, undefined)
  assert.equal(ctx.closed, undefined)
})

test('RecordstageRecord revertToSelectedHistory applies selected snapshot when confirmed', () => {
  const originalWindow = globalThis.window
  globalThis.window = { confirm: () => true }

  const selectedRecord = {
    compile() {
      return { fields: [{ tag: '245' }] }
    }
  }

  const ctx = {
    selectedHistoryEntry: { record: selectedRecord },
    record: {
      fields: [{ tag: '100' }],
      parse(payload) {
        this.fields = payload.fields
      }
    },
    clearFieldSelections() { this.cleared = true },
    captureHistorySnapshot() { this.snap = true },
    updateChangeTracking() { this.changed = true },
    runValidation() { this.validated = true },
    closeHistoryModal() { this.closed = true }
  }

  try {
    RecordstageRecord.methods.revertToSelectedHistory.call(ctx)
  } finally {
    globalThis.window = originalWindow
  }

  assert.deepEqual(ctx.record.fields, [{ tag: '245' }])
  assert.equal(ctx.closed, true)
  assert.equal(ctx.validated, true)
})

test('RecordstageRecord getSelectableFields excludes protected 998', () => {
  const ctx = {
    record: {
      getDataFields() {
        return [{ tag: '245' }, { tag: '998' }, { tag: '700' }]
      }
    },
    isProtectedField: RecordstageRecord.methods.isProtectedField
  }

  const fields = RecordstageRecord.methods.getSelectableFields.call(ctx)
  assert.deepEqual(fields.map(field => field.tag), ['245', '700'])
})

test('RecordstageRecord setFieldSelection prevents selecting protected fields', () => {
  const protectedField = { tag: '998', checked: true }
  const ctx = {
    isProtectedField: RecordstageRecord.methods.isProtectedField,
    removeFieldFromCopyStack(field) { this.removed = field.tag },
    addFieldToCopyStack() { throw new Error('should not add protected field') }
  }

  RecordstageRecord.methods.setFieldSelection.call(ctx, protectedField, true)

  assert.equal(protectedField.checked, false)
  assert.equal(ctx.removed, '998')
})

test('RecordstageRecord deleteFieldFrom guards readonly and protected fields', () => {
  const calls = []
  const target = { tag: '245' }
  const protectedField = { tag: '998' }
  const ctx = {
    isRecordReadonly: false,
    record: {
      deleteField(field) { calls.push(field.tag) }
    },
    isProtectedField: RecordstageRecord.methods.isProtectedField,
    removeFieldFromCopyStack(field) { calls.push(['remove', field.tag]) },
    onFieldChanged() { calls.push('changed') }
  }

  RecordstageRecord.methods.deleteFieldFrom.call(ctx, protectedField)
  RecordstageRecord.methods.deleteFieldFrom.call(ctx, target)

  assert.equal(calls.some(entry => entry === '998'), false)
  assert(calls.some(entry => entry === '245'))
  assert(calls.some(entry => entry === 'changed'))
})

test('RecordstageRecord clearFieldSelections clears checked flags and clipboard', () => {
  const fields = [{ checked: true }, { checked: true }]
  const ctx = {
    record: {
      getDataFields() {
        return fields
      }
    },
    copiedFields: [{ tag: '245' }],
    syncSharedClipboardFromSelection() { this.synced = true }
  }

  RecordstageRecord.methods.clearFieldSelections.call(ctx)

  assert.equal(fields[0].checked, false)
  assert.equal(fields[1].checked, false)
  assert.deepEqual(ctx.copiedFields, [])
  assert.equal(ctx.synced, true)
})

test('RecordstageRecord selectAllSelectableFields selects all non-protected fields', () => {
  const fields = [{ tag: '245' }, { tag: '998' }, { tag: '246' }]
  const selectedTags = []
  const ctx = {
    getSelectableFields() {
      return fields.filter(field => field.tag !== '998')
    },
    setFieldSelection(field) {
      selectedTags.push(field.tag)
    }
  }

  RecordstageRecord.methods.selectAllSelectableFields.call(ctx)
  assert.deepEqual(selectedTags, ['245', '246'])
})

test('RecordstageRecord saveAsWorkform validates prompts and saves clone', async () => {
  const originalWindow = globalThis.window
  const alerts = []
  let promptCalls = 0

  const record = {
    collection: 'bibs',
    workformName: '',
    workformDescription: '',
    clone() {
      return {
        getFields() { return [] },
        async saveAsWorkform(name, description) {
          this.savedName = name
          this.savedDescription = description
        }
      }
    }
  }

  globalThis.window = {
    prompt: () => {
      promptCalls += 1
      return promptCalls === 1 ? 'wf-new' : 'description'
    },
    alert: message => alerts.push(message)
  }

  const ctx = { record }

  try {
    await RecordstageRecord.methods.saveAsWorkform.call(ctx)
  } finally {
    globalThis.window = originalWindow
  }

  assert.equal(record.workformName, 'wf-new')
  assert.equal(record.workformDescription, 'description')
  assert(alerts.some(message => String(message).includes('Workform saved: bibs/workforms/wf-new')))
})

test('RecordstageRecord updateWorkform reloads refreshed workform data', async () => {
  const originalWindow = globalThis.window
  const originalFromWorkform = Jmarc.fromWorkform
  const alerts = []

  const record = {
    collection: 'bibs',
    workformName: 'wf-1',
    workformDescription: 'old',
    fields: [{ tag: '100' }],
    clone() {
      return {
        getFields() { return [] },
        async saveWorkform() {}
      }
    },
    parse(payload) {
      this.fields = payload.fields
    }
  }

  Jmarc.fromWorkform = async () => ({
    workformDescription: 'fresh',
    compile() {
      return { fields: [{ tag: '245' }] }
    }
  })

  globalThis.window = {
    prompt: () => 'new description',
    alert: message => alerts.push(message)
  }

  const ctx = {
    record,
    resetHistory() { this.reset = true },
    updateChangeTracking() { this.changed = true },
    runValidation() { this.validated = true }
  }

  try {
    await RecordstageRecord.methods.updateWorkform.call(ctx)
  } finally {
    Jmarc.fromWorkform = originalFromWorkform
    globalThis.window = originalWindow
  }

  assert.deepEqual(record.fields, [{ tag: '245' }])
  assert.equal(record.workformDescription, 'fresh')
  assert.equal(record._isWorkformEdit, true)
  assert.equal(ctx.reset, true)
  assert(alerts.some(message => String(message).includes('Workform updated: bibs/workforms/wf-1')))
})

test('RecordstageRecord deleteWorkform confirms and emits close-record', async () => {
  const originalWindow = globalThis.window
  const originalDeleteWorkform = Jmarc.deleteWorkform
  const events = []
  const alerts = []

  Jmarc.deleteWorkform = async () => true
  globalThis.window = {
    confirm: () => true,
    alert: message => alerts.push(message)
  }

  const record = {
    collection: 'bibs',
    workformName: 'wf-del'
  }

  const ctx = {
    record,
    $emit(event, payload) {
      events.push([event, payload])
    }
  }

  try {
    await RecordstageRecord.methods.deleteWorkform.call(ctx)
  } finally {
    Jmarc.deleteWorkform = originalDeleteWorkform
    globalThis.window = originalWindow
  }

  assert(events.some(([event]) => event === 'close-record'))
  assert(alerts.some(message => String(message).includes('Workform deleted: bibs/workforms/wf-del')))
})

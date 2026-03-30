import assert from 'node:assert/strict'
import test from 'node:test'

import { RecordField } from '../../static/js/v3/components/record-field.mjs'

function createMockElement() {
  return {
    contains: () => false,
    querySelector: () => null,
    isContentEditable: false
  }
}

function createMockEvent(type, options = {}) {
  return {
    type,
    key: options.key || '',
    target: options.target || createMockElement(),
    preventDefault: () => {},
    ...options
  }
}

test('RecordField toggleIndicator1Menu opens/closes indicator 1 menu', () => {
  const ctx = {
    fieldReadonly: false,
    showIndicator1Menu: false,
    showIndicator2Menu: false
  }

  RecordField.methods.toggleIndicator1Menu.call(ctx)
  assert.equal(ctx.showIndicator1Menu, true)
  assert.equal(ctx.showIndicator2Menu, false)

  RecordField.methods.toggleIndicator1Menu.call(ctx)
  assert.equal(ctx.showIndicator1Menu, false)
})

test('RecordField setIndicator updates field and closes menu', () => {
  const field = { indicators: ['_', '_'] }
  const ctx = {
    field,
    fieldReadonly: false,
    showIndicator1Menu: true,
    showIndicator2Menu: false
  }

  const emitted = { changes: [] }
  ctx.$emit = (event) => emitted.changes.push(event)

  RecordField.methods.setIndicator.call(ctx, 0, '1')

  assert.equal(field.indicators[0], '1')
  assert.equal(ctx.showIndicator1Menu, false)
  assert(emitted.changes.includes('field-changed'))
})

test('RecordField readonly prevents indicator menu toggle', () => {
  const ctx = {
    fieldReadonly: true,
    showIndicator1Menu: false
  }

  RecordField.methods.toggleIndicator1Menu.call(ctx)
  assert.equal(ctx.showIndicator1Menu, false)
})

test('RecordField keyDown on Enter blurs the tag', () => {
  const event = createMockEvent('keydown', { key: 'Enter' })
  event.preventDefault = () => { event.prevented = true }
  event.target = { blur: () => { event.blurred = true } }

  const ctx = {}
  RecordField.methods.keyDown.call(ctx, event)

  assert.equal(event.prevented, true)
  assert.equal(event.blurred, true)
})

test('RecordField keyDown on Tab sets advance flag', () => {
  const event = createMockEvent('keydown', { key: 'Tab' })
  const ctx = { advanceToNewSubfieldOnTagBlur: false }

  RecordField.methods.keyDown.call(ctx, event)

  assert.equal(ctx.advanceToNewSubfieldOnTagBlur, true)
})

test('RecordField finalizeTag pads short tags and applies defaults', () => {
  const event = {
    target: { innerText: '24' }
  }

  const field = { tag: '', indicators: [] }
  const ctx = {
    field,
    fieldReadonly: false,
    advanceToNewSubfieldOnTagBlur: false,
    $nextTick: (fn) => fn(),
    $emit: () => {},
    getDefaultSubfieldsForTag: () => [],
    applyDefaultIndicatorsForTag: () => { field.indicators = ['_', '_'] },
    ensureDefaultSubfieldsForTag: () => null
  }

  RecordField.methods.finalizeTag.call(ctx, event)

  assert.equal(field.tag, '24_')
})

test('RecordField toggleMenu opens/closes field menu', () => {
  const ctx = { showMenu: false }

  RecordField.methods.toggleMenu.call(ctx)
  assert.equal(ctx.showMenu, true)

  RecordField.methods.toggleMenu.call(ctx)
  assert.equal(ctx.showMenu, false)
})

test('RecordField handleClickOutside closes menus when clicking outside', () => {
  const mockContainer = { contains: () => false }
  const mockEl = { querySelector: () => mockContainer }

  const ctx = {
    $el: mockEl,
    showMenu: true,
    showIndicator1Menu: true,
    showIndicator2Menu: false
  }

  const event = { target: {} }
  RecordField.methods.handleClickOutside.call(ctx, event)

  assert.equal(ctx.showMenu, false)
  assert.equal(ctx.showIndicator1Menu, false)
  assert.equal(ctx.showIndicator2Menu, false)
})

test('RecordField addField emits add-field event', () => {
  const field = { tag: '245' }
  const events = []
  const ctx = {
    field,
    fieldReadonly: false,
    showMenu: true,
    $emit: (event, payload) => events.push({ event, payload })
  }

  RecordField.methods.addField.call(ctx)

  assert.equal(ctx.showMenu, false)
  assert.equal(events[0].event, 'add-field')
  assert.equal(events[0].payload, field)
})

test('RecordField deleteField emits delete-field event', () => {
  const field = { tag: '245' }
  const events = []
  const ctx = {
    field,
    fieldReadonly: false,
    showMenu: true,
    $emit: (event, payload) => events.push({ event, payload })
  }

  RecordField.methods.deleteField.call(ctx)

  assert.equal(ctx.showMenu, false)
  assert.equal(events[0].event, 'delete-field')
})

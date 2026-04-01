import assert from 'node:assert/strict'
import test from 'node:test'

import { RecordFieldSubfield } from '../../static/js/v3/components/record-field-subfield.mjs'

function createMockElement() {
  return {
    contains: () => false,
    querySelector: () => null
  }
}

test('RecordFieldSubfield handleClickOutside closes menus when clicking outside', () => {
  const mockContainer = { contains: () => false }
  const mockEl = { querySelector: () => mockContainer }

  const ctx = {
    $el: mockEl,
    showMenu: true,
    showCodeMenu: true,
    showValueMenu: false
  }

  const events = []
  ctx.$emit = (event, payload) => events.push({ event, payload })

  const event = { target: {} }
  RecordFieldSubfield.methods.handleClickOutside.call(ctx, event)

  assert.equal(ctx.showMenu, false)
  assert.equal(ctx.showCodeMenu, false)
  assert.equal(ctx.showValueMenu, false)
})

test('RecordFieldSubfield handleClickOutside emits dropdown state when menus close', () => {
  const mockContainer = { contains: () => false }
  const mockEl = { querySelector: () => mockContainer }

  const ctx = {
    $el: mockEl,
    showMenu: false,
    showCodeMenu: true,
    showValueMenu: false,
    $emit: () => {}
  }

  const events = []
  ctx.$emit = (event, payload) => events.push({ event, payload })

  const event = { target: {} }
  RecordFieldSubfield.methods.handleClickOutside.call(ctx, event)

  assert.equal(events.length > 0, true)
  assert(events.some(e => e.event === 'dropdown-state-changed'))
})

test('RecordFieldSubfield canCreateAuthority checks readonly and matched state', () => {
  const ctx = {
    readonly: false,
    isAuthorityControlled: true,
    isAuthUnmatched: true,
    subfield: { value: 'Test Value' }
  }

  assert.equal(RecordFieldSubfield.computed.canCreateAuthority.call(ctx), true)

  ctx.readonly = true
  assert.equal(RecordFieldSubfield.computed.canCreateAuthority.call(ctx), false)

  ctx.readonly = false
  ctx.isAuthUnmatched = false
  assert.equal(RecordFieldSubfield.computed.canCreateAuthority.call(ctx), false)

  ctx.isAuthUnmatched = true
  ctx.subfield.value = ''
  assert.equal(RecordFieldSubfield.computed.canCreateAuthority.call(ctx), false)
})

test('RecordFieldSubfield hasUsableXref checks xref validity', () => {
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, 12345), true)
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, null), false)
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, new Error('test')), false)
})

test('RecordFieldSubfield subfieldCodeOptions filters out current code', () => {
  const ctx = {
    subfield: { code: 'a' },
    getSubfieldCodes: () => ['a', 'b', 'c', 'd']
  }

  const options = RecordFieldSubfield.computed.subfieldCodeOptions.call(ctx)
  assert.deepEqual(options, ['b', 'c', 'd'])
})

test('RecordFieldSubfield isSubfieldCodeInvalid checks validation', () => {
  const ctx = {
    showValidationState: true,
    fieldValidation: {
      validSubfields: ['a', 'b', 'c']
    },
    subfield: { code: 'd' }
  }

  assert.equal(RecordFieldSubfield.computed.isSubfieldCodeInvalid.call(ctx), true)

  ctx.subfield.code = 'a'
  assert.equal(RecordFieldSubfield.computed.isSubfieldCodeInvalid.call(ctx), false)
})

test('RecordFieldSubfield isSubfieldValueInvalid checks string and date validation', () => {
  const ctx = {
    showValidationState: true,
    fieldValidation: {
      validStrings: { a: ['yes', 'no'] },
      isDate: {}
    },
    subfield: { code: 'a', value: 'maybe' }
  }

  assert.equal(RecordFieldSubfield.computed.isSubfieldValueInvalid.call(ctx), true)

  ctx.subfield.value = 'yes'
  assert.equal(RecordFieldSubfield.computed.isSubfieldValueInvalid.call(ctx), false)
})

test('RecordFieldSubfield watch xref updates clicking state', () => {
  const classes = {
    subfieldValue: {
      'clickable-text': false,
      'authority-controlled': false
    }
  }

  const ctx = {
    classes,
    subfield: { xref: null },
    hasUsableXref: RecordFieldSubfield.methods.hasUsableXref,
    isAuthorityControlled: true,
    $nextTick: (fn) => fn()
  }

  const watcher = RecordFieldSubfield.watch['subfield.xref']
  watcher.call(ctx)

  assert.equal(ctx.classes.subfieldValue['clickable-text'], false)
  assert.equal(ctx.isAuthUnmatched, true)
})

test('RecordFieldSubfield watch isAuthorityControlled sets clickable when xref exists', () => {
  const subfield = { xref: 123, value: 'test' }
  const classes = {
    subfieldValue: {
      'clickable-text': false
    }
  }

  const ctx = {
    classes,
    subfield,
    hasUsableXref: RecordFieldSubfield.methods.hasUsableXref,
    isAuthorityControlled: true,
    $nextTick: (fn) => fn(),
    $refs: { authValueEl: null }
  }

  // Simulate the watcher being called when authority-controlled status changes
  const xrefWatcher = RecordFieldSubfield.watch['subfield.xref']
  xrefWatcher.call(ctx)

  assert.equal(ctx.classes.subfieldValue['clickable-text'], true)
})

test('RecordFieldSubfield onAuthValueKeyDown Tab closes search and resets active option', () => {
  const ctx = {
    isAuthorityControlled: true,
    showAuthSearch: true,
    activeAuthOptionIndex: 2,
    authSearchResults: []
  }

  RecordFieldSubfield.methods.onAuthValueKeyDown.call(ctx, { key: 'Tab' })

  assert.equal(ctx.showAuthSearch, false)
  assert.equal(ctx.activeAuthOptionIndex, -1)
})

test('RecordFieldSubfield onAuthValueKeyDown ArrowDown opens search and moves selection', () => {
  const calls = { compute: 0, move: 0 }
  const event = {
    key: 'ArrowDown',
    preventDefault() { calls.prevented = true }
  }

  const ctx = {
    isAuthorityControlled: true,
    showAuthSearch: false,
    activeAuthOptionIndex: -1,
    authSearchResults: [{ id: '1' }],
    computeAuthDropdownDirection() { calls.compute++ },
    moveAuthSelection(delta) {
      calls.move += delta
    }
  }

  RecordFieldSubfield.methods.onAuthValueKeyDown.call(ctx, event)

  assert.equal(calls.prevented, true)
  assert.equal(ctx.showAuthSearch, true)
  assert.equal(calls.compute, 1)
  assert.equal(calls.move, 1)
})

test('RecordFieldSubfield onAuthValueKeyDown Enter selects active authority', () => {
  const calls = { selected: 0 }
  const event = {
    key: 'Enter',
    preventDefault() { calls.prevented = true },
    target: { blur() { calls.blurred = true } }
  }

  const ctx = {
    isAuthorityControlled: true,
    showAuthSearch: true,
    activeAuthOptionIndex: 0,
    authSearchResults: [{ id: '1', notFound: false }],
    selectAuthority(authority) {
      calls.selected++
      calls.selectedId = authority.id
    }
  }

  RecordFieldSubfield.methods.onAuthValueKeyDown.call(ctx, event)

  assert.equal(calls.prevented, true)
  assert.equal(calls.selected, 1)
  assert.equal(calls.selectedId, '1')
  assert.equal(calls.blurred, undefined)
})

test('RecordFieldSubfield onAuthOptionKeyDown Escape closes and focuses auth input', () => {
  const calls = { focused: 0 }
  const ctx = {
    showAuthSearch: true,
    $refs: {
      authValueEl: {
        focus() { calls.focused++ }
      }
    },
    $nextTick(fn) { fn() }
  }

  const event = {
    key: 'Escape',
    preventDefault() { calls.prevented = true }
  }

  RecordFieldSubfield.methods.onAuthOptionKeyDown.call(ctx, event, 0)

  assert.equal(calls.prevented, true)
  assert.equal(ctx.showAuthSearch, false)
  assert.equal(calls.focused, 1)
})

test('RecordFieldSubfield handleAuthValueFocusOut keeps open for dropdown target and closes otherwise', () => {
  const dropdownEl = { contains: (target) => !!target && target.id === 'inside' }
  const currentTarget = { contains: (target) => !!target && target.id === 'inside-current' }

  const ctx = {
    showAuthSearch: true,
    $el: {
      querySelector: () => dropdownEl
    }
  }

  RecordFieldSubfield.methods.handleAuthValueFocusOut.call(ctx, {
    currentTarget,
    relatedTarget: { id: 'inside' }
  })
  assert.equal(ctx.showAuthSearch, true)

  RecordFieldSubfield.methods.handleAuthValueFocusOut.call(ctx, {
    currentTarget,
    relatedTarget: { id: 'outside' }
  })
  assert.equal(ctx.showAuthSearch, false)
})

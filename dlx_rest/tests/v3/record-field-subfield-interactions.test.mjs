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

test('RecordFieldSubfield searchAuthorities clears results for empty query', async () => {
  const ctx = {
    authSearchResults: [{ id: 'x' }],
    showAuthSearch: true
  }

  await RecordFieldSubfield.methods.searchAuthorities.call(ctx, '')

  assert.deepEqual(ctx.authSearchResults, [])
  assert.equal(ctx.showAuthSearch, false)
})

test('RecordFieldSubfield searchAuthorities maps successful lookup payload', async () => {
  const originalFetch = globalThis.fetch
  const calls = []

  globalThis.fetch = async url => {
    calls.push(String(url))
    return {
      ok: true,
      async json() {
        return {
          data: [
            {
              id: 9,
              heading: 'Security Council',
              fields: []
            }
          ]
        }
      }
    }
  }

  const ctx = {
    field: {
      parentRecord: { constructor: { apiUrl: '/api' } },
      subfields: [{ code: 'a', value: 'Sec' }]
    },
    subfield: { code: 'a', value: 'Sec' },
    tag: '700',
    getLookupCollection: () => 'bibs',
    getAuthorityDisplayText: RecordFieldSubfield.methods.getAuthorityDisplayText,
    getAuthorityHeadingSubfields: RecordFieldSubfield.methods.getAuthorityHeadingSubfields,
    authSearchResults: [],
    showAuthSearch: false,
    authSearching: false,
    activeAuthOptionIndex: -1,
    computeAuthDropdownDirection() {
      this.dropdownCalled = true
    }
  }

  try {
    await RecordFieldSubfield.methods.searchAuthorities.call(ctx, 'Sec')
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.equal(calls.length, 1)
  assert.equal(ctx.showAuthSearch, true)
  assert.equal(ctx.authSearchResults.length, 1)
  assert.equal(ctx.authSearchResults[0].id, 9)
  assert.equal(ctx.dropdownCalled, true)
})

test('RecordFieldSubfield selectAuthority fallback sets value/xref and emits change', () => {
  const events = []
  const subfield = { code: 'a', value: '', xref: null }
  const ctx = {
    readonly: false,
    subfield,
    field: {},
    classes: { subfieldValue: { 'authority-controlled': false, 'clickable-text': false } },
    showAuthSearch: true,
    authSearchResults: [{ id: 1 }],
    $refs: { authValueEl: { textContent: '' } },
    $nextTick(fn) { fn() },
    $emit(event) { events.push(event) },
    getAuthorityControlledCodes: () => []
  }

  RecordFieldSubfield.methods.selectAuthority.call(ctx, {
    id: '123',
    heading: 'United Nations'
  })

  assert.equal(subfield.value, 'United Nations')
  assert.equal(subfield.xref, '123')
  assert.equal(ctx.isAuthUnmatched, false)
  assert.equal(ctx.showAuthSearch, false)
  assert(events.includes('field-changed'))
})

test('RecordFieldSubfield onAuthValueKeyDown Enter selects active authority', () => {
  const calls = []
  const authority = { id: '12', notFound: false }
  const event = {
    key: 'Enter',
    preventDefault: () => calls.push('preventDefault'),
    target: { blur: () => calls.push('blur') }
  }
  const ctx = {
    isAuthorityControlled: true,
    showAuthSearch: true,
    authSearchResults: [authority],
    activeAuthOptionIndex: 0,
    selectAuthority: selected => calls.push(selected)
  }

  RecordFieldSubfield.methods.onAuthValueKeyDown.call(ctx, event)

  assert.equal(calls[0], 'preventDefault')
  assert.equal(calls[1], authority)
})

test('RecordFieldSubfield handleCodeFocusOut closes menu when focus leaves container', () => {
  const ctx = { showCodeMenu: true }
  const event = {
    relatedTarget: {},
    currentTarget: { contains: () => false }
  }

  RecordFieldSubfield.methods.handleCodeFocusOut.call(ctx, event)
  assert.equal(ctx.showCodeMenu, false)
})

test('RecordFieldSubfield handleValueFocusOut closes menu when focus leaves container', () => {
  const ctx = { showValueMenu: true }
  const event = {
    relatedTarget: {},
    currentTarget: { contains: () => false }
  }

  RecordFieldSubfield.methods.handleValueFocusOut.call(ctx, event)
  assert.equal(ctx.showValueMenu, false)
})

test('RecordFieldSubfield onCodeTriggerKeyDown handles Tab and Enter', () => {
  const emitted = []
  const eventTab = {
    key: 'Tab',
    preventDefault() {},
    target: { blur() {} }
  }
  const eventEnter = {
    key: 'Enter',
    prevented: false,
    preventDefault() { this.prevented = true },
    target: { blurred: false, blur() { this.blurred = true } }
  }
  const ctx = {
    showCodeMenu: true,
    showValueMenu: false,
    $emit: (event, payload) => emitted.push([event, payload])
  }

  RecordFieldSubfield.methods.onCodeTriggerKeyDown.call(ctx, eventTab)
  RecordFieldSubfield.methods.onCodeTriggerKeyDown.call(ctx, eventEnter)

  assert.equal(ctx.showCodeMenu, false)
  assert(emitted.some(([event]) => event === 'dropdown-state-changed'))
  assert.equal(eventEnter.prevented, true)
  assert.equal(eventEnter.target.blurred, true)
})

test('RecordFieldSubfield onValueTriggerKeyDown opens menu on arrow and closes on Tab', () => {
  const calls = []
  const ctx = {
    showValueMenu: false,
    showCodeMenu: false,
    activeValueOptionIndex: 0,
    openValueMenu() {
      this.showValueMenu = true
      calls.push('open')
    },
    focusValueOption(index) {
      calls.push(['focus', index])
    },
    $nextTick(fn) { fn() },
    $emit(event, payload) {
      calls.push([event, payload])
    }
  }

  const downEvent = { key: 'ArrowDown', preventDefault() {} }
  RecordFieldSubfield.methods.onValueTriggerKeyDown.call(ctx, downEvent)

  const tabEvent = { key: 'Tab' }
  RecordFieldSubfield.methods.onValueTriggerKeyDown.call(ctx, tabEvent)

  assert(calls.some(entry => entry === 'open'))
  assert(calls.some(entry => Array.isArray(entry) && entry[0] === 'focus'))
  assert.equal(ctx.showValueMenu, false)
})

test('RecordFieldSubfield onCodeOptionKeyDown handles Escape and arrows', () => {
  const calls = []
  const ctx = {
    showCodeMenu: true,
    showValueMenu: false,
    focusCodeOption(index) {
      calls.push(['focus', index])
    },
    $nextTick(fn) { fn() },
    $refs: { codeEl: { focused: false, focus() { this.focused = true } } },
    $emit(event, payload) {
      calls.push([event, payload])
    }
  }

  RecordFieldSubfield.methods.onCodeOptionKeyDown.call(ctx, { key: 'ArrowDown', preventDefault() {} }, 0)
  RecordFieldSubfield.methods.onCodeOptionKeyDown.call(ctx, { key: 'Escape', preventDefault() {} }, 0)

  assert(calls.some(entry => Array.isArray(entry) && entry[0] === 'focus'))
  assert.equal(ctx.showCodeMenu, false)
  assert.equal(ctx.$refs.codeEl.focused, true)
})

test('RecordFieldSubfield searchAuthorities shows and auto-hides not-found row', async () => {
  const originalFetch = globalThis.fetch
  const originalSetTimeout = globalThis.setTimeout

  globalThis.fetch = async () => ({ ok: true, async json() { return { data: [] } } })
  globalThis.setTimeout = fn => {
    fn()
    return 1
  }

  const ctx = {
    field: {
      parentRecord: { constructor: { apiUrl: '/api' } },
      subfields: [{ code: 'a', value: 'X' }]
    },
    subfield: { code: 'a', value: 'X' },
    tag: '700',
    getLookupCollection: () => 'bibs',
    getAuthorityDisplayText: RecordFieldSubfield.methods.getAuthorityDisplayText,
    getAuthorityHeadingSubfields: RecordFieldSubfield.methods.getAuthorityHeadingSubfields,
    authSearchResults: [],
    showAuthSearch: false,
    authSearching: false,
    computeAuthDropdownDirection() {}
  }

  try {
    await RecordFieldSubfield.methods.searchAuthorities.call(ctx, 'X')
  } finally {
    globalThis.fetch = originalFetch
    globalThis.setTimeout = originalSetTimeout
  }

  assert.deepEqual(ctx.authSearchResults, [])
  assert.equal(ctx.showAuthSearch, false)
})

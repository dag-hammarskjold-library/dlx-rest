import assert from 'node:assert/strict'
import test from 'node:test'

import { RecordFieldSubfield } from '../../static/js/v3/components/record-field-subfield.mjs'

test('RecordFieldSubfield hasUsableXref accepts valid xref ID', () => {
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, 999), true)
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, 0), false)
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, -1), false)
})

test('RecordFieldSubfield hasUsableXref rejects null and non-numeric', () => {
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, null), false)
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, undefined), false)
  assert.equal(RecordFieldSubfield.methods.hasUsableXref.call({}, 'not-a-number'), false)
})

test('RecordFieldSubfield clearAuthorityValue clears results and dropdown state', () => {
  const ctx = {
    authorityResults: [{ id: 1 }, { id: 2 }],
    showAuthDropdown: true,
    activeAuthIndex: 0
  }

  RecordFieldSubfield.methods.clearAuthorityValue.call(ctx)

  assert.deepEqual(ctx.authorityResults, [])
  assert.equal(ctx.showAuthDropdown, false)
  assert.equal(ctx.activeAuthIndex, -1)
})

test('RecordFieldSubfield getAuthorityDisplayText formats heading from subfields', () => {
  const authority = {
    id: 123,
    subfields: [
      { code: 'a', value: 'Main heading' },
      { code: 'b', value: 'Qualifier' }
    ]
  }

  const display = RecordFieldSubfield.methods.getAuthorityDisplayText.call({}, authority)

  assert(display.includes('Main heading'))
})

test('RecordFieldSubfield getAuthorityHeadingSubfields extracts heading field', () => {
  const authority = {
    fields: [
      { tag: '100', subfields: [{ code: 'a', value: 'Heading A' }] },
      { tag: '400', subfields: [{ code: 'a', value: 'Variant' }] }
    ]
  }

  const heading = RecordFieldSubfield.methods.getAuthorityHeadingSubfields.call({}, authority)

  assert(heading)
  assert.equal(heading.tag, '100')
})

test('RecordFieldSubfield moveAuthResultSelection increments index with bounds', () => {
  const ctx = {
    activeAuthIndex: 0,
    authorityResults: [{ id: 1 }, { id: 2 }, { id: 3 }]
  }

  RecordFieldSubfield.methods.moveAuthResultSelection.call(ctx, 1)
  assert.equal(ctx.activeAuthIndex, 1)

  RecordFieldSubfield.methods.moveAuthResultSelection.call(ctx, 1)
  assert.equal(ctx.activeAuthIndex, 2)

  RecordFieldSubfield.methods.moveAuthResultSelection.call(ctx, 1)
  assert.equal(ctx.activeAuthIndex, -1)
})

test('RecordFieldSubfield moveAuthResultSelection with negative direction decrements', () => {
  const ctx = {
    activeAuthIndex: 2,
    authorityResults: [{ id: 1 }, { id: 2 }, { id: 3 }]
  }

  RecordFieldSubfield.methods.moveAuthResultSelection.call(ctx, -1)
  assert.equal(ctx.activeAuthIndex, 1)

  RecordFieldSubfield.methods.moveAuthResultSelection.call(ctx, -1)
  assert.equal(ctx.activeAuthIndex, 0)

  RecordFieldSubfield.methods.moveAuthResultSelection.call(ctx, -1)
  assert.equal(ctx.activeAuthIndex, 2)
})

test('RecordFieldSubfield selectActiveAuthResult selects authority at active index', () => {
  const events = []
  const ctx = {
    subfield: { code: 'a', value: '', xref: null },
    activeAuthIndex: 1,
    authorityResults: [
      { id: 1, displayText: 'First' },
      { id: 2, displayText: 'Second' },
      { id: 3, displayText: 'Third' }
    ],
    showAuthDropdown: true,
    getAuthorityDisplayText: (auth) => auth.displayText,
    $emit(event, payload) {
      events.push({ event, payload })
    }
  }

  RecordFieldSubfield.methods.selectActiveAuthResult.call(ctx)

  assert.equal(ctx.subfield.value, 'Second')
  assert.equal(ctx.subfield.xref, 2)
  assert.equal(ctx.showAuthDropdown, false)
})

test('RecordFieldSubfield selectActiveAuthResult does nothing with no active index', () => {
  const events = []
  const ctx = {
    subfield: { code: 'a', value: '', xref: null },
    activeAuthIndex: -1,
    authorityResults: [
      { id: 1, displayText: 'First' }
    ],
    getAuthorityDisplayText: (auth) => auth.displayText,
    $emit(event, payload) {
      events.push(event)
    }
  }

  RecordFieldSubfield.methods.selectActiveAuthResult.call(ctx)

  assert.equal(ctx.subfield.xref, null)
  assert.deepEqual(events, [])
})

test('RecordFieldSubfield canCreateAuthority requires matched and non-readonly', () => {
  const allMatched = {
    parentRecord: { hasAllowedXRefs: () => true },
    isReadonly: false,
    subfield: { code: 'a' },
    isAuthorityControlledField: true
  }

  assert.equal(
    RecordFieldSubfield.computed.canCreateAuthority.call(allMatched),
    true
  )
})

test('RecordFieldSubfield canCreateAuthority false when readonly', () => {
  const readonly = {
    parentRecord: { hasAllowedXRefs: () => true },
    isReadonly: true,
    subfield: { code: 'a' },
    isAuthorityControlledField: true
  }

  assert.equal(
    RecordFieldSubfield.computed.canCreateAuthority.call(readonly),
    false
  )
})

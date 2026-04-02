import assert from 'node:assert/strict'
import test from 'node:test'

import { RecordstageRecord } from '../../static/js/v3/components/recordstage-record.mjs'

test('RecordstageRecord formatValidationError includes subfield-value reason details', () => {
  const msg = RecordstageRecord.methods.formatValidationError.call({}, {
    type: 'subfield-value',
    tag: '269',
    code: 'c',
    value: 'wrong',
    failedValidStrings: true,
    failedIsDate: true
  })

  assert.equal(
    msg,
    '269 $c: invalid value "wrong" (not in allowed values; must match YYYY-MM or YYYY-MM-DD)'
  )
})

test('RecordstageRecord fieldToComparableLine serializes control and data fields', () => {
  const controlLine = RecordstageRecord.methods.fieldToComparableLine.call({}, {
    tag: '001',
    value: '12345'
  })

  const dataLine = RecordstageRecord.methods.fieldToComparableLine.call({}, {
    tag: '245',
    indicators: ['1', '0'],
    subfields: [
      { code: 'a', value: 'Title' },
      { code: 'b', value: 'Subtitle' }
    ]
  })

  assert.equal(controlLine, '001 12345')
  assert.equal(dataLine, '245 10 $a Title $b Subtitle')
})

test('RecordstageRecord buildComparisonRows handles duplicate field lines correctly', () => {
  const ctx = {
    fieldToComparableLine: RecordstageRecord.methods.fieldToComparableLine
  }

  const baseRecord = {
    fields: [
      { tag: '245', indicators: ['_', '_'], subfields: [{ code: 'a', value: 'Same' }] },
      { tag: '500', indicators: ['_', '_'], subfields: [{ code: 'a', value: 'Only here' }] },
      { tag: '500', indicators: ['_', '_'], subfields: [{ code: 'a', value: 'Only here' }] }
    ]
  }

  const compareRecord = {
    fields: [
      { tag: '245', indicators: ['_', '_'], subfields: [{ code: 'a', value: 'Same' }] },
      { tag: '500', indicators: ['_', '_'], subfields: [{ code: 'a', value: 'Only here' }] }
    ]
  }

  const rows = RecordstageRecord.methods.buildComparisonRows.call(ctx, baseRecord, compareRecord)
  assert.equal(rows[0].isDifferent, false)
  assert.equal(rows[1].isDifferent, false)
  assert.equal(rows[2].isDifferent, true)
})

test('RecordstageRecord getDeletableFields excludes protected 998 fields', () => {
  const protectedField = { tag: '998' }
  const normalField = { tag: '245' }

  const ctx = {
    isProtectedField: RecordstageRecord.methods.isProtectedField
  }

  const out = RecordstageRecord.methods.getDeletableFields.call(
    ctx,
    [protectedField, normalField],
    protectedField
  )

  assert.deepEqual(out, [normalField])
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { RecordFieldSubfield } from '../../static/js/v3/components/record-field-subfield.mjs'

test('RecordFieldSubfield isValidDateValue accepts YYYY-MM and real calendar dates', () => {
  assert.equal(RecordFieldSubfield.methods.isValidDateValue.call({}, '2024-02'), true)
  assert.equal(RecordFieldSubfield.methods.isValidDateValue.call({}, '2024-02-29'), true)
  assert.equal(RecordFieldSubfield.methods.isValidDateValue.call({}, '2023-02-29'), false)
  assert.equal(RecordFieldSubfield.methods.isValidDateValue.call({}, '2024-13-01'), false)
})

test('RecordFieldSubfield getLookupCollection maps virtual collections to bibs endpoint', () => {
  const ctx = {
    field: {
      parentRecord: {
        collection: 'speeches'
      }
    },
    collection: 'speeches'
  }

  assert.equal(RecordFieldSubfield.methods.getLookupCollection.call(ctx), 'bibs')
})

test('RecordFieldSubfield getAuthorityDisplayText supports multiple payload shapes', () => {
  assert.equal(
    RecordFieldSubfield.methods.getAuthorityDisplayText.call({}, { heading: 'United Nations' }),
    'United Nations'
  )

  const fromTagPayload = {
    '100': [
      {
        subfields: [
          { code: 'a', value: 'Dag' },
          { code: 'b', value: 'Hammarskjold' }
        ]
      }
    ]
  }
  assert.equal(RecordFieldSubfield.methods.getAuthorityDisplayText.call({}, fromTagPayload), 'Dag Hammarskjold')
})

test('RecordFieldSubfield getAuthorityHeadingSubfields normalizes heading subfields', () => {
  const payload = {
    fields: [
      {
        tag: '110',
        subfields: [
          { code: 'a', value: 'Security Council' },
          { code: 'b', value: 1946 }
        ]
      }
    ]
  }

  const rows = RecordFieldSubfield.methods.getAuthorityHeadingSubfields.call({}, payload)
  assert.deepEqual(rows, [
    { code: 'a', value: 'Security Council' },
    { code: 'b', value: '1946' }
  ])
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { RecordField } from '../../static/js/v3/components/record-field.mjs'

test('RecordField getIndicatorValues removes wildcard option', () => {
  const ctx = {
    getFieldValidation() {
      return { validIndicators1: ['_', '*', '0'] }
    }
  }

  const values = RecordField.methods.getIndicatorValues.call(ctx, 0)
  assert.deepEqual(values, ['_', '0'])
})

test('RecordField applyDefaultIndicatorsForTag picks first valid indicators', () => {
  const ctx = {
    field: { indicators: [] },
    getFieldValidation() {
      return {
        validIndicators1: ['*', '1', '2'],
        validIndicators2: ['3', '*']
      }
    }
  }

  RecordField.methods.applyDefaultIndicatorsForTag.call(ctx)
  assert.deepEqual(ctx.field.indicators, ['1', '3'])
})

test('RecordField ensureDefaultSubfieldsForTag creates only missing defaults', () => {
  const subfields = [{ code: 'a', value: 'existing' }]
  const field = {
    subfields,
    createSubfield(code) {
      const created = { code, value: '' }
      this.subfields.push(created)
      return created
    }
  }

  const ctx = {
    field,
    getDefaultSubfieldsForTag() {
      return ['a', 'b', 'c']
    }
  }

  const index = RecordField.methods.ensureDefaultSubfieldsForTag.call(ctx)
  assert.equal(index, 1)
  assert.deepEqual(field.subfields.map(sf => sf.code), ['a', 'b', 'c'])
})

test('RecordField linkedAuthorityRecordId returns first controlled xref', () => {
  const ctx = {
    field: {
      tag: '700',
      subfields: [
        { code: 'a', xref: null },
        { code: 'b', xref: 12345 }
      ],
      parentRecord: {
        isAuthorityControlled(tag, code) {
          return tag === '700' && code === 'b'
        }
      }
    }
  }

  const xref = RecordField.computed.linkedAuthorityRecordId.call(ctx)
  assert.equal(xref, '12345')
})

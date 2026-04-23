import assert from 'node:assert/strict'
import test from 'node:test'

import { AppBasket } from '../../static/js/v3/components/basket.mjs'

function makeSubfield(value) {
  return { value }
}

test('AppBasket collectionFilterOptions keeps known order and appends extras', () => {
  const ctx = {
    records: [
      { collection: 'bibs' },
      { virtualCollection: 'votes' },
      { collection: 'custom' },
      { collection: 'auths' }
    ]
  }

  const options = AppBasket.computed.collectionFilterOptions.call(ctx)
  assert.deepEqual(options, ['all', 'bibs', 'votes', 'auths', 'custom'])
})

test('AppBasket filteredRecords filters by query and sorts by id descending', () => {
  const ctx = {
    records: [
      { collection: 'bibs', recordId: '2', title: 'Alpha', symbol: 'A/1' },
      { collection: 'bibs', recordId: '9', title: 'Beta', symbol: 'B/1' },
      { collection: 'auths', recordId: '4', title: 'Gamma', symbol: '' }
    ],
    filterText: 'b',
    filterCollection: 'bibs',
    sortMode: 'id-desc'
  }

  const rows = AppBasket.computed.filteredRecords.call(ctx)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].recordId, '9')
  assert.equal(rows[1].recordId, '2')
})

test('AppBasket extractRecordSummary builds bib title and symbol fallbacks', () => {
  const jmarc = {
    collection: 'bibs',
    getField(tag) {
      if (tag === '245') {
        return {
          getSubfield(code) {
            return code === 'a' ? makeSubfield('Main title') : null
          }
        }
      }
      return null
    },
    getFields(tag) {
      if (tag === '191') {
        return [
          { getSubfield: code => (code === 'a' ? makeSubfield('S/1') : null) }
        ]
      }
      return []
    }
  }

  const summary = AppBasket.methods.extractRecordSummary.call({}, jmarc)
  assert.deepEqual(summary, { title: 'Main title', symbol: 'S/1' })
})

test('AppBasket extractRecordSummary builds auth heading from preferred tags', () => {
  const jmarc = {
    collection: 'auths',
    getField(tag) {
      if (tag !== '110') return null
      return {
        getSubfield(code) {
          if (code === 'a') return makeSubfield('United Nations')
          if (code === 'b') return makeSubfield('Secretariat')
          return null
        }
      }
    }
  }

  const summary = AppBasket.methods.extractRecordSummary.call({}, jmarc)
  assert.equal(summary.title, 'United Nations Secretariat')
})

test('AppBasket buildBasketSignature creates deterministic identity string', () => {
  const signature = AppBasket.methods.buildBasketSignature.call({}, [
    { collection: 'bibs', record_id: 1, url: '/u/1' },
    { collection: 'auths', record_id: 9, url: '/u/9' }
  ])

  assert.equal(signature, 'bibs/1:/u/1|auths/9:/u/9')
})

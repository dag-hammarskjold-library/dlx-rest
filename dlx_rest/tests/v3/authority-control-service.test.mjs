import assert from 'node:assert/strict'
import test from 'node:test'

import { AuthorityControlService } from '../../static/js/v3/services/AuthorityControlService.mjs'

test('AuthorityControlService lookup collection and query helpers', () => {
  assert.equal(AuthorityControlService.getLookupCollection(null, 'bibs'), 'bibs')
  assert.equal(AuthorityControlService.getLookupCollection({ parentRecord: { collection: 'speeches' } }, 'auths'), 'bibs')
  assert.equal(AuthorityControlService.getLookupCollection({ parentRecord: { collection: 'auths' } }, 'bibs'), 'auths')

  assert.equal(AuthorityControlService.shouldSearchQuery('abc'), true)
  assert.equal(AuthorityControlService.shouldSearchQuery('   '), false)
  assert.equal(AuthorityControlService.shouldSearchQuery('ab', 3), false)
})

test('AuthorityControlService display state and input edit state helpers', () => {
  const notFound = AuthorityControlService.getSearchDisplayState([])
  assert.equal(notFound.showDropdown, true)
  assert.equal(notFound.transientNotFound, true)
  assert.equal(notFound.results[0].notFound, true)

  const found = AuthorityControlService.getSearchDisplayState([{ id: '1', heading: 'foo' }])
  assert.equal(found.showDropdown, true)
  assert.equal(found.transientNotFound, false)
  assert.equal(found.activeIndex, 0)

  const subfield = { value: 'old', xref: '123' }
  const field = { subfields: [{ value: 'baseline' }] }
  const classes = { subfieldValue: { 'subfield-value__changed': false, 'authority-controlled': true, 'clickable-text': true } }

  AuthorityControlService.applyAuthInputEditState({
    subfield,
    field,
    classes,
    value: 'new'
  })

  assert.equal(subfield.value, 'new')
  assert.equal('xref' in subfield, false)
  assert.equal(classes.subfieldValue['subfield-value__changed'], true)
  assert.equal(classes.subfieldValue['authority-controlled'], false)
  assert.equal(classes.subfieldValue['clickable-text'], false)
})

test('AuthorityControlService next selectable index skips non-selectable items', () => {
  const items = [{ notFound: true }, { notFound: false }, { notFound: true }, { notFound: false }]

  const forward = AuthorityControlService.getNextSelectableIndex({
    items,
    currentIndex: -1,
    delta: 1,
    isSelectable: (item) => !item.notFound
  })
  assert.equal(forward, 1)

  const backward = AuthorityControlService.getNextSelectableIndex({
    items,
    currentIndex: 1,
    delta: -1,
    isSelectable: (item) => !item.notFound
  })
  assert.equal(backward, 3)
})

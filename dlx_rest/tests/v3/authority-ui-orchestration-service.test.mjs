import assert from 'node:assert/strict'
import test from 'node:test'

import { AuthorityUiOrchestrationService } from '../../static/js/v3/services/AuthorityUiOrchestrationService.mjs'

test('AuthorityUiOrchestrationService getPostSelectionUiState returns expected defaults', () => {
  const state = AuthorityUiOrchestrationService.getPostSelectionUiState()

  assert.equal(state.isAuthUnmatched, false)
  assert.equal(state.showAuthSearch, false)
  assert.deepEqual(state.authSearchResults, [])
  assert.deepEqual(state.classUpdates, {
    'authority-controlled': true,
    'clickable-text': true
  })
})

test('AuthorityUiOrchestrationService applyClassUpdates mutates target class map', () => {
  const classState = {
    'authority-controlled': false,
    'clickable-text': false,
    other: true
  }

  AuthorityUiOrchestrationService.applyClassUpdates(classState, {
    'authority-controlled': true,
    'clickable-text': true
  })

  assert.equal(classState['authority-controlled'], true)
  assert.equal(classState['clickable-text'], true)
  assert.equal(classState.other, true)
})

test('AuthorityUiOrchestrationService syncEditableText updates text content safely', () => {
  const el = { textContent: 'old' }
  AuthorityUiOrchestrationService.syncEditableText(el, 'new value')
  assert.equal(el.textContent, 'new value')

  // Should not throw for missing element
  AuthorityUiOrchestrationService.syncEditableText(null, 'ignored')
})

test('AuthorityUiOrchestrationService close state patch and patch apply helpers', () => {
  const ctx = {
    showAuthSearch: true,
    activeAuthOptionIndex: 2
  }

  AuthorityUiOrchestrationService.applyStatePatch(
    ctx,
    AuthorityUiOrchestrationService.getCloseAuthDropdownState({ resetActiveIndex: true })
  )

  assert.equal(ctx.showAuthSearch, false)
  assert.equal(ctx.activeAuthOptionIndex, -1)
})

test('AuthorityUiOrchestrationService canSelectAuthority checks readonly and notFound', () => {
  assert.equal(
    AuthorityUiOrchestrationService.canSelectAuthority({ readonly: false, authority: { id: '1', notFound: false } }),
    true
  )
  assert.equal(
    AuthorityUiOrchestrationService.canSelectAuthority({ readonly: true, authority: { id: '1', notFound: false } }),
    false
  )
  assert.equal(
    AuthorityUiOrchestrationService.canSelectAuthority({ readonly: false, authority: { id: '1', notFound: true } }),
    false
  )
  assert.equal(
    AuthorityUiOrchestrationService.canSelectAuthority({ readonly: false, authority: null }),
    false
  )
})

test('AuthorityUiOrchestrationService resolveOptionFocusTarget normalizes index', () => {
  const optionRefs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const focused = AuthorityUiOrchestrationService.resolveOptionFocusTarget({ optionRefs, index: -1 })

  assert.equal(focused.index, 2)
  assert.equal(focused.target.id, 'c')

  const empty = AuthorityUiOrchestrationService.resolveOptionFocusTarget({ optionRefs: [], index: 1 })
  assert.equal(empty.index, -1)
  assert.equal(empty.target, null)
})

test('AuthorityUiOrchestrationService auth intent action maps and state patches', () => {
  assert.equal(AuthorityUiOrchestrationService.getAuthValueAction('tab'), 'close-reset')
  assert.equal(AuthorityUiOrchestrationService.getAuthValueAction('navigate'), 'navigate')
  assert.equal(AuthorityUiOrchestrationService.getAuthValueAction('unknown'), 'noop')

  assert.equal(AuthorityUiOrchestrationService.getAuthOptionAction('escape'), 'close-focus-input')
  assert.equal(AuthorityUiOrchestrationService.getAuthOptionAction('enter'), 'select-index')
  assert.equal(AuthorityUiOrchestrationService.getAuthOptionAction('unknown'), 'noop')

  assert.deepEqual(
    AuthorityUiOrchestrationService.getStatePatchForAuthAction('close-reset'),
    { showAuthSearch: false, activeAuthOptionIndex: -1 }
  )
  assert.deepEqual(
    AuthorityUiOrchestrationService.getStatePatchForAuthAction('close'),
    { showAuthSearch: false }
  )
  assert.deepEqual(
    AuthorityUiOrchestrationService.getStatePatchForAuthAction('close-focus-input'),
    { showAuthSearch: false }
  )
  assert.equal(AuthorityUiOrchestrationService.getStatePatchForAuthAction('navigate'), null)
})

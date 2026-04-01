import assert from 'node:assert/strict'
import test from 'node:test'

import { DropdownInteractionService } from '../../static/js/v3/services/DropdownInteractionService.mjs'

test('DropdownInteractionService arrow helpers and index normalization', () => {
  assert.equal(DropdownInteractionService.isArrowKey('ArrowDown'), true)
  assert.equal(DropdownInteractionService.isArrowKey('ArrowUp'), true)
  assert.equal(DropdownInteractionService.isArrowKey('Enter'), false)

  assert.equal(DropdownInteractionService.getArrowDelta('ArrowDown'), 1)
  assert.equal(DropdownInteractionService.getArrowDelta('ArrowUp'), -1)
  assert.equal(DropdownInteractionService.getArrowDelta('Escape'), 0)

  assert.equal(DropdownInteractionService.normalizeIndex(5, 3), 2)
  assert.equal(DropdownInteractionService.normalizeIndex(-1, 3), 2)
  assert.equal(DropdownInteractionService.normalizeIndex(1, 0), -1)
})

test('DropdownInteractionService focusout helpers return expected close behavior', () => {
  const currentTarget = {
    contains(target) {
      return target === this
    }
  }

  assert.equal(DropdownInteractionService.shouldCloseOnFocusOut(currentTarget, null), true)
  assert.equal(DropdownInteractionService.shouldCloseOnFocusOut(currentTarget, currentTarget), false)

  const closeAuth = DropdownInteractionService.shouldCloseAuthDropdownOnFocusOut({
    currentTarget,
    nextTarget: { id: 'outside' },
    isInDropdown: () => false
  })
  assert.equal(closeAuth, true)

  const keepAuthOpen = DropdownInteractionService.shouldCloseAuthDropdownOnFocusOut({
    currentTarget,
    nextTarget: { id: 'inside-dropdown' },
    isInDropdown: () => true
  })
  assert.equal(keepAuthOpen, false)
})

test('DropdownInteractionService auth key intent resolution', () => {
  assert.equal(
    DropdownInteractionService.getAuthValueKeyIntent({
      key: 'Enter',
      showDropdown: true,
      resultCount: 2,
      activeIndex: 0
    }),
    'select-active'
  )

  assert.equal(
    DropdownInteractionService.getAuthValueKeyIntent({
      key: 'Enter',
      showDropdown: false,
      resultCount: 0,
      activeIndex: -1
    }),
    'blur'
  )

  assert.equal(
    DropdownInteractionService.getAuthValueKeyIntent({
      key: 'ArrowDown',
      showDropdown: false,
      resultCount: 3,
      activeIndex: -1
    }),
    'navigate'
  )

  assert.equal(DropdownInteractionService.getAuthOptionKeyIntent('Tab'), 'tab')
  assert.equal(DropdownInteractionService.getAuthOptionKeyIntent('Escape'), 'escape')
  assert.equal(DropdownInteractionService.getAuthOptionKeyIntent('Enter'), 'enter')
  assert.equal(DropdownInteractionService.getAuthOptionKeyIntent('ArrowUp'), 'navigate')
  assert.equal(DropdownInteractionService.getAuthOptionKeyIntent('x'), 'noop')
})

test('DropdownInteractionService generic menu key intent and action mapping', () => {
  assert.equal(
    DropdownInteractionService.getMenuTriggerKeyIntent({ key: 'Tab', allowEnterBlur: true }),
    'tab'
  )
  assert.equal(
    DropdownInteractionService.getMenuTriggerKeyIntent({ key: 'Enter', allowEnterBlur: true }),
    'enter'
  )
  assert.equal(
    DropdownInteractionService.getMenuTriggerKeyIntent({ key: 'Enter', allowEnterBlur: false }),
    'noop'
  )
  assert.equal(
    DropdownInteractionService.getMenuTriggerKeyIntent({ key: 'ArrowDown', allowEnterBlur: false }),
    'navigate'
  )

  assert.equal(DropdownInteractionService.getMenuOptionKeyIntent('Tab'), 'tab')
  assert.equal(DropdownInteractionService.getMenuOptionKeyIntent('Escape'), 'escape')
  assert.equal(DropdownInteractionService.getMenuOptionKeyIntent('ArrowUp'), 'navigate')
  assert.equal(DropdownInteractionService.getMenuOptionKeyIntent('Enter'), 'noop')

  assert.equal(DropdownInteractionService.getMenuTriggerAction('tab'), 'close')
  assert.equal(DropdownInteractionService.getMenuTriggerAction('enter'), 'blur')
  assert.equal(DropdownInteractionService.getMenuTriggerAction('navigate'), 'navigate')
  assert.equal(DropdownInteractionService.getMenuTriggerAction('unknown'), 'noop')

  assert.equal(DropdownInteractionService.getMenuOptionAction('tab'), 'close')
  assert.equal(DropdownInteractionService.getMenuOptionAction('escape'), 'close-focus-trigger')
  assert.equal(DropdownInteractionService.getMenuOptionAction('navigate'), 'navigate')
  assert.equal(DropdownInteractionService.getMenuOptionAction('unknown'), 'noop')
})

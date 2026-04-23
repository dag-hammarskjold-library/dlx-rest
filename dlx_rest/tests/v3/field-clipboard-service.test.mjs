import assert from 'node:assert/strict'
import test from 'node:test'

import { FieldClipboardService } from '../../static/js/v3/services/FieldClipboardService.mjs'

function createWindowMock() {
  const listeners = new Map()

  return {
    addEventListener(name, handler) {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name).add(handler)
    },
    removeEventListener(name, handler) {
      const set = listeners.get(name)
      if (!set) return
      set.delete(handler)
    },
    dispatchEvent(event) {
      const set = listeners.get(event.type)
      if (!set) return true
      for (const handler of set) {
        handler(event)
      }
      return true
    }
  }
}

class CustomEventMock {
  constructor(type, init = {}) {
    this.type = type
    this.detail = init.detail
  }
}

test('FieldClipboardService copies and serializes fields', (t) => {
  const originalWindow = globalThis.window
  const originalCustomEvent = globalThis.CustomEvent
  globalThis.window = createWindowMock()
  globalThis.CustomEvent = CustomEventMock

  t.after(() => {
    globalThis.window = originalWindow
    globalThis.CustomEvent = originalCustomEvent
  })

  const field = {
    tag: '245',
    indicators: ['1', '0'],
    subfields: [{ code: 'a', value: 'Title', xref: null }]
  }

  FieldClipboardService.clear()
  FieldClipboardService.copyFields([field])

  assert.equal(FieldClipboardService.getCount(), 1)
  assert.equal(FieldClipboardService.hasFields(), true)

  const copied = FieldClipboardService.getFields()[0]
  assert.equal(copied.tag, '245')
  assert.deepEqual(copied.indicators, ['1', '0'])
  assert.deepEqual(copied.subfields, [{ code: 'a', value: 'Title', xref: null }])
})

test('FieldClipboardService notifies listeners and supports unsubscribe', (t) => {
  const originalWindow = globalThis.window
  const originalCustomEvent = globalThis.CustomEvent
  globalThis.window = createWindowMock()
  globalThis.CustomEvent = CustomEventMock

  t.after(() => {
    globalThis.window = originalWindow
    globalThis.CustomEvent = originalCustomEvent
  })

  FieldClipboardService.clear()

  const notifications = []
  const unsubscribe = FieldClipboardService.onClipboardChange((event) => {
    notifications.push(event.count)
  })

  FieldClipboardService.copyFields([{ tag: '500', indicators: ['_', '_'], subfields: [] }])
  assert.deepEqual(notifications, [1])

  unsubscribe()
  FieldClipboardService.clear()

  assert.deepEqual(notifications, [1])
})
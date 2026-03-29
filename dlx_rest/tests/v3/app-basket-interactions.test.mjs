import assert from 'node:assert/strict'
import test from 'node:test'

import { AppBasket } from '../../static/js/v3/components/basket.mjs'

test('AppBasket toggleTitleSort alternates sort direction', () => {
  const ctx = {
    sortMode: 'title-asc'
  }

  AppBasket.methods.toggleTitleSort.call(ctx)
  assert.equal(ctx.sortMode, 'title-desc')

  AppBasket.methods.toggleTitleSort.call(ctx)
  assert.equal(ctx.sortMode, 'title-asc')
})

test('AppBasket toggleIdSort alternates sort direction', () => {
  const ctx = {
    sortMode: 'id-asc'
  }

  AppBasket.methods.toggleIdSort.call(ctx)
  assert.equal(ctx.sortMode, 'id-desc')

  AppBasket.methods.toggleIdSort.call(ctx)
  assert.equal(ctx.sortMode, 'id-asc')
})

test('AppBasket setSortMode changes sort mode', () => {
  const ctx = { sortMode: 'basket' }

  AppBasket.methods.setSortMode.call(ctx, 'title-asc')

  assert.equal(ctx.sortMode, 'title-asc')
})

test('AppBasket hasBasketRecord checks by collection and recordId', () => {
  const ctx = {
    records: [
      { collection: 'bibs', recordId: '1' },
      { collection: 'auths', recordId: '9' }
    ]
  }

  assert.equal(AppBasket.methods.hasBasketRecord.call(ctx, 'bibs', '1'), true)
  assert.equal(AppBasket.methods.hasBasketRecord.call(ctx, 'bibs', '99'), false)
  assert.equal(AppBasket.methods.hasBasketRecord.call(ctx, 'auths', '9'), true)
})

test('AppBasket addRecordToBasketView skips duplicates', () => {
  const ctx = {
    records: [],
    hasBasketRecord: AppBasket.methods.hasBasketRecord,
    extractRecordSummary: AppBasket.methods.extractRecordSummary,
    makeRecordKey: AppBasket.methods.makeRecordKey
  }

  const jmarc = {
    collection: 'bibs',
    recordId: '1',
    getVirtualCollection: () => 'bibs',
    getField: () => null,
    getFields: () => []
  }

  AppBasket.methods.addRecordToBasketView.call(ctx, jmarc)
  const initialLength = ctx.records.length

  AppBasket.methods.addRecordToBasketView.call(ctx, jmarc)
  const afterSecondCall = ctx.records.length

  assert.equal(initialLength, 1)
  assert.equal(afterSecondCall, 1)
})

test('AppBasket startBasketPolling sets interval', () => {
  let intervalId = null
  
  globalThis.window = {
    setInterval: (fn, delay) => {
      intervalId = 'fake-interval-42'
      return intervalId
    }
  }

  const ctx = { pollingHandle: null }

  AppBasket.methods.startBasketPolling.call(ctx)

  assert.equal(ctx.pollingHandle, 'fake-interval-42')

  delete globalThis.window
})

test('AppBasket stopBasketPolling clears interval', () => {
  let clearedInterval = null

  globalThis.window = {
    clearInterval: (handle) => {
      clearedInterval = handle
    }
  }

  const ctx = { pollingHandle: 'fake-interval-42' }

  AppBasket.methods.stopBasketPolling.call(ctx)

  assert.equal(clearedInterval, 'fake-interval-42')
  assert.equal(ctx.pollingHandle, null)

  delete globalThis.window
})

test('AppBasket stopBasketPolling is idempotent', () => {
  globalThis.window = {
    clearInterval: () => {
      throw new Error('Should not be called')
    }
  }

  const ctx = { pollingHandle: null }

  AppBasket.methods.stopBasketPolling.call(ctx)

  assert.equal(ctx.pollingHandle, null)

  delete globalThis.window
})

test('AppBasket filteredRecords sorts by title ascending', () => {
  const ctx = {
    records: [
      { collection: 'bibs', recordId: '1', title: 'Zebra', symbol: '' },
      { collection: 'bibs', recordId: '2', title: 'Alpha', symbol: '' },
      { collection: 'bibs', recordId: '3', title: 'Beta', symbol: '' }
    ],
    filterText: '',
    filterCollection: 'all',
    sortMode: 'title-asc'
  }

  const filtered = AppBasket.computed.filteredRecords.call(ctx)

  assert.deepEqual(
    filtered.map(r => r.title),
    ['Alpha', 'Beta', 'Zebra']
  )
})

test('AppBasket filteredRecords sorts by record ID descending', () => {
  const ctx = {
    records: [
      { collection: 'bibs', recordId: '5', title: 'A', symbol: '' },
      { collection: 'bibs', recordId: '2', title: 'B', symbol: '' },
      { collection: 'bibs', recordId: '8', title: 'C', symbol: '' }
    ],
    filterText: '',
    filterCollection: 'all',
    sortMode: 'id-desc'
  }

  const filtered = AppBasket.computed.filteredRecords.call(ctx)

  assert.deepEqual(
    filtered.map(r => r.recordId),
    ['8', '5', '2']
  )
})

test('AppBasket activeRecordKeys creates set of keys from active records', () => {
  const ctx = {
    activeRecords: [
      { collection: 'bibs', recordId: '1' },
      { collection: 'auths', recordId: '9' }
    ],
    makeRecordKey: AppBasket.methods.makeRecordKey
  }

  const keys = AppBasket.computed.activeRecordKeys.call(ctx)

  assert(keys instanceof Set)
  assert.equal(keys.size, 2)
  assert(keys.has('bibs/1'))
  assert(keys.has('auths/9'))
})

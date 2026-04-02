import assert from 'node:assert/strict'
import test from 'node:test'

import { AppStage } from '../../static/js/v3/components/stage.mjs'

test('AppStage normalizeCollection maps virtual collections', () => {
  assert.equal(AppStage.methods.normalizeCollection.call({}, 'speeches'), 'bibs')
  assert.equal(AppStage.methods.normalizeCollection.call({}, 'votes'), 'bibs')
  assert.equal(AppStage.methods.normalizeCollection.call({}, 'auths'), 'auths')
})

test('AppStage parseRecordsParam supports JSON and CSV', () => {
  const jsonCtx = { records: '["bibs/1","auths/2"]' }
  const csvCtx = { records: 'bibs/1, auths/2 , votes/3' }

  assert.deepEqual(AppStage.methods.parseRecordsParam.call(jsonCtx), ['bibs/1', 'auths/2'])
  assert.deepEqual(AppStage.methods.parseRecordsParam.call(csvCtx), ['bibs/1', 'auths/2', 'votes/3'])
})

test('AppStage setRecordState merges state and normalizes collection', () => {
  const ctx = {
    recordStates: {},
    makeRecordKey: AppStage.methods.makeRecordKey,
    normalizeCollection: AppStage.methods.normalizeCollection
  }

  AppStage.methods.setRecordState.call(ctx, 'speeches', 55, { readonly: true })
  AppStage.methods.setRecordState.call(ctx, 'speeches', 55, { reason: 'locked' })

  assert.deepEqual(ctx.recordStates['speeches/55'], {
    readonly: true,
    reason: 'locked',
    collection: 'bibs',
    recordId: '55'
  })
})

test('AppStage isAuthenticated computed checks auth function, token, and permissions', () => {
  assert.equal(AppStage.computed.isAuthenticated.call({ user: null }), false)

  assert.equal(
    AppStage.computed.isAuthenticated.call({
      user: {
        isAuthenticated: () => true
      }
    }),
    true
  )

  assert.equal(
    AppStage.computed.isAuthenticated.call({
      user: {
        getAuthToken: () => 'abc123',
        permissions: []
      }
    }),
    true
  )

  assert.equal(
    AppStage.computed.isAuthenticated.call({
      user: {
        getAuthToken: () => '',
        permissions: ['updateRecord']
      }
    }),
    true
  )
})

test('AppStage updateRecordsUrlParam syncs records query parameter', () => {
  const originalWindow = globalThis.window
  const calls = []

  globalThis.window = {
    location: { href: 'https://example.org/editor?foo=1' },
    history: {
      replaceState: (_state, _title, url) => {
        calls.push(String(url))
      }
    }
  }

  const ctx = {
    activeRecords: [
      { collection: 'bibs', recordId: '1' },
      { collection: 'auths', recordId: '9' }
    ]
  }

  AppStage.methods.updateRecordsUrlParam.call(ctx)
  assert.ok(calls[0].includes('records=bibs%2F1%2Cauths%2F9'))

  ctx.activeRecords = []
  AppStage.methods.updateRecordsUrlParam.call(ctx)
  assert.ok(!calls[1].includes('records='))

  globalThis.window = originalWindow
})

test('AppStage handleRecordSaved auto-adds saved clone to basket', async () => {
  const calls = []
  const ctx = {
    user: {
      isInBasket: () => false,
      addBasketItem: async (collection, recordId) => {
        calls.push(['addBasketItem', collection, recordId])
      },
      loadBasket: async () => {
        calls.push(['loadBasket'])
      }
    },
    normalizeCollection: AppStage.methods.normalizeCollection,
    $refs: {
      basket: {
        refreshFromUserBasket: async () => {
          calls.push(['refreshFromUserBasket'])
        }
      }
    },
    refreshBasketView: AppStage.methods.refreshBasketView
  }

  await AppStage.methods.handleRecordSaved.call(ctx, {
    record: { collection: 'auths', recordId: 55 },
    wasCloneDraft: true
  })

  assert.deepEqual(calls[0], ['addBasketItem', 'auths', 55])
  assert(calls.some(entry => entry[0] === 'loadBasket'))
  assert(calls.some(entry => entry[0] === 'refreshFromUserBasket'))
})

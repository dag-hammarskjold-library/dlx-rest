import assert from 'node:assert/strict'
import test from 'node:test'

import { AppStage } from '../../static/js/v3/components/stage.mjs'

test('AppStage activateRecord reorders activeRecords with new record on top', () => {
  const r1 = { collection: 'bibs', recordId: '1' }
  const r2 = { collection: 'bibs', recordId: '2' }
  const r3 = { collection: 'bibs', recordId: '3' }

  const ctx = {
    activeRecords: [r1, r2, r3],
    recordStates: {},
    updateRecordsUrlParam: () => {}
  }

  AppStage.methods.activateRecord.call(ctx, r2)

  assert.deepEqual(ctx.activeRecords, [r2, r1, r3])
})

test('AppStage activateRecord removes duplicate if already present', () => {
  const r1 = { collection: 'bibs', recordId: '1' }
  const r2 = { collection: 'bibs', recordId: '2' }
  const r3 = { collection: 'auths', recordId: '3' }

  const ctx = {
    activeRecords: [r1, r2, r3],
    recordStates: {},
    updateRecordsUrlParam: () => {}
  }

  AppStage.methods.activateRecord.call(ctx, r3)

  assert.deepEqual(ctx.activeRecords, [r3, r1, r2])
  assert.equal(ctx.activeRecords.length, 3)
})

test('AppStage activateRecord can skip URL update', () => {
  const urlUpdates = []
  const r1 = { collection: 'bibs', recordId: '1' }

  const ctx = {
    activeRecords: [],
    recordStates: {},
    updateRecordsUrlParam: () => {
      urlUpdates.push('updated')
    }
  }

  AppStage.methods.activateRecord.call(ctx, r1, { updateUrl: false })

  assert.equal(urlUpdates.length, 0)
})

test('AppStage activateWorkformRecord delegates to activateRecord', () => {
  const r1 = { collection: 'bibs', recordId: null }
  const calls = []

  const ctx = {
    activeRecords: [],
    recordStates: {},
    updateRecordsUrlParam: () => {
      calls.push('updateUrl')
    },
    activateRecord: AppStage.methods.activateRecord
  }

  AppStage.methods.activateWorkformRecord.call(ctx, r1)

  assert.deepEqual(ctx.activeRecords, [r1])
  assert.equal(calls.length, 1)
})

test('AppStage addStageNotice generates unique IDs and appends notice', () => {
  const ctx = { stageNotices: [] }

  AppStage.methods.addStageNotice.call(ctx, 'Test message', 'warning')
  AppStage.methods.addStageNotice.call(ctx, 'Another message', 'info')

  assert.equal(ctx.stageNotices.length, 2)
  assert.equal(ctx.stageNotices[0].message, 'Test message')
  assert.equal(ctx.stageNotices[0].type, 'warning')
  assert.equal(ctx.stageNotices[1].type, 'info')
  assert.notEqual(ctx.stageNotices[0].id, ctx.stageNotices[1].id)
})

test('AppStage getRecordStateForJmarc finds state by collection and recordId', () => {
  const jmarc = { collection: 'bibs', recordId: '42' }
  const ctx = {
    recordStates: {
      'bibs/42': { readonly: true, reason: 'locked' }
    },
    makeRecordKey: AppStage.methods.makeRecordKey
  }

  const state = AppStage.methods.getRecordStateForJmarc.call(ctx, jmarc)

  assert.deepEqual(state, { readonly: true, reason: 'locked' })
})

test('AppStage getRecordStateForJmarc returns null when not found', () => {
  const jmarc = { collection: 'auths', recordId: '999' }
  const ctx = {
    recordStates: {},
    makeRecordKey: AppStage.methods.makeRecordKey
  }

  const state = AppStage.methods.getRecordStateForJmarc.call(ctx, jmarc)

  assert.equal(state, null)
})

test('AppStage setRecordState creates new object to ensure reactivity', () => {
  const ctx = {
    recordStates: { 'bibs/1': { readonly: false } },
    makeRecordKey: AppStage.methods.makeRecordKey,
    normalizeCollection: AppStage.methods.normalizeCollection
  }

  const originalState = ctx.recordStates
  AppStage.methods.setRecordState.call(ctx, 'bibs', '1', { readonly: true })

  assert.notEqual(ctx.recordStates, originalState)
  assert.equal(ctx.recordStates['bibs/1'].readonly, true)
})

test('AppStage refreshBasketView no-ops without user loader', async () => {
  const ctx = {
    user: null,
    $refs: {}
  }

  await AppStage.methods.refreshBasketView.call(ctx)
  assert.equal(true, true)
})

test('AppStage refreshBasketView loads user basket and refreshes basket ref', async () => {
  const calls = []
  const ctx = {
    user: {
      async loadBasket() {
        calls.push('loadBasket')
      }
    },
    $refs: {
      basket: {
        async refreshFromUserBasket() {
          calls.push('refreshFromUserBasket')
        }
      }
    }
  }

  await AppStage.methods.refreshBasketView.call(ctx)
  assert.deepEqual(calls, ['loadBasket', 'refreshFromUserBasket'])
})

test('AppStage handleRecordSaved ignores non-clone payloads', async () => {
  const ctx = {
    user: {
      isInBasket() {
        throw new Error('should not be called')
      }
    },
    normalizeCollection: AppStage.methods.normalizeCollection,
    refreshBasketView: async () => {
      throw new Error('should not be called')
    }
  }

  await AppStage.methods.handleRecordSaved.call(ctx, {
    record: { collection: 'bibs', recordId: 1 },
    wasCloneDraft: false
  })

  assert.equal(true, true)
})

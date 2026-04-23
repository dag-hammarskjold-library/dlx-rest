import assert from 'node:assert/strict'
import test from 'node:test'

import { BasketRecord } from '../../static/js/v3/components/basket-record.mjs'

test('BasketRecord computed display helpers provide fallbacks', () => {
  const ctx = {
    item: {
      collection: 'bibs',
      virtualCollection: 'votes',
      recordId: '12',
      title: '',
      symbol: ''
    }
  }

  assert.equal(BasketRecord.computed.displayCollection.call(ctx), 'votes')
  assert.equal(BasketRecord.computed.displayRecordId.call(ctx), '12')
  assert.equal(BasketRecord.computed.displayTitle.call(ctx), '[No title]')
  assert.equal(BasketRecord.computed.displaySymbol.call(ctx), '')
})

test('BasketRecord active watcher toggles selected class', () => {
  const data = BasketRecord.data.call({ active: false })
  assert.equal(data.classes.basketRecord['basket-record__selected'], false)

  const watcherCtx = { classes: data.classes }
  BasketRecord.watch.active.call(watcherCtx, true)
  assert.equal(watcherCtx.classes.basketRecord['basket-record__selected'], true)
})

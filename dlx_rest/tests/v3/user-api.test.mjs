import assert from 'node:assert/strict'
import test from 'node:test'

import { User } from '../../static/js/v3/api/user.mjs'

test('User isAuthenticated supports username/token/permissions', () => {
  User.apiUrl = '/api'
  const user = new User('none')

  const originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = {
    getItem: () => ''
  }

  try {
    assert.equal(user.isAuthenticated(), false)

    user.permissions = ['readRecord']
    assert.equal(user.isAuthenticated(), true)

    user.permissions = []
    user.username = 'real-user'
    assert.equal(user.isAuthenticated(), true)
  } finally {
    globalThis.localStorage = originalLocalStorage
  }
})

test('User normalizeCollection maps virtual collections', () => {
  User.apiUrl = '/api'
  const user = new User('real')

  assert.equal(user.normalizeCollection('speeches'), 'bibs')
  assert.equal(user.normalizeCollection('votes'), 'bibs')
  assert.equal(user.normalizeCollection('auths'), 'auths')
})

test('User addBasketItem posts normalized payload', async () => {
  User.apiUrl = '/api'
  const user = new User('real')

  const originalFetch = globalThis.fetch
  const originalLocalStorage = globalThis.localStorage
  const calls = []

  globalThis.localStorage = { getItem: () => 'tkn' }
  globalThis.fetch = async (url, options) => {
    calls.push([String(url), options])
    return { ok: true }
  }

  try {
    const result = await user.addBasketItem('speeches', 55)
    assert.equal(result, true)
  } finally {
    globalThis.fetch = originalFetch
    globalThis.localStorage = originalLocalStorage
  }

  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], '/api/userprofile/my_profile/basket')
  const body = JSON.parse(calls[0][1].body)
  assert.equal(body.collection, 'bibs')
  assert.equal(body.record_id, '55')
})

test('User removeBasketItemByUrl validates URL and throws when request fails', async () => {
  User.apiUrl = '/api'
  const user = new User('real')

  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window
  const originalLocalStorage = globalThis.localStorage

  globalThis.window = { location: { origin: 'https://example.org' } }
  globalThis.localStorage = { getItem: () => 'tkn' }

  try {
    await assert.rejects(
      () => user.removeBasketItemByUrl(''),
      /Basket item URL is required/
    )

    globalThis.fetch = async () => ({ ok: false, status: 500, statusText: 'Server Error' })
    await assert.rejects(
      () => user.removeBasketItemByUrl('/api/userprofile/my_profile/basket/1'),
      /Failed to remove basket item: 500 Server Error/
    )
  } finally {
    globalThis.fetch = originalFetch
    globalThis.window = originalWindow
    globalThis.localStorage = originalLocalStorage
  }
})

test('User getBasketRecords handles non-ok response by clearing basket', async () => {
  User.apiUrl = '/api'
  const user = new User('real')
  user.basket = [{ collection: 'bibs', record_id: '1' }]

  const originalFetch = globalThis.fetch
  const originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = { getItem: () => 'tkn' }
  globalThis.fetch = async () => ({ ok: false, statusText: 'Unauthorized' })

  try {
    await user.getBasketRecords()
  } finally {
    globalThis.fetch = originalFetch
    globalThis.localStorage = originalLocalStorage
  }

  assert.deepEqual(user.basket, [])
})

test('User loadUserProfile extracts permissions from response data', async () => {
  User.apiUrl = '/api'
  const user = new User('real')

  const originalFetch = globalThis.fetch
  const originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = { getItem: () => 'tkn' }
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        data: {
          permissions: ['readRecord', 'updateRecord']
        }
      }
    }
  })

  try {
    await user.loadUserProfile()
  } finally {
    globalThis.fetch = originalFetch
    globalThis.localStorage = originalLocalStorage
  }

  assert.deepEqual(user.permissions, ['readRecord', 'updateRecord'])
  assert.equal(user.hasPermission('updateRecord'), true)
})

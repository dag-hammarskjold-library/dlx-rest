import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('frontend workspace smoke', () => {
  it('has a Vue mount target in index.html', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    expect(html.includes('id="v3-smoke-app"')).toBe(true)
  })
})

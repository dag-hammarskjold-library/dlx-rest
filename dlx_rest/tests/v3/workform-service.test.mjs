import assert from 'node:assert/strict'
import test from 'node:test'

import { WorkformService } from '../../static/js/v3/services/WorkformService.mjs'
import { Jmarc } from '../../static/js/api/jmarc.mjs'

function createMockRecord() {
  const record = {
    collection: 'bibs',
    workformName: 'wf-1',
    workformDescription: 'original description',
    fields: [{ tag: '245' }],
    parse(data) {
      this.fields = Array.isArray(data?.fields) ? [...data.fields] : []
    },
    clone() {
      return {
        fields: [{ tag: '998' }, { tag: '245' }],
        getFields(tag) {
          return tag === '998' ? this.fields.filter(f => f.tag === '998') : []
        },
        deleteField(field) {
          this.fields = this.fields.filter(f => f !== field)
        },
        async saveAsWorkform(name, description) {
          this.savedAs = { name, description }
        },
        async saveWorkform(name, description) {
          this.saved = { name, description }
        }
      }
    }
  }

  return record
}

test('WorkformService saveAsWorkform updates metadata and strips 998', async () => {
  const record = createMockRecord()
  const service = new WorkformService(record)

  const result = await service.saveAsWorkform({
    workformName: 'new-wf',
    description: 'new description'
  })

  assert.equal(result.success, true)
  assert.equal(result.path, 'bibs/workforms/new-wf')
  assert.equal(record.workformName, 'new-wf')
  assert.equal(record.workformDescription, 'new description')
})

test('WorkformService updateWorkform reloads canonical data', async (t) => {
  const originalFromWorkform = Jmarc.fromWorkform
  t.after(() => {
    Jmarc.fromWorkform = originalFromWorkform
  })

  Jmarc.fromWorkform = async () => ({
    compile() {
      return { fields: [{ tag: '100' }, { tag: '245' }] }
    }
  })

  const record = createMockRecord()
  const service = new WorkformService(record)

  const result = await service.updateWorkform({ description: 'updated description' })

  assert.equal(result.success, true)
  assert.equal(result.reloaded, true)
  assert.equal(record.workformDescription, 'updated description')
  assert.deepEqual(record.fields, [{ tag: '100' }, { tag: '245' }])
})

test('WorkformService metadata helpers work as expected', () => {
  const record = createMockRecord()
  const service = new WorkformService(record)

  assert.equal(service.isPersistedWorkform(), true)
  assert.equal(service.getWorkformName(), 'wf-1')
  assert.equal(service.getWorkformDescription(), 'original description')

  service.updateMetadata('wf-2', 'desc-2')
  assert.equal(record.workformName, 'wf-2')
  assert.equal(record.workformDescription, 'desc-2')

  service.clearMetadata()
  assert.equal(record.workformName, null)
  assert.equal(record.workformDescription, null)
})
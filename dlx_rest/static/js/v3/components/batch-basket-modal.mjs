import { Jmarc } from "../../api/jmarc.mjs"

const BATCH_ACTION_STORAGE_KEY = 'dlx:v3:batch:last-action'

function normalizeFieldPayload(field) {
    return {
        tag: String(field?.tag || ''),
        indicators: Array.isArray(field?.indicators) ? [...field.indicators] : ['_', '_'],
        subfields: (field?.subfields || []).map(subfield => ({
            code: String(subfield?.code || ''),
            value: subfield?.value ?? '',
            xref: subfield?.xref ?? null
        }))
    }
}

function fieldSignature(field) {
    const normalized = normalizeFieldPayload(field)
    return JSON.stringify(normalized)
}

function applyFieldAdd(targetRecord, fieldPayload) {
    const normalized = normalizeFieldPayload(fieldPayload)
    const newField = targetRecord.createField(normalized.tag)
    newField.indicators = [...normalized.indicators]

    normalized.subfields.forEach(subfield => {
        const created = newField.createSubfield(subfield.code)
        created.value = subfield.value
        created.xref = subfield.xref
    })
}

function applyFieldDelete(targetRecord, fieldPayloads) {
    const wantedSignatures = new Set(fieldPayloads.map(field => fieldSignature(field)))
    const matchingFields = targetRecord.getDataFields().filter(field => wantedSignatures.has(fieldSignature(field)))
    matchingFields.forEach(field => targetRecord.deleteField(field))
    return matchingFields.length
}

export const BatchBasketModal = {
    props: {
        visible: { type: Boolean, required: true },
        sourceRecord: { type: Object, required: false, default: null },
        selectedFields: { type: Array, required: false, default: () => [] },
        basketRecords: { type: Array, required: false, default: () => [] }
    },
    emits: ['close', 'applied'],
    data() {
        return {
            action: 'add',
            includeSourceRecord: false,
            selectedRecordKeys: [],
            previewRows: [],
            stagedChanges: [],
            showPreview: false,
            isApplying: false
        }
    },
    computed: {
        sourceRecordKey() {
            if (!this.sourceRecord) return null
            return `${this.sourceRecord.collection}/${this.sourceRecord.recordId}`
        },
        basketOptions() {
            return (this.basketRecords || []).map(record => ({
                key: `${record.collection}/${record.recordId}`,
                collection: record.collection,
                recordId: String(record.recordId),
                label: `${record.getVirtualCollection ? record.getVirtualCollection() : record.collection}/${record.recordId}`
            }))
        },
        canPreview() {
            return this.selectedRecordKeys.length > 0 && this.selectedFields.length > 0
        },
        saveableCount() {
            return this.previewRows.filter(row => row.canSave === true).length
        },
        unsaveableCount() {
            return this.previewRows.filter(row => row.canSave === false).length
        }
    },
    watch: {
        visible(newValue) {
            if (newValue) {
                this.resetState()
            }
        },
        action(newValue) {
            this.persistBatchAction(newValue)
            this.includeSourceRecord = newValue === 'delete'
            this.ensureSourceSelectionRule()
        },
        includeSourceRecord() {
            this.ensureSourceSelectionRule()
        }
    },
    methods: {
        getStoredBatchAction() {
            try {
                const stored = window.localStorage.getItem(BATCH_ACTION_STORAGE_KEY)
                return stored === 'add' || stored === 'delete' ? stored : 'add'
            } catch (error) {
                return 'add'
            }
        },
        persistBatchAction(action) {
            if (action !== 'add' && action !== 'delete') return
            try {
                window.localStorage.setItem(BATCH_ACTION_STORAGE_KEY, action)
            } catch (error) {
                // Ignore persistence failures (private mode, storage disabled, etc.)
            }
        },
        resetState() {
            this.action = this.getStoredBatchAction()
            this.includeSourceRecord = this.action === 'delete'
            this.previewRows = []
            this.stagedChanges = []
            this.showPreview = false
            this.selectedRecordKeys = this.basketOptions
                .map(option => option.key)
                .filter(key => key !== this.sourceRecordKey)
        },
        ensureSourceSelectionRule() {
            if (!this.sourceRecordKey) return

            if (this.includeSourceRecord) {
                if (!this.selectedRecordKeys.includes(this.sourceRecordKey)) {
                    this.selectedRecordKeys.push(this.sourceRecordKey)
                }
                return
            }

            this.selectedRecordKeys = this.selectedRecordKeys.filter(key => key !== this.sourceRecordKey)
        },
        toggleSelectAll(shouldSelect) {
            if (shouldSelect) {
                this.selectedRecordKeys = this.basketOptions.map(option => option.key)
                if (!this.includeSourceRecord && this.sourceRecordKey) {
                    this.selectedRecordKeys = this.selectedRecordKeys.filter(key => key !== this.sourceRecordKey)
                }
                return
            }

            this.selectedRecordKeys = []
        },
        async getRecordForPreview(collection, recordId) {
            const inBasket = (this.basketRecords || []).find(record =>
                String(record.collection) === String(collection)
                && String(record.recordId) === String(recordId)
            )

            if (inBasket && typeof inBasket.clone === 'function') {
                return inBasket.clone()
            }

            return Jmarc.get(collection, recordId)
        },
        async previewChanges() {
            if (!this.canPreview) return

            this.previewRows = []
            this.stagedChanges = []

            const results = await Promise.all(this.selectedRecordKeys.map(async key => {
                const [collection, recordId] = key.split('/')
                const target = await this.getRecordForPreview(collection, recordId)

                const row = {
                    record: `${collection}/${recordId}`,
                    action: this.action,
                    changedFields: 0,
                    invalid: false,
                    canSave: true,
                    messages: []
                }

                if (this.action === 'add') {
                    this.selectedFields.forEach(field => {
                        applyFieldAdd(target, field)
                        row.changedFields += 1
                    })
                } else {
                    row.changedFields = applyFieldDelete(target, this.selectedFields)
                }

                const flags = target.allValidationWarnings()
                if (flags.length > 0 && !target.getField('998')) {
                    row.invalid = true
                    row.canSave = false
                    row.messages = flags.map(flag => flag.message)
                }

                if (!row.invalid) {
                    this.stagedChanges.push({ collection, recordId, record: target })
                }

                return row
            }))

            this.previewRows = results
            this.showPreview = true
        },
        async applyChanges() {
            if (this.isApplying) return
            this.isApplying = true

            try {
                const updatedRecords = []
                for (const item of this.stagedChanges) {
                    await item.record.put()
                    updatedRecords.push({ collection: item.collection, recordId: item.recordId })
                }

                this.$emit('applied', {
                    action: this.action,
                    updatedRecords,
                    skipped: this.previewRows.filter(row => row.invalid).length
                })

                this.$emit('close')
            } catch (error) {
                console.error('Failed to apply batch basket actions', error)
                window.alert(`Batch update failed: ${error && error.message ? error.message : String(error)}`)
            } finally {
                this.isApplying = false
            }
        }
    },
    template: /* html */ `
      <div v-if="visible" class="batch-modal-overlay" @click.self="$emit('close')">
        <div class="batch-modal-dialog" role="dialog" aria-modal="true" aria-label="Batch basket actions">
          <div class="batch-modal-header">
            <h3>Batch basket actions</h3>
            <button class="batch-modal-close" @click="$emit('close')" aria-label="Close batch basket actions">x</button>
          </div>

          <div v-if="!showPreview" class="batch-modal-body">
            <div class="batch-section">
              <div class="batch-section-title">Action</div>
              <label><input type="radio" value="add" v-model="action"> Add selected fields</label>
              <label class="ml-2"><input type="radio" value="delete" v-model="action"> Delete matching fields</label>
            </div>

            <div class="batch-section">
              <div class="batch-section-title">Fields from active record</div>
              <div v-if="selectedFields.length === 0" class="batch-hint">No selected fields. Select fields in the active record first.</div>
              <ul v-else class="batch-field-list">
                <li v-for="(field, idx) in selectedFields" :key="idx">{{ field.tag }} ({{ (field.subfields || []).length }} subfields)</li>
              </ul>
            </div>

            <div class="batch-section">
              <div class="batch-section-title">Target basket records</div>
              <div class="batch-hint">
                <a href="#" @click.prevent="toggleSelectAll(true)">Select all</a>
                /
                <a href="#" @click.prevent="toggleSelectAll(false)">Select none</a>
              </div>
              <label class="batch-inline-option">
                <input type="checkbox" v-model="includeSourceRecord">
                Include source record
              </label>
              <div class="batch-target-list">
                <label v-for="option in basketOptions" :key="option.key" class="batch-target-item">
                  <input
                    type="checkbox"
                    :value="option.key"
                    v-model="selectedRecordKeys"
                    :disabled="!includeSourceRecord && option.key === sourceRecordKey"
                  >
                  <span>{{ option.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div v-else class="batch-modal-body">
            <div class="batch-section-title">Preview</div>
                        <div class="batch-hint">
                            Can save: {{ saveableCount }}
                            <span v-if="unsaveableCount > 0"> | Cannot save: {{ unsaveableCount }}</span>
                        </div>
            <div class="batch-preview-list">
              <div v-for="row in previewRows" :key="row.record" class="batch-preview-item" :class="row.invalid ? 'batch-preview-item--invalid' : 'batch-preview-item--ok'">
                <div class="batch-preview-head">
                  <strong>{{ row.record }}</strong>
                                    <span>
                                        {{ row.action === 'add' ? 'add' : 'delete' }} {{ row.changedFields }} field(s)
                                        <em class="batch-preview-save-status" :class="row.canSave ? 'batch-preview-save-status--ok' : 'batch-preview-save-status--bad'">
                                            {{ row.canSave ? 'Can save' : 'Cannot save' }}
                                        </em>
                                    </span>
                </div>
                <ul v-if="row.invalid" class="batch-preview-errors">
                  <li v-for="(message, idx) in row.messages" :key="idx">{{ message }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="batch-modal-footer">
            <button type="button" @click="$emit('close')">Cancel</button>
            <button v-if="!showPreview" type="button" @click="previewChanges" :disabled="!canPreview">Preview</button>
            <button v-else type="button" @click="showPreview = false">Back</button>
            <button v-if="showPreview" type="button" @click="applyChanges" :disabled="isApplying || stagedChanges.length === 0">Apply</button>
          </div>
        </div>
      </div>
    `
}

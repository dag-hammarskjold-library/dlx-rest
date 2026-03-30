import { RecordstageRecord } from "./recordstage-record.mjs"
import { Jmarc } from "../../api/jmarc.mjs"

export const AppRecordstage = {
    props: {
        records: Array,
        readonly: { type: Boolean, required: false, default: false },
      recordStates: { type: Object, required: false, default: () => ({}) },
        user: Object
    },
    components: { RecordstageRecord },
    data() {
      return {
        focusedRecord: null,
        showShortcutHelp: false,
        boundHandleKeydown: null,
        shortcutDefinitions: [
          { keys: 'Ctrl/Cmd + Shift + A', description: 'Select all fields in active record' },
          { keys: 'Ctrl/Cmd + Shift + D', description: 'Deselect all fields in active record' },
          { keys: 'Ctrl/Cmd + Shift + B', description: 'Open batch actions for active record' },
          { keys: 'Ctrl/Cmd + Shift + .', description: 'Focus next displayed record' },
          { keys: 'Ctrl/Cmd + Shift + X', description: 'Close active record' },
          { keys: 'Ctrl/Cmd + Shift + /', description: 'Show keyboard shortcuts help' },
          { keys: 'Ctrl/Cmd + S', description: 'Save active record' },
          { keys: 'Ctrl/Cmd + Z', description: 'Undo active record change' },
          { keys: 'Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y', description: 'Redo active record change' },
          { keys: 'Shift + Enter', description: 'Add a field after focused field' },
          { keys: 'Shift + Backspace/Delete', description: 'Delete selected fields' },
          { keys: 'Ctrl/Cmd + Alt + Backspace/Delete', description: 'Delete active record' },
          { keys: 'Esc', description: 'Close keyboard shortcuts help' }
        ],
        showCreateRecordModal: false,
        isLoadingWorkforms: false,
        workformLoadError: '',
        availableWorkforms: [],
        showMergeModal: false,
        mergeGainingRecordId: '',
        mergeSubmitting: false
      }
    },
    watch: {
      records: {
        handler(newRecords) {
          if (!Array.isArray(newRecords) || newRecords.length === 0) {
            this.focusedRecord = null
            return
          }

          if (!this.focusedRecord || !newRecords.includes(this.focusedRecord)) {
            this.focusedRecord = newRecords[0]
          }
        },
        immediate: true
      }
    },
    mounted() {
      this.boundHandleKeydown = this.handleGlobalKeydown.bind(this)
      window.addEventListener('keydown', this.boundHandleKeydown)
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.boundHandleKeydown)
    },
    template: /* html */ `
    <div class="recordstage">
      <div class="recordstage-menu" v-if="!readonly">
        <button :disabled="!canOpenWorkformModal" @click="toggleCreateRecordDropdown" title="Create record">
          <i class="bi bi-plus-square me-1"></i>
          <span>Create record</span>
        </button>
        <button class="merge-record" :disabled="!canMergeAuthorities" @click="toggleMergeRecordsDropdown" title="Merge auths">
          <i class="bi bi-intersect me-1"></i>
          <span>Merge auths</span>
        </button>
        <button @click="openShortcutHelp" title="Keyboard shortcuts">
          <i class="bi bi-keyboard me-1"></i>
          <span>Keyboard help</span>
        </button>
      </div>
      <div class="recordstage-display">
        <recordstage-record 
          v-for="jmarc in records" 
          :key="jmarc.collection + jmarc.recordId" 
          ref="recordEditors"
          :record="jmarc"
          :readonly="isRecordReadonly(jmarc)"
          :record-state="getRecordState(jmarc)"
          :is-focused="focusedRecord === jmarc"
          :user="user"
          @focus-record="focusRecord"
            @clone-record="cloneRecord"
          @open-related-record="openRelatedRecord"
          @batch-actions="batchActions"
          @unlock-record="unlockRecord"
          @delete-record="deleteRecord"
          @close-record="closeRecord"
        />
        <div v-if="records.length === 0" class="recordstage-empty">
          <p>No records selected</p>
        </div>
      </div>
      <div v-if="showShortcutHelp" class="shortcut-help-overlay" @click.self="closeShortcutHelp">
        <div class="shortcut-help-dialog" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
          <div class="shortcut-help-header">
            <h3>Keyboard shortcuts</h3>
            <button class="shortcut-help-close" @click="closeShortcutHelp" aria-label="Close keyboard shortcuts">x</button>
          </div>
          <ul class="shortcut-help-list">
            <li v-for="shortcut in shortcutDefinitions" :key="shortcut.keys">
              <span class="shortcut-help-keys">{{ shortcut.keys }}</span>
              <span class="shortcut-help-desc">{{ shortcut.description }}</span>
            </li>
          </ul>
        </div>
      </div>
      <teleport to="body">
        <div v-if="showCreateRecordModal" class="create-record-modal-overlay" @click.self="closeCreateRecordModal">
          <div class="create-record-modal-dialog" role="dialog" aria-modal="true" aria-label="Create record from workform">
            <div class="create-record-modal-header">
              <h3>Create record from workform</h3>
              <button type="button" class="create-record-modal-close" @click="closeCreateRecordModal" aria-label="Close create record modal">x</button>
            </div>

            <div v-if="isLoadingWorkforms" class="create-record-modal-loading">Loading workforms...</div>
            <div v-else-if="workformLoadError" class="create-record-modal-error">{{ workformLoadError }}</div>
            <div v-else-if="availableWorkforms.length === 0" class="create-record-modal-empty">No workforms available.</div>
            <div v-else class="create-record-modal-list">
              <div
                v-for="entry in availableWorkforms"
                :key="entry.collection + '/' + entry.name"
                class="create-record-modal-item"
                @click="canCreateRecord ? createRecordFromWorkform(entry) : null"
              >
                <div class="create-record-modal-item-row">
                  <div class="create-record-modal-item-title">{{ entry.name }}</div>
                  <div class="create-record-modal-item-actions">
                    <button v-if="canCreateRecord" type="button" class="create-record-modal-action" title="Create record from this workform" @click.stop="createRecordFromWorkform(entry)">
                      <i class="bi bi-plus-square"></i>
                    </button>
                    <button v-if="canUpdateWorkform" type="button" class="create-record-modal-action" title="Edit this workform" @click.stop="editWorkform(entry)">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button v-if="canDeleteWorkform" type="button" class="create-record-modal-action create-record-modal-action--danger" title="Delete this workform" @click.stop="deleteWorkformFromList(entry)">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
                <div class="create-record-modal-item-meta">{{ entry.collection }} ({{ entry.virtualCollection }})</div>
                <div v-if="entry.description" class="create-record-modal-item-desc">{{ entry.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showMergeModal" class="create-record-modal-overlay" @click.self="closeMergeModal">
          <div class="create-record-modal-dialog" role="dialog" aria-modal="true" aria-label="Merge authority records">
            <div class="create-record-modal-header">
              <h3>Merge authority records</h3>
              <button type="button" class="create-record-modal-close" @click="closeMergeModal" aria-label="Close merge modal">x</button>
            </div>

            <div class="create-record-modal-item-meta mb-2">Select the gaining authority record. The other selected authority becomes the losing record.</div>

            <div class="mb-2">
              <select class="form-select" v-model="mergeGainingRecordId" :disabled="mergeSubmitting">
                <option v-for="record in mergeAuthCandidates" :key="record.recordId" :value="String(record.recordId)">
                  auths/{{ record.recordId }}
                </option>
              </select>
            </div>

            <div class="create-record-modal-item-meta" v-if="currentMergeSelection">
              Gaining: auths/{{ currentMergeSelection.gainingRecordId }}
            </div>
            <div class="create-record-modal-item-meta" v-if="currentMergeSelection">
              Losing: auths/{{ currentMergeSelection.losingRecordId }}
            </div>

            <div class="batch-modal-footer mt-3">
              <button type="button" class="btn btn-secondary" @click="closeMergeModal" :disabled="mergeSubmitting">Close</button>
              <button type="button" class="btn btn-success" @click="submitMergeAuthorities" :disabled="!currentMergeSelection || mergeSubmitting">
                <span v-if="mergeSubmitting">Merging...</span>
                <span v-else>Merge</span>
              </button>
            </div>
          </div>
        </div>
      </teleport>
    </div>
  `,
    computed: {
        canCreateRecord() {
            return !!(this.user && typeof this.user.hasPermission === 'function' && this.user.hasPermission('createRecord'))
      },
      canUpdateWorkform() {
        return !!(this.user && typeof this.user.hasPermission === 'function' && this.user.hasPermission('updateWorkform'))
      },
      canDeleteWorkform() {
        return !!(this.user && typeof this.user.hasPermission === 'function' && this.user.hasPermission('deleteWorkform'))
      },
      canOpenWorkformModal() {
        return this.canCreateRecord || this.canUpdateWorkform || this.canDeleteWorkform
        },
      canMergeAuthority() {
        return !!(this.user && typeof this.user.hasPermission === 'function' && this.user.hasPermission('mergeAuthority'))
      },
      mergeAuthCandidates() {
        const records = Array.isArray(this.records) ? this.records : []
        return records.filter(record => record && record.collection === 'auths' && record.recordId)
      },
      canMergeAuthorities() {
        return !this.readonly && this.canMergeAuthority && this.mergeAuthCandidates.length === 2
      },
      currentMergeSelection() {
        if (!this.mergeGainingRecordId) return null
        const gainingRecordId = Number.parseInt(this.mergeGainingRecordId, 10)
        if (!Number.isFinite(gainingRecordId)) return null

        const gainingRecord = this.mergeAuthCandidates.find(record => Number(record.recordId) === gainingRecordId)
        const losingRecord = this.mergeAuthCandidates.find(record => Number(record.recordId) !== gainingRecordId)
        if (!gainingRecord || !losingRecord) return null

        return {
          gainingRecord,
          losingRecord,
          gainingRecordId: Number(gainingRecord.recordId),
          losingRecordId: Number(losingRecord.recordId)
        }
        }
    },
    methods: {
        async toggleCreateRecordDropdown() {
        if (!this.canOpenWorkformModal) return
            this.showCreateRecordModal = true
            await this.loadWorkforms()
        },
        toggleMergeRecordsDropdown() {
          if (!this.canMergeAuthorities) {
            this.$emit('stage-notice', {
              type: 'warning',
              message: 'Select exactly two persisted authority records and ensure you have merge permission.'
            })
            return
          }

          this.mergeGainingRecordId = String(this.mergeAuthCandidates[0].recordId)
          this.showMergeModal = true
        },
        closeMergeModal() {
          this.showMergeModal = false
          this.mergeSubmitting = false
        },
        async submitMergeAuthorities() {
          if (!this.currentMergeSelection || this.mergeSubmitting) return

          const { gainingRecordId, losingRecordId, losingRecord } = this.currentMergeSelection

          if (!window.confirm(`Merge auths/${losingRecordId} into auths/${gainingRecordId}?`)) {
            return
          }

          this.mergeSubmitting = true
          try {
            const result = await Jmarc.mergeAuthorities(gainingRecordId, losingRecordId)
            this.$emit('stage-notice', {
              type: 'info',
              message: result && result.message ? result.message : `Merged auths/${losingRecordId} into auths/${gainingRecordId}.`
            })

            // Close the losing record and reload the gaining authority.
            this.$emit('close-record', losingRecord)
            const refreshedGaining = await Jmarc.get('auths', gainingRecordId)
            this.$emit('open-related-record', refreshedGaining)
            this.closeMergeModal()
          } catch (error) {
            const message = error && error.message ? error.message : String(error)
            this.$emit('stage-notice', {
              type: 'warning',
              message: `Authority merge failed: ${message}`
            })
          } finally {
            this.mergeSubmitting = false
          }
        },
        closeCreateRecordModal() {
            this.showCreateRecordModal = false
        },
        async loadWorkforms() {
            this.isLoadingWorkforms = true
            this.workformLoadError = ''

            try {
                const collections = ['bibs', 'auths']
                const allEntries = []

                for (const collection of collections) {
                    const names = await Jmarc.listWorkforms(collection)
                    const loaded = await Promise.all(names.map(async name => {
                        const workform = await Jmarc.fromWorkform(collection, name)
                        return {
                            collection,
                            name,
                            description: workform.workformDescription || '',
                            virtualCollection: workform.getVirtualCollection(),
                            workform
                        }
                    }))

                    allEntries.push(...loaded)
                }

                this.availableWorkforms = allEntries.sort((a, b) => {
                    const byCollection = a.collection.localeCompare(b.collection)
                    if (byCollection !== 0) return byCollection
                    return a.name.localeCompare(b.name)
                })
            } catch (error) {
                this.workformLoadError = error && error.message ? error.message : String(error)
                this.availableWorkforms = []
            } finally {
                this.isLoadingWorkforms = false
            }
        },
        createRecordFromWorkform(entry) {
          if (!this.canCreateRecord) return
            if (!entry || !entry.workform) return

            const nextRecord = entry.workform.clone()
          if (typeof nextRecord.getFields === 'function' && typeof nextRecord.deleteField === 'function') {
            const fields998 = nextRecord.getFields('998') || []
            fields998.forEach(field => nextRecord.deleteField(field))
          }
            nextRecord.recordId = null
            nextRecord.url = null
            nextRecord.workformName = entry.name
            nextRecord.workformDescription = entry.description || ''
            nextRecord._isCloneDraft = true
            nextRecord._isWorkformEdit = false

            this.$emit('create-record', nextRecord)
            this.closeCreateRecordModal()
        },
          editWorkform(entry) {
            if (!this.canUpdateWorkform) return
            if (!entry || !entry.workform) return

            const editableWorkform = entry.workform.clone()
            editableWorkform.workformName = entry.name
            editableWorkform.workformDescription = entry.description || ''
            editableWorkform._isWorkformEdit = true
              editableWorkform._isCloneDraft = false

            this.$emit('create-record', editableWorkform)
            this.closeCreateRecordModal()
          },
          async deleteWorkformFromList(entry) {
            if (!this.canDeleteWorkform) return
            if (!entry || !entry.name || !entry.collection) return

            if (!window.confirm(`Delete workform ${entry.collection}/workforms/${entry.name}?`)) {
              return
            }

            try {
              await Jmarc.deleteWorkform(entry.collection, entry.name)
              await this.loadWorkforms()
            } catch (error) {
              window.alert(`Could not delete workform: ${error && error.message ? error.message : String(error)}`)
            }
          },
        getRecordState(jmarc) {
          if (!jmarc || !this.recordStates) return null
          const key = `${jmarc.collection}/${jmarc.recordId}`
          return this.recordStates[key] || null
        },
        isRecordReadonly(jmarc) {
          if (this.readonly) return true
          const state = this.getRecordState(jmarc)
          return !!(state && state.readonly)
        },
        getRecordEditors() {
            const editors = this.$refs.recordEditors
            if (!editors) return []
            return Array.isArray(editors) ? editors : [editors]
        },
        getFocusedRecordEditor() {
            const editors = this.getRecordEditors().filter(Boolean)
            if (editors.length === 0) return null

            const focusedEditor = editors.find(editor => editor.record === this.focusedRecord)
            return focusedEditor || editors[0]
        },
        selectAllFieldsInFocusedRecord() {
            const editor = this.getFocusedRecordEditor()
            if (editor && typeof editor.selectAllSelectableFields === 'function') {
                editor.selectAllSelectableFields()
            }
        },
        deselectAllFieldsInFocusedRecord() {
            const editor = this.getFocusedRecordEditor()
            if (editor && typeof editor.clearAllFieldSelections === 'function') {
                editor.clearAllFieldSelections()
            }
        },
        openBatchActionsForFocusedRecord() {
          const editor = this.getFocusedRecordEditor()
          if (editor && typeof editor.batchActions === 'function') {
            editor.batchActions()
          }
        },
        deleteFocusedRecord() {
            const editor = this.getFocusedRecordEditor()
            if (editor && typeof editor.deleteRecord === 'function') {
                editor.deleteRecord()
            }
        },
        focusNextRecord() {
            if (!Array.isArray(this.records) || this.records.length < 2) return

            const currentIndex = this.records.indexOf(this.focusedRecord)
            const nextIndex = currentIndex >= 0
                ? (currentIndex + 1) % this.records.length
                : 0

            this.focusedRecord = this.records[nextIndex]
        },
          closeFocusedRecord() {
            if (!this.focusedRecord) return
            this.closeRecord(this.focusedRecord)
          },
        openShortcutHelp() {
            this.showShortcutHelp = true
        },
        closeShortcutHelp() {
            this.showShortcutHelp = false
        },
        handleGlobalKeydown(event) {
          if (this.readonly) return

            const key = String(event.key || '').toLowerCase()
            if (this.showShortcutHelp && key === 'escape') {
                event.preventDefault()
                this.closeShortcutHelp()
                return
            }

            const hasModifier = event.metaKey || event.ctrlKey
            const isDeleteRecordShortcut = hasModifier && event.altKey && (key === 'backspace' || key === 'delete')

            if (isDeleteRecordShortcut) {
              event.preventDefault()
              event.stopPropagation()
              this.deleteFocusedRecord()
              return
            }

            if (!hasModifier || !event.shiftKey) return

            const isSelectAll = key === 'a'
            const isDeselectAll = key === 'd'
            const isOpenBatchActions = key === 'b'
            const isFocusNextRecord = key === '.'
            const isCloseActiveRecord = key === 'x'
            const isShowHelp = key === '/' || key === '?'

            if (!isSelectAll && !isDeselectAll && !isOpenBatchActions && !isFocusNextRecord && !isCloseActiveRecord && !isShowHelp) return

            event.preventDefault()
            event.stopPropagation()

            if (isShowHelp) {
                this.openShortcutHelp()
                return
            }

            if (isFocusNextRecord) {
                this.focusNextRecord()
                return
            }

            if (isOpenBatchActions) {
              this.openBatchActionsForFocusedRecord()
              return
            }

            if (isCloseActiveRecord) {
              this.closeFocusedRecord()
              return
            }

            if (isDeselectAll) {
                this.deselectAllFieldsInFocusedRecord()
                return
            }

            this.selectAllFieldsInFocusedRecord()
        },
        focusRecord(jmarc) {
            this.focusedRecord = jmarc
        },
        closeRecord(jmarc) {
          const currentRecords = Array.isArray(this.records) ? this.records : []
          const closingIndex = currentRecords.indexOf(jmarc)
          const remainingRecords = currentRecords.filter(record => record !== jmarc)

          if (remainingRecords.length === 0) {
            this.focusedRecord = null
          } else if (closingIndex >= 0 && closingIndex < remainingRecords.length) {
            // Prefer the next record in display order when available.
            this.focusedRecord = remainingRecords[closingIndex]
          } else {
            // If there is no next record, fall back to the first remaining record.
            this.focusedRecord = remainingRecords[0]
          }

          this.$emit('close-record', jmarc)
          },
        unlockRecord(jmarc) {
            this.$emit('unlock-record', jmarc)
        },
        deleteRecord(jmarc) {
          this.$emit('delete-record', jmarc)
        },
        openRelatedRecord(jmarc) {
            this.$emit('open-related-record', jmarc)
        },
        batchActions(payload) {
          this.$emit('batch-actions', payload)
        },
          cloneRecord(jmarc) {
            this.$emit('clone-record', jmarc)
        }
    }
}
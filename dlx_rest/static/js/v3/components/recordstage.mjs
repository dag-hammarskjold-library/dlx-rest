import { RecordstageRecord } from "./recordstage-record.mjs"

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
          { keys: 'Ctrl/Cmd + Shift + .', description: 'Focus next displayed record' },
          { keys: 'Ctrl/Cmd + Shift + X', description: 'Close active record' },
          { keys: 'Ctrl/Cmd + Shift + /', description: 'Show keyboard shortcuts help' },
          { keys: 'Ctrl/Cmd + S', description: 'Save active record' },
          { keys: 'Ctrl/Cmd + Z', description: 'Undo active record change' },
          { keys: 'Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y', description: 'Redo active record change' },
          { keys: 'Shift + Enter', description: 'Add a field after focused field' },
          { keys: 'Shift + Backspace/Delete', description: 'Delete selected fields' },
          { keys: 'Esc', description: 'Close keyboard shortcuts help' }
        ]
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
        <button @click="toggleCreateRecordDropdown">create record</button>
        <button class="merge-record" @click="toggleMergeRecordsDropdown">merge auths</button>
        <button @click="openShortcutHelp" title="Keyboard shortcuts">keyboard help</button>
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
          @unlock-record="unlockRecord"
          @close-record="closeRecord"
        />
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
    </div>
  `,
    methods: {
        toggleCreateRecordDropdown() { window.alert("workform list") },
        toggleMergeRecordsDropdown() { window.alert("merge chooser") },
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
            const key = String(event.key || '').toLowerCase()
            if (this.showShortcutHelp && key === 'escape') {
                event.preventDefault()
                this.closeShortcutHelp()
                return
            }

            const hasModifier = event.metaKey || event.ctrlKey
            if (!hasModifier || !event.shiftKey) return

            const isSelectAll = key === 'a'
            const isDeselectAll = key === 'd'
            const isFocusNextRecord = key === '.'
            const isCloseActiveRecord = key === 'x'
            const isShowHelp = key === '/' || key === '?'

            if (!isSelectAll && !isDeselectAll && !isFocusNextRecord && !isCloseActiveRecord && !isShowHelp) return

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
          cloneRecord(jmarc) {
            this.$emit('clone-record', jmarc)
        }
    }
}
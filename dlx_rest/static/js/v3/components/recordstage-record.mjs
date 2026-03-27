import { RecordField } from "./record-field.mjs"

export const RecordstageRecord = {
    props: {
        record: Object,
        readonly: { type: Boolean, required: false, default: false },
        user: Object
    },
    components: { RecordField },
    data() {
        return {
            hasChanges: false,
            selectedFields: [],
            copiedFields: [],
            isDragSelecting: false,
            dragSelectValue: true,
            dragAdditive: false,
            changedFields: new Set(),
            controls: [
                {
                    id: 'save',
                    label: 'Save',
                    icon: 'bi-floppy',
                    permission: 'updateRecord',
                    action: 'saveRecord'
                },
                {
                    id: 'clone',
                    label: 'Clone',
                    icon: 'bi-files',
                    permission: 'createRecord',
                    action: 'cloneRecord'
                },
                {
                    id: 'paste',
                    label: 'Paste Fields',
                    icon: 'bi-clipboard',
                    permission: 'updateRecord',
                    action: 'pasteFields'
                },
                {
                    id: 'delete',
                    label: 'Delete Record',
                    icon: 'bi-trash',
                    permission: 'deleteRecord',
                    action: 'deleteRecord'
                },
                {
                    id: 'batch',
                    label: 'Batch Actions',
                    icon: 'bi-list-check',
                    permission: 'updateRecord',
                    action: 'batchActions'
                }
            ]
        }
    },
    computed: {
        visibleControls() {
            return this.controls.filter(control =>
                this.user && this.user.hasPermission(control.permission)
            )
        },
        allFieldsSelected() {
            const dataFields = this.record.getDataFields()
            return dataFields.length > 0 && dataFields.every(f => f.checked)
        }
    },
    watch: {
        record: {
            handler(newRecord) {
                if (newRecord && newRecord.updateSavedState) {
                    newRecord.updateSavedState()
                }
            },
            immediate: true
        }
    },
    mounted() {
        window.addEventListener('mouseup', this.endFieldSelection)
    },
    beforeUnmount() {
        window.removeEventListener('mouseup', this.endFieldSelection)
    },
    methods: {
        fieldHasChanged(field) {
            if (!field.savedState) return false
            return JSON.stringify(field.savedState) !== JSON.stringify(field.compile())
        },
        updateChangeTracking() {
            const dataFields = this.record.getDataFields()
            this.changedFields.clear()

            dataFields.forEach(field => {
                if (this.fieldHasChanged(field)) {
                    this.changedFields.add(field)
                }
            })

            // Use Jmarc's built-in saved getter
            this.hasChanges = !this.record.saved
        },
        onFieldChanged() {
            this.updateChangeTracking()
        },
        handleControl(control) {
            switch (control.id) {
                case 'save':
                    this.saveRecord()
                    break
                case 'clone':
                    this.cloneRecord()
                    break
                case 'paste':
                    this.pasteFields()
                    break
                case 'delete':
                    this.deleteRecord()
                    break
                case 'batch':
                    this.batchActions()
                    break
            }
        },
        saveRecord() {
            console.log('Save record:', this.record)
            this.record.updateSavedState()
            this.hasChanges = false
            this.changedFields.clear()
            this.$emit('saveRecord', this.record)
        },
        cloneRecord() {
            console.log('Clone record:', this.record)
            this.$emit('cloneRecord', this.record)
        },
        pasteFields() {
            if (this.copiedFields.length === 0) {
                console.warn('No fields copied')
                return
            }

            const fieldsToPaste = [...this.copiedFields]
            const pastedFields = []

            fieldsToPaste.forEach(sourceField => {
                if (!sourceField || !sourceField.tag) return

                const newField = this.record.createField(sourceField.tag)

                newField.indicators = Array.isArray(sourceField.indicators)
                    ? [...sourceField.indicators]
                    : ["_", "_"]

                ;(sourceField.subfields || []).forEach(sf => {
                    const newSubfield = newField.createSubfield(sf.code)
                    newSubfield.value = sf.value
                    newSubfield.xref = sf.xref
                })

                newField.checked = false
                pastedFields.push(newField)
            })

            if (pastedFields.length === 0) {
                console.warn('No fields were pasted')
                return
            }

            this.sortRecordFieldsByTag()
            this.clearFieldSelections()
            pastedFields.forEach(field => this.setFieldSelection(field, true))

            this.updateChangeTracking()
            this.$emit('pasteFields', { record: this.record, fields: pastedFields })
        },

        sortRecordFieldsByTag() {
            const byTag = (a, b) => {
                const ta = String(a?.tag ?? '')
                const tb = String(b?.tag ?? '')
                const na = Number.parseInt(ta, 10)
                const nb = Number.parseInt(tb, 10)
                const bothNumeric = !Number.isNaN(na) && !Number.isNaN(nb)

                if (bothNumeric && na !== nb) return na - nb
                return ta.localeCompare(tb)
            }

            // If Jmarc exposes a sorter, use it.
            if (typeof this.record.sortFields === 'function') {
                this.record.sortFields()
                return
            }

            // Sort underlying Jmarc storage (preferred).
            if (Array.isArray(this.record.fields)) {
                const controls = []
                const data = []

                this.record.fields.forEach(f => {
                    if (Array.isArray(f?.subfields)) data.push(f)
                    else controls.push(f)
                })

                data.sort(byTag)
                this.record.fields.splice(0, this.record.fields.length, ...controls, ...data)
                return
            }

            // Fallbacks
            if (Array.isArray(this.record.datafields)) {
                this.record.datafields.sort(byTag)
                return
            }

            const dataFields = this.record.getDataFields?.()
            if (Array.isArray(dataFields)) {
                dataFields.sort(byTag)
            }
        },
        deleteRecord() {
            if (confirm(`Are you sure you want to delete this record?`)) {
                console.log('Delete record:', this.record)
                this.$emit('deleteRecord', this.record)
            }
        },
        batchActions() {
            console.log('Batch actions for:', this.record)
            this.$emit('batchActions', this.record)
        },
        setFieldSelection(field, shouldSelect) {
            field.checked = shouldSelect
            if (shouldSelect) {
                this.addFieldToCopyStack(field)
            } else {
                this.removeFieldFromCopyStack(field)
            }
        },
        clearFieldSelections() {
            const dataFields = this.record.getDataFields()
            dataFields.forEach(field => {
                field.checked = false
            })
            this.copiedFields = []
        },
        beginFieldSelection(field, event) {
            if (event.button !== 0) return // left click only

            this.isDragSelecting = true
            this.dragAdditive = event.ctrlKey || event.metaKey // Ctrl on Win/Linux, Cmd on macOS
            this.dragSelectValue = this.dragAdditive ? !field.checked : true

            if (!this.dragAdditive) {
                this.clearFieldSelections()
            }

            this.setFieldSelection(field, this.dragSelectValue)
            event.preventDefault()
        },
        onFieldHoverSelection(field) {
            if (!this.isDragSelecting) return
            this.setFieldSelection(field, this.dragSelectValue)
        },
        endFieldSelection() {
            this.isDragSelecting = false
            this.dragAdditive = false
        },
        toggleSelectAllFields() {
            const dataFields = this.record.getDataFields()
            const shouldCheck = !this.allFieldsSelected

            dataFields.forEach(field => {
                this.setFieldSelection(field, shouldCheck)
            })
        },
        addFieldToCopyStack(field) {
            if (!this.copiedFields.includes(field)) {
                this.copiedFields.push(field)
            }
        },
        removeFieldFromCopyStack(field) {
            const index = this.copiedFields.indexOf(field)
            if (index > -1) {
                this.copiedFields.splice(index, 1)
            }
        },
        toggleFieldSelection(field, event) {
            const additive = event && (event.ctrlKey || event.metaKey)
            if (additive) {
                this.setFieldSelection(field, !field.checked)
                return
            }

            this.clearFieldSelections()
            this.setFieldSelection(field, true)
        }
    },
    template: /* html */ `
    <div class="record-container">
      <div class="record-header">
        <div class="record-header-id">
          <i 
            class="bi record-select-all"
            :class="allFieldsSelected ? 'bi-check-square' : 'bi-square'"
            @click="toggleSelectAllFields"
            title="Select/Unselect all fields"
          ></i>
          <span class="ms-2">{{ record.getVirtualCollection() }}/{{ record.recordId }}</span>
        </div>
        <div class="record-controls">
          <button
            v-for="control in visibleControls"
            :key="control.id"
            :title="control.label"
            :data-action="control.id"
            :class="['record-control-btn', { 'has-changes': control.id === 'save' && hasChanges }]"
            @click="handleControl(control)"
          >
            <i :class="['bi', control.icon]"></i>
          </button>
          <button
            v-if="!readonly"
            class="record-control-btn record-close-btn"
            title="Close record"
            @click="$emit('close-record', record)"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
      <div
        v-for="(field, idx) in record.getDataFields()"
        :key="field.tag + '-' + idx"
        class="record-field-selectable"
        :class="{ 'is-selected': field.checked, 'is-changed': changedFields.has(field) }"
        @mousedown="beginFieldSelection(field, $event)"
        @mouseenter="onFieldHoverSelection(field)"
        @mouseup="endFieldSelection"
      >
        <record-field 
          :field="field"
          :collection="record.collection"
          :readonly="readonly"
          @field-changed="onFieldChanged"
          @field-selected="toggleFieldSelection(field, $event)"
        />
      </div>
    </div>
  `
}
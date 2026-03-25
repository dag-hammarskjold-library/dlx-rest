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
        }
    },
    methods: {
        onFieldChanged() {
            this.hasChanges = true
        },
        handleControl(control) {
            if (control.id === 'save' && this.hasChanges) {
                this.saveRecord()
            } else {
                this.$emit(control.action, this.record)
            }
        },
        saveRecord() {
            console.log('Save record:', this.record)
            this.hasChanges = false
            this.$emit('saveRecord', this.record)
        },
        cloneRecord() {
            console.log('Clone record:', this.record)
            this.$emit('cloneRecord', this.record)
        },
        pasteFields() {
            console.log('Paste fields into:', this.record)
            this.$emit('pasteFields', this.record)
        },
        deleteRecord() {
            console.log('Delete record:', this.record)
            this.$emit('deleteRecord', this.record)
        },
        batchActions() {
            console.log('Batch actions for:', this.record)
            this.$emit('batchActions', this.record)
        }
    },
    template: /* html */ `
    <div class="record-container">
      <div class="record-header">
        <div class="record-header-id">{{ record.collection + "/" + record.recordId }}</div>
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
      <record-field 
        v-for="field in record.getDataFields()" 
        :key="field.tag" 
        :field="field"
        :readonly="readonly"
        @field-changed="onFieldChanged"
      />
    </div>
  `
}
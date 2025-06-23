export const recordcontrols = {
    props: {
        jmarc: { type: Object, required: true },
        readonly: { type: Boolean, default: false },
        user: { type: String, default: null },
        historyMode: { type: Boolean, default: false }
    },
    template: `
      <div class="record-controls d-flex flex-wrap align-items-center">
        <!-- Select/Unselect Fields -->
        <i class="far fa-square p-1 record-control"
           title="Select/Unselect Fields"
           @click="emitAction('select-fields')"></i>
        <!-- Save -->
        <i v-if="!historyMode && !readonly"
           class="fas fa-save p-1 record-control"
           :class = "jmarc.saved ? 'text-muted' : ''"
           :title="jmarc.saved ? 'No unsaved changes' : 'Save Record'"
           @click="emitAction('save-record')"></i>
        <!-- Clone -->
        <i v-if="!historyMode && !readonly"
           class="fas fa-copy p-1 record-control"
           title="Clone Record"
           @click="emitAction('clone-record')"></i>
        <!-- Paste -->
        <i v-if="!historyMode && !readonly"
           class="far fa-arrow-alt-circle-down p-1 record-control"
           title="Paste Fields"
           @click="emitAction('paste-field')"></i>
        <!-- Toggle Hidden Fields -->
        <i v-if="!historyMode"
           class="fas fa-eye p-1 record-control"
           title="Toggle Hidden Fields"
           @click="emitAction('toggle-hidden')"></i>
        <!-- Delete -->
        <i v-if="!historyMode && !readonly"
           class="fas fa-trash-alt p-1 record-control"
           title="Delete Record"
           @click="emitAction('delete-record')"></i>
        <!-- Undo -->
        <i v-if="!historyMode && !readonly"
           class="fa fa-undo p-1 record-control"
           title="Undo"
           @click="emitAction('undo')"></i>
        <!-- Redo -->
        <i v-if="!historyMode && !readonly"
           class="fa fa-redo p-1 record-control"
           title="Redo"
           @click="emitAction('redo')"></i>
        <!-- History -->
        <i v-if="!historyMode && !readonly"
           class="fas fa-history p-1 record-control"
           title="History"
           @click="emitAction('show-history')"></i>
        <!-- Save As Workform -->
        <i v-if="!historyMode && !readonly"
           class="fas fa-share-square p-1 record-control"
           title="Save As Workform"
           @click="emitAction('save-as-workform')"></i>
        <!-- Batch Actions -->
        <i v-if="!historyMode && !readonly"
           class="fas fa-tasks p-1 record-control"
           title="Batch Actions"
           @click="emitAction('batch-edit')"></i>
        <!-- Remove/Close -->
        <i class="fas fa-window-close p-1 record-control float-right"
           title="Close Record"
           @click="emitAction('close-record')"></i>
        <!-- Approve (auths only) -->
        <i v-if="jmarc.collection === 'auths' && !historyMode && !readonly"
           class="fas fa-check-circle p-1 record-control"
           title="Approve Record"
           @click="emitAction('approve-auth')"></i>
        <!-- Revert (history mode only) -->
        <i v-if="historyMode"
           class="fa fa-undo p-1 record-control"
           title="Revert to this revision"
           @click="emitAction('revert')"></i>
      </div>
    `,
    methods: {
        emitAction(action) {
            this.$emit(action, this.jmarc);
        }
    },
};
import { RecordstageRecord } from "./recordstage-record.mjs"

export const AppRecordstage = {
    props: {
        records: Array,
        readonly: { type: Boolean, required: false, default: false },
        user: Object
    },
    components: { RecordstageRecord },
    data() {
      return {
        focusedRecord: null
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
    template: /* html */ `
    <div class="recordstage">
      <div class="recordstage-menu" v-if="!readonly">
        <button @click="toggleCreateRecordDropdown">create record</button>
        <button class="merge-record" @click="toggleMergeRecordsDropdown">merge auths</button>
      </div>
      <div class="recordstage-display">
        <recordstage-record 
          v-for="jmarc in records" 
          :key="jmarc.collection + jmarc.recordId" 
          :record="jmarc"
          :readonly="readonly"
          :is-focused="focusedRecord === jmarc"
          :user="user"
          @focus-record="focusRecord"
            @clone-record="cloneRecord"
          @close-record="closeRecord"
        />
      </div>
    </div>
  `,
    methods: {
        toggleCreateRecordDropdown() { window.alert("workform list") },
        toggleMergeRecordsDropdown() { window.alert("merge chooser") },
        focusRecord(jmarc) {
            this.focusedRecord = jmarc
        },
        closeRecord(jmarc) {
            this.$emit('close-record', jmarc)
          },
          cloneRecord(jmarc) {
            this.$emit('clone-record', jmarc)
        }
    }
}
import { RecordstageRecord } from "./recordstage-record.mjs"

export const AppRecordstage = {
    props: {
        records: Array,
        readonly: { type: Boolean, required: false, default: false },
        user: Object
    },
    components: { RecordstageRecord },
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
          :user="user"
          @close-record="closeRecord"
        />
      </div>
    </div>
  `,
    methods: {
        toggleCreateRecordDropdown() { window.alert("workform list") },
        toggleMergeRecordsDropdown() { window.alert("merge chooser") },
        closeRecord(jmarc) {
            this.$emit('close-record', jmarc)
        }
    }
}
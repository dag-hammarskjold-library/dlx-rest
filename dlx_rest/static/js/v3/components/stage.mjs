import { AppBasket } from "./basket.mjs"
import { AppRecordstage } from "./recordstage.mjs"
import { User } from "../api/user.mjs"
import { Jmarc } from "../../api/jmarc.mjs"

export const AppStage = {
    props: {
        api_prefix: { type: String, required: true },
        user: { type: Object, required: false, default: null },
        records: { type: String, required: false, default: "" }
    },
    components: { AppBasket, AppRecordstage },
    data() {
        return {
            activeRecords: []
        }
    },
    computed: {
        isAuthenticated() {
            return this.user !== null && this.user !== undefined
        }
    },
    template: /* html */ `
    <div class="app-container">
      <div class="basket-container" v-if="isAuthenticated">
        <app-basket 
          :user="user"
          :api_prefix="api_prefix"
          :activeRecords="activeRecords"
          @activate-record="activateRecord"
        />
      </div>
      <div class="main-stage-container" :class="{ 'full-width': !isAuthenticated }">
        <app-recordstage 
          v-if="activeRecords.length > 0"
          :records="activeRecords"
          :readonly="!isAuthenticated"
          :user="user"
                        @clone-record="activateClonedRecord"
          @close-record="closeRecord"
        />
        <div v-else class="recordstage-empty">
          <p>No records selected</p>
        </div>
      </div>
    </div>
  `,
    async mounted() {
        User.apiUrl = this.api_prefix
        Jmarc.apiUrl = this.api_prefix

        // Initialize Jmarc's authMap for authority lookups
        try {
            await Jmarc.init()
        } catch (error) {
            console.warn('Failed to initialize authMap:', error)
        }

        // Parse and load records passed from the server
        await this.loadRecords()
    },
    methods: {
        async loadRecords() {
            if (!this.records) return

            // Parse the records string - handle comma-separated or JSON array format
            let recordRefs = []
            try {
                // Try parsing as JSON array first
                recordRefs = JSON.parse(this.records)
            } catch (e) {
                // Fall back to comma-separated values
                recordRefs = this.records
                    .split(',')
                    .map(ref => ref.trim())
                    .filter(ref => ref.length > 0)
            }

            // Load each record
            for (const recordRef of recordRefs) {
                try {
                    // Parse "collection/record_id" format
                    const [collection, recordId] = recordRef.split('/')
                    
                    if (!collection || !recordId) {
                        console.error(`Invalid record reference format: ${recordRef}. Expected "collection/record_id"`)
                        continue
                    }

                    const jmarc = await Jmarc.get(collection, recordId)
                    this.activateRecord(jmarc)
                } catch (error) {
                    console.error(`Failed to load record ${recordRef}:`, error)
                }
            }
        },
        activateRecord(jmarc) {
              if (!jmarc) return

            if (this.activeRecords.includes(jmarc)) {
                const index = this.activeRecords.indexOf(jmarc)
                this.activeRecords.splice(index, 1)
            }

            this.activeRecords.unshift(jmarc)
        },
          activateClonedRecord(jmarc) {
              if (!jmarc) return

              // Guard cloned records so they always open at the top with visual draft state.
              jmarc._isCloneDraft = true
              this.activateRecord(jmarc)
          },
        closeRecord(jmarc) {
            if (this.activeRecords.includes(jmarc)) {
                const index = this.activeRecords.indexOf(jmarc)
                this.activeRecords.splice(index, 1)
            }
        }
    }
}
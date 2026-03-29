import { AppBasket } from "./basket.mjs"
import { AppRecordstage } from "./recordstage.mjs"
import { BatchBasketModal } from "./batch-basket-modal.mjs"
import { User } from "../api/user.mjs"
import { Jmarc } from "../../api/jmarc.mjs"

export const AppStage = {
    props: {
        api_prefix: { type: String, required: true },
        user: { type: Object, required: false, default: null },
        records: { type: String, required: false, default: "" }
    },
    components: { AppBasket, AppRecordstage, BatchBasketModal },
    data() {
        return {
            activeRecords: [],
            recordStates: {},
            stageNotices: [],
            showBatchModal: false,
            batchSourceRecord: null,
            batchSelectedFields: []
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
                    ref="basket"
          :user="user"
          :api_prefix="api_prefix"
          :activeRecords="activeRecords"
          @activate-record="activateRecord"
        />
      </div>
      <div class="main-stage-container" :class="{ 'full-width': !isAuthenticated }">
                <div v-if="stageNotices.length > 0" class="recordstage-notices">
                    <div
                        v-for="notice in stageNotices"
                        :key="notice.id"
                        class="recordstage-notice"
                        :class="notice.type === 'warning' ? 'recordstage-notice--warning' : 'recordstage-notice--info'"
                    >
                        {{ notice.message }}
                    </div>
                </div>
        <app-recordstage 
          v-if="activeRecords.length > 0"
          :records="activeRecords"
                    :record-states="recordStates"
          :readonly="!isAuthenticated"
          :user="user"
                        @clone-record="activateClonedRecord"
                                        @batch-actions="openBatchActions"
          @close-record="closeRecord"
                    @unlock-record="unlockRecordForEditing"
        />
                                <batch-basket-modal
                                        :visible="showBatchModal"
                                        :source-record="batchSourceRecord"
                                        :selected-fields="batchSelectedFields"
                                        :basket-records="$refs.basket ? $refs.basket.records : []"
                                        @close="closeBatchActions"
                                        @applied="handleBatchActionsApplied"
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
        normalizeCollection(collection) {
            const map = {
                speeches: 'bibs',
                votes: 'bibs'
            }
            return map[String(collection || '').toLowerCase()] || collection
        },
        makeRecordKey(collection, recordId) {
            return `${String(collection)}/${String(recordId)}`
        },
        setRecordState(collection, recordId, patch) {
            const key = this.makeRecordKey(collection, recordId)
            const previous = this.recordStates[key] || {}
            this.recordStates = {
                ...this.recordStates,
                [key]: {
                    ...previous,
                    ...patch,
                    collection: this.normalizeCollection(collection),
                    recordId: String(recordId)
                }
            }
        },
        getRecordStateForJmarc(jmarc) {
            if (!jmarc) return null
            return this.recordStates[this.makeRecordKey(jmarc.collection, jmarc.recordId)] || null
        },
        addStageNotice(message, type = 'info') {
            const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
            this.stageNotices = [...this.stageNotices, { id, message, type }]
        },
        parseRecordsParam() {
            if (!this.records || this.records === 'None') return []

            let recordRefs = []
            try {
                recordRefs = JSON.parse(this.records)
            } catch (e) {
                recordRefs = this.records
                    .split(',')
                    .map(ref => ref.trim())
                    .filter(ref => ref.length > 0)
            }

            return recordRefs
        },
        updateRecordsUrlParam() {
            const url = new URL(window.location.href)
            const recordsList = this.activeRecords
                .filter(record => record && record.recordId)
                .map(record => `${record.collection}/${record.recordId}`)

            if (recordsList.length > 0) {
                url.searchParams.set('records', recordsList.join(','))
            } else {
                url.searchParams.delete('records')
            }

            window.history.replaceState({}, '', url)
        },
        async ensureBasketAccessForRecord(collection, recordId) {
            if (!this.isAuthenticated || !this.user) {
                return { readonly: true, reason: 'unauthenticated' }
            }

            const normalizedCollection = this.normalizeCollection(collection)

            if (this.user.isInBasket(normalizedCollection, recordId)) {
                return { readonly: false }
            }

            const lockStatus = await this.user.getRecordLockStatus(normalizedCollection, recordId)
            if (lockStatus && lockStatus.locked) {
                return {
                    readonly: true,
                    reason: 'locked',
                    lockStatus,
                    canUnlock: true
                }
            }

            await this.user.addBasketItem(normalizedCollection, recordId, { override: false })
            await this.user.loadBasket()

            if (this.$refs.basket && typeof this.$refs.basket.refreshFromUserBasket === 'function') {
                await this.$refs.basket.refreshFromUserBasket()
            }

            return { readonly: false }
        },
        async loadRecords() {
            const recordRefs = this.parseRecordsParam()
            if (recordRefs.length === 0) return

            const loadedRecords = []

            // Load each record
            for (const recordRef of recordRefs) {
                try {
                    // Parse "collection/record_id" format
                    const [rawCollection, recordId] = String(recordRef).split('/')
                    const collection = this.normalizeCollection(rawCollection)
                    
                    if (!collection || !recordId) {
                        console.error(`Invalid record reference format: ${recordRef}. Expected "collection/record_id"`)
                        continue
                    }

                    const jmarc = await Jmarc.get(collection, recordId)

                    const accessState = await this.ensureBasketAccessForRecord(collection, recordId)
                    this.setRecordState(collection, recordId, accessState)

                    if (accessState.reason === 'locked' && accessState.lockStatus) {
                        this.addStageNotice(
                            `${collection}/${recordId} is locked in basket "${accessState.lockStatus.in}" by ${accessState.lockStatus.by}. Opened read-only.`,
                            'warning'
                        )
                    }

                    loadedRecords.push(jmarc)
                } catch (error) {
                    console.error(`Failed to load record ${recordRef}:`, error)
                }
            }

            // Keep the same order as the records query parameter.
            this.activeRecords = loadedRecords

            this.updateRecordsUrlParam()
        },
        activateRecord(jmarc, { updateUrl = true } = {}) {
              if (!jmarc) return

            if (this.activeRecords.includes(jmarc)) {
                const index = this.activeRecords.indexOf(jmarc)
                this.activeRecords.splice(index, 1)
            }

            this.activeRecords.unshift(jmarc)

            if (updateUrl) {
                this.updateRecordsUrlParam()
            }
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
            this.updateRecordsUrlParam()
        },
        openBatchActions(payload) {
            this.batchSourceRecord = payload && payload.sourceRecord ? payload.sourceRecord : null
            this.batchSelectedFields = payload && Array.isArray(payload.selectedFields)
                ? payload.selectedFields
                : []
            this.showBatchModal = true
        },
        closeBatchActions() {
            this.showBatchModal = false
            this.batchSourceRecord = null
            this.batchSelectedFields = []
        },
        async refreshActiveRecordFromServer(collection, recordId) {
            const index = this.activeRecords.findIndex(record =>
                String(record.collection) === String(collection)
                && String(record.recordId) === String(recordId)
            )

            if (index < 0) return

            const updated = await Jmarc.get(collection, recordId)
            const next = [...this.activeRecords]
            next.splice(index, 1, updated)
            this.activeRecords = next
        },
        async handleBatchActionsApplied(result) {
            const action = result && result.action ? result.action : 'update'
            const updatedRecords = result && Array.isArray(result.updatedRecords) ? result.updatedRecords : []
            const skipped = result && Number.isFinite(result.skipped) ? result.skipped : 0

            const refreshed = []
            for (const target of updatedRecords) {
                const key = `${target.collection}/${target.recordId}`
                if (refreshed.includes(key)) continue
                refreshed.push(key)
                try {
                    await this.refreshActiveRecordFromServer(target.collection, target.recordId)
                } catch (error) {
                    console.warn(`Could not refresh active record ${key} after batch ${action}`, error)
                }
            }

            const appliedCount = updatedRecords.length
            this.addStageNotice(
                `Batch ${action} applied to ${appliedCount} record(s)` + (skipped > 0 ? `; ${skipped} skipped due to validation.` : '.'),
                skipped > 0 ? 'warning' : 'info'
            )
        },
        async unlockRecordForEditing(jmarc) {
            if (!jmarc || !this.user) return

            try {
                // Local override only: do not transfer basket ownership from the locking user.
                this.setRecordState(jmarc.collection, jmarc.recordId, {
                    readonly: false,
                    reason: 'lock-overridden',
                    canUnlock: false
                })

                this.addStageNotice(
                    `Unlocked ${jmarc.collection}/${jmarc.recordId} for local editing without changing basket ownership.`,
                    'info'
                )
            } catch (error) {
                console.error(`Failed to unlock ${jmarc.collection}/${jmarc.recordId}:`, error)
                this.addStageNotice(`Could not unlock ${jmarc.collection}/${jmarc.recordId} for editing.`, 'warning')
            }
        }
    }
}
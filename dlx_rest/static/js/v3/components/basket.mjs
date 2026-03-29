import { BasketRecord } from "./basket-record.mjs"
import { Jmarc } from "../../api/jmarc.mjs"

export const AppBasket = {
    props: {
        user: Object,
        api_prefix: String,
        activeRecords: Array
    },
    components: { BasketRecord },
    emits: ['activate-record', 'basket-records-removed'],
    data() {
        return {
            records: [],
            filterText: '',
            filterCollection: 'all',
            sortMode: 'basket',
            pollingHandle: null,
            lastBasketSignature: '',
            classes: { basketRecord: { "basket-record": true } }
        }
    },
    computed: {
        activeRecordKeys() {
            return new Set((this.activeRecords || []).map(record => this.makeRecordKey(record.collection, record.recordId)))
        },
        collectionFilterOptions() {
            const values = new Set((this.records || []).map(item => String(item.virtualCollection || item.collection || '').toLowerCase()).filter(Boolean))
            const ordered = ['bibs', 'speeches', 'votes', 'auths']
            const known = ordered.filter(value => values.has(value))
            const extras = [...values].filter(value => !ordered.includes(value)).sort((a, b) => a.localeCompare(b))
            return ['all', ...known, ...extras]
        },
        filteredRecords() {
            const query = String(this.filterText || '').trim().toLowerCase()

            const filtered = this.records.filter(item => {
                const itemCollection = String(item.virtualCollection || item.collection || '').toLowerCase()
                const matchesCollection = this.filterCollection === 'all' || itemCollection === this.filterCollection
                if (!matchesCollection) return false

                if (!query) return true
                const haystack = [
                    item.collection,
                    item.virtualCollection,
                    item.recordId,
                    item.title,
                    item.symbol
                ]
                    .map(value => String(value || '').toLowerCase())
                    .join(' ')

                return haystack.includes(query)
            })

            if (this.sortMode === 'basket') {
                return filtered
            }

            const sorted = [...filtered]
            if (this.sortMode === 'title-asc') {
                sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
            } else if (this.sortMode === 'title-desc') {
                sorted.sort((a, b) => String(b.title || '').localeCompare(String(a.title || '')))
            } else if (this.sortMode === 'id-asc') {
                sorted.sort((a, b) => Number(a.recordId) - Number(b.recordId))
            } else if (this.sortMode === 'id-desc') {
                sorted.sort((a, b) => Number(b.recordId) - Number(a.recordId))
            }

            return sorted
        }
    },
    template: /* html */ `
    <div class="app-basket">
      <div class="basket-toolbar">
        <button type="button" title="Sort by basket order" @click="setSortMode('basket')">
          <i class="bi bi-list-ul"></i>
        </button>
        <button type="button" title="Sort by title" @click="toggleTitleSort">
          <i class="bi bi-sort-alpha-down"></i>
        </button>
        <button type="button" title="Sort by record ID" @click="toggleIdSort">
          <i class="bi bi-sort-numeric-down"></i>
        </button>
        <select v-model="filterCollection" title="Filter by collection" class="basket-filter-collection">
                    <option v-for="option in collectionFilterOptions" :key="option" :value="option">
                        {{ option === 'all' ? 'All' : option }}
                    </option>
        </select>
        <input v-model="filterText" class="basket-filter-input" type="text" placeholder="Filter title/symbol/id" title="Filter basket records">
        <button type="button" title="Clear basket" @click="clearBasket">
          <i class="bi bi-trash"></i>
        </button>
      </div>
      <div v-for="item in filteredRecords" :key="item.key">
        <basket-record 
          :class="classes.basketRecord"
          :item="item"
                    :active="activeRecordKeys.has(item.key)"
          @click="activateRecord(item.jmarc)"
          @remove="removeBasketItem(item)"
        />
      </div>
    </div>
  `,
    async mounted() {
        Jmarc.apiUrl = this.api_prefix

        // Load records from user's basket
        await this.loadBasketRecords()
        this.startBasketPolling()
    },
    beforeUnmount() {
        this.stopBasketPolling()
    },
    methods: {
        makeRecordKey(collection, recordId) {
            return `${String(collection)}/${String(recordId)}`
        },
        buildBasketSignature(items) {
            const values = (items || []).map(item => `${item.collection}/${item.record_id}:${item.url || ''}`)
            return values.join('|')
        },
        extractRecordSummary(jmarc) {
            const summary = {
                title: '[No title]',
                symbol: ''
            }

            if (!jmarc) return summary

            if (jmarc.collection === 'bibs') {
                const titleField = jmarc.getField('249') || jmarc.getField('245') || jmarc.getField('700')
                if (titleField && titleField.getSubfield('a')) {
                    summary.title = titleField.getSubfield('a').value || '[No title]'
                }

                const symbolFields = jmarc.getFields('191').length > 0
                    ? jmarc.getFields('191')
                    : jmarc.getFields('791')

                summary.symbol = symbolFields
                    .map(field => (field.getSubfield('a') ? field.getSubfield('a').value : ''))
                    .filter(Boolean)
                    .join('; ')
            } else if (jmarc.collection === 'auths') {
                let headingField = null
                for (const tag of ['100', '110', '111', '130', '150', '190', '191']) {
                    if (jmarc.getField(tag)) {
                        headingField = jmarc.getField(tag)
                        break
                    }
                }

                if (headingField) {
                    const titleParts = ['a', 'b', 'c', 'd']
                        .map(code => (headingField.getSubfield(code) ? headingField.getSubfield(code).value : ''))
                        .filter(Boolean)
                    summary.title = titleParts.join(' ') || '[No title]'
                }
            }

            return summary
        },
        hasBasketRecord(collection, recordId) {
            return this.records.some(item =>
                String(item.collection) === String(collection)
                && String(item.recordId) === String(recordId)
            )
        },
        setSortMode(mode) {
            this.sortMode = mode
        },
        toggleTitleSort() {
            this.sortMode = this.sortMode === 'title-asc' ? 'title-desc' : 'title-asc'
        },
        toggleIdSort() {
            this.sortMode = this.sortMode === 'id-asc' ? 'id-desc' : 'id-asc'
        },
        startBasketPolling() {
            if (this.pollingHandle) return
            this.pollingHandle = window.setInterval(() => {
                this.pollBasketForUpdates()
            }, 15000)
        },
        stopBasketPolling() {
            if (!this.pollingHandle) return
            window.clearInterval(this.pollingHandle)
            this.pollingHandle = null
        },
        async pollBasketForUpdates() {
            if (!this.user || typeof this.user.loadBasket !== 'function') return

            try {
                await this.user.loadBasket()
                const signature = this.buildBasketSignature(this.user.basket)
                if (signature === this.lastBasketSignature) return
                await this.syncRecordsWithBasket()
            } catch (error) {
                console.warn('Basket polling failed:', error)
            }
        },
        async refreshFromUserBasket() {
            await this.syncRecordsWithBasket(true)
        },
        addRecordToBasketView(jmarc) {
            if (!jmarc) return
            if (this.hasBasketRecord(jmarc.collection, jmarc.recordId)) return

            const summary = this.extractRecordSummary(jmarc)
            this.records.push({
                key: this.makeRecordKey(jmarc.collection, jmarc.recordId),
                collection: jmarc.collection,
                virtualCollection: jmarc.getVirtualCollection(),
                recordId: String(jmarc.recordId),
                title: summary.title,
                symbol: summary.symbol,
                basketItemUrl: null,
                jmarc
            })
        },
        async loadBasketRecords() {
            if (!this.user || !this.user.basket) {
                console.warn('User or basket data not available')
                return
            }

            await this.syncRecordsWithBasket(true)
        },
        async syncRecordsWithBasket(forceReload = false) {
            const basketItems = Array.isArray(this.user?.basket) ? this.user.basket : []
            const existingMap = new Map(this.records.map(item => [item.key, item]))
            const previousKeys = new Set(this.records.map(item => item.key))
            const next = []

            for (const basketItem of basketItems) {
                const key = this.makeRecordKey(basketItem.collection, basketItem.record_id)
                const existing = existingMap.get(key)
                try {
                    if (existing && !forceReload) {
                        next.push({
                            ...existing,
                            basketItemUrl: basketItem.url || existing.basketItemUrl
                        })
                        continue
                    }

                    const jmarc = await Jmarc.get(basketItem.collection, basketItem.record_id)
                    const summary = this.extractRecordSummary(jmarc)

                    next.push({
                        key,
                        collection: basketItem.collection,
                        virtualCollection: jmarc.getVirtualCollection(),
                        recordId: String(basketItem.record_id),
                        title: summary.title,
                        symbol: summary.symbol,
                        basketItemUrl: basketItem.url || null,
                        jmarc
                    })
                } catch (error) {
                    console.error(`Failed to load basket record ${basketItem.collection}/${basketItem.record_id}:`, error)
                }
            }

            this.records = next
            this.lastBasketSignature = this.buildBasketSignature(basketItems)

            const nextKeys = new Set(next.map(item => item.key))
            const removed = []
            previousKeys.forEach(key => {
                if (nextKeys.has(key)) return
                const [collection, recordId] = String(key).split('/')
                removed.push({ collection, recordId })
            })

            if (removed.length > 0) {
                this.$emit('basket-records-removed', removed)
            }
        },
        async clearBasket() {
            if (!this.user || typeof this.user.clearBasket !== 'function') return
            if (!window.confirm('Clear all records from your basket?')) return

            try {
                await this.user.clearBasket()
                await this.user.loadBasket()
                await this.syncRecordsWithBasket(true)
            } catch (error) {
                console.error('Failed to clear basket:', error)
            }
        },
        async removeBasketItem(item) {
            if (!item || !this.user || typeof this.user.removeBasketItemByUrl !== 'function') return

            try {
                await this.user.removeBasketItemByUrl(item.basketItemUrl)
                await this.user.loadBasket()
                await this.syncRecordsWithBasket()
            } catch (error) {
                console.error(`Failed to remove basket item ${item.key}:`, error)
            }
        },
        activateRecord(jmarc) {
            this.$emit('activate-record', jmarc)
        }
    }
}
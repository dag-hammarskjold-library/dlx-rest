import { BasketRecord } from "./basket-record.mjs"
import { Jmarc } from "../../api/jmarc.mjs"

export const AppBasket = {
    props: {
        user: Object,
        api_prefix: String,
        activeRecords: Array
    },
    components: { BasketRecord },
    data() {
        return {
            records: [],
            classes: { basketRecord: { "basket-record": true } }
        }
    },
    template: /* html */ `
    <div class="app-basket">
      <div v-for="jmarc in records" :key="jmarc.collection + '/' + jmarc.recordId">
        <basket-record 
          :class="classes.basketRecord"
          :jmarc="jmarc"
          :active="activeRecords.includes(jmarc)"
          @click="activateRecord(jmarc)"
        />
      </div>
    </div>
  `,
    async mounted() {
        Jmarc.apiUrl = this.api_prefix

        // Load records from user's basket
        await this.loadBasketRecords()
    },
    methods: {
        hasBasketRecord(collection, recordId) {
            return this.records.some(record =>
                String(record.collection) === String(collection)
                && String(record.recordId) === String(recordId)
            )
        },
        async refreshFromUserBasket() {
            this.records = []
            await this.loadBasketRecords()
        },
        addRecordToBasketView(jmarc) {
            if (!jmarc) return
            if (this.hasBasketRecord(jmarc.collection, jmarc.recordId)) return
            this.records.unshift(jmarc)
        },
        async loadBasketRecords() {
            if (!this.user || !this.user.basket) {
                console.warn('User or basket data not available')
                return
            }

            // Load each record from the user's basket
            for (const basketItem of this.user.basket) {
                try {
                    if (this.hasBasketRecord(basketItem.collection, basketItem.record_id)) {
                        continue
                    }
                    const jmarc = await Jmarc.get(basketItem.collection, basketItem.record_id)
                    this.records.push(jmarc)
                } catch (error) {
                    console.error(`Failed to load basket record ${basketItem.collection}/${basketItem.record_id}:`, error)
                }
            }
        },
        activateRecord(jmarc) {
            this.$emit('activate-record', jmarc)

            // Move to front of basket
            if (this.records.includes(jmarc)) {
                const index = this.records.indexOf(jmarc)
                this.records.splice(index, 1)
            }
            this.records.unshift(jmarc)
        }
    }
}
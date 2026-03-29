export const BasketRecord = {
    props: {
        item: Object,
        active: Boolean
    },
    data() {
        return {
            classes: {
                basketRecord: {
                    "basket-record": true,
                    "basket-record__selected": this.active
                }
            }
        }
    },
    watch: {
        active(newVal) {
            this.classes.basketRecord["basket-record__selected"] = newVal
        }
    },
    computed: {
                displayCollection() {
                        if (!this.item) return ''
                        return this.item.virtualCollection || this.item.collection
                },
                displayRecordId() {
                        return this.item ? this.item.recordId : ''
                },
                displayTitle() {
                        return this.item && this.item.title ? this.item.title : '[No title]'
                },
                displaySymbol() {
                        return this.item && this.item.symbol ? this.item.symbol : ''
        }
    },
    template: /* html */ `
    <div :class="classes.basketRecord">
            <div class="basket-record-row">
                <span>{{ displayCollection + "/" + displayRecordId }}</span>
                <button class="basket-record-remove" type="button" title="Remove from basket" @click.stop="$emit('remove')">
                    <i class="bi bi-x-circle"></i>
                </button>
            </div>
            <div class="basket-record-title" :title="displayTitle">{{ displayTitle }}</div>
            <div v-if="displaySymbol" class="basket-record-symbol" :title="displaySymbol">{{ displaySymbol }}</div>
    </div>
  `
}
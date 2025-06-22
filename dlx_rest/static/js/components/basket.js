import basket from "../api/basket.js";
import { EventBus } from "../utils/event-bus.js";

export let basketcomponent = {
    props: ["api_prefix", "basket_id"],
    template: `
    <div class="basket-list" style="background-color:white; height:100vh; overflow-y:auto;">
        <div class="d-flex justify-content-between align-items-center p-2">
            <div>
                <i class="fas fa-sync p-1 record-control" title="Reload Basket Now" @click="rebuildBasket"></i>
                <i class="fas fa-cut p-1 record-control" title="Clear Basket Contents" @click="clearBasket"></i>
            </div>
        </div>
        <div v-if="basketItems.length === 0" class="p-2 text-muted">Basket is empty.</div>
        <div v-for="record in sortedBasket" :key="record.collection + '-' + record._id" class="list-group mt-2">
            <a href="#" @click.prevent="openRecord(record)" class="list-group-item list-group-item-action" :id="record.collection + '--' + record._id">
                <div class="d-flex w-100 justify-content-between">
                    <small><span>{{record.vcoll}}/{{record._id}}</span></small>
                    <small>
                        <i class="fas fa-times p-1 record-control" title="Remove record from basket" @click.stop="removeRecord(record)"></i>
                    </small>
                </div>
                <div>
                    <span style="white-space:nowrap" :title="record.title">{{record.title}}</span>
                </div>
                <div v-if="record.symbol">
                    <small>
                        <span v-if="record.symbol.length > 45" :title="record.symbol">{{record.symbol.substring(0,45)}}....</span>
                        <span v-else :title="record.symbol">{{record.symbol}}</span>
                    </small>
                </div>
            </a>
        </div>
    </div>
    `,
    data() {
        return {
            basketItems: [],
        };
    },
    computed: {
        sortedBasket() {
            return this.basketItems.slice().sort((a, b) => {
                return (a.basket_item_id || '').localeCompare(b.basket_item_id || '');
            });
        }
    },
    created() {
        this.loadBasket();
    },
    methods: {
        async loadBasket() {
            this.basketItems = [];
            const myBasket = await basket.getBasket(this.api_prefix);
            // Convert Set to Array if needed
            const items = Array.from(myBasket);
            for (let element of items) {
                let data = {
                    collection: element.collection,
                    vcoll: element.collection,
                    _id: element.record_id,
                    basket_item_id: element.url ? element.url.split('/').pop() : element.record_id,
                    title: "[No Title]",
                    symbol: ""
                };
                try {
                    const item = await basket.getItem(this.api_prefix, element.collection, element.record_id);
                    if (!item) continue;
                    if (element.collection === "bibs") {
                        let titleField = item.getField("249") || item.getField("245") || item.getField("700");
                        let rtype = item.getField("089");
                        if (rtype && rtype.getSubfield("b")) {
                            if (rtype.getSubfield("b").value === "B22") data.vcoll = "speeches";
                            if (rtype.getSubfield("b").value === "B23") data.vcoll = "votes";
                        }
                        if (titleField && titleField.getSubfield("a")) {
                            data.title = titleField.getSubfield("a").value || "[No Title]";
                        }
                        let symbolFields = item.getFields("191").length > 0 ? item.getFields("191")
                            : item.getFields("791").length > 0 ? item.getFields("791") : [];
                        data.symbol = symbolFields.map(x => x.getSubfield("a") ? x.getSubfield("a").value : null).filter(x => !!x).join("; ");
                    } else if (element.collection === "auths") {
                        let headingField;
                        for (let tag of ["100", "110", "111", "130", "150", "190", "191"]) {
                            if (item.getField(tag)) headingField = item.getField(tag);
                        }
                        if (headingField) {
                            let text = [];
                            for (let sub of ["a", "b", "c", "d"]) {
                                text.push(headingField.getSubfield(sub) ? headingField.getSubfield(sub).value : "");
                            }
                            data.title = text.join(" ");
                        }
                    }
                } catch (e) {
                    data.title = "[Failed to load]";
                }
                this.basketItems.push(data);
            }
        },
        async rebuildBasket() {
            await this.loadBasket();
        },
        async clearBasket() {
            await basket.clearItems(this.api_prefix, "userprofile/my_profile/basket");
            await this.loadBasket();
        },
        async removeRecord(record) {
            await basket.deleteItem(null, record.collection, record._id);
            this.basketItems = this.basketItems.filter(
                r => !(r.collection === record.collection && String(r._id) === String(record._id))
            );
            EventBus.$emit('remove-record', { collection: record.collection, record_id: record._id });
        },
        openRecord(record) {
            EventBus.$emit('open-record', { collection: record.collection, record_id: record._id });
        }
    }
};
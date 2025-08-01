/* Add to basket icon used in search results */

import basket from "../api/basket.js";

export let itemaddcomponent = {
    props: ["api_prefix", "collection", "recordId", "myBasket"],
    template: `
        <div @click="handleClick()">
            <i v-if="statusPending" class="fas fa-spinner fa-pulse"></i>
            <i v-else-if="itemLocked" class="fas fa-lock" data-toggle="tooltip" :title="'Item locked by ' + lockedBy" ></i>
            <i v-else-if="inBasket" class="fas fa-folder-minus item-toggle" data-toggle="tooltip" :title="'Remove from basket'" ></i>
            <i v-else class="fas fa-folder-plus item-toggle" data-toggle="tooltip" title="Add to basket"></i>
        </div>
    `,
    data: function() {
        return {
            itemLocked: true,
            inBasket: false,
            lockedBy: "system",
            statusPending: true
        }
    },
    mounted: async function() {
        this.initBasket()
    },
    watch: {
        myBasket: {
            handler: function() {
                this.initBasket();
            },
            deep: true
        }
    },
    methods: {
        async initBasket() {

            this.myBasket.forEach(item => {
                if (item.collection === this.collection && item.record_id === this.recordId) {
                    this.inBasket = true;
                    this.itemLocked = false;
                }
            });

            if (! this.inBasket) {
                let lockedStatus = await basket.itemLocked(this.api_prefix, this.collection, this.recordId);
                
                if (lockedStatus["locked"] == true) {
                    this.lockedBy = lockedStatus["by"];
                    this.itemLocked = true;
                } else {
                    this.inBasket = false;
                    this.itemLocked = false;
                }
            }

            this.statusPending = false;
        },
        async handleClick(event) {
            if (this.itemLocked || this.statusPending) {
                return
            }

            this.statusPending = true;
            
            if (this.inBasket) {
                await basket.deleteItem(this.myBasket, this.collection, this.recordId);
                this.inBasket = false;
            } else {
                await basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', this.collection, this.recordId);
                this.inBasket = true;
            }

            this.statusPending = false;   
        }
    }
}
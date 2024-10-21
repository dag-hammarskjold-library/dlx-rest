/* Add to basket icon used in search results */

import basket from "../api/basket.js";

export let itemaddcomponent = {
    props: ["api_prefix", "collection", "recordId", "userBasket"],
    template: `
        <div @click="handleClick()">
            <i v-if="statusPending" class="fas fa-2x fa-spinner fa-pulse"></i>
            <i v-else-if="itemLocked" class="fas fa-2x fa-lock" data-toggle="tooltip" :title="'Item locked by ' + lockedBy" ></i>
            <i v-else-if="inBasket" class="fas fa-2x fa-folder-minus" data-toggle="tooltip" :title="'Remove from basket'" ></i>
            <i v-else class="fas fa-2x fa-folder-plus" data-toggle="tooltip" title="Add to basket"></i>
        </div>
    `,
    data: function() {
        return {
            myBasket: null,
            itemLocked: true,
            inBasket: false,
            lockedBy: "system",
            statusPending: true
        }
    },
    mounted: async function() {
        this.myBasket = await this.userBasket; //await basket.getBasket(this.api_prefix);

        this.myBasket.forEach(item => {
            if (item.collection === this.collection && item.record_id == this.recordId) {
                this.inBasket = true;
                this.itemLocked = false;
                this.$emit("disableCheckbox", this.recordId);
            }
        });

        if (! this.inBasket) {
            let lockedStatus = await basket.itemLocked(this.api_prefix, this.collection, this.recordId);
            
            if (lockedStatus["locked"] == true) {
                this.lockedBy = lockedStatus["by"];
                this.itemLocked = true;
                this.$emit("disableCheckbox", this.recordId);
            } else {
                this.inBasket = false;
                this.itemLocked = false;
                this.$emit("enableCheckbox", this.recordId);
            }
        }

        this.statusPending = false;
    },
    methods: {
        async handleClick(event) {
            if (this.itemLocked) {
                return
            }

            this.statusPending = true;
            
            if (this.inBasket) {
                await basket.deleteItem(this.myBasket, this.collection, this.recordId);
                this.inBasket = false;
                this.$emit("enableCheckbox", this.recordId);
            } else {
                await basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', this.collection, this.recordId);
                this.inBasket = true;
                this.$emit("disableCheckbox", this.recordId);
            }

            this.statusPending = false;

            
        }
        
    }
}
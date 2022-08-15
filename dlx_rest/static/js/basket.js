/////////////////////////////////////////////////////////////////
// BASKET COMPONENT

import { Jmarc } from "./jmarc.mjs";
import basket from "./api/basket.js";

/////////////////////////////////////////////////////////////////
export let basketcomponent = {
    props: ["api_prefix", "basket_id"],
    template: ` 
    <div class="container col-sm-2" id="app0" style="background-color:white;">
        <div class='container mt-3 shadow' style="overflow-y: scroll; height:650px;">
         <div class="row"><div class="col"><i class="fas fa-sync text-primary" title="Reload Basket Now" v-on:click="rebuildBasket()"></i></div></div>
            <div :id=record._id v-for="record in sortedBasket" :key="record._id" class="list-group mt-2 ">
            
                <a href="#" class="list-group-item list-group-item-action" aria-current="true" :id="record.collection + '--' + record._id"s>
                <div class="d-flex w-100 justify-content-between" >
                        <small><span class="mb-1">{{record.collection}}/{{record._id}}</span></small>
                        <small><i v-on:click="removeRecordFromList(record.collection, record._id)" class="far fa-trash-alt"></i></small>
                    </div>
                    <p class="mb-1 text-success" v-on:click="displayRecord(record._id, record.collection)">
                        <span v-if="record.title.length > 45" :title=record.title>{{record.title.substring(0,45)}}....</span>
                        <span v-else :title=record.title>{{record.title}}</span>
                    </p>
                    <p v-if="record.symbol" class="mb-1">
                        <small>
                            <span v-if="record.symbol.length > 45" :title=record.symbol>{{record.symbol.substring(0,45)}}....</span>
                            <span v-else :title=record.symbol>{{record.symbol}}</span>
                        </small>
                    </p>
                </a>
            </div>
        </div>
    </div>
    `,
    data: function () {
        return {
          visible: true,
          basketItems: [],
          recordDisplayed:[]    
        }
    },
    computed: {
        sortedBasket: function () {
            return this.basketItems.sort((a,b) => { return a.basket_item_id.localeCompare(b.basket_item_id) })
        }
    },
    created: async function () {
        this.$root.$refs.basketcomponent = this;
        this.buildBasket();
    },
    /* // Removed
    mounted: async function() {
        this.timer = setInterval(this.rebuildBasket, 20000)
    },
    */
    methods: {
        removeRecordFromRecordDisplayed(recordToDelete){
            const index = this.recordDisplayed.indexOf(recordToDelete);
            if (index > -1) {
                this.recordDisplayed.splice(index, 1);
            }
        },
        async displayRecord(myRecord, myCollection) {
            // Check if the record is already displayed
            const len = this.recordDisplayed.length;

            if (len===2) {
                this.callChangeStyling("Please remove one record from the editor!!!", "row alert alert-warning")
            }   
            else
            {
                this.$root.$refs.multiplemarcrecordcomponent.recordlist.push(`${myCollection}/${myRecord}`);
                let jmarc = await Jmarc.get(myCollection, myRecord);
                this.$root.$refs.multiplemarcrecordcomponent.displayMarcRecord(jmarc)
                // add record displayed
                this.recordDisplayed.push(jmarc.recordId)
                // this.forceUpdate()
                this.callChangeStyling("Record added to the editor", "row alert alert-success")

            }

        },
        callChangeStyling(myText, myStyle) {
            this.$root.$refs.messagecomponent.changeStyling(myText, myStyle)
        },
        async removeRecordFromList(collection, record_id) {
            let el = document.getElementById(`${collection}--${record_id}`);
            const myBasket = await basket.getBasket(this.api_prefix, "userprofile/my_profile/basket");
            const deleted = await basket.deleteItem(this.api_prefix, "userprofile/my_profile/basket", myBasket, collection, record_id);
            if (deleted) {
                el.parentElement.remove();
                this.callChangeStyling("Record removed from basket", "row alert alert-success");
                return true;
            }
        },
        async buildBasket() {
            const myBasket = await basket.getBasket(this.api_prefix);

            for (let element of myBasket) {
                let data = {};

                basket.getItem(this.api, element.collection, element.record_id).then(
                    item => {
                        data["collection"] = element.collection;
                        data["_id"] = element.record_id;
                        data["basket_item_id"] = element.url.split('/').pop();

                        let titleField = item.getField("245") || item.getField("700");

                        if (titleField) {
                            data["title"] = titleField.getSubfield("a") ? titleField.getSubfield("a").value || "[No Title]" : "[No Title]"
                        } else {
                            data["title"] = "[No Title]"
                        }

                        let symbolFields = item.getFields("191").length > 0 ? item.getFields("191") 
                            : item.getFields("791").length > 0 ? item.getFields("791")
                            : []

                        data["symbol"] = symbolFields.map(x => {return x.getSubfield("a") ? x.getSubfield("a").value : null}).filter(x => !!x).join("; ");

                        this.basketItems.push(data);
                    }
                ).catch(
                    error => {
                        console.log(error)
                        /* 
                        this is likely why items are disappearing from the basket. we probably don't want to 
                        delete the item from the basket for any old error that might occur.

                        //basket.deleteItem(this.api_prefix, 'userprofile/my_profile/basket', myBasket, element.collection, element.record_id);
                        */

                        // alert that debugging is needed
                        callChangeStyling(`Basket item ${element.collection} / ${element.record_id} failed to load`, "row alert alert-danger")
                    }
                )
            }

            return true
        },
        async rebuildBasket() {
            const myBasket = await basket.getBasket(this.api_prefix);
            this.basketItems = [];
            this.buildBasket();
        }
    }
}
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
    mounted: async function() {
        //this.timer = setInterval(this.rebuildBasket, 20000) // Removed

        this.editor = this.$root.$refs.multiplemarcrecordcomponent; // other components not avaialble before mounted
    },
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

            if (this.editor.currentRecordObjects.filter(x => x.collection == myCollection && x.recordId == myRecord).length > 0) {
                // the record is already open
                //this.callChangeStyling("Record already open", "row alert alert-danger")
                return
            }

            if (this.editor.currentRecordObjects.length === 2) {
                //this.callChangeStyling("Please remove one record from the editor!!!", "row alert alert-warning")

                // close the second record 
                let toRemove = this.editor.currentRecordObjects[1];
                this.callChangeStyling(`Removing ${toRemove.collection}/${toRemove.recordId}`, "row alert alert-warning");
                await new Promise(r => setTimeout(r, 750));
                if (! this.editor.userClose(toRemove)) return // the close may have been cancelled by the user
            }   
            
            this.editor.recordlist.push(`${myCollection}/${myRecord}`);
            let jmarc = await Jmarc.get(myCollection, myRecord);
            
            if (this.editor.displayMarcRecord(jmarc)) {
                // add record displayed
                this.recordDisplayed.push(jmarc.recordId)
                // this.forceUpdate()
                this.callChangeStyling("Record added to the editor", "row alert alert-success")
            } else {
                // the record did not display for some reason
                this.editor.recordlist.splice(this.editor.recordlist.indexOf(`${myCollection}/${myRecord}`), 1);
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

                        if (element.collection == "bibs") {
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
                        } else if (element.collection == "auths") {
                            let headingField;

                            for (let _ of ["100", "110", "111", "130", "150", "190", "191"]) {
                                if (item.getField(_)) {
                                    headingField = item.getField(_)
                                }
                            }
                            
                            if (headingField) {
                                let text = [];

                                for (let _ of ["a", "b", "c", "d"]) {
                                    text.push(headingField.getSubfield(_) ? headingField.getSubfield(_).value : "")
                                }

                                data["title"] = text.join(" ")
                            }
                        }

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
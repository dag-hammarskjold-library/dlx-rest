/////////////////////////////////////////////////////////////////
// BASKET COMPONENT

import { Jmarc } from "./jmarc.mjs";
import basket from "./api/basket.js";
import { multiplemarcrecordcomponent } from "./record.js";

/////////////////////////////////////////////////////////////////
export let basketcomponent = {
    props: ["api_prefix", "basket_id"],
    template: ` 
    <div class="col-sm-2" id="app0" style="background-color:white;">
        <div class="mt-1" style="overflow-y: scroll; min-height:650px;">
            <div class="col">
                <div class="col">
                    <i class="fas fa-sync p-1 record-control" title="Reload Basket Now" v-on:click="rebuildBasket()"></i>
                    <i class="fas fa-cut p-1 record-control" title="Clear Basket Contents" v-on:click="clearBasket()"></i>
                </div>
                <div :id=record._id v-for="record in sortedBasket" :key="record._id" class="list-group mt-2 ">
                
                    <a href="#" v-on:click="handleClick($event, record._id, record.collection)" class="list-group-item list-group-item-action" aria-current="true" :id="record.collection + '--' + record._id"s>
                        <div class="d-flex w-100 justify-content-between" >
                            <small><span style="overflow-x:hidden">{{record.collection}}/{{record._id}}</span></small>
                            <small><i id="closeRecord" v-on:click="handleClick($event, record._id, record.collection)" class="fas fa-times p-1 record-control" title="Remove record from basket"></i></small>
                        </div>
                        <div style="overflow-x:hidden">
                            <span style="white-space:nowrap" :title=record.title>{{record.title}}</span>
                        </div>
                        <div v-if="record.symbol" style="overflow-x:hidden">
                            <small>
                                <span v-if="record.symbol.length > 45" :title=record.symbol>{{record.symbol.substring(0,45)}}....</span>
                                <span v-else :title=record.symbol>{{record.symbol}}</span>
                            </small>
                        </div>
                    </a>
                </div>
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
        handleClick(e, record_id, collection) {
            if (e.srcElement.id == "closeRecord") {
                e.stopPropagation()
                this.removeRecordFromList(collection, record_id)
            } else {
                this.displayRecord(record_id, collection)
            }
        },
        removeRecordFromRecordDisplayed(recordToDelete){
            const index = this.recordDisplayed.indexOf(recordToDelete);
            if (index > -1) {
                // remove from the basket
                this.recordDisplayed.splice(index, 1);
            }
        },
        async displayRecord(myRecord, myCollection) {
            // Check if the record is already displayed
            const len = this.recordDisplayed.length;

            if (this.editor.currentRecordObjects.filter(x => x.collection == myCollection && x.recordId == myRecord).length > 0) {
                // the record is already open
                //this.callChangeStyling("Record already open", "d-flex w-100 alert-danger")
                return
            }

            if (this.editor.currentRecordObjects.length === 2) {
                //this.callChangeStyling("Please remove one record from the editor!!!", "d-flex w-100 alert-warning")

                // attempt to close the second record 
                let toRemove = this.editor.currentRecordObjects[1];
                if (! this.editor.userClose(toRemove)) return // the close may have been cancelled by the user
            }   
            
            this.editor.recordlist.push(`${myCollection}/${myRecord}`);
            
            Jmarc.get(myCollection, myRecord).then(
                jmarc => {
                    if (this.editor.displayMarcRecord(jmarc)) {
                        // add record displayed
                        this.recordDisplayed.push(jmarc.recordId)
                        // this.forceUpdate()
                        this.callChangeStyling("Record added to the editor", "d-flex w-100 alert-success")
                    } else {
                        // the record did not display for some reason
                        this.editor.recordlist.splice(this.editor.recordlist.indexOf(`${myCollection}/${myRecord}`), 1);
                    }
                }
            )
        },
        callChangeStyling(myText, myStyle) {
            this.$root.$refs.messagecomponent.changeStyling(myText, myStyle)
        },
        async removeRecordFromList(collection, record_id) {
            let el = document.getElementById(`${collection}--${record_id}`)
            const myBasket = await basket.getBasket(this.api_prefix, "userprofile/my_profile/basket");
            const deleted = await basket.deleteItem(this.api_prefix, "userprofile/my_profile/basket", myBasket, collection, record_id);
            if (deleted) {
                // remove the record from the editor stage (if the record is displayed)
                this.editor.displayedJmarcObject.forEach((item)=>{
                    if (item.recordId===parseInt(record_id)) { 
                        this.editor.removeRecordFromEditor(item) }
                    }
                )

                el.parentElement.remove();
                this.callChangeStyling("Record removed from basket", "d-flex w-100 alert-success");
                return true;
            }
        },
        async clearBasket() {
            for (let item of this.basketItems) {
                this.removeRecordFromList(item.collection, item._id)
            }
        },
        async buildBasket() {
            const myBasket = await basket.getBasket(this.api_prefix);

            for (let element of myBasket) {
                let data = {};

                basket.getItem(this.api, element.collection, element.record_id).then(
                    item => {
                        if (typeof item === "undefined") {
                            //const myBasket = await basket.getBasket(this.api_prefix, "userprofile/my_profile/basket");
                            basket.deleteItem(this.api_prefix, "userprofile/my_profile/basket", myBasket, element.collection, element.record_id);
                            return
                        }

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
                        this.callChangeStyling(`Basket item ${element.collection} / ${element.record_id} failed to load`, "d-flex w-100 alert-danger")
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
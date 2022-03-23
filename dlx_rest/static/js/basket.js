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
            <div v-for="record in sortedBasket" :key="record._id" class="list-group mt-2 " >
                <a href="#" class="list-group-item list-group-item-action" aria-current="true" :id="record.collection + '--' + record._id">
                    <div class="d-flex w-100 justify-content-between">
                        <small><span class="mb-1">{{record.collection}}/{{record._id}}</span></small>
                        <small><i v-on:click="removeRecordFromList(record.collection, record._id)" class="far fa-trash-alt"></i></small>
                    </div>
                    <p class="mb-1 text-success" v-on:click="displayRecord(record._id, record.collection)">
                        <span v-if="record.title.length > 45" :title=record.title>{{record.title.substring(0,45)}}....</span>
                        <span v-else :title=record.title>{{record.title}}</span>
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
        this.timer = setInterval(this.rebuildBasket, 20000)
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

            if (len===2) {
                this.callChangeStyling("Please remove one record from the editor!!!", "row alert alert-warning")
            }   
            else
            {
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
            for (let item of myBasket) {
                basket.getItem(this.api, item.collection, item.record_id).then(myItem => {
                    myItem['collection'] = item.collection;
                    let myItemTitle = "";
                    if (item.collection == "bibs") {
                        let myTitleField = myItem.getField(245,0);
                        let myTitle = [];
                        if (myTitleField) {
                            for (let s in myTitleField.subfields) {
                                myTitle.push(myTitleField.subfields[s].value);
                            }
                        } else {
                            myTitle.push("[No Title]")
                        }
                        myItemTitle = myTitle.join(" ");
                        let mySymbolField = myItem.getField(191,0);
                        let mySymbol = [];
                        if (mySymbolField) {
                            for (let s in mySymbolField.subfields) {
                                if (mySymbolField.subfields[s].code === "a") {
                                    mySymbol.push(mySymbolField.subfields[s].value);
                                }
                            }
                        }
                        myItem["symbol"] = mySymbol.join(" ")
                    } else if (item.collection == "auths") {
                        let myTitleField = myItem.fields.filter(x => x.tag.match(/^1[0-9][0-9]/))[0];
                        let myTitle = [];
                        if (myTitleField) {
                            for (let s in myTitleField.subfields) {
                                myTitle.push(myTitleField.subfields[s].value);
                            }
                        } else {
                            myTitle.push("[No Title]")
                        }
                        myItemTitle = myTitle.join(" ");
                    }
                    myItem["title"] = myItemTitle;
                    myItem["_id"] = item.record_id;
                    myItem["basket_item_id"] = item.url.split('/').pop()
                    this.basketItems.push(myItem);
                }).catch(error => {
                    console.log(error)
                    basket.deleteItem(this.api_prefix, 'userprofile/my_profile/basket', myBasket, item.collection, item.record_id);
                })
            }
            return true
        },
        rebuildBasket() {
            //const myBasket = await basket.getBasket(this.api_prefix);
            this.basketItems = [];
            this.buildBasket();
        }
    }
}
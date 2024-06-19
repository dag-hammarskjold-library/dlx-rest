

export let basketcomponent = {
    props: ["api_prefix"],
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
                            <small><span style="overflow-x:hidden">{{record.vcoll}}/{{record._id}}</span></small>
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
            basketItems: [
                /*
                data["collection"] = element.collection;
                        data["vcoll"] = data["collection"]
                        data["_id"] = element.record_id;
                        data["basket_item_id"] = element.url.split('/').pop();
                */
               {
                "collection": "bibs",
                "vcoll": "bibs",
                "_id": "1373986"
               }
            ]
        }
    },
    created: function () {
        this.getBasket()
    },
    computed: {
        sortedBasket: function () {
            return this.basketItems.sort((a,b) => { return a.basket_item_id.localeCompare(b.basket_item_id) })
        }
    },
    methods: {
        async getBasket() {
            const url = `${this.api_prefix}userprofile/my_profile/basket`
            fetch(url).then( response => {
                response.json().then( jsonData => {
                    console.log(jsonData.data)
                })
            })
        },
        handleClick(e, record_id, collection) {
            if (e.srcElement.id == "closeRecord") {
                e.stopPropagation()
                this.removeRecordFromList(collection, record_id)
            } else {
                this.displayRecord(record_id, collection)
            }
        },
        async clearBasket() {
            this.basketItems = []
        },
    }
}
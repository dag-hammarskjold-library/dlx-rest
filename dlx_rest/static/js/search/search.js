import { sortcomponent } from "./sort.js";
import { countcomponent } from "./count.js";
import basket from "../api/basket.js";
import user from "../api/user.js";

export let searchcomponent = {
    // onclick="addRemoveBasket("add","{{record['id']}}","{{coll}}","{{prefix}}")"
    props: {
        api_prefix: {
            type: String,
            required: true
        },
        search_url: {
            type: String,
            required: true
        },
        collection: {
            type: String,
            required: true
        }
    },
    template: ` 
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <div class="row pt-2">
            <form class="form-inline mr-auto col-lg-12" :action="action">
                <input v-if="params.search" id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :aria-label="'Search ' + collection + ' collection'" :value="params.search">
                <input v-else id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :placeholder="'Search ' + collection + ' collection'" aria-label="Search this collection">
                <button class="btn btn-primary" type="submit" id="search-btn" value="Search">Search</button>
            </form>
        </div>
        <sortcomponent v-bind:uibase="uibase" v-bind:collection="collection" v-bind:params="params"></sortcomponent>
        <nav>
            <ul class="pagination pagination-md justify-content-center">
                <li class="page-item disabled"><span class="page-link">{{start}} to {{end}} of {{resultcount}} Records</span></li>
                <li v-if="prev" class="page-item"><a class="page-link" :href="prev">Previous</a></li>
                <li v-else class="page-item disabled"><a class="page-link" href="">Previous</a></li>
                <li v-if="next" class="page-item"><a class="page-link" :href="next">Next</a></li>
                <li v-else class="page-item disabled"><a class="page-link" href="">Next</a></li>
            </ul>
        </nav>
        <div v-for="result in this.results" :key="result._id">
            <div class="row pt-2 border-bottom">
                <div class="col-sm-11">
                    <div class="row">
                        <a class="lead" :href="uibase + '/records/' + collection + '/' + result._id">
                            {{result.first_line}}
                        </a>
                        <countcomponent v-if="collection == 'auths'" :api_prefix="api_prefix" :recordId="result._id"></countcomponent>
                    </div>
                    <div class="row">
                        <p>{{result.second_line}}</p>
                    </div>
                </div>
                <div class="col-sm-1">
                    <!-- need to test if authenticated here -->
                    <div class="row ml-auto">
                        <a><i :id="'icon-' + collection + '-' + result._id" class="fas" data-toggle="tooltip" title="Add to your basket"></i></a>
                    </div>
                </div>
            </div>
        </div>
        <nav>
            <ul class="pagination pagination-md justify-content-center">
                <li class="page-item disabled"><span class="page-link">{{start}} to {{end}} of {{resultcount}} Records</span></li>
                <li v-if="prev" class="page-item"><a class="page-link" :href="prev">Previous</a></li>
                <li v-else class="page-item disabled"><a class="page-link" href="">Previous</a></li>
                <li v-if="next" class="page-item"><a class="page-link" :href="next">Next</a></li>
                <li v-else class="page-item disabled"><a class="page-link" href="">Next</a></li>
            </ul>
        </nav>
    </div>`,
    data: function () {
        let myParams = this.search_url.split("?")[1];
        let myProps = {}
        for (let p of myParams.split("&")) {
            let thisParam = p.split("=");
            if (thisParam[0] == "start" || thisParam[0] == "limit") {
                myProps[thisParam[0]] = parseInt(thisParam[1]);
            } else {
                myProps[thisParam[0]] = decodeURIComponent(thisParam[1]).replace(/\+/g, ' ');
            }
        }
        let myUIBase = this.api_prefix.replace('/api/','');
        //console.log(this.links)
        return {
            visible: true,
            results: [],
            links: {},
            action: `${myUIBase}/records/${this.collection}/search`,
            params: myProps,
            uibase: myUIBase,
            count: null,
            prev: null,
            next: null,
            resultcount: 0,
            start: 0,
            end: 0,
            basketcontents: ['foo'],
            lookup_maps: {}
        }
    },
    created: async function() {
        let response = await fetch(this.search_url);
        if (response.ok) {

            let jsonData = await response.json();
            let linkKeys = Object.keys(jsonData["_links"])
            linkKeys.forEach((key, index) => {
                this.links[key] = jsonData["_links"][key];
            });
            if (this.links.related.count) {
                this.count = this.links.related.count;
            }
            if (this.links._prev) {
                this.prev = this.links._prev.replace('&search','&q').replace('/records','/search').replace('/api/marc','/records');
            }
            if (this.links._next) {
                this.next = this.links._next.replace('&search','&q').replace('/records','/search').replace('/api/marc','/records');
            }
            for (let result of jsonData["data"]) {
                let myResult = { "_id": result["_id"]}
                if (this.collection == "bibs") {
                    myResult["first_line"] = result["title"]
                    myResult["second_line"] = [result["types"], result["date"], result["symbol"]].filter(Boolean).join(" | ")
                } else if (this.collection == "auths") {
                    myResult["first_line"] = result["heading"]
                    myResult["second_line"] = result["alt"]
                    myResult["heading_tag"] = result["heading_tag"];
                } else if (this.collection == "files") {
                    // not implemented yet
                }
                this.results.push(myResult);
            }

            if (this.collection == "auths") {
                let authLookupMapUrl = `${this.api_prefix}marc/${this.collection}/lookup/map`
                let authMapResponse = await fetch(authLookupMapUrl);
                let authMapData = await authMapResponse.json();
                this.lookup_maps['auths'] = authMapData.data;

                let bibLookupMapUrl = `${this.api_prefix}marc/bibs/lookup/map`
                let bibMapResponse = await fetch(bibLookupMapUrl);
                let bibMapData = await bibMapResponse.json();
                this.lookup_maps['bibs'] = bibMapData.data;
            }

            
            
            this.buildPagination();
        }
    },
    mounted: async function() {
        let myProfile = await user.getProfile(this.api_prefix, 'my_profile');
        if (myProfile) {
            this.user = myProfile.data.email;
        } 

        if (typeof this.user !== "undefined") {
            const myBasket = await basket.getBasket(this.api_prefix);
            for (let result of this.results) {
                let myId = `icon-${this.collection}-${result._id}`
                let iconEl = document.getElementById(myId);

                iconEl.classList.add('fa-folder-plus');
                iconEl.addEventListener("click", async () => {
                    const myBasket = await basket.getBasket(this.api_prefix);
                    this.toggleAddRemove(iconEl, myBasket, this.collection, result._id);
                });
                if (this.basketContains(myBasket, this.collection, result._id)) {
                    iconEl.classList.remove('fa-folder-plus',);
                    iconEl.classList.add('fa-folder-minus');
                    iconEl.title = "Remove from basket";
                }
                // checking if the record is locked and displaying a lock if it is.
                const itemLocked = await basket.itemLocked(this.api_prefix, this.collection, result._id);
                if (itemLocked["locked"] == true && itemLocked["by"] != this.user) {
                    // Display a lock icon
                    iconEl.classList.remove('fa-folder-plus',);
                    iconEl.classList.remove('fa-folder-minus',);
                    iconEl.classList.add('fa-lock',); // To do: add a click event here to "unlock" the item
                    iconEl.title = `This item is locked by ${itemLocked["by"]}`;
                }
            }
            
        }
    },
    methods: {
        async buildPagination() {
            let countResponse = await fetch(this.count);
            let jsonData = await countResponse.json();
            this.resultcount = jsonData["data"];

            let myEnd = this.params.start + this.params.limit -1;
            this.end = myEnd
            this.start = this.params.start
            if (this.resultcount == 0) {
                this.start = 0;
            }
            if (myEnd >= this.resultcount) {
                this.end = this.resultcount
                this.next = null
            }
        },
        async getMyBasket(url) {
            let response = await fetch(url);
            if (response.ok) {
                let jsonData = await response.json();
                for (let item of jsonData.data.items) {
                    let itemRes = await fetch(item);
                    if (itemRes.ok) {
                        let itemJson = await itemRes.json();
                        this.basketcontents.push(itemJson.data);
                    }
                }
            }
        },
        basketContains(basketContents, collection, record_id) {
            for (let item of basketContents) {
                if (item.collection == collection && item.record_id == record_id) {
                    return true;
                }
            }
            return false;
        },
        toggleAddRemove(el, myBasket, collection, record_id) {
            if (el.classList.value === "fas fa-folder-plus") {
                // we can run an add
                const added = basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', collection, record_id)
                if (added) {
                    el.classList.remove("fa-folder-plus");
                    el.classList.add("fa-folder-minus");
                    // Send a message to the messagebar...
                }
            } else {
                // we can run a deletion
                const deleted = basket.deleteItem(this.api_prefix, 'userprofile/my_profile/basket', myBasket, collection, record_id)
                if (deleted) {
                    el.classList.remove("fa-folder-minus");
                    el.classList.add("fa-folder-plus");
                    // Send a message to the messagebar...
                }
            }
        }
    },
    components: {
        'sortcomponent': sortcomponent, 
        'countcomponent': countcomponent
    }
}
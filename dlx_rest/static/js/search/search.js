import { sortcomponent } from "./sort.js";
import basket from "../api/basket.js";

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
                        <a class="lead" href="#">
                            {{result.first_line}}
                        </a>
                    </div>
                    <div class="row">
                        <p>{{result.second_line}}</p>
                    </div>
                </div>
                <div class="col-sm-1">
                    <!-- need to test if authenticated here -->
                    <div class="row ml-auto">
                        <a><i :id="'icon-' + collection + '-' + result._id" class="fas fa-folder-plus addRemoveIcon" data-toggle="tooltip" title="Add to your basket"></i></a>
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
                    myResult["second_line"] = [result["types"], result["date"], result["symbol"]].join(" | ")
                } else if (this.collection == "auths") {
                    myResult["first_line"] = result["heading"]
                    myResult["second_line"] = result["alt"]
                } else if (this.collection == "files") {
                    // not implemented yet
                }
                this.results.push(myResult);
            }
            this.buildPagination();
        }
    },
    mounted: async function() {
        let myProfile = await this.checkAuthentication();
        if (this.user !== null) {
            // This should always be the info returned as /api/userprofile/my_profile/basket
            let myUrl = myProfile._links.related.baskets[0]
            await this.getMyBasket(myUrl);
            for (let result of this.results) {
                let myId = `icon-${this.collection}-${result._id}`
                let iconEl = document.getElementById(myId);
                let basketItemId = this.$root.$refs.basketcomponent.getId(result._id, this.collection);
                
                if (this.basketContains(this.basketcontents, this.collection, result._id)) {
                    // set the icon to a minus sign and the title to "Remove from basket"
                    iconEl.classList.remove('fa-folder-plus');
                    iconEl.classList.add('fa-folder-minus');
                    iconEl.title = "Remove from basket";
                    iconEl.addEventListener('click', () => {
                        this.$root.$refs.basketcomponent.removeRecordFromList(basketItemId);
                    })
                } else {
                    iconEl.addEventListener('click', () => {
                        basket.createItem(this.api_prefix, )
                    });
                }
            }
        } else {
            for (let result of this.results) {
                let myId = `icon-${this.collection}-${result._id}`
                let iconEl = document.getElementById(myId);
                iconEl.style.display = "none";
            }
        }
    },
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
            basketcontents: []
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
        async checkAuthentication() {
            let myProfileUrl = `${this.api_prefix}userprofile/my_profile`;
            let response = await fetch(myProfileUrl);
            if (response.redirected) {
                this.user = null;
                return null;
            } else if (response.ok) {
                let jsonData = await response.json();
                this.user = jsonData.data.email;
                return jsonData;
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
        }
    },
    components: {
        'sortcomponent': sortcomponent,
    }
}
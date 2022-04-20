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
                <button class="btn btn-sm btn-default" type="button" value="Cancel search" title="Cancel" v-on:click="cancelSearch()">
                    <span>X</span>
                </button>
            </form>
        </div>
        <sortcomponent v-bind:uibase="uibase" v-bind:collection="collection" v-bind:params="params"></sortcomponent>
        <nav>
            <ul class="pagination pagination-md justify-content-center">
                <li class="page-item disabled">
                    <span class="page-link">
                        {{start}} to {{end}} of
                        <span id="result-count-top">
                            <div class="spinner-grow" role="status" style="width:1rem;height:1rem">
                                <span class="sr-only">Loading...</span>
                            </div>
                        </span>
                        Records ({{searchTime}} seconds)
                    </span>
                </li>
                <li v-if="prev" class="page-item"><a class="page-link" :href="prev">Previous</a></li>
                <li v-else class="page-item disabled"><a class="page-link" href="">Previous</a></li>
                <li v-if="next" class="page-item"><a class="page-link" :href="next">Next</a></li>
                <li v-else class="page-item disabled"><a class="page-link" href="">Next</a></li>
            </ul>
        </nav>
        <div id="results-spinner" class="col d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <br>
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
                <li class="page-item disabled">
                    <span class="page-link">
                        {{start}} to {{end}} of 
                        <span id="result-count-bottom">
                            <div class="spinner-grow" role="status" style="width:1rem;height:1rem">
                                <span class="sr-only">Loading...</span>
                            </div>
                        </span>
                        Records ({{searchTime}} seconds)
                    </span>
                </li>
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
            lookup_maps: {},
            searchTime: 0,
            maxTime: 15000, //milliseconds
            abortController: new AbortController()
        }
    },
    created: async function() {
        
    },
    mounted: async function() {
        let component = this;
        
        // [what is this used for?]
        if (component.collection == "auths") {
            let authLookupMapUrl = `${component.api_prefix}marc/${component.collection}/lookup/map`
            let authMapResponse = await fetch(authLookupMapUrl);
            let authMapData = await authMapResponse.json();
            component.lookup_maps['auths'] = authMapData.data;
        
            let bibLookupMapUrl = `${component.api_prefix}marc/bibs/lookup/map`
            let bibMapResponse = await fetch(bibLookupMapUrl);
            let bibMapData = await bibMapResponse.json();
            component.lookup_maps['bibs'] = bibMapData.data;
        }

        let myEnd = component.params.start + component.params.limit -1;
        component.end = myEnd;
        component.start = component.params.start;

        // start the count
        fetch(this.search_url.replace('/records', '/records/count')).then(
            response => response.json()
        ).then(
            jsonData => {
                component.resultcount = jsonData["data"];
                
                // override the spinner
                document.getElementById("result-count-top").innerHTML = component.resultcount;
                document.getElementById("result-count-bottom").innerHTML = component.resultcount;

                if (component.resultcount == 0) {
                    component.start = 0;
                }
                
                if (myEnd >= component.resultcount) {
                    component.end = component.resultcount
                    component.next = null
                }
            }
        );

        let startTime = Date.now();
        
        fetch(this.search_url, this.abortController).then(
            response => {
                if (response.ok) {
                    document.getElementById("results-spinner").remove();
                    return response.json();
                }
            }
        ).then(
            jsonData => {
                if (! jsonData) {
                    throw new Error("Invalid search")
                }

                component.searchTime = (Date.now() - startTime) / 1000;

                let linkKeys = Object.keys(jsonData["_links"]);
                linkKeys.forEach((key, index) => {
                    component.links[key] = jsonData["_links"][key];
                });
                if (component.links.related.count) {
                    component.count = component.links.related.count;
                }
                if (component.links._prev) {
                    component.prev = component.links._prev.replace('&search','&q').replace('/records','/search').replace('/api/marc','/records');
                }
                if (component.links._next) {
                    component.next = component.links._next.replace('&search','&q').replace('/records','/search').replace('/api/marc','/records');
                }
                for (let result of jsonData["data"]) {
                    let myResult = { "_id": result["_id"]}
                    if (component.collection == "bibs") {
                        myResult["first_line"] = result["title"]
                        myResult["second_line"] = [result["symbol"], result["date"], result["types"]].filter(Boolean).join(" | ")
                    } else if (component.collection == "auths") {
                        myResult["first_line"] = result["heading"]
                        myResult["second_line"] = result["alt"]
                        myResult["heading_tag"] = result["heading_tag"];
                    } else if (component.collection == "files") {
                        // not implemented yet
                    }
                    component.results.push(myResult);
                }
            }
        ).catch(
            error => {
                if ((Date.now() - startTime) >= this.maxTime) {
                    this.reportError(`The search is taking longer than the maximum time allowed (${this.maxTime / 1000} seconds). Try narrowing the search.`)
                } else if (error.name === "AbortError") {
                    this.reportError("Search cancelled")
                } else {
                    this.reportError(error.toString())
                }
            }
        ).then( () => {
            user.getProfile(this.api_prefix, 'my_profile').then(
                myProfile => {
                    //console.log("got my profile")
                    if (myProfile) {
                        this.user = myProfile.data.email;
                    }
    
                    if (typeof this.user !== "undefined") {
                        //console.log("this user is not undefined")
                        basket.getBasket(this.api_prefix).then(
                            myBasket => {
                                //console.log("got my basket contents")
                                for (let result of this.results) {
                                    //console.log("processing result")
                                    let myId = `icon-${this.collection}-${result._id}`
                                    let iconEl = document.getElementById(myId);
                    
                                    iconEl.classList.add('fa-folder-plus');
                                    iconEl.addEventListener("click", async () => {
                                        basket.getBasket(this.api_prefix).then(
                                            myBasket => {
                                                this.toggleAddRemove(iconEl, myBasket, this.collection, result._id);
                    
                                                if (this.basketContains(myBasket, this.collection, result._id)) {
                                                    iconEl.classList.remove('fa-folder-plus',);
                                                    iconEl.classList.add('fa-folder-minus');
                                                    iconEl.title = "Remove from basket";
                                                }
                                            }
                                        );
                                    });
                    
                                    // checking if the record is locked and displaying a lock if it is.
                                    basket.itemLocked(this.api_prefix, this.collection, result._id).then(
                                        itemLocked => {
                                            if (itemLocked["locked"] == true && itemLocked["by"] != this.user) {
                                                // Display a lock icon
                                                iconEl.classList.remove('fa-folder-plus',);
                                                iconEl.classList.remove('fa-folder-minus',);
                                                iconEl.classList.add('fa-lock',); // To do: add a click event here to "unlock" the item
                                                iconEl.title = `This item is locked by ${itemLocked["by"]}`;
                                            }
                                        }
                                    )
                                }
                            }
                        )
                    }
    
                }
            )
        })
        
        // cancel the search if it takes more than 15 seconds
        setTimeout(() => this.abortController.abort(), this.maxTime);
    },
    methods: {
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
                basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', collection, record_id).then( () => {
                    el.classList.remove("fa-folder-plus");
                    el.classList.add("fa-folder-minus");
                })
            } else {
                // we can run a deletion
                basket.deleteItem(this.api_prefix, 'userprofile/my_profile/basket', myBasket, collection, record_id).then( () => {
                    el.classList.remove("fa-folder-minus");
                    el.classList.add("fa-folder-plus");
                })
            }
        },
        reportError(message) {
            document.getElementById("results-spinner").innerHTML = message;
            document.getElementById("result-count-top").innerHTML = "0";
            document.getElementById("result-count-bottom").innerHTML = "0";
        },
        cancelSearch() {
            this.abortController.abort()
        }
    },
    components: {
        'sortcomponent': sortcomponent, 
        'countcomponent': countcomponent
    }
}
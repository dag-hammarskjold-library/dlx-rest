import { sortcomponent } from "./search/sort.js";
import { countcomponent } from "./search/count.js";
import basket from "./api/basket.js";
import user from "./api/user.js";

export let authreviewcomponent = {
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
        },
        logged_in: {
            type: String,
            required: true
        }
    },
    template: ` 
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <div class="col text-center">
            <h1>Authorities Review</h1>
            <form :action="action">  
                <label for="dateSelector">Authorities creaded/updated since</label>              
                <div class="input-group mb-3">
                    <input id="dateSelector" type="date" class="form-control" aria-label="Date" :value="since">
                    <div class="input-group-append">
                        <a class="btn btn-outline-secondary" type="button" @click="changeDateAndSearch">Submit</a>
                    </div>
                </div>
            </form>
        </div>
        <div id="filters" class="col text-center">
            Filter: 
            <a v-for="headFilter in headFilters" class="badge badge-light mx-1 head-filter" :data-searchString="headFilter">{{headFilter}}</a>
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
        <div id="message-display" class="col-xs-1 text-center"></div>
        <div id="results-list" v-for="result in this.results" :key="result._id">
            <div class="row pt-2 border-bottom">
                <div class="col-sm-11 px-4 shadow bg-light rounded">
                    <div class="row">
                        <a v-if="allowDirectEdit" :id="'link-' + result._id" class="lead" :href="uibase + '/editor?records=' + collection + '/' + result._id">{{result.first_line}}</a>
                        <a v-else class="lead" :id="'link-' + result._id" :href="uibase + '/records/' + collection + '/' + result._id">{{result.first_line}}</a>
                        <countcomponent v-if="collection == 'auths'" :api_prefix="api_prefix" :recordId="result._id"></countcomponent>
                    </div>
                    <div class="row">
                        <p>{{result.second_line}}</p>
                    </div>
                </div>
                <div class="col-sm-1">
                    <!-- need to test if authenticated here -->
                    <div class="row ml-auto">
                        <a><i :id="'icon-' + collection + '-' + result._id" class="fas fa-2x" data-toggle="tooltip" title="Add to your basket"></i></a>
                    </div>
                </div>
            </div>
        </div>
        </br>
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
        console.log(myProps["search"])

        // Get the date string we want to display
        let updated = myProps["search"].split(/updated(>|<|=)/)[2].split(" ")[0]
        
        let myUIBase = this.api_prefix.replace('/api/','');
        //console.log(this.links)
        return {
            visible: true,
            results: [],
            links: {},
            action: `${myUIBase}/records/${this.collection}/review`,
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
            expressions: [],
            vcoll: null,
            searchTime: 0,
            maxTime: 15000, //milliseconds
            abortController: new AbortController(),
            headFilters: ['100','110','111','150','190'],
            since: updated
        }
    },
    created: async function() {
        this.allowDirectEdit = this.logged_in ? true : false;
    },
    mounted: async function() {
        let component = this;
        
        // [what is this used for?]
        if (component.collection == "auths") {
            this.searchFields = this.authSearchFields
            let authLookupMapUrl = `${component.api_prefix}marc/${component.collection}/lookup/map`
            let authMapResponse = await fetch(authLookupMapUrl);
            let authMapData = await authMapResponse.json();
            component.lookup_maps['auths'] = authMapData.data;
        
            let bibLookupMapUrl = `${component.api_prefix}marc/bibs/lookup/map`
            let bibMapResponse = await fetch(bibLookupMapUrl);
            let bibMapData = await bibMapResponse.json();
            component.lookup_maps['bibs'] = bibMapData.data;
        } else if (component.collection == "bibs") {
            this.searchFields = this.bibSearchFields
        } 
        if (this.params.search.includes("989:Voting Data")) {
            this.searchFields = this.voteSearchFields
            this.vcoll = "989:Voting Data"
        } 
        if (this.params.search.includes("989:Speeches")) {
            this.searchFields = this.speechSearchFields
            this.vcoll = "989:Speeches"
        }

        let myEnd = component.params.start + component.params.limit -1;
        component.end = myEnd;
        component.start = component.params.start;
        let startTime = Date.now();

        // start the count
        fetch(this.search_url.replace('/records', '/records/count'), this.abortController).then(
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
        ).catch(
            error => {
                if (error.name === "AbortError") {
                    document.getElementById("result-count-top").innerHTML = '⏱'
                    document.getElementById("result-count-bottom").innerHTML = '⏱'
                }
            }
        );
        
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

        ).then( 
            () => {
                user.getProfile(component.api_prefix, 'my_profile').then(
                    myProfile => {
                        //console.log("got my profile")
                        if (myProfile) {
                            component.user = myProfile.data.email;
                        }
                    
                        if (typeof component.user !== "undefined") {
                            //console.log("this user is not undefined")
                            basket.getBasket(component.api_prefix).then(
                                myBasket => {
                                    //console.log(myBasket)
                                    //console.log("got my basket contents")
                                    for (let result of component.results) {
                                        //console.log("processing result")
                                        let myId = `icon-${component.collection}-${result._id}`;
                                        let iconEl = document.getElementById(myId);
                                    
                                        if (component.basketContains(myBasket, component.collection, result._id)) {
                                            //iconEl.classList.remove('fa-folder-plus',);
                                            iconEl.classList.add("fa-folder-minus");
                                            iconEl.classList.add("text-muted");
                                            iconEl.title = "Remove from basket";
                                        } else {
                                            iconEl.classList.add('fa-folder-plus');
                                            iconEl.title = "Add to basket";
                                        }

                                        // checking if the record is locked and displaying a lock if it is.
                                        basket.itemLocked(this.api_prefix, this.collection, result._id).then(
                                            itemLocked => {
                                                if (itemLocked["locked"] == true && itemLocked["by"] != this.user) {
                                                    // Display a lock icon
                                                    iconEl.classList.remove('fa-folder-plus',);
                                                    iconEl.classList.remove('fa-folder-minus',);
                                                    iconEl.classList.add('fa-lock',);
                                                    iconEl.title = `This item is locked by ${itemLocked["by"]}`;
                                                    // revert link to read only view. 
                                                    // TODO: acquire the lock status earlier 
                                                    document.getElementById("link-" + result._id).href = this.uibase + '/records/' + this.collection + '/' + result._id;
                                                }
                                            }
                                        );

                                        iconEl.addEventListener("click", function() {
                                            if (iconEl.classList.contains("fa-folder-plus")) {
                                                //console.log("We're trying to create something.")
                                                basket.getBasket(component.api_prefix)
                                                iconEl.classList.add("fa-spinner");
                                                // we can run an add
                                                basket.createItem(component.api_prefix, 'userprofile/my_profile/basket', component.collection, result._id).then(
                                                    function() {
                                                        iconEl.classList.remove("fa-spinner");
                                                        iconEl.classList.remove("fa-folder-plus");
                                                        iconEl.classList.add("fa-folder-minus");
                                                        iconEl.classList.add("text-muted");
                                                        iconEl.title = "Remove from basket";
                                                    }
                                                )
                                            } else if (iconEl.classList.contains("fa-folder-minus")) {
                                                //console.log("We're trying to delete something.")
                                                basket.getBasket(component.api_prefix)
                                                iconEl.classList.add("fa-spinner");
                                                // we can run a deletion
                                                basket.deleteItem(component.api_prefix, 'userprofile/my_profile/basket', myBasket, component.collection, result._id).then(
                                                    function() {
                                                        //console.log("But did we do it?")
                                                        iconEl.classList.remove("fa-spinner");
                                                        iconEl.classList.remove("fa-folder-minus");
                                                        iconEl.classList.add("fa-folder-plus");
                                                        iconEl.classList.remove("text-muted");
                                                        iconEl.title = "Add to basket";
                                                    }
                                                )
                                            } else if (iconEl.classList.contains("fa-lock")) {
                                                // TODO: unlock

                                            }
                                        });
                                    }
                                }
                            )
                        }        
                    }
                )
            }
        );
        
        // cancel the search if it takes more than 15 seconds
        setTimeout(() => this.abortController.abort(), this.maxTime);

        for (let el of document.getElementsByClassName('head-filter')) {
            el.href = this.rebuildUrl("search", el.getAttribute("data-searchString"));
        }
    },
    methods: {
        rebuildUrl(param, value) {
            let myParams = Object.assign({},this.params);
            let searchParam = myParams["search"]
            let newSearchParam = ""
            for (let hf of this.headFilters) {
                newSearchParam = searchParam.replace(hf, "nnn")
                if (newSearchParam.includes("nnn")) {
                    break
                }
            }
            
            if (newSearchParam.includes("nnn")) {
                myParams["search"] = newSearchParam.replace("nnn",value)
            } else {
                myParams["search"] = `${newSearchParam} AND ${value}:*`
            }

            const qs = Object.keys(myParams)
                .map(key => `${key.replace('search','q')}=${encodeURIComponent(myParams[key])}`)
                .join('&');
            return `${this.action}?${qs}`;
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
            if (el.classList.value === "fas fa-2x fa-folder-plus") {
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
        toggleAdvancedSearch() {
            let el = document.getElementById("advanced-search")
            let ss = document.getElementById("simple-search")
            let toggleASLink = document.getElementById("toggleASLink")
            let toggleSSLink = document.getElementById("toggleSSLink")
            if (el.style.display == "none"){
                el.style.display = "block"
                ss.style.display = "none"
                toggleASLink.classList.add("active")
                toggleSSLink.classList.remove("active")
                //toggleLink.textContent = "Simple Search"
            } else {
                el.style.display = "none"
                ss.style.display = "block"
                toggleSSLink.classList.add("active")
                toggleASLink.classList.remove("active")
                //toggleLink.textContent = "Advanced Search"
            }
        },
        setParameter(which, what) {
            this.advancedParams[which] = what
            let el = document.getElementById(which)
            if (typeof what === "object") {
                el.innerText = what.name
                this.advancedParams[which] = what.value
            } else {
                el.innerText = what
            }
        },
        submitAdvancedSearch() {
            // Build the URL
            var expressions = []
            var anycount = 0
            for (let i of ["1","2","3"]) {
                let term  = this.advancedParams[`searchTerm${i}`]
                let termList = []
                // First figure out if there IS a search term here, then split it by space
                if (term !== null) {
                    termList = term.split(/\s+/)
                }
                // Next figure out if we're searching in a field or not
                if (this.advancedParams[`searchField${i}`] == "any" ) {
                    if (term) {
                        console.log(term)
                        anycount++
                    }
                    // What kind of search are we doing?
                    switch (this.advancedParams[`searchType${i}`]) {
                        case "any":
                            // Any of the words in any field
                            // expressions.push(termList.join(" "))
                            // break
                            this.reportError('"Any of the words" "in any field" is not currently supported');
                            throw new Error("Search cancelled");
                        case "all":
                            // All of the words in any field
                            expressions.push(termList.join(" "))
                            break
                        case "exact":
                            // Exact phrase in any field
                            expressions.push(`'${termList.join(" ")}'`)
                            break
                        case "partial":
                            // Partial phrase in any field
                            expressions.push(`"${termList.join(" ")}"`)
                            break
                        case "regex":
                            // This can't be done like this on MDB, so we should disable the option
                            //break
                            this.reportError('"Regular expression" "in any field" is not currently supported');
                            throw new Error("Search cancelled");
                        default:
                            expressions.push(termList.join(" "))
                    }                    
                } else {
                    let myField = this.advancedParams[`searchField${i}`]
                    let myExpr = []
                    // To do: add a flag for case insensitive search
                    switch(this.advancedParams[`searchType${i}`]) {
                        case "any":
                            // Any of the words in any field
                            for (let term of termList) {
                                myExpr.push(`${myField}:${term}`)
                            }
                            expressions.push(myExpr.join(" OR "))
                            break
                        case "all":
                            // All of the words in any field
                            expressions.push(`${myField}:${termList.join(" ")}`)
                            break
                        case "exact":
                            // Exact phrase in any field
                            expressions.push(`${myField}:'${termList.join(" ")}'`)
                            break
                        case "partial":
                            // Partial phrase in any field
                            expressions.push(`${myField}:"${termList.join(" ")}"`)
                            break
                        case "regex":
                            // Regular expression; this probably needs additional validation to make sure it IS a regex
                            // Also it doesn't work quite right...
                            expressions.push(`${myField}:${termList.join(" ")}`)
                            break
                        default:
                            expressions.push(termList.join(" "))
                    }
                }
            }
            if (anycount > 1) {                  
                this.reportError("Can't have more than one \"in any field\" term")
                throw new Error("Search cancelled");
            }
            this.expressions = expressions
            let compiledExpr = []
            if (this.vcoll) {
                compiledExpr.push(`${this.vcoll} AND`)
            }
            for (let i in expressions) {
                let j = parseInt(i)+1
                let accessor = `searchConnector${j.toString()}`
                //console.log(i, expressions[i], accessor, this.advancedParams[accessor])
                if (expressions[i] !== "") {
                    compiledExpr.push(expressions[i])
                }
                if (this.advancedParams[accessor]) {
                    compiledExpr.push(this.advancedParams[accessor])
                }
            }
            // Get rid of any trailing boolean connectors if they don't connect to another expression
            while (compiledExpr[compiledExpr.length - 1] === 'AND') {
                compiledExpr.pop()
            }
            while (compiledExpr[compiledExpr.length - 1] === 'OR') {
                compiledExpr.pop()
            }

            // Catch and warn of invalid searches
            // ...

            let url = `${this.action}?q=${encodeURIComponent(compiledExpr.join(" "))}`
            
            window.location = url
        },
        reportError(message) {
            let display = document.getElementById("results-spinner");
            display = display || document.getElementById("message-display");
            display.innerText = message;
            this.results = []; // clear any exisiting results
            document.getElementById("result-count-top").innerHTML = "0";
            document.getElementById("result-count-bottom").innerHTML = "0";
        },
        cancelSearch() {
            this.abortController.abort();
            this.start = this.end = 0;
        },
        changeDateAndSearch() {
            // this.action is where we start
            let myParams = Object.assign({},this.params);
            let newDate = document.getElementById("dateSelector").value
            //el.href = this.rebuildUrl("updated", el.getAttribute("data-searchString"));
            let searchParam = myParams["search"]
            let newSearchParams = []
            //let newSearchParam = searchParam.replace("updated", newDate)
            for (let p of searchParam.split(" ")) {
                let newP = p
                if (p.includes("updated")) {
                    let v = p.split(/(<|=|>)/)
                    newP = p.replace(v[2],newDate)
                }
                newSearchParams.push(newP)
            }
                
            myParams["search"] = newSearchParams.join(" ")
            console.log(myParams)
        
            const qs = Object.keys(myParams)
                .map(key => `${key.replace('search','q')}=${encodeURIComponent(myParams[key])}`)
                .join('&');
            window.location = `${this.action}?${qs}`;
        }
    },
    components: {
        'sortcomponent': sortcomponent, 
        'countcomponent': countcomponent
    }
}
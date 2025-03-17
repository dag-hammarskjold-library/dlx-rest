import { sortcomponent } from "./sort.js";
import { countcomponent } from "./count.js";
import { itemaddcomponent } from "./itemadd.js";
import { recordfilecomponent } from "../recordfiles.js";
import basket from "../api/basket.js";
import user from "../api/user.js";
import { Jmarc } from "../jmarc.mjs";
import { exportmodal } from "../modals/export.js";
import { readonlyrecord } from "../readonly_record.js"

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
        },
        logged_in: {
            type: String,
            required: true
        },
        index_list: {
            type: String,
            required: true
        }
    },
    template: /* html */ `
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <nav class="navbar navbar-expand-lg navbar-light bg-white text-center">
            <div class="collapse navbar-collapse" id="advancedSearchToggle">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item"><a id="toggleSSLink" class="nav-link active" href="#" @click="toggleAdvancedSearch()">Simple Search</a></li>
                    <li class="nav-item"><a id="toggleASLink" class="nav-link" href="#" @click="toggleAdvancedSearch()">Advanced Search</a></li>
                    <li v-if="collectionTitle=='speeches'" class="nav-item"><a class="nav-link" :href="uibase + '/records/speeches/review'">Speech Review</a></li>
                    <li class="nav-item">
                        <div class="custom-control custom-switch nav-link ml-5">
                            <input v-if="params.engine === 'atlas'" type="checkbox" checked="true" class="custom-control-input" id="customSwitch1" @change="toggleEngine">
                            <input v-else type="checkbox" class="custom-control-input" id="customSwitch1" @change="toggleEngine">
                            <label class="custom-control-label" for="customSwitch1">Use Atlas Search</label>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
        <div id="advanced-search" class="row pt-2" style="display:none">
            <div class="input-group mb-3">
                <div class="input-group-prepend">
                    <button id="searchType1" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">All of the words:</button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" v-for="t in searchTypes" :value=t.value @click="setParameter('searchType1',t)">{{t.name}}</option>
                    </div>
                </div>
                <input id="searchTerm1" type="text" class="form-control" aria-label="Text input with dropdown button" v-model="advancedParams.searchTerm1" @keydown.enter="submitAdvancedSearch">
                <div class="input-group-prepend"><span class="input-group-text">in</span></div>
                <div class="input-group-prepend">
                    <button id="searchField1" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">any field</button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" v-for="field in searchFields" @click="setParameter('searchField1',field)">{{field}}</option>
                    </div>
                </div>
                <div class="input-group-append">
                    <button id="searchConnector1" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">AND</button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" value="AND" @click="setParameter('searchConnector1','AND')">AND</option>
                        <option class="dropdown-item" value="OR" @click="setParameter('searchConnector1','OR')">OR</option>
                        <option class="dropdown-item" value="ANDNOT" @click="setParameter('searchConnector1','AND NOT')">AND NOT</option>
                        <option class="dropdown-item" value="ORNOT" @click="setParameter('searchConnector1','OR NOT')">OR NOT</option>
                    </div>
                </div>
            </div>
            <div class="input-group mb-3">
                <div class="input-group-prepend">
                    <button id="searchType2" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">All of the words:</button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" v-for="t in searchTypes" :value=t.value @click="setParameter('searchType2', t)">{{t.name}}</option>
                    </div>
                </div>
                <input id="searchTerm2" type="text" class="form-control" aria-label="Text input with dropdown button" v-model="advancedParams.searchTerm2" @keydown.enter="submitAdvancedSearch">
                <div class="input-group-prepend"><span class="input-group-text">in</span></div>
                <div class="input-group-prepend">
                    <button id="searchField2" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">any field</button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" v-for="field in searchFields" @click="setParameter('searchField2',field)">{{field}}</option>
                    </div>
                </div>
                <div class="input-group-append">
                    <button id="searchConnector2" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">AND</button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" value="AND" @click="setParameter('searchConnector2','AND')">AND</option>
                        <option class="dropdown-item" value="OR" @click="setParameter('searchConnector2','OR')">OR</option>
                        <option class="dropdown-item" value="ANDNOT" @click="setParameter('searchConnector1','AND NOT')">AND NOT</option>
                        <option class="dropdown-item" value="ORNOT" @click="setParameter('searchConnector1','OR NOT')">OR NOT</option>
                    </div>
                </div>
            </div>
            <div class="input-group mb-3">
                <div class="input-group-prepend">
                    <button id="searchType3" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">All of the words:</button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" v-for="t in searchTypes" :value=t.value @click="setParameter('searchType3', t)">{{t.name}}</option>
                    </div>
                </div>
                <input id="searchTerm3" type="text" class="form-control" aria-label="Text input with dropdown button" v-model="advancedParams.searchTerm3" @keydown.enter="submitAdvancedSearch">
                <div class="input-group-prepend"><span class="input-group-text">in</span></div>
                <div class="input-group-append">
                    <button id="searchField3" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">any field</button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" v-for="field in searchFields" @click="setParameter('searchField3',field)">{{field}}</option>
                    </div>
                </div>
            </div>
            <input class="btn btn-primary" type="submit" id="search-btn" value="Search" @click="submitAdvancedSearch">
        </div>
        <div id="simple-search" class="row pt-2">
            <form class="form-inline mr-auto col-lg-12" :action="action">
                <input v-if="params.search" id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" aria-label="Search" :value="params.search">
                <input v-else id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" placeholder="Search" aria-label="Search">
                <input v-for="v,k in params" type="hidden" :id="k" :name="k" :value="v">
                <button class="btn btn-primary" type="submit" id="search-btn" value="Search">Search</button>
                <button class="btn btn-sm btn-default" type="button" value="Cancel search" title="Cancel" v-on:click="cancelSearch()">
                    <span>X</span>
                </button>
            </form>    
        </div>
        <div v-if="collection == 'auths'" id="filters" class="col text-center">
            Filter: 
            <a v-for="headFilter in headFilters" class="badge badge-light mx-1 head-filter" :data-searchString="headFilter">{{headFilter}}</a>
        </div>
        <sortcomponent v-bind:uibase="uibase" v-bind:collection="collection" v-bind:params="params" :subtype="subtype"></sortcomponent>
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
                <li v-if="prev" class="page-item"><a class="page-link result-link" :href="prev">Previous</a></li>
                <li v-else class="page-item disabled"><a class="page-link result-link" href="">Previous</a></li>
                <li v-if="next" class="page-item"><a class="page-link result-link" :href="next">Next</a></li>
                <li v-else class="page-item disabled"><a class="page-link result-link" href="">Next</a></li>
            </ul>
        </nav>
        <div id="results-spinner" class="col d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <br>
        <div id="message-display" class="col-xs-1 text-center"></div>
        <div class="row" v-if="user">
            Select 
            <a class="mx-1 result-link" href="#" @click="selectAll">All</a>
            <a class="mx-1 result-link" href="#" @click="selectNone">None</a>
            <a class="mx-1 result-link" href="#" @click="sendToBasket">Send Selected to Basket (limit: 100)</a>
            <a v-if="collectionTitle=='speeches'" class="ml-auto result-link" :href="uibase + '/records/speeches/review'">Speech Review</a>
            <a class="ml-auto result-link"><i class="fas fa-share-square" title="Export Results" @click="showExportModal"></i></a>
        </div>
        <div id="results-list" v-for="result in this.results" :key="result._id">
            <div class="row mt-1 border-bottom search-result">
                <div class="col-sm-1" v-if="user">
                    <input :id="'input-' + collection + '-' + result._id" type="checkbox" disabled="true" data-toggle="tooltip" title="Select/deselect record"/>
                </div>
                <div class="col-sm-9 px-4">
                    <div v-if="collection != 'auths'" class="row" style="overflow-x:hidden">
                        <a v-if="!result.locked" :id="'link-' + result._id" class="result-link" :href="uibase + '/editor?records=' + collection + '/' + result._id" style="white-space:nowrap">{{result.first_line}}</a>
                        <a v-else class="result-link" :id="'link-' + result._id" :href="uibase + '/records/' + collection + '/' + result._id" style="white-space:nowrap">{{result.first_line}}</a>
                        <countcomponent v-if="collection == 'auths'" :api_prefix="api_prefix" :recordId="result._id"></countcomponent>
                    </div>
                    <div v-else class="row" style="flex-wrap:inherit">
                        <a v-if="!result.locked" :id="'link-' + result._id" class="result-link" :href="uibase + '/editor?records=' + collection + '/' + result._id" style="overflow-wrap:break-word">{{result.first_line}}</a>
                        <a v-else class="result-link" :id="'link-' + result._id" :href="uibase + '/records/' + collection + '/' + result._id" style="overflow-wrap:break-word">{{result.first_line}}</a>
                        <countcomponent v-if="collection == 'auths'" :api_prefix="api_prefix" :recordId="result._id"></countcomponent>
                    </div>
                    <div class="row" style="white-space:nowrap">
                        {{result.second_line}}
                    </div>
                    <div class="row" v-for="agenda in result.agendas">
                        <span class="ml-3">{{agenda}}</span>
                    </div>
                    <div class="row" v-for="val in result.f596">
                        <span class="ml-3">{{val}}</span>
                    </div>
                    <div class="row" v-for="val in result.f520" style="white-space:nowrap">
                        <span class="ml-3">{{val}}</span>
                    </div>
                </div>
                <div>
                    <i v-if="previewOpen === result._id" class="fas fa-window-close preview-toggle" v-on:click="togglePreview($event, result._id)" title="Preview record"></i>
                    <i v-else class="fas fa-file preview-toggle" v-on:click="togglePreview($event, result._id)" title="Preview record"></i>
                    <readonlyrecord v-if="previewOpen === result._id" :api_prefix="api_prefix" :collection="collection" :record_id="result._id" class="record-preview"></readonlyrecord>
                </div>
                <div class="col">
                    <recordfilecomponent ref="recordfilecomponent" v-if="collection=='bibs'" :api_prefix="api_prefix" :record_id="result._id" />
                </div>
                <div class="col-sm-1">
                    <!-- need to test if authenticated here -->
                    <div class="row ml-auto">
                        <!-- <a><i :id="'icon-' + collection + '-' + result._id" class="fas fa-2x" data-toggle="tooltip" title="Add to basket"></i></a> -->
                        <itemaddcomponent ref="itemaddcomponent" v-if="myBasket" :api_prefix="api_prefix" :myBasket="myBasket" :collection="collection" :recordId="result._id" @enableCheckbox="enableCheckbox(result)" @disableCheckbox="disableCheckbox(result)"></itemaddcomponent>
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
                <li v-if="prev" class="page-item"><a class="page-link result-link" :href="prev">Previous</a></li>
                <li v-else class="page-item disabled"><a class="page-link result-link" href="">Previous</a></li>
                <li v-if="next" class="page-item"><a class="page-link result-link" :href="next">Next</a></li>
                <li v-else class="page-item disabled"><a class="page-link result-link" href="">Next</a></li>
            </ul>
        </nav>
        <exportmodal ref="exportmodal" :links="this.links"></exportmodal>
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
        let myUIBase = this.api_prefix.replace('/api/', '');
        let mySubtype = ["vote", "speech"].includes(myProps.subtype) ? myProps.subtype : this.collection
        return {
            visible: true,
            results: [],
            links: {},
            action: `${myUIBase}/records/${this.collection}/search`,
            params: myProps,
            searchType: "all",
            advancedParams: {
                'searchType1': 'all',
                'searchTerm1': null,
                'searchField1': 'any',
                'searchConnector1': 'AND',
                'searchType2': 'all',
                'searchTerm2': null,
                'searchField2': 'any',
                'searchConnector2': 'AND',
                'searchType3': 'all',
                'searchTerm3': null,
                'searchField3': 'any'
            },
            // To do: Get these logical fields from the configuration
            /*
            bibSearchFields: ['author','title','symbol','notes','subject'],
            authSearchFields: ['heading', 'agenda_title', 'agenda_subject'],
            voteSearchFields: ['symbol','title','agenda','year'],
            speechSearchFields: ['symbol'],
            */
            searchFields: [],
            searchTypes: [
                { 'name': 'All of the words:', 'value': 'all' },
                { 'name': 'Any of the words:', 'value': 'any' },
                { 'name': 'Exact phrase:', 'value': 'exact' },
                { 'name': 'Partial phrase:', 'value': 'partial' },
                { 'name': 'Regular expression:', 'value': 'regex' },
            ],
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
            searchTime: "?",
            maxTime: 20000, //milliseconds
            headFilters: ['100', '110', '111', '130', '150', '190', '191'],
            abortController: new AbortController(),
            myProfile: {},
            myBasket: {},
            user: null,
            collectionTitle: null,
            engine: "community",
            previewOpen: false,
            subtype: mySubtype
        }
    },
    created: async function () {
        this.allowDirectEdit = this.logged_in ? true : false;
    },
    mounted: async function () {
        let component = this;
        this.collectionTitle = component.collection;
        this.myProfile = await user.getProfile(component.api_prefix, 'my_profile');
        this.user = this.myProfile.data.email;
        this.myBasket = await basket.getBasket(this.api_prefix);
        Jmarc.apiUrl = component.api_prefix;

        // cancel record preview if clicking anywhere besides the preview
        window.addEventListener("click", function (event) {
            if (event.target.parentElement === null) {
                // probably a modal
                return
            }

            if (
                event.target.classList.contains("preview-toggle")
                || event.target.classList.contains("record-preview")
                || event.target.parentElement.classList.contains("record-preview")
            ) {
                // the target is a part of the preview (do nothing)
                return
            }

            for (let x of document.getElementsByClassName("record-preview")) {
                component.togglePreview(event)
            }
        });

        //let searchstr = document.getElementById('q').value;
        this.searchFields = JSON.parse(this.index_list)

        // [what is this used for?]
        if (component.collection == "auths") {
            /* let authLookupMapUrl = `${component.api_prefix}marc/${component.collection}/lookup/map`
            let authMapResponse = await fetch(authLookupMapUrl);
            let authMapData = await authMapResponse.json();
            component.lookup_maps['auths'] = authMapData.data;
        
            let bibLookupMapUrl = `${component.api_prefix}marc/bibs/lookup/map`
            let bibMapResponse = await fetch(bibLookupMapUrl);
            let bibMapData = await bibMapResponse.json();
            component.lookup_maps['bibs'] = bibMapData.data; */
        } else if (component.collection == "bibs") {
            //this.searchFields = this.bibSearchFields
        }
        // todo: remove the type cretieria from the search input; update criteria
        if (this.params.subtype === "speech") {
            this.vcoll = "089:'B22'"
            this.collectionTitle = "speeches"
        }
        // todo: remove the type cretieria from the search input, update criteria
        if (this.params.subtype === "vote") {
            this.vcoll = "089:'B23'"
            this.collectionTitle = "votes"
        }

        let myEnd = component.params.start + component.params.limit - 1;
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
                } else if (response.status === 422) {
                    return response.json().then(
                        json => {
                            throw new Error(json["message"])
                        }
                    )
                } else if (response.status == 422) {
                    throw new Error("Internal server error");
                }
            }
        ).then(
            jsonData => {
                component.searchTime = (Date.now() - startTime) / 1000;

                let linkKeys = Object.keys(jsonData["_links"]);
                linkKeys.forEach((key, index) => {
                    component.links[key] = jsonData["_links"][key];
                });
                if (component.links.related.count) {
                    component.count = component.links.related.count;
                }
                if (component.links._prev) {
                    component.prev = component.links._prev.replace('&search', '&q').replace('/records', '/search').replace('/api/marc', '/records');
                }
                if (component.links._next) {
                    component.next = component.links._next.replace('&search', '&q').replace('/records', '/search').replace('/api/marc', '/records');
                }
                for (let result of jsonData["data"]) {
                    let myResult = { "_id": result["_id"] }
                    if (component.collection == "bibs") {
                        myResult["first_line"] = result["title"]
                        //.split("::")[result["types"].split("::").length-1]]

                        let rtype = result["types"].split("::")

                        myResult["second_line"] = [result["symbol"], result["date"], rtype[rtype.length - 1]].filter(Boolean).join(" | ")
                        myResult["f520"] = result["f520"]
                        if (this.vcoll == "089:'B22'") {
                            myResult["agendas"] = result["agendas"]
                            myResult["f596"] = result["f596"]
                        }
                    } else if (component.collection == "auths") {
                        myResult["first_line"] = result["heading"]
                        myResult["second_line"] = result["alt"]
                        myResult["heading_tag"] = result["heading_tag"];
                    } else if (component.collection == "files") {
                        // not implemented yet
                    }
                    myResult.locked = false
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
        )

        // cancel the search if it takes more than 15 seconds
        setTimeout(() => this.abortController.abort(), this.maxTime);

        for (let el of document.getElementsByClassName('head-filter')) {
            el.href = this.rebuildUrl("search", el.getAttribute("data-searchString"));
        }
    },
    methods: {
        rebuildUrl(param, value) {
            let myParams = Object.assign({}, this.params);
            let searchParam = myParams["search"]
            let newSearchParam = ""
            for (let hf of this.headFilters) {
                newSearchParam = searchParam.replace(hf, "nnn")
                if (newSearchParam.includes("nnn")) {
                    break
                }
            }

            if (newSearchParam.includes("nnn")) {
                myParams["search"] = newSearchParam.replace("nnn", value)
            } else {
                if (newSearchParam.length > 0) {
                    myParams["search"] = `${newSearchParam} AND ${value}:*`
                } else {
                    myParams["search"] = `${value}:*`
                }

            }

            // Set the search type to whatever we've set it to with our toggle 
            myParams["engine"] = this.engine

            const qs = Object.keys(myParams)
                .map(key => `${key.replace('search', 'q')}=${encodeURIComponent(myParams[key])}`)
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
        refreshBasket() {
            basket.getBasket(this.api_prefix).then((b) => {
                this.myBasket = b
            })
        },
        toggleAdvancedSearch() {
            let el = document.getElementById("advanced-search")
            let ss = document.getElementById("simple-search")
            let toggleASLink = document.getElementById("toggleASLink")
            let toggleSSLink = document.getElementById("toggleSSLink")
            if (el.style.display == "none") {
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
        submitAdvancedSearch(e) {
            // Build the URL
            var expressions = []
            var anycount = 0
            for (let i of ["1", "2", "3"]) {
                let term = this.advancedParams[`searchTerm${i}`]
                let termList = []
                // First figure out if there IS a search term here, then split it by space
                if (term !== null) {
                    termList = term.split(/\s+/)
                }
                // Next figure out if we're searching in a field or not
                if (this.advancedParams[`searchField${i}`] == "any") {
                    if (term) {
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
                            expressions.push(termList.map(x => x.replace(/(AND|OR|NOT)/, '"$1"')).join(" ")) // enclose these in double quotes so they aren't intrepreted as operators
                            break
                        case "exact":
                            // Exact phrase in any field
                            expressions.push(`'${termList.join(" ")}'`)
                            break
                        case "partial":
                            // Partial phrase in any field
                            expressions.push(`"${termList.join(" ")}"`) // enclose in double quotes
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
                    switch (this.advancedParams[`searchType${i}`]) {
                        case "any":
                            // Any of the words in the given field
                            for (let term of termList) {
                                myExpr.push(`${myField}:${term}`)
                            }
                            expressions.push(myExpr.join(" OR "))
                            break
                        case "all":
                            // All of the words in the given field
                            termList = termList.map(x => x.replace(/(AND|OR|NOT)/, '"$1"')) // enclose these in double quotes so they aren't intrepreted as operators
                            expressions.push(`${myField}:${termList.join(" ")}`)
                            break
                        case "exact":
                            // Exact phrase in the given field
                            expressions.push(`${myField}:'${termList.join(" ")}'`)
                            break
                        case "partial":
                            // Partial phrase in the given field
                            expressions.push(`${myField}:"${termList.join(" ")}"`) // enclose in double quotes
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
                let j = parseInt(i) + 1
                let accessor = `searchConnector${j.toString()}`
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
        selectAll(e) {
            e.preventDefault()
            for (let inputEl of document.getElementsByTagName("input")) {
                if (inputEl.type == "checkbox" && !inputEl.disabled && inputEl.id != "customSwitch1") {
                    inputEl.checked = true
                }
            }
        },
        selectNone(e) {
            e.preventDefault()
            for (let inputEl of document.getElementsByTagName("input")) {
                if (inputEl.type == "checkbox" && inputEl.id != "customSwitch1") {
                    inputEl.checked = false
                }
            }
        },
        // We could instead use the result object to control this and maintain reactivity.
        enableCheckbox(record) {
            //console.log("enbling checkbox")
            let el = document.getElementById(`input-${this.collection}-${record._id}`);
            el.disabled = false;
            record.locked = false;
        },
        disableCheckbox(record) {
            //console.log("disabling checkbox")
            let el = document.getElementById(`input-${this.collection}-${record._id}`);
            el.checked = false;
            el.disabled = true;
            record.locked = true;
        },
        async sendToBasket(e) {
            e.preventDefault()
            let items = []
            let limit = 100     // Really shouldn't send more than that
            let idx = 0
            for (let inputEl of document.getElementsByTagName("input")) {
                if (inputEl.type == "checkbox" && inputEl.checked) {
                    if (idx >= limit) {
                        continue
                    }
                    let collection = inputEl.id.split("-")[1]
                    let record_id = inputEl.id.split("-")[2]
                    items.push({
                        "collection": `${collection}`,
                        "record_id": `${record_id}`
                    })
                    idx++
                }
            }
            if (items.length > 0) {
                basket.createItems(this.api_prefix, 'userprofile/my_profile/basket', JSON.stringify(items)).then(() => window.location.reload(false))
            }
        },
        togglePreview(event, recordId) {
            if (event.target.classList.contains("preview-toggle") && this.previewOpen === recordId) {

                this.previewOpen = false;
            } else if (recordId) {
                this.previewOpen = recordId;
            } else {
                this.previewOpen = false;
            }

            return
        },
        showExportModal() {
            //console.log(this.links.format)
            this.$refs.exportmodal.show()
        },
        toggleEngine(e) {
            // toggle the search type
            //console.log("Toggling search engine")
            this.params.engine = e.target.checked ? "atlas" : "community"
            this.rebuildUrl("engine", this.engine)

        }
    },
    components: {
        'sortcomponent': sortcomponent,
        'countcomponent': countcomponent,
        'exportmodal': exportmodal,
        'itemaddcomponent': itemaddcomponent,
        'recordfilecomponent': recordfilecomponent,
        'readonlyrecord': readonlyrecord
    }
}
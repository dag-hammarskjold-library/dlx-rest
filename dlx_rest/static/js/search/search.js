import { sortcomponent } from "./sort.js"
import { countcomponent } from "./count.js"
import basket from "../api/basket.js"
import user from "../api/user.js"
import { previewmodal } from "../modals/preview.js"
import { simplesearchform } from "./simplesearch.js"
import { advancedsearchform } from "./advancedsearch.js"
import { searchresults } from "./results.js"

export let searchcomponent = {
    props: {
        api_prefix: {
            type: String,
            required: true
        },
        collection: {
            type: String,
            required: true
        },
    },
    template:`
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <nav class="navbar navbar-expand-lg navbar-light bg-white text-center">
            <div class="collapse navbar-collapse" id="advancedSearchToggle">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item"><a id="toggleSSLink" class="nav-link active" href="#" @click="toggleAdvancedSearch()">Simple Search</a></li>
                    <li class="nav-item"><a id="toggleASLink" class="nav-link" href="#" @click="toggleAdvancedSearch()">Advanced Search</a></li>
                </ul>
            </div>
        </nav>
        <div v-if="showAdvanced"><advancedsearchform :collection="collection" :api_prefix="api_prefix" ref="advanced-search-form" v-on:submit="submitSearch"></advancedsearchform></div>
        <div v-else><simplesearchform :collection="collection" :api_prefix="api_prefix" ref="simple-search-form" v-on:cancel="cancelSearch" v-on:submit="submitSearch"></simplesearchform></div>
        <div v-if="showSpinner" id="results-spinner" class="col d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <div v-if="results.length > 0">
            <!-- <pagination></pagination> -->
            <nav>
                <ul class="pagination pagination-md justify-content-center">
                    <li class="page-item disabled">
                        <span class="page-link">
                            {{start}} to {{end}} of 
                            <div v-if="showCountSpinner" class="spinner-grow" role="status" style="width:1rem;height:1rem">
                                <span class="sr-only">Loading...</span>
                            </div>
                            <span v-else>{{resultcount}}</span>
                            Records ({{searchTime}} seconds)
                        </span>
                    </li>
                    <li v-if="prev" class="page-item"><a class="page-link result-link" :href="prev">Previous</a></li>
                    <li v-else class="page-item disabled"><a class="page-link result-link" href="">Previous</a></li>
                    <li v-if="next" class="page-item"><a class="page-link result-link" :href="next">Next</a></li>
                    <li v-else class="page-item disabled"><a class="page-link result-link" href="">Next</a></li>
                </ul>
            </nav>
            <searchresults :collection="collection" :api_prefix="api_prefix" :results="results"></searchresults>
            <!-- <pagination></pagination> -->
            <nav>
                <ul class="pagination pagination-md justify-content-center">
                    <li class="page-item disabled">
                        <span class="page-link">
                            {{start}} to {{end}} of 
                            <span id="result-count-bottom">
                                <div v-if="showCountSpinner" class="spinner-grow" role="status" style="width:1rem;height:1rem">
                                    <span class="sr-only">Loading...</span>
                                </div>
                                <span v-else>{{resultcount}}</span>
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
        </div>
    </div>`,
    data: function() {
        let myUIBase = this.api_prefix.replace('/api/','')
        /* Redo this
        let myParams = this.search_url.split("?")[1]
        let myProps = {}
        for (let p of myParams.split("&")) {
            let thisParam = p.split("=");
            if (thisParam[0] == "start" || thisParam[0] == "limit") {
                myProps[thisParam[0]] = parseInt(thisParam[1]);
            } else {
                myProps[thisParam[0]] = decodeURIComponent(thisParam[1]).replace(/\+/g, ' ');
            }
        }
        */
        return {
            results: [],
            submitted: false,
            showSpinner: false,
            showCountSpinner: false,
            hidden_qs: ["NOT 089:B22 AND NOT 089:B23"],
            searchTerm: "",
            myBasket: {},
            selectedRecords: [],
            uibase: myUIBase,
            searchTime: 0,
            showAdvanced: false,
            actualCollection: this.collection,
            start: 0,
            end: 0,
            resultcount: 0,
            next: null,
            prev: null,
            maxTime: 2000,
            abortController: new AbortController(),
        }
    },
    created: function () {
        const urlParams = new URLSearchParams(window.location.search)
        const searchQuery = urlParams.get("q")
        if (this.collection == "auths") {
            this.hidden_qs = []
        } else if (this.collection == "speeches") {
            this.hidden_qs = ["089:'B22'"]
            this.actualCollection = "bibs"
        } else if (this.collection == "votes") {
            this.hidden_qs = ["089:'B23'"]
            this.actualCollection = "bibs"
        }
        if (searchQuery) {
            this.searchTerm = searchQuery
            this.updateSearchQuery()
            this.submitSearch()
        }
        this.refreshBasket()
    },
    methods: {
        async refreshBasket() {
            basket.getBasket(this.api_prefix).then( (b) => {
                this.myBasket = b
            })
        },
        updateSearchQuery() {
            const url = new URL(window.location)
            url.searchParams.set("q", this.searchTerm)
            this.qs = [this.searchTerm, this.hidden_qs].join(" AND ")
            window.history.replaceState(null, "", url)
        },
        submitSearch() {
            // Do the search and update this.results
            let search_url = `${this.api_prefix}marc/${this.actualCollection}/records?search=${encodeURIComponent(this.qs)}&format=brief`
            console.log(search_url)
            let ui_url = `${this.api_prefix.replace("/api/","")}/records/speeches/review?q=${this.foundQ}`
            let startTime = Date.now()
            this.showSpinner = true
            fetch(search_url, this.abortController).then(response => {
                response.json().then(jsonData => {
                    this.results = jsonData.data
                }).then( () => {
                    this.submitted = true
                })
            }).then( () => {
                this.searchTime = (Date.now() - startTime) / 1000
                this.showSpinner = false
            })

            // Removed
            // then( () => {this.showSpinner = false}).then(() => {
            //    window.history.replaceState({},ui_url)
            //}).

            // Now do the total result count
            this.showCountSpinner = true
            //this.end = this.params.start + this.params.limit -1
            fetch(search_url.replace('/records', '/records/count'), this.abortController).then(response => {
                response.json().then( jsonData => {
                    this.resultcount = jsonData["data"]
                }).then ( () => {
                    this.showCountSpinner = false
                    if (this.resultcount == 0) {
                        this.start = 0;
                    }
                    
                    if (this.end >= this.resultcount) {
                        this.end = this.resultcount
                        this.next = null
                    }
                })
            })

        },
        cancelSearch () {
            this.abortController.abort()
            this.start = this.end = 0
        },
        toggleAdvancedSearch() {
            this.showAdvanced = !this.showAdvanced
        }
    },
    components: {
        "simplesearchform": simplesearchform,
        "advancedsearchform": advancedsearchform,
        "searchresults": searchresults
    }
}
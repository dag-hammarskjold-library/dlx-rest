import { sortcomponent } from "./sort.js"
import { countcomponent } from "./count.js"
import basket from "../api/basket.js"
import user from "../api/user.js"
import { previewmodal } from "../modals/preview.js"
import { simplesearchform } from "./simplesearch.js"
import { advancedsearchform } from "./advancedsearch.js"

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
        <div v-if="showAdvanced"><advancedsearchform :collection="collection" :api_prefix="api_prefix" ref="advanced-search-form"></advancedsearchform></div>
        <div v-else><simplesearchform :collection="collection" :api_prefix="api_prefix" ref="simple-search-form" v-on:cancel="cancelSearch"></simplesearchform></div>
    </div>`,
    data: function() {
        let myUIBase = this.api_prefix.replace('/api/','')
        return {
            results: [],
            submitted: false,
            showSpinner: false,
            hidden_qs: ["NOT 089:B22 AND NOT 089:B23"],
            searchTerm: "",
            myBasket: {},
            selectedRecords: [],
            uibase: myUIBase,
            searchTime: 0,
            showAdvanced: false,
        }
    },
    created: function () {
        const urlParams = new URLSearchParams(window.location.search)
        const searchQuery = urlParams.get("q")
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
            // Do the search and update this.speeches
            // Can we channel both advanced search and simple search into this?
            let search_url = `${this.api_prefix}marc/bibs/records?search=${encodeURIComponent(this.qs)}&format=brief`
            console.log(search_url)
            let ui_url = `${this.api_prefix.replace("/api/","")}/records/speeches/review?q=${this.foundQ}`
            let startTime = Date.now()
            this.showSpinner = true
            fetch(search_url).then(response => {
                response.json().then(jsonData => {
                    this.results = jsonData.data
                }).then( () => {
                    this.submitted = true
                })
            }).then( () => {this.showSpinner = false}).then(() => {
                window.history.replaceState({},ui_url)
            }).then( () => {
                this.searchTime = (Date.now() - startTime) / 1000
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
        "advancedsearchform": advancedsearchform
    }
}
import { sortcomponent } from "./sort.js";
import { countcomponent } from "./count.js";
//import { previewmodal } from "../modals/preview.js"   // provided by #1293
import basket from "../api/basket.js";
import user from "../api/user.js";
import { Jmarc } from "../jmarc.mjs";

export let searchcomponent = {
    props: ["api_prefix"],
    template: `
    <div class="col-sm-8" id="app1" style="background:white">
        <nav class="navbar navbar-expand-lg navbar-light bg-white text-center">
            <div class="collapse navbar-collapse" id="advancedSearchToggle">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item"><a id="toggleSSLink" class="nav-link active" href="#" @click="toggleAdvancedSearch()">Simple Search</a></li>
                    <li class="nav-item"><a id="toggleASLink" class="nav-link" href="#" @click="toggleAdvancedSearch()">Advanced Search</a></li>
                </ul>
            </div>
        </nav>
        <div id="advanced-search"></div>
        <div id="simple-search">
            <form class="form-inline mr-auto col-lg-12" :action="action">
                <input v-if="params.search" id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :aria-label="'Search ' + collection + ' collection'" :value="params.search" @keyup="updateSearchQuery">
                <input v-else id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :placeholder="'Search ' + collection + ' collection'" aria-label="Search this collection" @keyup="updateSearchQuery">
                <input v-for="v,k in params" type="hidden" :id="k" :name="k" :value="v">
                <button class="btn btn-primary" type="submit" id="search-btn" value="Search">Search</button>
                <button class="btn btn-sm btn-default" type="button" value="Cancel search" title="Cancel" v-on:click="cancelSearch()">
                    <span>X</span>
                </button>
            </form>   
        </div>
        <div v-if="collection == 'auths'"></div>
        <!--<sortcomponent :uibase="foo" :collection="bar" :params="baz"></sortcomponent>-->
    </div>`,
    data: function () {
        return {
            collection: "bibs",
            hidden_qs: [],  // What's included in the API search url, but not in the browser's location bar
            searchTerm: null,
            params: [],
            myBasket: {}
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
        refreshBasket() {
            basket.getBasket(this.api_prefix).then( b => {
                this.myBasket = b
            })
        },
        toggleBasket: async function (e, recordId) {
            // Add items to/remove items from the basket
        },
        sendToBasket: function () {
            // sends selected records to basket and updates UI to reflect this
        },
        selectAll() {
            // Select all of the records on the screen, up to a maximum number
        },
        selectNone() {
            // Select none of the records on the screen
        },
        toggleSelect(e) {
            // Toggle the selection of a record using the individual checkbox
        },
        updateSearchQuery() {
            // Updates the search query visible in the location bar as the user types
            const url = new URL(window.location)
            url.searchParams.set("q", this.searchTerm)
            this.qs = [this.searchTerm, this.hidden_qs].join(" AND ")
            window.history.replaceState(null, "", url)
        },
        submitSearch: async function() {
            // Submit the search and update the list of search results
        },
        toggleAdvancedSearch() {
            // Toggle between advanced and simple search
        }
    },
    components: {
        // 'previewmodal': previewmodal,
        'sortcomponent': sortcomponent,
        'countcomponent': countcomponent
    }
}
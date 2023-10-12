import { sortcomponent } from "./search/sort.js";
import { countcomponent } from "./search/count.js";
import basket from "./api/basket.js";
import user from "./api/user.js";
import { previewmodal } from "./modals/preview.js";

export let speechreviewcomponent = {
    props: {
        api_prefix: {
            type: String,
            required: true
        }
    },
    template: `<div class="col pt-2" id="app1" style="background-color:white;">
    <div class="col text-center">
        <h1>Speech Review</h1>
        <form @submit.prevent="submitSearch">
            <label for="speechSearch">Search Speeches</label>
            <div class="input-group mb-3">
                <input id="speechSearch" type="text" class="form-control" aria-label="Search Speeches" @change="updateQs($event)" :value="foundQ">
                <div class="input-group-append">
                    <a class="btn btn-outline-secondary" type="button" @click="submitSearch">Submit</a>
                </div>
            </div>
        </form>
    </div>
    <div class="col">
        <div id="results-spinner" class="col d-flex justify-content-center" >
            <div class="spinner-border" role="status" v-show="showSpinner">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <div v-if="submitted">{{speeches.length}} results</div>
        <div v-if="speeches.length > 0">Sorting:<span class="mx-1" v-for="sc in sortColumns">[{{sc.column}}: {{sc.direction}}]</span></div>
        <table class="table table-sm table-striped table-hover" v-if="speeches.length > 0">
            <thead class="prevent-select">
                <tr>
                    <th scope="col"></th>
                    <th scope="col">#</th>
                    <th scope="col" @click="processSort($event, 'symbol')">Meeting Record (791)
                        <i data-target="symbol" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="symbol-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col" @click="processSort($event, 'date')">Date (992 or 269)
                        <i data-target="date" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="date-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col" @click="processSort($event, 'speaker')">Speaker (700 a)
                        <i data-target="speaker" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="speaker-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col" @click="processSort($event, 'speaker_country')">Speaker (700 g)
                        <i data-target="speaker_country" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="speaker_country-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col" @click="processSort($event, 'country_org')">Country/Organization (710 or 711)
                        <i data-target="country_org" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="country_org-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col">Agendas</th>
                    <th scope="col"></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(speech, index) in sortedSpeeches" :key="speech._id">
                    <td><input type="checkbox" :data-recordid="speech._id"></td>
                    <td>{{index + 1}}</td>
                    <td @click="togglePreview('bibs',speech._id)" title="Toggle Record Preview"><i class="fas fa-file mr-2"></i>{{speech.symbol}}</td>
                    <td>{{speech.date}}</td>
                    <td>{{speech.speaker}}</td>
                    <td>{{speech.speaker_country}}</td>
                    <td>{{speech.country_org}}</td>
                    <td title="Toggle Agenda View">
                        <i class="fas fa-file" @click="toggleAgendas($event, speech.agendas)"></i>
                    </td>
                    <td @click="toggleBasket">
                        <i v-if="speech.locked" :id="speech._id + '-basket'" class="fas fa-lock"></i>
                        <i v-else-if="speech.myBasket" :id="speech._id + '-basket'" class="fas fa-folder-minus"></i>
                        <i v-else :id="speech._id + '-basket'" class="fas fa-folder-plus"></i>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <div v-if="showAgendaModal" :agendas="agendas">
        <div class="modal fade" ref="modal">
            <div v-for="agenda in agendas">{{agenda}}</div>
        </div>
    </div>
    <previewmodal ref="previewmodal" :api_prefix="api_prefix"></previewmodal>
</div>`,
    data: function() {
        return {
            speeches: [],
            submitted: false,
            sortColumns: [],
            showAgendaModal: false,
            showSpinner: false,
            agendas: [],
            hidden_qs: ["089:B22"],
            qs: [],
            foundQ: [],
            myBasket: {}
        }
    },
    computed: {
        // This function performs multifield sort using the objects stored in the sortColumns array
        // What goes in the sortColumns array, in what order, and how it gets there is handled by processSort() below
        sortedSpeeches: function () {
            return this.speeches.sort( (a, b) => {
                // For each object in sortColumns, we want to perform the sort
                // Each object is a defined column that exists in the incoming data
                for (const i in this.sortColumns) {
                    const column = this.sortColumns[i].column
                    const direction = this.sortColumns[i].direction
                    // localeCompare() is the acutal comparison function that performs the sort
                    // It works on a broad range of text and can sort, e.g., 2 before 10, etc.
                    let comparison = a[column].localeCompare(b[column])
                    // And finally, this is how we change direction
                    if (direction == "desc") {
                        comparison *= -1
                    }
                    if (comparison !== 0) {
                        return comparison
                    }
                }
                return 0
            })
        }
    },
    created: function () {
        // If we already have search terms (e.g., from the URL), push them to our existing query string
        this.foundQ = new URLSearchParams(window.location.search).get("q")
        if (this.foundQ) {
            this.qs.push(this.foundQ)
        }
        // And submit the search
        this.showSpinner = false
        this.submitSearch()
    },
    methods: {
        updateQs(e) {
            this.qs = [this.hidden_qs, e.target.value].join(" AND ")
            this.foundQ = e.target.value
            let ui_url = `${this.api_prefix.replace("/api/","")}/records/speeches/review?q=${this.foundQ}`
            window.history.replaceState({},ui_url)
        },
        submitSearch() {
            // Do the search and update this.speeches
            let search_url = `${this.api_prefix}marc/bibs/records?search=${this.qs}&format=brief_speech&start=1&limit=50000`
            let ui_url = `${this.api_prefix.replace("/api/","")}/records/speeches/review?q=${this.foundQ}`
            this.showSpinner = true
            fetch(search_url).then(response => {
                response.json().then(jsonData => {
                    this.speeches = jsonData.data
                }).then( () => {
                    this.submitted = true
                    for (let s of this.speeches) {
                        // Is the item locked?
                        basket.itemLocked(this.api_prefix, "bibs", s._id).then( (lockState) => {
                            s.locked = lockState.locked
                            //console.log(s.locked)
                        })
                    }
                })
            }).then( () => {this.showSpinner = false}).then(() => {
                window.history.replaceState({},ui_url)
            })
        },
        processSort: function(e, column) {
            // reset sort indicators
            for (let i of document.getElementsByTagName("i")) {
                i.classList.replace("text-dark", "text-secondary")
            }
            // reset badges
            for (let b of document.getElementsByClassName("badge")) {
                b.innerText = "0"
            }
            // Figure out if we already have the indicated column in sortColumns
            let existingColumn = this.sortColumns.find((sc) => sc.column === column)
            if (existingColumn) {
                // The column exists, but are we sorting it alone?
                if (e.shiftKey) {
                    let direction = ""
                    existingColumn.direction == "asc" ? direction = "desc" : direction = "asc"
                    if (existingColumn.direction === direction) {
                        // This column and direction alreday exist in this.sortColumns, so we want to remove the object
                        this.sortColumns.splice(existingColumn)
                    } else {
                        // Otherwise we are changing the sort direction
                        existingColumn.direction = direction
                    }
                } else {                    
                    existingColumn.direction == "asc" ? existingColumn.direction = "desc" : existingColumn.direction = "asc"
                    this.sortColumns = [existingColumn]
                }
            } else {
                if (e.shiftKey) {
                    // There was no existing column, and we want to add this to our list of columns
                    this.sortColumns.push({column: column, direction: "asc"})
                } else {
                    // There was no existing column, and we want to make this our only sort column
                    this.sortColumns = [{column:column, direction:"asc"}]
                }
            }
            // Finally, go through the DOM and update the icons and badges according to the contents of sortColumns
            var idx = 1
            for (let sc of this.sortColumns) {
                for (let i of document.getElementsByTagName("i")) {
                    if (i.getAttribute("data-target") == sc.column) {
                        sc.direction === "desc" ? i.classList.replace("fa-sort-alpha-up", "fa-sort-alpha-down") : i.classList.replace("fa-sort-alpha-down", "fa-sort-alpha-up")
                        i.classList.replace("text-secondary", "text-dark")
                        let badge = document.getElementById(`${sc.column}-badge`)
                        badge.innerText = idx
                        idx++
                    }
                }
            }
        },
        toggleBasket: async function (e) {
            console.log("click")
        },
        togglePreview: async function (collection, speechId) {
            console.log("toggling record preview for",speechId)
            this.$refs.previewmodal.collection = collection
            this.$refs.previewmodal.recordId = speechId
            this.$refs.previewmodal.show()
        },
        toggleAgendas: function (e) {
            console.log("opening agenda preview")
            this.agendas = ["foo", "bar"]
            this.showAgendaModal = true
        },
        dismissPreview: function () {
            console.log("dismissing previews")
            for (let d of document.getElementsByClassName("preview")) {
                if (!d.classList.contains("hidden")) {
                    d.classList.toggle("hidden")
                }
            }
        },
    },
    components: {
        'sortcomponent': sortcomponent, 
        'countcomponent': countcomponent,
        'previewmodal': previewmodal
    }
}
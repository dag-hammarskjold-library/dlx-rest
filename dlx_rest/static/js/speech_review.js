import { sortcomponent } from "./search/sort.js";
import { countcomponent } from "./search/count.js";
import basket from "./api/basket.js";
import user from "./api/user.js";
import { previewmodal } from "./modals/preview.js";
import { agendamodal } from "./modals/agenda.js";
import { recordfilecomponent } from "./recordfiles.js";

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
                <input id="speechSearch" type="text" class="form-control" aria-label="Search Speeches" v-model="searchTerm" @keyup="updateSearchQuery">
                <div class="input-group-append">
                    <a v-if="searchTerm" class="btn btn-outline-secondary" type="button" @click="submitSearch">Submit</a>
                    <a v-else class="btn" style="color: lightgray" type="button" disabled>Submit</a>
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
        <div v-if="submitted">{{speeches.length}} results returned in {{searchTime}} seconds</div>
        <div v-if="speeches.length > 0" @click.prevent>
            Select 
            <a class="mx-1 result-link" href="#" @click="selectAll">All</a>
            <a class="mx-1 result-link" href="#" @click="selectNone">None</a>
            <a v-if="selectedRecords.length > 0" class="mx-1 result-link" href="#" @click="sendToBasket">Send Selected to Basket</a>
            <a v-else class="mx-1 result-link text-muted" href="#">Send Selected to Basket</a>
            <br>
            <div>Sorting:<span class="mx-1" v-for="sc in sortColumns">[{{sc.column}}: {{sc.direction}}]</span>
            <a class="ml-auto float-right result-link" :href="uibase + '/records/bibs/search?subtype=speech'">Speeches</a>
            </div>
        </div>
        <table class="table table-sm table-striped table-hover" v-if="speeches.length > 0">
            <thead class="prevent-select">
                <tr>
                    <th scope="col"></th>
                    <th scope="col">#</th>
                    <th scope="col" @click="processSort($event, 'symbol')">Meeting Record (791)
                        <i data-target="symbol" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="symbol-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col" @click="processSort($event, 'date')">Date (992)
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
                    <th scope="col">Files</th>
                    <th scope="col">Agendas</th>
                    <th scope="col"></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(speech, index) in sortedSpeeches" :key="speech._id" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" :class="{selected: speech.selected}">
                    <td>
                        <input v-if="speech.locked" type="checkbox" :data-recordid="speech._id" @change="toggleSelect($event, speech)" disabled>
                        <input v-else-if="speech.myBasket" type="checkbox" :data-recordid="speech._id" @change="toggleSelect($event, speech)" disabled>
                        <input v-else type="checkbox" :data-recordid="speech._id" @change="toggleSelect($event, speech)">
                    </td>
                    <td>{{index + 1}}</td>
                    <td @click="togglePreview('bibs',speech._id)" title="Toggle Record Preview"><i class="fas fa-file mr-2"></i>{{speech.symbol}}</td>
                    <td>{{speech.date}}</td>
                    <td>{{speech.speaker}}</td>
                    <td>{{speech.speaker_country}}</td>
                    <td>{{speech.country_org}}</td>
                    <td><recordfilecomponent :api_prefix="api_prefix" :record_id="speech._id" :desired_languages="['en','fr','es']" /></td>
                    <td title="Toggle Agenda View">
                        <i class="fas fa-file" @click="toggleAgendas($event, speech._id, speech.agendas)"></i>
                    </td>
                    <td>
                        <i v-if="speech.locked" :id="speech._id + '-basket'" class="fas fa-lock"></i>
                        <i v-else-if="speech.myBasket" :id="speech._id + '-basket'" class="fas fa-folder-minus" @click="toggleBasket($event, speech._id)"></i>
                        <i v-else :id="speech._id + '-basket'" class="fas fa-folder-plus" @click="toggleBasket($event, speech._id)"></i>
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
    <previewmodal ref="previewmodal" :api_prefix="api_prefix" collection_name="Speeches"></previewmodal>
    <agendamodal ref="agendamodal" :api_prefix="api_prefix"></agendamodal>
</div>`,
    style:`
        .selected {
            background-color: #70a9e1;
        }
    `,
    data: function () {
        let myUIBase = this.api_prefix.replace('/api/', '')
        return {
            speeches: [],
            submitted: false,
            sortColumns: [],
            showAgendaModal: false,
            showSpinner: false,
            agendas: [],
            searchTerm: "",
            myBasket: {},
            selectedRecords: [],
            uibase: myUIBase,
            searchTime: 0,
            isDragging: false,
            selectedRows: []
        }
    },
    computed: {
        // This function performs multifield sort using the objects stored in the sortColumns array
        // What goes in the sortColumns array, in what order, and how it gets there is handled by processSort() below
        sortedSpeeches: function () {
            return this.speeches.sort((a, b) => {
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
            basket.getBasket(this.api_prefix).then((b) => {
                this.myBasket = b
            })
        },
        updateSearchQuery() {
            const url = new URL(window.location)
            url.searchParams.set("q", this.searchTerm)
            window.history.replaceState(null, "", url)
        },
        async submitSearch() {
            if (!this.searchTerm) {
                window.alert("Search term required");
                return
            }

            this.speeches = []
            this.showSpinner = true
            const startTime = Date.now();
            const seenIds = []; // temporarily necessasry due to pagination bug https://github.com/dag-hammarskjold-library/dlx-rest/issues/1586
            let next = `${this.api_prefix}marc/bibs/records?search=${this.searchTerm}&subtype=speech&format=brief_speech`;

            while (1) {
                let records;

                await fetch(next).then(response => {
                    return response.json()
                }).then(json => {
                    next = json['_links']['_next']
                    records = json['data']
                }).catch(e => {
                    // todo: alert user there was an error
                    throw e
                });

                if (records.length === 0) {
                    break
                }

                records.forEach(record => {
                    if (!seenIds.includes(record._id)) {
                        seenIds.push(record._id);
                        this.speeches.push(record);
                    }
                });
            }

            this.searchTime = (Date.now() - startTime) / 1000;
            this.showSpinner = false;
            this.submitted = true;
            let ui_url = `${this.api_prefix.replace("/api/", "")}/records/speeches/review?q=${this.foundQ}`
            window.history.replaceState({}, ui_url);
        },
        toggleSelect(e, speech) {
            let recordId = e.target.dataset.recordid
            speech.selected = !speech.selected
            if (speech.selected) {
                this.selectedRecords.push({ "collection": "bibs", "record_id": recordId })
            } else {
                this.selectedRecords.splice(this.selectedRecords.indexOf({ "collection": "bibs", "record_id": recordId }), 1)
            }
        },
        selectAll() {
            this.speeches.forEach(speech => {
                let i = document.querySelector(`input[data-recordid="${speech._id}"]`)
                i.disabled ? i.checked = false : i.checked = true
                if (i.checked) {
                    this.selectedRecords.push({ "collection": "bibs", "record_id": speech._id })
                    speech.selected = true
                } else {
                    speech.selected = false
                }
            })
        },
        selectNone() {
            for (let i of document.querySelectorAll("input[type=checkbox]")) {
                i.checked = false
            }
            this.selectedRecords = []
            this.speeches.forEach(speech => {
                speech.selected = false
            })
            this.selectedRows = []
        },
        /* Click and drag to select records */
        // We only end up targeting <td> elements when these events happen 
        // so we have to target the parent element, which should be a <tr>
        handleMouseDown(e) {
            if (e.shiftKey) {
                this.isDragging = true
                if (!this.selectedRows.includes(e.target.parentElement)) {
                    this.selectedRows.push(e.target.parentElement)
                }
            }
        },
        handleMouseMove(e) {
            if (e.shiftKey && this.isDragging) {
                //e.target.parentElement.setAttribute("")
                //e.target.parentElement.style = "background-color: #70a9e1"
                e.target.parentElement.classList.add("selected")
                if (!this.selectedRows.includes(e.target.parentElement)) {
                    this.selectedRows.push(e.target.parentElement)
                }
            }
            
        },
        handleMouseUp(e) {
            if (e.shiftKey)
                {this.isDragging = false
                this.selectRows()
            }
        },
        selectRows() {
            const startIdx = this.speeches.indexOf(this.dragStart)
            const endIdx = this.speeches.indexOf(this.dragEnd)

            this.selectedRows.forEach(row => {
                let i = row.getElementsByTagName("input")[0]
                if (!i.disabled && !i.checked) {
                    i.click()
                }
            })
        },
        processSort: function (e, column) {
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
                    this.sortColumns.push({ column: column, direction: "asc" })
                } else {
                    // There was no existing column, and we want to make this our only sort column
                    this.sortColumns = [{ column: column, direction: "asc" }]
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
        sendToBasket() {
            /*  
            Several things need to happen here
            1. Send all the items to the basket that have checkmarks beside them
            2. Uncheck the checked items
            3. Disable the checkbox for each item sent to the basket
            4. Update the folder icon for each item sent to the basket
            5. Empty this.selectedRecords
            */
            basket.createItems(this.api_prefix, 'userprofile/my_profile/basket', JSON.stringify(this.selectedRecords)).then(() => {
                for (let record of this.selectedRecords) {
                    let checkbox = document.querySelector(`input[data-recordid="${record.record_id}"]`)
                    checkbox.checked = false
                    checkbox.disabled = true
                    let icon = document.querySelector(`i[id="${record.record_id}-basket"]`)
                    icon.classList.remove("fa-folder-plus")
                    icon.classList.add("fa-folder-minus")
                }
                this.selectedRecords = []
                this.speeches.forEach(speech => {
                    speech.selected = false
                })
                this.refreshBasket()
            })
        },
        toggleBasket: async function (e, speechId) {
            if (e.target.classList.contains("fa-folder-plus")) {
                // add to basket
                await basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', "bibs", speechId).then(() => {
                    let checkbox = document.querySelector(`input[data-recordid="${speechId}"]`)
                    checkbox.disabled = true
                    e.target.classList.remove("fa-folder-plus")
                    e.target.classList.add("fa-folder-minus")
                })
            } else {
                // remove from basket
                await basket.deleteItem(this.myBasket, "bibs", speechId).then(() => {
                    let checkbox = document.querySelector(`input[data-recordid="${speechId}"]`)
                    checkbox.disabled = false
                    e.target.classList.remove("fa-folder-minus")
                    e.target.classList.add("fa-folder-plus")
                })
            }
            this.refreshBasket()
        },
        togglePreview: async function (collection, speechId) {
            this.$refs.previewmodal.collection = collection
            this.$refs.previewmodal.recordId = speechId
            this.$refs.previewmodal.show()
        },
        toggleAgendas: function (e, speechId, agendas) {
            this.$refs.agendamodal.agendas = agendas
            this.$refs.agendamodal.recordId = speechId
            this.$refs.agendamodal.showModal = true
        },
        dismissPreview: function () {
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
        'previewmodal': previewmodal,
        'agendamodal': agendamodal,
        'recordfilecomponent': recordfilecomponent
    }
}
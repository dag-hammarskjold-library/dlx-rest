import { sortcomponent } from "./search/sort.js";
import { countcomponent } from "./search/count.js";
import basket from "./api/basket.js";
import user from "./api/user.js";
import { previewmodal } from "./modals/preview.js";
import { recordfilecomponent } from "./recordfiles.js";
import { advancedsearchcomponent } from "./advancedsearch.js"

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
    template: `<div class="col pt-2" id="app1" style="background-color:white;">
    <div class="col">
        <a href="" @click.prevent="mode='simpleSearch'">Simple Search</a>
        <a href="" @click.prevent="mode='advancedSearch'">Advanced Search</a>
    </div>
    <div class="col text-center" v-if="mode=='simpleSearch'">
        <form @submit.prevent="submitSearch">
            <label for="recordSearch">Search Records</label>
            <div class="input-group mb-3">
                <input id="recordSearch" type="text" class="form-control" aria-label="Search Records" v-model="searchTerm" @keyup="updateSearchQuery">
                <div class="input-group-append">
                    <a v-if="searchTerm" class="btn btn-outline-secondary" type="button" @click="submitSearch">Submit</a>
                    <a v-else class="btn" style="color: lightgray" type="button" disabled>Submit</a>
                </div>
            </div>
        </form>
    </div>
    <div class="col text-center" v-if="mode=='advancedSearch'">
        <advancedsearchcomponent></advancedsearchcomponent>
    </div>
    <div class="col">
        <div id="results-spinner" class="col d-flex justify-content-center" >
            <div class="spinner-border" role="status" v-show="showSpinner">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        <div v-if="submitted">{{records.length}} results returned in {{searchTime}} seconds</div>
        <div v-if="records.length > 0" @click.prevent>
            Select 
            <a class="mx-1 result-link" href="#" @click="selectAll">All</a>
            <a class="mx-1 result-link" href="#" @click="selectNone">None</a>
            <a v-if="selectedRecords.length > 0" class="mx-1 result-link" href="#" @click="sendToBasket">Send Selected to Basket</a>
            <a v-else class="mx-1 result-link text-muted" href="#">Send Selected to Basket</a>
            <br>
        </div>
        <table class="table table-sm table-striped table-hover" style="width:100%" v-if="records.length > 0">
            <tbody>
                <tr v-for="(record, index) in records" :key="record._id" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" :class="{selected: record.selected}">
                    
                    <td>
                        <input v-if="record.locked" type="checkbox" :data-recordid="record._id" @change="toggleSelect($event, record)" disabled>
                        <input v-else-if="record.myBasket" type="checkbox" :data-recordid="record._id" @change="toggleSelect($event, record)" disabled>
                        <input v-else type="checkbox" :data-recordid="record._id" @change="toggleSelect($event, record)">
                    </td>
                    <td>{{index + 1}}</td>
                    <td @click="togglePreview(collection,record._id)" title="Toggle Record Preview"><i class="fas fa-file mr-2"></i></td>
                    <td>
                        <div class="row">
                            <div class="col-sm">
                                <div v-if="collection != 'auths'">
                                    <a v-if="!record.locked" :id="'link-' + record._id" class="result-link" :href="uibase + '/editor?records=' + collection + '/' + record._id">{{record.title}}</a>
                                    <a v-else class="result-link" :id="'link-' + record._id" :href="uibase + '/records/' + collection + '/' + record._id">{{record.title}}</a>
                                    <countcomponent v-if="collection == 'auths'" :api_prefix="api_prefix" :recordId="record._id"></countcomponent>
                                    <br>
                                    {{[record["f099c"].length > 0 ? record["f099c"].join(', ') : false, record["symbol"], record["date"], record["types"].split("::")[record["types"].split("::").length - 1]].filter(Boolean).join(" | ")}}
                                </div>
                                <div v-else class="row" style="flex-wrap:inherit">
                                    <a v-if="!record.locked" :id="'link-' + record._id" class="result-link" :href="uibase + '/editor?records=' + collection + '/' + record._id" style="overflow-wrap:break-word">{{record.heading_tag}}: {{record.heading}}</a>
                                    <a v-else class="result-link" :id="'link-' + record._id" :href="uibase + '/records/' + collection + '/' + record._id" style="overflow-wrap:break-word">{{record.heading_tag}}: {{record.heading}}</a>
                                    <countcomponent v-if="collection == 'auths'" :api_prefix="api_prefix" :recordId="record._id"></countcomponent>
                                </div>
                                <div class="row" style="white-space:nowrap">
                                    {{record.second_line}}
                                </div>
                                <div class="row" v-for="agenda in record.agendas">
                                    <span class="ml-3">{{agenda}}</span>
                                </div>
                                <div class="row" v-for="val in record.f596">
                                    <span class="ml-3">{{val}}</span>
                                </div>
                                <div class="row" v-for="val in record.f520" style="white-space:nowrap">
                                    <span class="ml-3">{{val}}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="white-space:pre">
                            <recordfilecomponent v-if="collection !== 'auths'" :api_prefix="api_prefix" :record_id="record._id" :desired_languages="['ar','zh','en','fr','ru','es']" />
                        </div>
                    </td>
                    <td>
                        <i v-if="record.locked" :id="record._id + '-basket'" class="fas fa-lock"></i>
                        <i v-else-if="record.myBasket" :id="record._id + '-basket'" class="fas fa-folder-minus" @click="toggleBasket($event, record._id)"></i>
                        <i v-else :id="record._id + '-basket'" class="fas fa-folder-plus" @click="toggleBasket($event, record._id)"></i>
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
    <previewmodal ref="previewmodal" :api_prefix="api_prefix" collection_name="Records"></previewmodal>
</div>`,
    style:`
        .selected {
            background-color: #70a9e1;
        }
    `,
    data: function () {
        let myUIBase = this.api_prefix.replace('/api/', '')
        return {
            subtype: null,
            records: [],
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
            selectedRows: [],
            mode: "simpleSearch"
        }
    },
    computed: {
        // This function performs multifield sort using the objects stored in the sortColumns array
        // What goes in the sortColumns array, in what order, and how it gets there is handled by processSort() below
        sortedRecords: function () {
            return this.records.sort((a, b) => {
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

            this.records = []
            this.showSpinner = true
            const startTime = Date.now();
            const seenIds = []; // temporarily necessasry due to pagination bug https://github.com/dag-hammarskjold-library/dlx-rest/issues/1586
            let next = `${this.api_prefix}marc/${this.collection}/records?search=${this.searchTerm}&format=brief`;
            if (this.subtype) {
                next = `${this.api_prefix}marc/${this.collection}/records?search=${this.searchTerm}&subtype=${this.subtype ? this.subtype : ''}&format=brief_${this.subtype}`;
            }
            

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
                        this.records.push(record);
                    }
                });
            }

            this.searchTime = (Date.now() - startTime) / 1000;
            this.showSpinner = false;
            this.submitted = true;
            let ui_url = `${this.api_prefix.replace("/api/", "")}/records/${this.collection}/review?q=${this.foundQ}`
            window.history.replaceState({}, ui_url);
        },
        toggleSelect(e, record) {
            let recordId = e.target.dataset.recordid
            record.selected = !record.selected
            if (record.selected) {
                this.selectedRecords.push({ "collection": this.collection, "record_id": recordId })
            } else {
                this.selectedRecords.splice(this.selectedRecords.indexOf({ "collection": this.collection, "record_id": recordId }), 1)
            }
        },
        selectAll() {
            this.records.forEach(record => {
                let i = document.querySelector(`input[data-recordid="${record._id}"]`)
                i.disabled ? i.checked = false : i.checked = true
                if (i.checked) {
                    this.selectedRecords.push({ "collection": this.collection, "record_id": record._id })
                    record.selected = true
                } else {
                    record.selected = false
                }
            })
        },
        selectNone() {
            for (let i of document.querySelectorAll("input[type=checkbox]")) {
                i.checked = false
            }
            this.selectedRecords = []
            this.records.forEach(record => {
                record.selected = false
            })
            this.selectedRows = []
        },
        /* Click and drag to select records */
        // We only end up targeting <td> elements when these events happen 
        // so we have to target the parent element, which should be a <tr>
        handleMouseDown(e) {
            if (e.shiftKey) {
                this.isDragging = true
                const row = e.target.closest('tr')
                if (row && !this.selectedRows.includes(row)) {
                    this.selectedRows.push(row)
                }
            }
        },
        handleMouseMove(e) {
            if (e.shiftKey && this.isDragging) {
                const row = e.target.closest('tr')
                if (row) {
                    row.classList.add("selected")
                    if (!this.selectedRows.includes(row)) {
                        this.selectedRows.push(row)
                    }
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
            const startIdx = this.records.indexOf(this.dragStart)
            const endIdx = this.records.indexOf(this.dragEnd)

            this.selectedRows.forEach(row => {
                const input = row.querySelector("input[type=checkbox]")
                if (input && !input.disabled && !input.checked) {
                    input.click()
                } else {
                    row.classList.remove("selected")
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
                this.records.forEach(record => {
                    record.selected = false
                })
                this.refreshBasket()
            })
        },
        toggleBasket: async function (e, recordId) {
            if (e.target.classList.contains("fa-folder-plus")) {
                // add to basket
                await basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', this.collection, recordId).then(() => {
                    let checkbox = document.querySelector(`input[data-recordid="${recordId}"]`)
                    checkbox.disabled = true
                    e.target.classList.remove("fa-folder-plus")
                    e.target.classList.add("fa-folder-minus")
                })
            } else {
                // remove from basket
                await basket.deleteItem(this.myBasket, this.collection, recordId).then(() => {
                    let checkbox = document.querySelector(`input[data-recordid="${recordId}"]`)
                    checkbox.disabled = false
                    e.target.classList.remove("fa-folder-minus")
                    e.target.classList.add("fa-folder-plus")
                })
            }
            this.refreshBasket()
        },
        togglePreview: async function (collection, recordId) {
            this.$refs.previewmodal.collection = collection
            this.$refs.previewmodal.recordId = recordId
            this.$refs.previewmodal.show()
        },
        toggleAgendas: function (e, recordId, agendas) {
            this.$refs.agendamodal.agendas = agendas
            this.$refs.agendamodal.recordId = recordId
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
        'recordfilecomponent': recordfilecomponent,
        'advancedsearchcomponent': advancedsearchcomponent    
    }
}
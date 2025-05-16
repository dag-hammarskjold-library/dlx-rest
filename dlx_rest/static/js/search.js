import { sortcomponent } from "./search/sort.js";
import { countcomponent } from "./search/count.js";
import basket from "./api/basket.js";
import user from "./api/user.js";
import { previewmodal } from "./modals/preview.js";
import { recordfilecomponent } from "./recordfiles.js";

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
    template: `
    <div class="col pt-2" id="app1" style="background-color:white;">
        <div class="col">
            <a class="result-link" href="" @click.prevent="mode='simpleSearch'">Simple Search</a>
            <a class="result-link" href="" @click.prevent="mode='advancedSearch'">Advanced Search</a>
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
            <div class="input-group-append">
                <a v-if="searchTerm" class="btn btn-outline-secondary" type="button" @click="submitSearch">Submit</a>
                <a v-else class="btn" style="color: lightgray" type="button" disabled>Submit</a>
            </div>
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
            mode: "simpleSearch",
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
            searchFields: [],
            searchTypes: [
                { 'name': 'All of the words:', 'value': 'all' },
                { 'name': 'Any of the words:', 'value': 'any' },
                { 'name': 'Exact phrase:', 'value': 'exact' },
                { 'name': 'Partial phrase:', 'value': 'partial' },
                { 'name': 'Regular expression:', 'value': 'regex' },
            ],
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
    created: async function () {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get("q");
        //this.mode = urlParams.get("mode") || "simpleSearch";
        
        if (searchQuery) {
            this.searchTerm = searchQuery;
            //if (this.mode === "advancedSearch") {
            this.parseSearchTerm();
            //}
            this.submitSearch();
        }

        this.subtype = urlParams.get("subtype") ? urlParams.get("subtype") : ''
        this.refreshBasket()
        let logicalFieldsUrl = `${this.api_prefix}marc/${this.collection}?subtype=${this.subtype}`
        await fetch(logicalFieldsUrl).then(response => {
            return response.json()
        }).then(json => {
            console.log(json)
            this.searchFields = json["data"]["logical_fields"]
            
        })
    },
    methods: {
        async refreshBasket() {
            basket.getBasket(this.api_prefix).then((b) => {
                this.myBasket = b
            })
        },
        parseSearchTerm() {
            if (!this.searchTerm) return;
            
            // Split the search term into parts based on logical operators
            const parts = this.searchTerm.split(/\s+(AND|OR|AND NOT|OR NOT)\s+/);
            
            for (let i = 0; i < parts.length; i += 2) {
                const part = parts[i];
                const connector = parts[i + 1];
                const position = Math.floor(i / 2) + 1;
                
                // Parse field:value pattern
                const fieldMatch = part.match(/(\w+):'([^']+)'/);
                if (fieldMatch) {
                    this.advancedParams[`searchField${position}`] = fieldMatch[1];
                    this.advancedParams[`searchTerm${position}`] = fieldMatch[2];
                    this.advancedParams[`searchType${position}`] = 'exact';
                } else {
                    this.advancedParams[`searchTerm${position}`] = part.replace(/['"]/g, '');
                    this.advancedParams[`searchType${position}`] = part.includes('"') ? 'exact' : 'all';
                }
                
                if (connector) {
                    this.advancedParams[`searchConnector${position}`] = connector;
                }
            }
            
            // Update UI elements
            if (this.mode == 'advancedSearch') {
                this.updateAdvancedSearchUI();
            }
        },
        updateAdvancedSearchUI() {
            // Update button text for each row
            for (let i = 1; i <= 3; i++) {
                const type = this.advancedParams[`searchType${i}`];
                const typeObj = this.searchTypes.find(t => t.value === type);
                if (typeObj) {
                    document.getElementById(`searchType${i}`).innerText = typeObj.name;
                }
                
                const field = this.advancedParams[`searchField${i}`];
                if (field && field !== 'any') {
                    document.getElementById(`searchField${i}`).innerText = field;
                }
                
                const connector = this.advancedParams[`searchConnector${i}`];
                if (connector) {
                    document.getElementById(`searchConnector${i}`).innerText = connector;
                }
            }
        },
        buildSearchQuery() {
            const parts = [];
            
            for (let i = 1; i <= 3; i++) {
                const term = this.advancedParams[`searchTerm${i}`];
                if (!term) continue;
                
                let queryPart = '';
                const field = this.advancedParams[`searchField${i}`];
                const type = this.advancedParams[`searchType${i}`];
                
                if (field && field !== 'any') {
                    // Handle field-specific search
                    queryPart = `${field}:'${term}'`;
                } else {
                    // Handle general search based on type
                    switch (type) {
                        case 'exact':
                            queryPart = `"${term}"`;
                            break;
                        case 'all':
                            queryPart = term.split(' ').join(' AND ');
                            break;
                        case 'any':
                            queryPart = term.split(' ').join(' OR ');
                            break;
                        default:
                            queryPart = term;
                    }
                }
                
                parts.push(queryPart);
                
                // Add connector if not last part and has a term
                if (i < 3 && this.advancedParams[`searchTerm${i + 1}`]) {
                    parts.push(this.advancedParams[`searchConnector${i}`]);
                }
            }
            
            return parts.join(' ');
        },
        submitAdvancedSearch() {
            this.searchTerm = this.buildSearchQuery();
            this.updateSearchQuery();
            this.submitSearch();
        },
        updateSearchQuery() {
            const url = new URL(window.location);
            url.searchParams.set("q", this.searchTerm);
            //url.searchParams.set("mode", this.mode);
            this.parseSearchTerm()
            window.history.replaceState(null, "", url);
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
    }
}
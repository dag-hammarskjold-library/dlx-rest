import { sortcomponent } from "./search/sort.js";
import { countcomponent } from "./search/count.js";
import basket from "./api/basket.js";
import user from "./api/user.js";
import { readonlyrecord } from "./readonly_record.js";
import { agendamodal } from "./modals/agenda.js";
import { recordfilecomponent } from "./recordfiles.js";

// --- DRY selection and search logic ---
function buildSpeechSearchUrl(api_prefix, searchTerm) {
    return `${api_prefix}marc/bibs/records?search=${encodeURIComponent(searchTerm)}&subtype=speech&format=brief_speech`;
}

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
            <div class="mb-2">
                <button class="btn btn-outline-secondary btn-sm" @click.prevent="selectAll">Select All</button>
                <button class="btn btn-outline-secondary btn-sm" @click.prevent="selectNone">Select None</button>
                <button v-if="selectedRecords.length > 0" class="btn btn-primary btn-sm ml-2" @click.prevent="sendToBasket">
                    Send {{selectedRecords.length}} to Basket
                </button>
            </div>
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
                <tr v-for="(speech, index) in sortedSpeeches" 
                    :key="speech._id" 
                    @mousedown="handleMouseDown($event, speech, index)" 
                    @mousemove="handleMouseMove($event, speech, index)" 
                    @mouseup="handleMouseUp($event)"
                    :class="{selected: speech.selected}">
                    <td></td>
                    <td>{{index + 1}}</td>
                    <td> 
                        <!-- Preview -->
                        <div>
                            <i v-if="previewOpen === speech._id" class="fas fa-window-close preview-toggle" v-on:click="togglePreview($event, speech._id)" title="Preview record"></i>
                            <i v-else class="fas fa-file preview-toggle mr-2" v-on:click="togglePreview($event, speech._id)" title="Preview record"></i>
                            <readonlyrecord v-if="previewOpen === speech._id" :api_prefix="api_prefix" :collection="collection" :record_id="speech._id" class="record-preview"></readonlyrecord>
                            {{speech.symbol}}
                        </div>
                    </td>
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
            isSearching: false,
            isDragging: false,
            dragStartIdx: null,
            dragEndIdx: null,
            previewOpen: null,
            collection: "bibs"
        }
    },
    computed: {
        sortedSpeeches: function () {
            return this.speeches.slice().sort((a, b) => {
                for (const i in this.sortColumns) {
                    const column = this.sortColumns[i].column
                    const direction = this.sortColumns[i].direction
                    let comparison = (a[column] || '').localeCompare(b[column] || '')
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
        getSelectableRecords() {
            return this.speeches;
        },
        async refreshBasket() {
            this.myBasket = await basket.getBasket(this.api_prefix);
            this.speeches.forEach(r => {
                r.myBasket = basket.contains("bibs", r._id, this.myBasket);
            });
        },
        updateSearchQuery() {
            const url = new URL(window.location)
            url.searchParams.set("q", this.searchTerm)
            window.history.replaceState(null, "", url)
        },
        async submitSearch() {
            if (!this.searchTerm) {
                window.alert("Search term required");
                return;
            }
            this.speeches = [];
            this.showSpinner = true;
            this.isSearching = true;
            this.selectedRecords = [];
            const startTime = Date.now();
            const seenIds = [];
            let next = buildSpeechSearchUrl(this.api_prefix, this.searchTerm);

            try {
                while (1) {
                    let records;
                    const response = await fetch(next);
                    if (!response.ok) throw new Error("Search failed");
                    const json = await response.json();
                    next = json['_links']['_next'];
                    records = json['data'];
                    if (!records || records.length === 0) break;
                    records.forEach(record => {
                        if (!seenIds.includes(record._id)) {
                            seenIds.push(record._id);
                            this.speeches.push(record);
                        }
                    });
                }
                // Update basket status for all records
                await this.refreshBasket();
            } catch (e) {
                window.alert(e.message || "Search failed");
            } finally {
                this.searchTime = ((Date.now() - startTime) / 1000).toFixed(1);
                this.showSpinner = false;
                this.isSearching = false;
                this.submitted = true;
            }
        },
        selectAll() {
            this.speeches.forEach(speech => {
                if (!speech.myBasket && !speech.locked) {
                    speech.selected = true;
                    if (!this.selectedRecords.some(r => r.record_id === speech._id && r.collection === "bibs")) {
                        this.selectedRecords.push({ collection: "bibs", record_id: speech._id });
                    }
                }
            });
        },
        selectNone() {
            this.speeches.forEach(speech => {
                speech.selected = false;
            });
            this.selectedRecords = [];
        },
        handleMouseDown(e, speech, idx) {
            if (
                e.target.classList.contains('preview-toggle') ||
                e.target.closest('.preview-toggle') ||
                e.target.classList.contains('folder-plus') ||
                e.target.classList.contains('folder-minus') ||
                e.target.classList.contains('fa-lock')
            ) {
                return;
            }
            if (e.button !== 0) return;
            this.isDragging = true;
            this.dragStartIdx = idx;
            this.dragEndIdx = idx;
            this.updateDragSelection();
            document.addEventListener('mouseup', this.cancelDrag);
        },
        handleMouseMove(e, speech, idx) {
            if (!this.isDragging) return;
            this.dragEndIdx = idx;
            this.updateDragSelection();
        },
        handleMouseUp(e) {
            if (this.isDragging) {
                this.isDragging = false;
                this.dragStartIdx = null;
                this.dragEndIdx = null;
                document.removeEventListener('mouseup', this.cancelDrag);
            }
        },
        cancelDrag() {
            this.isDragging = false;
            this.dragStartIdx = null;
            this.dragEndIdx = null;
            document.removeEventListener('mouseup', this.cancelDrag);
        },
        updateDragSelection() {
            let arr = this.speeches;
            let [start, end] = [this.dragStartIdx, this.dragEndIdx].sort((a, b) => a - b);
            arr.forEach((r, i) => {
                if (!r.myBasket && !r.locked) r.selected = (i >= start && i <= end);
                if (r.selected) {
                    if (!this.selectedRecords.some(x => x.record_id === r._id && x.collection === "bibs")) {
                        this.selectedRecords.push({ collection: "bibs", record_id: r._id });
                    }
                } else {
                    const idx = this.selectedRecords.findIndex(x => x.record_id === r._id && x.collection === "bibs");
                    if (idx !== -1) this.selectedRecords.splice(idx, 1);
                }
            });
        },
        async sendToBasket(e) {
            if (e) e.preventDefault();
            const items = this.selectedRecords.slice(0, 100);
            if (items.length > 0) {
                await basket.createItems(this.api_prefix, 'userprofile/my_profile/basket', JSON.stringify(items));
                await this.refreshBasket();
                this.selectedRecords = [];
                this.speeches.forEach(r => {
                    r.myBasket = basket.contains("bibs", r._id, this.myBasket);
                    r.selected = false;
                });
            }
        },
        async toggleBasket(e, speechId) {
            let speech = this.speeches.find(r => r._id === speechId);
            if (!speech) return;
            if (!speech.myBasket) {
                await basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', "bibs", speechId);
                speech.myBasket = true;
                speech.selected = false;
            } else {
                await basket.deleteItem(this.myBasket, "bibs", speechId);
                speech.myBasket = false;
                speech.selected = false;
            }
            await this.refreshBasket();
        },
        togglePreview(e, speechId) {
            console.log("toggling preview for", speechId)
            if (this.previewOpen === speechId) {
                this.previewOpen = null;
            } else {
                this.previewOpen = speechId;
            }
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
        processSort: function (e, column) {
            for (let i of document.getElementsByTagName("i")) {
                i.classList.replace("text-dark", "text-secondary")
            }
            for (let b of document.getElementsByClassName("badge")) {
                b.innerText = "0"
            }
            let existingColumn = this.sortColumns.find((sc) => sc.column === column)
            if (existingColumn) {
                if (e.shiftKey) {
                    let direction = ""
                    existingColumn.direction == "asc" ? direction = "desc" : direction = "asc"
                    if (existingColumn.direction === direction) {
                        this.sortColumns.splice(existingColumn)
                    } else {
                        existingColumn.direction = direction
                    }
                } else {
                    existingColumn.direction == "asc" ? existingColumn.direction = "desc" : existingColumn.direction = "asc"
                    this.sortColumns = [existingColumn]
                }
            } else {
                if (e.shiftKey) {
                    this.sortColumns.push({ column: column, direction: "asc" })
                } else {
                    this.sortColumns = [{ column: column, direction: "asc" }]
                }
            }
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
        }
    },
    components: {
        'sortcomponent': sortcomponent,
        'countcomponent': countcomponent,
        'readonlyrecord': readonlyrecord,
        'agendamodal': agendamodal,
        'recordfilecomponent': recordfilecomponent
    }
}
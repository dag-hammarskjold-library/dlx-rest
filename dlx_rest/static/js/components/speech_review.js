import { sortcomponent } from "./sort.js";
import { countcomponent } from "./count.js";
import basket from "../api/basket.js";
import user from "../api/user.js";
import { readonlyrecord } from "./readonly_record.js";
import { recordfilecomponent } from "./recordfiles.js";
import { agendamodal } from "./agenda.js";

export let speechreviewcomponent = {
    props: {
        api_prefix: { type: String, required: true }
    },
    template: `
    <div class="col pt-2" id="app1" style="background-color:white;">
        <div class="col mb-2 d-flex justify-content-between">
            <div>
                <h1>Speech Review</h1>
            </div>
            <div class="d-flex align-items-center">
                <a class="result-link px-3" :href="uibase + '/records/bibs/search?subtype=speech'">Speeches</a>
            </div>
        </div>
        <div class="col text-center">
            <form @submit.prevent="submitSearch">
                <div class="input-group mb-3">
                    <input id="speechSearch" type="text" class="form-control" aria-label="Search Speeches" v-model="searchTerm" @keyup="updateSearchQuery">
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="submit" :disabled="!searchTerm">Submit</button>
                    </div>
                </div>
            </form>
        </div>
        <div v-if="searchError" class="alert alert-danger alert-dismissible fade show" role="alert">
            {{searchError}}
            <button type="button" class="close" @click="searchError = null">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="results-container col">
            <div v-if="showSpinner" class="text-center mt-3">
                <div class="spinner-border mr-2" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <button class="btn btn-danger btn-sm" @click="cancelSearch">
                    Cancel Search
                </button>
            </div>
            <div class="controls-header mb-3" v-if="speeches.length > 0">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <div class="btn-group mr-3">
                            <button class="btn btn-outline-secondary btn-sm" @click.prevent="selectAll">Select All</button>
                            <button class="btn btn-outline-secondary btn-sm" @click.prevent="selectNone">Select None</button>
                        </div>
                        <button v-if="selectedRecords.length > 0" 
                                class="btn btn-primary btn-sm" 
                                @click.prevent="sendToBasket">
                            Send {{selectedRecords.length}} to Basket
                        </button>
                        <button class="btn btn-danger btn-sm ml-2"
                                @click.prevent="confirmDelete"
                                v-if="canDelete">
                            Delete {{selectedRecords.length}} Records
                        </button>
                    </div>
                    <div v-if="isSearching || submitted">
                        {{resultCount}} results found{{isSearching ? ' so far' : ''}} 
                        in {{searchTime.toFixed(1)}} seconds{{isSearching ? '...' : ''}}
                    </div>
                </div>
            </div>
            <div v-if="speeches.length > 0">
                Sorting:<span class="mx-1" v-for="sc in sortColumns">[{{sortLabel(sc.column)}}: {{sc.direction}}]</span>
                <button class="btn btn-sm btn-outline-secondary ml-2" @click="clearSort">Clear Sort</button>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover w-100" v-if="speeches.length > 0">
                    <thead>
                        <tr>
                            <th></th>
                            <th style="width:30px"></th>
                            <th style="width:50px">#</th>
                            <template>
                                <th v-for="col in sortableColumns" :key="col.key">
                                    <div class="th-col">
                                        <span
                                            class="sort-btn"
                                            @click="processSort($event, col.key)"
                                            :aria-label="'Sort by ' + col.label"
                                            type="button"
                                            tabindex="0"
                                        >
                                            <span class="header-label">{{ col.label }}</span>
                                            <i :class="sortIconClass(col.key)" :data-target="col.key"></i>
                                            <span class="badge badge-pill badge-dark">{{ sortBadge(col.key) }}</span>
                                        </span>
                                    </div>
                                </th>
                            </template>
                            <th>Files</th>
                            <th>Agendas</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(speech, index) in sortedSpeeches">
                            <tr
                                :key="speech._id"
                                :class="{selected: speech.selected}"
                                @mousedown="handleMouseDown($event, speech, index)" 
                                @mousemove="handleMouseMove($event, speech, index)" 
                                @mouseup="handleMouseUp($event)">
                                <td></td>
                                <td>
                                    <i v-if="speech.locked" 
                                        :id="speech._id + '-basket'" 
                                        class="fas fa-lock"></i>
                                    <i v-else-if="speech.myBasket" 
                                        :id="speech._id + '-basket'" 
                                        class="fas fa-folder-minus" 
                                        @click="toggleBasket($event, speech._id)"></i>
                                    <i v-else 
                                        :id="speech._id + '-basket'" 
                                        class="fas fa-folder-plus" 
                                        @click="toggleBasket($event, speech._id)"></i>
                                </td>
                                <td>{{index + 1}}</td>
                                <td>
                                    <div>
                                        <i v-if="previewOpen === speech._id" class="fas fa-window-close preview-toggle mr-2" v-on:click="togglePreview($event, speech._id)" title="Preview record"></i>
                                        <i v-else class="fas fa-file preview-toggle mr-2" v-on:click="togglePreview($event, speech._id)" title="Preview record"></i>
                                        {{speech.symbol}}
                                    </div>
                                </td>
                                <td>{{speech.date}}</td>
                                <td>{{speech.speaker}}</td>
                                <td>{{speech.speaker_country}}</td>
                                <td>{{speech.country_org}}</td>
                                <td>
                                    <recordfilecomponent :api_prefix="api_prefix" :record_id="speech._id" :desired_languages="['en','fr','es']" />
                                </td>
                                <td title="Toggle Agenda View">
                                    <i class="fas fa-file" @click="toggleAgendas($event, speech._id, speech.agendas)"></i>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="col">
            <div v-if="!isSearching && submitted && speeches.length === 0" class="text-center mt-3">
                <p class="text-muted">No results found for {{searchTerm}}.</p>
                <p class="text-muted">Try changing your search terms.</p>
            </div>
        </div>
        <agendamodal ref="agendamodal" :api_prefix="api_prefix"></agendamodal>
        <!-- Preview modal -->
        <div v-if="previewOpen"
            class="modal fade show d-block"
            tabindex="-1"
            style="background:rgba(0,0,0,0.3)"
            @mousedown.self="togglePreview($event, previewOpen)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" @mousedown.stop>
                    <div class="modal-header">
                        <h5 class="modal-title">Record Preview</h5>
                        <button type="button" class="close" @click="togglePreview($event, previewOpen)"><span>&times;</span></button>
                    </div>
                    <div class="modal-body">
                        <readonlyrecord
                            :api_prefix="api_prefix"
                            collection="bibs"
                            :record_id="previewOpen"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    style: `
        .selected { background-color: #70a9e1; }
        .controls-header {
            background: white;
            padding: 1rem;
            border-bottom: 1px solid #dee2e6;
        }
        .results-container { position: relative; }
    `,
    data: function () {
        let myUIBase = this.api_prefix.replace('/api/', '');
        return {
            speeches: [],
            submitted: false,
            showSpinner: false,
            searchTerm: "",
            myBasket: {},
            myProfile: null,
            selectedRecords: [],
            uibase: myUIBase,
            searchTime: 0,
            resultCount: 0,
            isSearching: false,
            isDragging: false,
            dragStartIdx: null,
            dragEndIdx: null,
            previewOpen: null,
            sortColumns: [
                { column: "date", direction: "desc" }
            ],
            searchError: null,
            abortController: null,
            sortableColumns: [
                { key: "symbol", label: "Meeting Record (791)" },
                { key: "date", label: "Date (992)" },
                { key: "speaker", label: "Speaker (700 a)" },
                { key: "speaker_country", label: "Speaker (700 g)" },
                { key: "country_org", label: "Country/Organization (710 or 711)" }
            ],
        }
    },
    computed: {
        sortedSpeeches: function () {
            return this.speeches.slice().sort((a, b) => {
                for (const i in this.sortColumns) {
                    const column = this.sortColumns[i].column;
                    const direction = this.sortColumns[i].direction;
                    let comparison = (a[column] || '').localeCompare(b[column] || '');
                    if (direction == "desc") {
                        comparison *= -1;
                    }
                    if (comparison !== 0) {
                        return comparison;
                    }
                }
                return 0;
            });
        },
        // Returns the badge number for a column, or 0 if not sorted
        sortBadge() {
            return (col) => {
                const idx = this.sortColumns.findIndex(sc => sc.column === col);
                return idx !== -1 ? idx + 1 : 0;
            };
        },
        // Returns the icon class for a column
        sortIconClass() {
            return (col) => {
                const sc = this.sortColumns.find(sc => sc.column === col);
                if (!sc) return "fas fa-sort-alpha-up text-secondary";
                return [
                    "fas",
                    sc.direction === "desc" ? "fa-sort-alpha-down" : "fa-sort-alpha-up",
                    "text-dark"
                ].join(" ");
            };
        },

        canDelete() {
            if (!user.hasPermission(this.myProfile, 'batchDelete')) {
                return false
            }
            return this.selectedRecords.length > 0 && 
                !this.selectedRecords.some(r => r.locked) 
        },
    },
    created: async function () {
        this.myProfile = await user.getProfile(this.api_prefix, 'my_profile')
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get("q");
        if (searchQuery) {
            this.searchTerm = searchQuery;
            this.updateSearchQuery();
            this.submitSearch();
        }
        this.refreshBasket();
    },
    methods: {
        async refreshBasket() {
            this.myBasket = await basket.getBasket(this.api_prefix);
            this.speeches.forEach(r => {
                r.myBasket = basket.contains("bibs", r._id, this.myBasket);
            });
        },
        updateSearchQuery() {
            const url = new URL(window.location);
            url.searchParams.set("q", this.searchTerm);
            window.history.replaceState(null, "", url);
        },
        async submitSearch() {
            if (!this.searchTerm) {
                this.searchError = "Search term required";
                return;
            }
            if (this.abortController) {
                this.abortController.abort();
            }
            this.abortController = new AbortController();

            this.speeches = [];
            this.showSpinner = true;
            this.isSearching = true;
            this.selectedRecords = [];
            this.resultCount = 0;
            const startTime = Date.now();
            const seenIds = [];
            let next = `${this.api_prefix}marc/bibs/records?search=${encodeURIComponent(this.searchTerm)}&subtype=speech&format=brief_speech`;
            const timeUpdater = setInterval(() => {
                this.searchTime = ((Date.now() - startTime) / 1000)
            }, 100);

            try {
                while (1) {
                    let records;
                    try {
                        const response = await fetch(next, {
                            signal: this.abortController.signal,
                        });
                        if (!response.ok) throw new Error("Search failed");
                        const json = await response.json();
                        next = json['_links'] && json['_links']['_next'];
                        records = json['data'];
                    } catch (e) {
                        if (e.name === 'AbortError') {
                            throw new Error("Search cancelled by user");
                        }
                        throw e;
                    }
                    if (!records || records.length === 0) break;
                    records.forEach(record => {
                        if (!seenIds.includes(record._id)) {
                            seenIds.push(record._id);
                            this.speeches.push(record);
                            this.resultCount++;
                        }
                    });
                }
                await this.refreshBasket();
            } catch (e) {
                if (e.message === "Search cancelled by user") {
                    // Optionally handle cancellation UI
                } else {
                    window.alert(e.message || "Search failed");
                }
                this.searchError = e.message;
            } finally {
                clearInterval(timeUpdater);
                this.searchTime = ((Date.now() - startTime) / 1000);
                this.showSpinner = false;
                this.isSearching = false;
                this.submitted = true;
                this.abortController = null;
            }
        },
        cancelSearch() {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
                this.showSpinner = false;
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
            // Only left mouse button
            if (e.button !== 0) return;
            // Ignore clicks on interactive elements
            if (
                e.target.closest('.preview-toggle') ||
                e.target.closest('.fa-folder-plus') ||
                e.target.closest('.fa-folder-minus') ||
                e.target.closest('.fa-lock')
            ) {
                return;
            }
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
            // Use sortedSpeeches for index mapping
            let arr = this.sortedSpeeches;
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
        togglePreview(event, recordId) {
            if (this.previewOpen === recordId) {
                this.previewOpen = false;
            } else if (recordId) {
                this.previewOpen = recordId;
            }

            return
        },
        toggleAgendas: function (e, speechId, agendas) {
            this.$refs.agendamodal.agendas = agendas;
            this.$refs.agendamodal.recordId = speechId;
            this.$refs.agendamodal.showModal = true;
        },
        processSort(e, column) {
            let existingColumn = this.sortColumns.find((sc) => sc.column === column);
            if (existingColumn) {
                if (e.shiftKey) {
                    // Remove if already present with same direction, otherwise toggle
                    existingColumn.direction = existingColumn.direction === "asc" ? "desc" : "asc";
                } else {
                    // Single sort
                    existingColumn.direction = existingColumn.direction === "asc" ? "desc" : "asc";
                    this.sortColumns = [existingColumn];
                }
            } else {
                if (e.shiftKey) {
                    this.sortColumns.push({ column: column, direction: "asc" });
                } else {
                    this.sortColumns = [{ column: column, direction: "asc" }];
                }
            }
        },
        clearSort() {
            this.sortColumns = [{ column: "date", direction: "desc" }];
        },
        sortLabel(col) {
            const map = {
            symbol: "Meeting Record",
            date: "Date",
            speaker: "Speaker",
            speaker_country: "Speaker Country",
            country_org: "Country/Org"
            };
            return map[col] || col;
        },
        async executeDelete() {
            if (!user.hasPermission(this.myProfile, 'batchDelete')) return;
            this.isDeleting = true;
            const successfulDeletes = new Set();
            const failedDeletes = new Set();

            try {
                // Process all deletes
                for (const record of this.selectedRecords) {
                    try {
                        const response = await fetch(
                            `${this.api_prefix}marc/${record.collection}/records/${record.record_id}`, 
                            {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }
                        );

                        if (response.ok) {
                            successfulDeletes.add(record.record_id);
                        } else {
                            failedDeletes.add(record.record_id);
                        }
                    } catch (error) {
                        console.error(`Error deleting record ${record.record_id}:`, error);
                        failedDeletes.add(record.record_id);
                    }
                }

                // Remove successfully deleted records from the display
                this.records = this.records.filter(record => {
                    // Check if this record's ID is in the successfulDeletes set
                    return !successfulDeletes.has(record._id.toString());
                });

                // Update result count
                this.resultCount = this.records.length;

                // Show results message
                if (failedDeletes.size > 0) {
                    alert(`Successfully deleted ${successfulDeletes.size} records.\nFailed to delete ${failedDeletes.size} records.`);
                } else {
                    alert(`Successfully deleted ${successfulDeletes.size} records.`);
                }

                // Clear selection
                this.selectNone();
                
            } finally {
                this.isDeleting = false;
                $('#deleteConfirmModal').modal('hide');
            }
        }
    },
    components: {
        'countcomponent': countcomponent,
        'readonlyrecord': readonlyrecord,
        'recordfilecomponent': recordfilecomponent,
        'agendamodal': agendamodal
    }
}
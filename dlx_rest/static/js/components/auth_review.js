import { sortcomponent } from "./sort.js";
import { countcomponent } from "./count.js";
import basket from "../api/basket.js";
import user from "../api/user.js";
import { readonlyrecord } from "./readonly_record.js";

export let authreviewcomponent = {
    props: {
        api_prefix: { type: String, required: true }
    },
    template: `
    <div class="col pt-2" id="app1" style="background-color:white;">
        <div class="col mb-2 d-flex justify-content-between">
            <div>
                <h1>Auth Review</h1>
            </div>
            <div class="d-flex align-items-center">
                <a class="result-link px-3" :href="uibase + '/records/auths/search'">Auths</a>
            </div>
        </div>
        <div class="col text-center">
            <form @submit.prevent="submitSearch">
                <div class="input-group mb-3">
                    <input id="authDate" type="date" class="form-control" aria-label="Search Auths by Date" v-model="searchDate" @change="updateSearchQuery">
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="submit" :disabled="!searchDate">Submit</button>
                    </div>
                </div>
            </form>
        </div>
        <sortcomponent v-if="auths.length > 0"
            :uibase="uibase"
            collection="auths"
            :search-term="searchDate"
            :current-sort="currentSort"
            :current-direction="currentDirection"
            @sort-changed="handleSortChange"
            @direction-changed="handleDirectionChange">
        </sortcomponent>
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
            <div class="controls-header mb-3" v-if="auths.length > 0">
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
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover w-100" v-if="auths.length > 0">
                    <thead>
                        <tr>
                            <th></th>
                            <th style="width: 30px"></th>
                            <th style="width: 50px">#</th>
                            <th>Heading &amp; Details</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(auth, index) in auths">
                            <tr
                                :key="auth._id"
                                :class="{selected: auth.selected}"
                                @mousedown="handleMouseDown($event, auth, index)" 
                                @mousemove="handleMouseMove($event, auth, index)" 
                                @mouseup="handleMouseUp($event)">
                                <td></td>
                                <td>
                                    <i v-if="auth.locked" 
                                        :id="auth._id + '-basket'" 
                                        class="fas fa-lock"></i>
                                    <i v-else-if="auth.myBasket" 
                                        :id="auth._id + '-basket'" 
                                        class="fas fa-folder-minus" 
                                        @click="toggleBasket($event, auth._id)"></i>
                                    <i v-else 
                                        :id="auth._id + '-basket'" 
                                        class="fas fa-folder-plus" 
                                        @click="toggleBasket($event, auth._id)"></i>
                                </td>
                                <td>{{index + 1}}</td>
                                <td>
                                    <div>
                                        <span class="d-flex align-items-center">
                                            <i v-if="previewOpen === auth._id" class="fas fa-window-close preview-toggle mr-2" v-on:click="togglePreview($event, auth._id)" title="Preview record"></i>
                                            <i v-else class="fas fa-file preview-toggle mr-2" v-on:click="togglePreview($event, auth._id)" title="Preview record"></i>
                                            <a v-if="!auth.locked" 
                                                :id="'link-' + auth._id" 
                                                class="result-link record-title" 
                                                :href="uibase + '/editor?records=auths/' + auth._id">
                                                {{auth.heading}}
                                            </a>
                                            <a v-else 
                                                class="result-link record-title" 
                                                :id="'link-' + auth._id" 
                                                :href="uibase + '/records/auths/' + auth._id">
                                                {{auth.heading}}
                                            </a>
                                        </span>
                                        <readonlyrecord v-if="previewOpen === auth._id" :api_prefix="api_prefix" collection="auths" :record_id="auth._id" class="record-preview mt-2"></readonlyrecord>
                                        <div class="record-details mt-1">
                                            <span v-if="auth.alt"><strong>Alt:</strong> {{auth.alt}}</span>
                                            <span v-if="auth.symbol" class="ml-2"><strong>Symbol:</strong> {{auth.symbol}}</span>
                                            <span v-if="auth.date" class="ml-2"><strong>Date:</strong> {{auth.date}}</span>
                                            <span v-if="auth.types" class="ml-2"><strong>Types:</strong> {{auth.types}}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <countcomponent :api_prefix="api_prefix" :recordId="auth._id"></countcomponent>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="col">
            <div v-if="!isSearching && submitted && auths.length === 0" class="text-center mt-3">
                <p class="text-muted">No results found for updated > {{searchDate}}.</p>
                <p class="text-muted">Try changing your date.</p>
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
        .record-title {
            display: block;
            word-break: break-word;
            overflow-wrap: break-word;
        }
        .record-details {
            font-size: 0.9em;
            color: #666;
        }
    `,
    data: function () {
        let myUIBase = this.api_prefix.replace('/api/', '');
        // Default to one week ago
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const pad = n => n.toString().padStart(2, '0');
        const defaultDate = `${weekAgo.getFullYear()}-${pad(weekAgo.getMonth() + 1)}-${pad(weekAgo.getDate())}`;

        // Try to extract date from q param, e.g. q=updated>2025-01-01
        let urlDate = null;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const q = urlParams.get("q");
            if (q) {
                const match = q.match(/updated>(\d{4}-\d{2}-\d{2})/);
                if (match) {
                    urlDate = match[1];
                }
            }
        } catch (e) {}

        return {
            auths: [],
            submitted: false,
            showSpinner: false,
            searchDate: urlDate || defaultDate,
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
            currentSort: 'updated',
            currentDirection: 'desc',
            searchError: null,
        }
    },
    computed: {
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
        this.updateSearchQuery();
        this.submitSearch();
        this.refreshBasket();
    },
    methods: {
        async refreshBasket() {
            this.myBasket = await basket.getBasket(this.api_prefix);
            this.auths.forEach(r => {
                r.myBasket = basket.contains("auths", r._id, this.myBasket);
            });
        },
        updateSearchQuery() {
            // Compose the client URL as specified
            const query = `updated>${this.searchDate} AND NOT 999__c:'t'`;
            const url = new URL(window.location);
            url.searchParams.set("sort", this.currentSort);
            url.searchParams.set("direction", this.currentDirection);
            url.searchParams.set("q", query);
            url.searchParams.set("format", "brief");
            window.history.replaceState(null, "", url);
        },
        async submitSearch() {
            if (!this.searchDate) {
                this.searchError = "Date is required";
                return;
            }
            this.auths = [];
            this.showSpinner = true;
            this.isSearching = true;
            this.selectedRecords = [];
            this.resultCount = 0;
            const startTime = Date.now();
            const seenIds = [];
            // Compose the API URL as specified
            const query = `updated>${this.searchDate} AND NOT 999__c:'t'`;
            let next = `${this.api_prefix}marc/auths/records?sort=${encodeURIComponent(this.currentSort)}&direction=${encodeURIComponent(this.currentDirection)}&search=${encodeURIComponent(query)}&format=brief`;
            try {
                while (1) {
                    let records;
                    const response = await fetch(next);
                    if (!response.ok) throw new Error("Search failed");
                    const json = await response.json();
                    next = json['_links'] && json['_links']['_next'];
                    records = json['data'];
                    if (!records || records.length === 0) break;
                    records.forEach(record => {
                        if (!seenIds.includes(record._id)) {
                            seenIds.push(record._id);
                            this.auths.push(record);
                            this.resultCount++;
                        }
                    });
                }
                await this.refreshBasket();
            } catch (e) {
                this.searchError = e.message || "Search failed";
            } finally {
                this.searchTime = ((Date.now() - startTime) / 1000);
                this.showSpinner = false;
                this.isSearching = false;
                this.submitted = true;
            }
            this.updateSearchQuery();
        },
        selectAll() {
            this.auths.forEach(auth => {
                if (!auth.myBasket && !auth.locked) {
                    auth.selected = true;
                    if (!this.selectedRecords.some(r => r.record_id === auth._id && r.collection === "auths")) {
                        this.selectedRecords.push({ collection: "auths", record_id: auth._id });
                    }
                }
            });
        },
        selectNone() {
            this.auths.forEach(auth => {
                auth.selected = false;
            });
            this.selectedRecords = [];
        },
        handleMouseDown(e, auth, idx) {
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
        handleMouseMove(e, auth, idx) {
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
            let arr = this.auths;
            let [start, end] = [this.dragStartIdx, this.dragEndIdx].sort((a, b) => a - b);
            arr.forEach((r, i) => {
                if (!r.myBasket && !r.locked) r.selected = (i >= start && i <= end);
                if (r.selected) {
                    if (!this.selectedRecords.some(x => x.record_id === r._id && x.collection === "auths")) {
                        this.selectedRecords.push({ collection: "auths", record_id: r._id });
                    }
                } else {
                    const idx = this.selectedRecords.findIndex(x => x.record_id === r._id && x.collection === "auths");
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
                this.auths.forEach(r => {
                    r.myBasket = basket.contains("auths", r._id, this.myBasket);
                    r.selected = false;
                });
            }
        },
        async toggleBasket(e, authId) {
            let auth = this.auths.find(r => r._id === authId);
            if (!auth) return;
            if (!auth.myBasket) {
                await basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', "auths", authId);
                auth.myBasket = true;
                auth.selected = false;
            } else {
                await basket.deleteItem(this.myBasket, "auths", authId);
                auth.myBasket = false;
                auth.selected = false;
            }
            await this.refreshBasket();
        },
        togglePreview(event, authId) {
            if (event.target.classList.contains("preview-toggle") && this.previewOpen === authId) {
                this.previewOpen = null;
            } else if (authId) {
                this.previewOpen = authId;
            } else {
                this.previewOpen = null;
            }
        },
        handleSortChange({ sort, direction }) {
            this.currentSort = sort;
            this.currentDirection = direction;
            if (this.searchDate) {
                this.submitSearch();
            }
        },
        handleDirectionChange(direction) {
            this.currentDirection = direction;
            if (this.searchDate) {
                this.submitSearch();
            }
        },
        cancelSearch() {
            this.showSpinner = false;
            this.isSearching = false;
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
        'sortcomponent': sortcomponent,
        'countcomponent': countcomponent,
        'readonlyrecord': readonlyrecord
    }
}
import { sortcomponent } from "./sort.js";
import { countcomponent } from "./count.js";
import basket from "../api/basket.js";
import user from "../api/user.js";
import { readonlyrecord } from "./readonly_record.js"
import { recordfilecomponent } from "./recordfiles.js";
import { exportmodal } from "./export.js";
import { searchHistoryComponent } from "./search-history.js";
import { itemaddcomponent } from "./itemadd.js";

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
        sort: {
            type: String,
            required: false,
        },
        direction: {
            type: String,
            required: false,
        },
    },
    template: /*html*/ `
    <div class="col pt-2" id="app1" style="background-color:white;">

        <!-- Selectors for various kinds of searches, including search history and review screens -->
        <div class="col d-flex justify-content-center">
            <div>
                <a class="result-link" 
                :class="{ 'text-muted': mode === 'simpleSearch' }"
                href="" 
                @click.prevent="mode='simpleSearch'"
                :aria-current="mode === 'simpleSearch' ? 'page' : null">
                Simple Search
                </a>
                <span class="mx-1">|</span>
                <a class="result-link" 
                :class="{ 'text-muted': mode === 'advancedSearch' }"
                href="" 
                @click.prevent="mode='advancedSearch'; parseSearchTerm()"
                :aria-current="mode === 'advancedSearch' ? 'page' : null">
                Advanced Search
                </a>
                <span class="mx-1">|</span>
                <span v-if="subtype === 'speech' || collection === 'auths'">
                    <a v-if="subtype ==='speech'" class="result-link" :href="uibase + '/records/speeches/review'">Speech Review</a>
                    <a v-if="collection ==='auths'" class="result-link" :href="uibase + '/records/auths/review'">Auth Review</a>
                    <span class="mx-1">|</span>
                </span>
                <search-history
                    ref="searchHistory"
                    search-input-id="recordSearch"
                    :api-prefix="api_prefix"
                ></search-history>
            </div>
        </div>

        <!-- Simple Search -->
        <div class="col text-center" v-if="mode=='simpleSearch'">
            <form @submit.prevent="submitSearch">

                <div class="input-group" aria-label="Cancel search">
                    <input id="recordSearch" type="text" class="form-control" aria-label="Search Records" v-model="searchTerm" @keyup="updateSearchQuery">
                    <div class="input-group-append mb-3" v-if="showSpinner">
                        <button class="btn btn-danger" type="button" @click="cancelSearch">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="input-group-append" aria-label="Submit search" v-else>
                        <button class="btn btn-outline-secondary" 
                            type="button" @click="submitSearch" 
                            :disabled="!searchTerm">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Advanced Search -->
        <div class="col text-center" v-if="mode=='advancedSearch'">
            <div v-for="i in 3" :key="i" class="input-group mb-3">
                <div class="input-group-prepend">
                    <button :id="'searchType'+i" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{ searchTypes.find(t => t.value === advancedParams['searchType'+i])?.name || 'All of the words:' }}
                    </button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" v-for="t in searchTypes" :key="t.value" @click="setParameter('searchType'+i, t)">{{t.name}}</option>
                    </div>
                </div>
                <input :id="'searchTerm'+i" type="text" class="form-control" aria-label="Text input with dropdown button"
                    v-model="advancedParams['searchTerm'+i]" @keydown.enter="submitAdvancedSearch">
                <div class="input-group-prepend"><span class="input-group-text">in</span></div>
                <div class="input-group-prepend">
                    <button :id="'searchField'+i" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{ advancedParams['searchField'+i] !== 'any'
                            ? (logicalFieldLabels[advancedParams['searchField'+i]] || advancedParams['searchField'+i])
                            : 'any field' }}
                    </button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" value="any" @click="setParameter('searchField'+i, {value: 'any'})">any field</option>
                        <option class="dropdown-item" v-for="field in searchFields" :key="field" @click="setParameter('searchField'+i, {value: field})">{{logicalFieldLabels[field] || field}}</option>
                    </div>
                </div>
                <div class="input-group-append" v-if="i < 3">
                    <button :id="'searchConnector'+i" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {{ advancedParams['searchConnector'+i] || 'AND' }}
                    </button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" value="AND" @click="setParameter('searchConnector'+i, {value: 'AND'})">AND</option>
                        <option class="dropdown-item" value="OR" @click="setParameter('searchConnector'+i, {value: 'OR'})">OR</option>
                        <option class="dropdown-item" value="AND NOT" @click="setParameter('searchConnector'+i, {value: 'AND NOT'})">AND NOT</option>
                        <option class="dropdown-item" value="OR NOT" @click="setParameter('searchConnector'+i, {value: 'OR NOT'})">OR NOT</option>
                    </div>
                </div>
            </div>
            <div class="input-group-append mb-3" v-if="showSpinner">
                <button class="btn btn-danger" type="button" @click="cancelSearch">
                    Cancel Search
                </button>
            </div>
            <div class="input-group-append mb-3" v-else>
                <button class="btn btn-outline-secondary" 
                    type="button" @click="submitAdvancedSearch" 
                    :disabled="!hasAdvancedTerms">
                    Submit
                </button>
            </div>
        </div>

        <!-- sort and filter controls -->
        <div class="col d-flex justify-content-between text-center">
            <sortcomponent v-if="records.length > 0"
                :uibase="uibase"
                :collection="collection"
                :subtype="subtype"
                :search-term="searchTerm"
                :current-sort="currentSort"
                :current-direction="currentDirection"
                @sort-changed="handleSortChange"
                @direction-changed="handleDirectionChange">
            </sortcomponent>
            <!-- Auth heading filters -->
            <div v-if="collection == 'auths' && searchTerm" id="filters" class="col">
                Filter by: <br>
                <a v-for="headFilter in headFilters" 
                    class="badge mx-1" 
                    :class="{ 'badge-primary': activeFilters?.has(headFilter), 'badge-light': !activeFilters?.has(headFilter) }"
                    href="#"
                    @click.prevent="applyHeadFilter(headFilter)">
                    {{headFilter}}
                </a>
            </div>

            <!-- Bib subtype filters -->
            <div v-if="collection == 'bibs' && searchTerm" id="type-filters" class="col">
                Filter by: <br>
                <a v-for="typeFilter in typeFilters" 
                    class="badge mx-1" 
                    :class="{ 'badge-primary': activeFilters?.has(typeFilter.name), 'badge-light': !activeFilters?.has(typeFilter.name) }"
                    href="#"
                    @click.prevent="applyTypeFilter(typeFilter.name)">
                    {{typeFilter.label}}
                </a>
            </div>

            <div v-if="isSearching || submitted" class="col text-right">
                {{totalCount}} total results
                <br>
                {{resultCount}} results loaded
            </div>
        </div>

        <div v-if="searchError" class="alert alert-danger alert-dismissible fade show" role="alert">
            {{searchError}}
            <button type="button" class="close" @click="searchError = null">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>

        <!-- Results Area -->
        <div class="results-container col">

            <!-- Loading Spinner -->
            <div v-if="showSpinner" class="text-center mt-3">
                <div class="spinner-border mr-2" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            </div>

            <!-- Record Set Controls -->
            <div class="controls-header" v-if="records.length > 0">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <div class="btn-group mr-3">
                            <button class="btn btn-outline-secondary btn-sm" @click.prevent="selectAll">Select All (Max 100)</button>
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
                    <a class="result-link px-3" v-if="records.length > 0">
                        <i class="fas fa-share-square" title="Export Results" @click="showExportModal"></i>
                    </a>
                </div>
            </div>
            <!-- No Results Message -->
            <div class="col">
                <div v-if="!isSearching && submitted && records.length === 0" class="text-center mt-3">
                    <p class="text-muted">No results found for {{searchTerm}}.</p>
                    <p class="text-muted">Try changing your search terms or using the advanced search options.</p>
                </div>
            </div>
            <!-- Results Table -->
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover w-100 prevent-select" v-if="records.length > 0">
                    <thead>
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th>#</th>
                            <th v-if="collection !== 'auths'">Files</th>
                            <th v-else></th>
                            <th v-if="collection !== 'auths'">Title</th>
                            <th v-else>Heading</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(record, index) in records" 
                            :key="record._id" 
                            :class="{selected: record.selected}"
                            @mousedown="handleMouseDown($event, record, index)" 
                            @mousemove="handleMouseMove($event, record, index)" 
                            @mouseup="handleMouseUp($event)">
                            <td>
                                <input type="checkbox">
                            </td>
                            <td>
                                <itemadd
                                    :api_prefix="api_prefix"
                                    :collection="collection"
                                    :recordId="record._id"
                                    :myBasket="myBasket"
                                    @mousedown.native.stop
                                    @mouseup.native.stop
                                    @click.native.stop
                                ></itemadd>
                            </td>
                            <td> 
                                <!-- Preview -->
                                <div>
                                    <i v-if="previewOpen === record._id" class="fas fa-window-close preview-toggle" v-on:click="togglePreview($event, record._id)" title="Preview record"></i>
                                    <i v-else class="fas fa-file preview-toggle" v-on:click="togglePreview($event, record._id)" title="Preview record"></i>
                                </div>
                            </td>
                            
                            <!-- Record Data -->
                            <td>{{index + 1}}</td>
                            <td>
                                <recordfilecomponent v-if="collection === 'bibs' && subtype !== 'speech'" 
                                                :api_prefix="api_prefix" 
                                                :record_id="record._id" 
                                                :desired_languages="['ar','zh','en','fr','ru','es']" />
                                <recordfilecomponent v-if="subtype === 'speech'"
                                                :api_prefix="api_prefix"
                                                :record_id="record._id"
                                                :desired_languages="['en','fr','es']" />
                            </td>
                            <td class="title-cell">
                                <div>
                                    <a v-if="!record.locked" 
                                        :id="'link-' + record._id" 
                                        class="result-link record-title" 
                                        :href="uibase + '/editor?records=' + collection + '/' + record._id">
                                        <span v-if="collection == 'auths'" :title="record.heading">
                                            {{record.heading.substring(0,240)}}
                                        </span>
                                        <span v-else :title="record.title">
                                            {{record.title.substring(0,240)}}
                                        </span>
                                    </a>
                                    <a v-else 
                                        class="result-link record-title" 
                                        :id="'link-' + record._id" 
                                        :href="uibase + '/records/' + collection + '/' + record._id">
                                        <span v-if="collection == 'auths'" :title="record.heading">
                                            {{record.heading.substring(0,240)}}
                                        </span>
                                        <span v-else :title="record.title">
                                            {{record.title.substring(0,240)}}
                                        </span>
                                    </a>
                                    <countcomponent v-if="collection == 'auths'" 
                                                :api_prefix="api_prefix" 
                                                :recordId="record._id">
                                    </countcomponent>
                                    <div class="record-details mt-1">
                                        {{record.alt}}
                                    </div>
                                    <div class="record-details mt-1">
                                        {{[record["f099c"]?.length > 0 && !record["symbol"] ? record["f099c"].join(', ') : false, 
                                        record["symbol"], 
                                        record["date"], 
                                        record["types"]?.split("::").slice(-1)[0]
                                        ].filter(Boolean).join(" | ")}}
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
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div id="results-footer" class="text-center mt-3">
            <div v-if="records.length > 0 && records.length === totalCount">End</div>
            <div v-else-if="records.length > 0">
                <span>{{records.length}} / {{totalCount}} loaded</span>                 
                <i class="spinner-border mr-2"></i>
            </div>
            <div>&nbsp;</div> <!-- padding -->
        </div>

        <!-- Export modal -->
        <exportmodal ref="exportmodal"
            :api_prefix="api_prefix"
            :collection="collection"
            :searchParams="searchParams">
        </exportmodal>

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
                            :collection="collection"
                            :record_id="previewOpen"
                        />
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Delete Confirmation Modal -->
        <div class="modal fade" id="deleteConfirmModal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirm Delete</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p class="text-danger">Are you sure you want to delete {{selectedRecords.length}} records?</p>
                        <p class="text-muted">This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" 
                                @click="executeDelete" 
                                :disabled="isDeleting">
                            <span v-if="isDeleting" class="spinner-border spinner-border-sm mr-2"></span>
                            {{isDeleting ? 'Deleting...' : 'Delete Records'}}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    style: `
        .selected {
            background-color: #70a9e1;
        }

        .text-muted {
            pointer-events: none;
            cursor: default;
        }

        .record-title {
            display: block;
            word-break: break-word;
            overflow-wrap: break-word;
        }

        .record-details {
            font-size: 0.9em;
            color: #666;
        }

        .title-cell {
            min-width: 300px;
        }

        .table {
            margin-bottom: 0;
        }

        .table td {
            vertical-align: middle;
        }

        .card {
            position: sticky;
            top: 1rem;
        }

        @media (max-width: 768px) {
            .card {
                position: static;
                margin-bottom: 1rem;
            }
        }

        .controls-header {
            background: white;
            padding: 1rem;
            border-bottom: 1px solid #dee2e6;
        }

        .results-container {
            position: relative;
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
            abortController: null,
            showSpinner: false,
            agendas: [],
            searchParams: new URLSearchParams(window.location),
            searchTerm: "",
            searchQuery: "",
            myBasket: {},
            myProfile: {},
            selectedRecords: [],
            uibase: myUIBase,
            searchTime: 0,
            totalCount: 0,
            total: 0,
            resultsPerPage: 100,
            isSearching: false,
            infiniteScrollEnabled: true,
            nextPageUrl: null,
            isFetchingMore: false,
            isDragging: false,
            selectedRows: [],
            mode: "simpleSearch",
            advancedParams: {
                'searchTerm1': null,
                'searchTerm2': null,
                'searchTerm3': null,
            },
            searchFields: [],
            searchTypes: [
                { 'name': 'All of the words:', 'value': 'all' },
                { 'name': 'Any of the words:', 'value': 'any' },
                { 'name': 'Exact phrase:', 'value': 'exact' },
                { 'name': 'Partial phrase:', 'value': 'partial' },
                { 'name': 'Regular expression:', 'value': 'regex' },
            ],
            previewOpen: false,
            currentSort: 'updated',
            currentDirection: 'desc',
            headFilters: ['100', '110', '111', '130', '150', '190', '191'],
            typeFilters: [
                {
                    'name': 'all',
                    'label': 'All'
                },
                {
                    'name': 'default',
                    'label': 'Docs & Pubs'
                },
                {
                    'name': 'speech',
                    'label': 'Speeches'
                },
                {
                    'name': 'vote',
                    'label': 'Votes'
                }
            ],
            activeFilters: new Set(["default"]),
            isDeleting: false,
            searchError: null,
            logicalFieldLabels: {
                // We can add more logical field labels here if needed
                "body": "Series Symbol"
            },
            userEmail: "",
            lastSelectedIdx: null,
        }
    },
    computed: {
        hasAdvancedTerms() {
            return !!(this.advancedParams.searchTerm1 || this.advancedParams.searchTerm2 || this.advancedParams.searchTerm3);
        },
        canDelete() {
            if (!user.hasPermission(this.myProfile, 'batchDelete')) {
                return false
            }
            return this.selectedRecords.length > 0 && 
                !this.selectedRecords.some(r => r.locked) 
        },
        defaultSearchParams() {
            // Speech subtype defaults
            if (this.subtype === 'speech') {
                return {
                    'searchType1': 'exact',
                    'searchField1': 'symbol',
                    'searchConnector1': 'AND',
                    'searchType2': 'all',
                    'searchField2': 'any',
                    'searchConnector2': 'AND',
                    'searchType3': 'all',
                    'searchField3': 'any'
                };
            }
            
            // Default search params for other cases
            return {
                'searchType1': 'all',
                'searchField1': 'any',
                'searchConnector1': 'AND',
                'searchType2': 'all',
                'searchField2': 'any',
                'searchConnector2': 'AND',
                'searchType3': 'all',
                'searchField3': 'any'
            };
        },
        currentSearchParams() {
            return new URLSearchParams(window.location.search)
        }
    },
    created: async function () {
        // Get the user profile for permissions checking
        this.myProfile = await user.getProfile(this.api_prefix, 'my_profile')
        //console.log(this.myProfile)

        const searchQuery = this.currentSearchParams.get("q");
        this.subtype = this.currentSearchParams.get("subtype") || 'default';
        const url = new URL(window.location);
        url.searchParams.set('subtype', this.subtype);
        window.history.replaceState(null, "", url);

        this.activeFilters = new Set();

        // only set default to activeFilters if collection is not auths
        if (this.collection !== 'auths' && !this.activeFilters.size) {
            this.activeFilters.add(this.subtype || "default");
        }

        const profile = await user.getProfile(this.api_prefix, 'my_profile');
        if (profile && profile.data && profile.data.email) {
            this.userEmail = profile.data.email;
        }

        // Set default search parameters based on collection/subtype
        this.advancedParams = {
            ...this.advancedParams,
            ...this.defaultSearchParams
        };
        
        // Get sort parameters from URL or use defaults
        this.currentSort = this.sort || this.currentSearchParams.get("sort") || 'updated';
        this.currentDirection = this.direction || this.currentSearchParams.get("direction") || 'desc';

        // Get logical fields from new endpoint
        let logicalFieldsUrl = `${this.api_prefix}marc/${this.collection}/logical_fields`;
        if (this.subtype) {
            logicalFieldsUrl += `?subtype=${this.subtype}`;
        }
        
        await fetch(logicalFieldsUrl).then(response => {
            return response.json()
        }).then(json => {
            this.searchFields = json.data.logical_fields;
            this.searchQuery = searchQuery;
        });

        // Only after we have fields, parse and submit if we have a query
        if (searchQuery) {
            this.searchTerm = searchQuery;
            this.submitSearch();
        }

        this.refreshBasket();

        window.addEventListener('scroll', this.handleScroll);
    },
    beforeDestroy() {
        window.removeEventListener('scroll', this.handleScroll);
    },
    methods: {
        async refreshBasket() {
            this.myBasket = await basket.getBasket(this.api_prefix);
            this.records.forEach(r => {
                r.myBasket = basket.contains(this.collection, r._id, this.myBasket);
            });
        },
        parseSearchTerm() {
            // Reset advancedParams while preserving defaults
            const defaults = this.defaultSearchParams;
            
            for (let i = 1; i <= 3; i++) {
                this.advancedParams[`searchField${i}`] = defaults[`searchField${i}`];
                this.advancedParams[`searchTerm${i}`] = '';
                this.advancedParams[`searchType${i}`] = defaults[`searchType${i}`];
                if (i < 3) this.advancedParams[`searchConnector${i}`] = defaults[`searchConnector${i}`];
            }
            if (!this.searchTerm) return;

            // Split the search by connectors
            let tokens = []
            this.searchTerm.split(/ +(AND|OR) +/).forEach(x => x.split(/ ?\b(NOT) +/).forEach(y => tokens.push(y)))
            tokens = tokens.filter(x => x)
            const terms = tokens.filter(x => !['AND', 'OR', 'NOT'].includes(x)) // the separators are returned by .split when using regex

            if (terms.length > 3) {
                window.alert('Not all of the search terms can fit in the advanced search display')
            }

            terms.forEach((term, index) => {
                let paramIndex = index + 1
                term = term.trim()

                if (term.match(/^\w+:/)) {
                    // Specific Field
                    // NOTE: Any word in a specific field is not supported

                    let match = term.match(/^(\w+):(.*)/)
                    this.advancedParams[`searchField${paramIndex}`] = match[1]
                    let value = match[2]

                    // Exact
                    match = value.match(/^'(.*)'$/)

                    if (match) {
                        this.advancedParams[`searchType${paramIndex}`] = 'exact'
                        this.advancedParams[`searchTerm${paramIndex}`] = match[1]
                    }

                    // Multi phrase. Terms with multiple double quote encolsed phrases, or at least one phrase mixed with free text
                    if ([...value.matchAll(/"/g)].length >= 2) {
                        if (value.match(/.+".+/)) {
                            // There are at least two total quotes and one in the middle of the string
                            window.alert("Advanced search does not support mulitple phrases or phrases mixed with free text in one field")
                            // Remove all quotes and let it get treated as free
                            value = value.replaceAll('"', '')
                        }
                    }
                    
                    // Phrase
                    if (value.match(/^".*"$/)) {
                        this.advancedParams[`searchType${paramIndex}`] = 'partial'
                        this.advancedParams[`searchTerm${paramIndex}`] = value.replaceAll('"', "")
                    }

                    // Free
                    if (!value.match(/^".+"$/) && !value.match(/.+".+/)) {
                        this.advancedParams[`searchTerm${paramIndex}`] = value
                    }
                } else {
                    // Any field

                    // TODO: Handle multiple free text terms. Terms separated by OR would be split into 
                    // their own input boxes. Terms separeted by AND can be combined into one input box.

                    let value = term
                    this.advancedParams[`searchField${paramIndex}`] = 'any'
                    
                    // Phrase mixed with free text
                    if ((value[0] != '"' || value[value.length-1] != '"') && [...value.matchAll(/"/g)].length >= 2 && value.match(/.+".+/)) {
                        window.alert("Advanced search does not currently support phrases mixed with free text")
                        // Remove all quotes and let it get treated as free
                            value = value.replaceAll('"', '')
                    }

                    // Multi double quote enclosed phrases
                    if (value.split(/"\s+"/).length > 1 && value.match(/^".+"$/)) {
                        // The term consists entirely of double quoted phrases.
                        // Split them into their own terms.
                        for (let phrase of value.split(/"\s+"/)) {
                            this.advancedParams[`searchType${paramIndex}`] = "partial"
                            this.advancedParams[`searchTerm${paramIndex}`] = phrase.replaceAll('"', "")
                            paramIndex++
                        }

                        if (paramIndex > 3) {
                            window.alert('Not all of the search terms can fit in the advanced search display')
                        }
                    }

                    // Single phrase
                    if (value.match(/^".+"$/)) {
                        this.advancedParams[`searchType${paramIndex}`] = "partial"
                        this.advancedParams[`searchTerm${paramIndex}`] = value.replaceAll('"', "")
                    }

                    // Free
                    if (!value.match(/^".+"$/)) {
                        this.advancedParams[`searchTerm${paramIndex}`] = value
                    }
                }

                // Get the next operator, if any.
                // TODO: Decide if advanced search should support searches where there is only one term with NOT
                const next = tokens[tokens.indexOf(term)+1]
                const next2 = tokens[tokens.indexOf(term)+2]
                let connector = next === "AND" && next2 == "NOT" ? "AND NOT" : next === "OR" && next2 == "NOT" ? "OR NOT" : next
                this.advancedParams[`searchConnector${paramIndex}`] = connector
            })

            // TODO: Decide whether to Handle regex and wildcard in fielded advanced search 
        },

        buildSearchQuery() {
            const parts = [];
            for (let i = 1; i <= 3; i++) {
                const term = this.advancedParams[`searchTerm${i}`]?.trim();
                if (!term) continue;

                const field = this.advancedParams[`searchField${i}`];
                const type = this.advancedParams[`searchType${i}`];

                let queryPart = '';
                if (field !== 'any') {
                    // Field-specific searches
                    switch (type) {
                        case 'all':
                            // field:term1 AND field:term2
                            queryPart = `${field}:${term}`
                            break;
                        case 'exact':
                            // field:'complete phrase'
                            queryPart = `${field}:'${term}'`;
                            break;
                        case 'any':
                            // field:term1 OR field:term2
                            queryPart = term.split(/\s+/)
                                .map(t => `${field}:${t}`)
                                .join(' OR ');
                            break;
                        case 'partial':
                            // field:"partial phrase"
                            queryPart = `${field}:"${term}"`;
                            break;
                        default:
                            queryPart = `${field}:${term}`;
                    }
                } else {
                    // Non-field specific searches
                    switch (type) {
                        case 'exact':
                            queryPart = `'${term}'`;
                            break;
                        case 'any':
                            queryPart = term.split(/\s+/).join(' OR ');
                            break;
                        case 'partial':
                            queryPart = `"${term}"`;
                            break;
                        default:
                            queryPart = term;
                    }
                }

                parts.push(queryPart);

                if (i < 3 && this.advancedParams[`searchTerm${i + 1}`]?.trim()) {
                    parts.push(this.advancedParams[`searchConnector${i}`]);
                }
            }
            return parts.join(' ');
        },

        // When user submits advanced search, marshal to string and update simple box
        submitAdvancedSearch() {
            this.searchTerm = this.buildSearchQuery();
            this.updateSearchQuery();
            this.submitSearch();
        },

        // When user types in simple search, parse into advancedParams
        updateSearchQuery() {
            const url = new URL(window.location);
            url.searchParams.set("q", this.searchTerm);
            window.history.replaceState(null, "", url);
            this.searchParams = new URLSearchParams(window.location.search)
        },

        normalizeSymbolSearch(q) {
            // Skip normalization if the collection is "auths"
            if (this.collection === "auths") return q;
            // Split on AND/OR/NOT (case-insensitive, surrounded by spaces)
            const terms = q.split(/ *(AND|OR|NOT) +/i).filter(Boolean);

            if (
                terms.length === 1 &&
                !/[:<>]/.test(terms[0]) &&
                !['AND', 'OR', 'NOT'].includes(terms[0].toUpperCase()) &&
                /^[A-Za-z]+\/.+/.test(terms[0])
            ) {
                // Looks like a symbol, rewrite as symbol:"TERM"
                return `symbol:"${terms[0]}"`;
            }
            return q;
        },

        applyActiveHeadFilters(records) {
            // Only filter if collection is 'auths' and filters are active
            if (this.collection === 'auths' && this.activeFilters && this.activeFilters.size > 0) {
                return records.filter(record =>
                    Array.from(this.activeFilters).some(tag => record.heading_tag === tag)
                );
            }
            return records;
        },

        applyHeadFilter(fieldTag) {
            // Initialize active filters Set if needed
            if (!this.activeFilters) {
                this.activeFilters = new Set();
            }

            // Store original records if not already stored
            if (!this._originalRecords) {
                this._originalRecords = [...this.records];
            }

            // Toggle filter
            if (this.activeFilters.has(fieldTag)) {
                this.activeFilters.delete(fieldTag);
            } else {
                this.activeFilters.add(fieldTag);
            }

            // If no filters active, restore original results
            if (this.activeFilters.size === 0) {
                this.records = [...this._originalRecords];
                this.resultCount = this.records.length;
                return;
            }

            // Always filter from the original unfiltered set
            //if (!this._originalRecords) {
            //    this._originalRecords = [...this.records];
            //}
            this.records = this.applyActiveHeadFilters(this._originalRecords);
            this.resultCount = this.records.length;
        },

        applyTypeFilter(filtername) {
            // Update URL parameters
            const url = new URL(window.location);
            url.searchParams.set("subtype", filtername);
            window.history.replaceState(null, "", url);
            this.searchParams = new URLSearchParams(window.location.search)

            // Update subtype in component state
            this.subtype = filtername;

            // Set activeFilters to only the selected type
            this.activeFilters = new Set();
            this.activeFilters.add(filtername)

            //console.log(this.subtype, this.activeFilters)

            // Resubmit search with new sort parameters
            this.submitSearch();
        },

        // Add cleanup method for when search changes
        clearFilters() {
            this._originalRecords = null;
            this.activeFilters = null;
        },

        // When user submits simple search, parse into advancedParams and search
        async submitSearch() {
            // Add to search history if possible
            if (this.userEmail && this.$refs.searchHistory) {
                await this.$refs.searchHistory.addToHistory(this.searchTerm);
            }

            this.searchError = null;
            if (!this.searchTerm) {
                this.searchError = "Search term required";
                return;
            }

            this.searchTerm = this.normalizeSymbolSearch(this.searchTerm);
            this.updateSearchQuery();

            if (this.abortController) {
                this.abortController.abort();
            }

            this.abortController = new AbortController();

            if (!this.collection === 'bibs') {
                this._originalRecords = null;
                this.clearFilters();
            }
            
            this.records = [];
            this.showSpinner = true;
            this.isSearching = true;
            this.resultCount = 0;
            this.nextPageUrl = null;
            this.infiniteScrollEnabled = true;
            this.isFetchingMore = false;
            const startTime = Date.now();
            const seenIds = [];

            // Build base URL with limit=100
            let next = `${this.api_prefix}marc/${this.collection}/records?search=${this.searchTerm}&format=brief&sort=${this.currentSort}&direction=${this.currentDirection}&limit=100`;
            if (this.subtype && this.subtype !== 'default') {
                if (['speech', 'vote', 'all'].includes(this.subtype)) {
                    next = `${this.api_prefix}marc/${this.collection}/records?search=${this.searchTerm}&subtype=${this.subtype}&format=brief&sort=${this.currentSort}&direction=${this.currentDirection}&limit=100`;
                } else {
                    next = `${this.api_prefix}marc/${this.collection}/records?search=${this.searchTerm}&subtype=${this.subtype}&format=brief_${this.subtype}&sort=${this.currentSort}&direction=${this.currentDirection}&limit=100`;
                }
            }

            const timeUpdater = setInterval(() => {
                this.searchTime = ((Date.now() - startTime) / 1000)
            }, 100);

            // Fetch only the first 100 results, do NOT continue fetching more here
            const json = await fetch(next, {signal: this.abortController.signal}).then(response => {
                if (!response.ok) {
                    response.json().then(json => {
                        this.searchError = `${json['message']} (${response.status})`;
                        throw new Error(this.searchError);
                    });
                    return null;
                }
                return response.json();
            }).catch(e => {
                clearInterval(timeUpdater);
                this.endSearch();

                if (e.name === 'AbortError') {
                    const message = "Search cancelled by user";
                    this.searchError = message;
                    throw new Error(message);
                }
                this.searchError = e.message;
                throw e;
            });

            if (json) {
                this.totalCount = json['_meta']['count'];
                this.nextPageUrl = json['_links']['_next'];
                let records = json['data'];
                this._originalRecords = records;
                records = this.applyActiveHeadFilters(records);
                records.forEach(record => {
                    if (!seenIds.includes(record._id)) {
                        seenIds.push(record._id);
                        this.records.push(record);
                        this.resultCount++;
                    }
                });
                // Do NOT fetch more here; let handleScroll trigger fetchMoreResults when needed
            }
        
            clearInterval(timeUpdater);
            this.endSearch();
        },

        async fetchMoreResults() {
            if (!this.nextPageUrl || this.isFetchingMore || !this.infiniteScrollEnabled) return;
            this.isFetchingMore = true;
            const json = await fetch(this.nextPageUrl, {signal: this.abortController?.signal}).then(response => response.json());
            if (json) {
                this.nextPageUrl = json['_links']['_next'];
                let newRecords = json['data'];
                // Add to _originalRecords for filtering
                if (!this._originalRecords) this._originalRecords = [];
                newRecords.forEach(record => {
                    if (!this._originalRecords.some(r => r._id === record._id)) {
                        this._originalRecords.push(record);
                    }
                });
                // Apply head filters if needed
                newRecords = this.applyActiveHeadFilters(newRecords);
                newRecords.forEach(record => {
                    if (!this.records.some(r => r._id === record._id)) {
                        this.records.push(record);
                        this.resultCount++;
                    }
                });
            }
            this.isFetchingMore = false;
        },

        handleScroll() {
            if (!this.infiniteScrollEnabled || this.isFetchingMore) return;
            const scrollY = window.scrollY || window.pageYOffset;
            const viewportHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;
            // Only fetch if the page is scrollable and user has scrolled past 90%
            //console.log(scrollY, viewportHeight, fullHeight, (scrollY + viewportHeight) / fullHeight);
            if (fullHeight > viewportHeight && (scrollY + viewportHeight) / fullHeight >= 0.9) {
                this.fetchMoreResults();
            }
        },

        endSearch() {
            this.isSearching = false;
            this.showSpinner = false;
            this.abortController = null;
            //this.searchTime = ((Date.now() - startTime) / 1000); # this is being done twice
            this.submitted = true;
            this.records.forEach(r => {
                r.myBasket = basket.contains(this.collection, r._id, this.myBasket);
            });
            let ui_url = `${this.api_prefix.replace("/api/", "")}/records/${this.collection}/review?q=${this.foundQ}`
            window.history.replaceState({}, ui_url);
            this.searchParams = new URLSearchParams(window.location.search)
        },
        cancelSearch() {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
                this.showSpinner = false;
            }
        },

        handleSortChange({ sort, direction }) {
            // Update URL parameters
            const url = new URL(window.location);
            url.searchParams.set("sort", sort);
            url.searchParams.set("direction", direction);
            window.history.replaceState(null, "", url);
            this.searchParams = new URLSearchParams(window.location.search);

            // Update component state
            this.currentSort = sort;
            this.currentDirection = direction;

            // Resubmit search with new sort parameters
            if (this.searchTerm) {
                this.submitSearch();
            }
        },

        handleDirectionChange(direction) {
            // Update URL parameter
            const url = new URL(window.location);
            url.searchParams.set("direction", direction);
            window.history.replaceState(null, "", url);
            this.searchParams = new URLSearchParams(window.location.search);

            // Update component state
            this.currentDirection = direction;

            // Resubmit search with new direction
            if (this.searchTerm) {
                this.submitSearch();
            }
        },

        setParameter(cls, field) {
            this.advancedParams[cls] = field.value;
        },

        toggleSelect(e, result) {
            result.selected = !result.selected;
            if (result.selected) {
                if (!this.selectedRecords.some(r => r.record_id === result._id && r.collection === this.collection)) {
                    this.selectedRecords.push({ collection: this.collection, record_id: result._id });
                }
            } else {
                const idx = this.selectedRecords.findIndex(r => r.record_id === result._id && r.collection === this.collection);
                if (idx !== -1) this.selectedRecords.splice(idx, 1);
            }
        },
        selectAll() {
            [...this.records].forEach(result => {
                if (!result.myBasket && !result.locked && this.selectedRecords.length < 100) {
                    result.selected = true;
                    if (!this.selectedRecords.some(r => r.record_id === result._id && r.collection === this.collection)) {
                        this.selectedRecords.push({ collection: this.collection, record_id: result._id });
                    }
                }
            });
        },
        selectNone() {
            [...this.records].forEach(result => {
                result.selected = false;
            });
            this.selectedRecords = [];
            this.lastSelectedIdx = null;
        },
        
        // Handle click and drag selection and shift+click and drag selection
        handleMouseDown(e, result, idx) {
            if (e.button !== 0) return;

            if (!e.shiftKey) {
                this.records.forEach(r => r.selected = false);
                this.selectedRecords = [];
            }
            if (!result.selected && !result.myBasket && !result.locked) {
                result.selected = true;
                this.selectedRecords.push({ collection: this.collection, record_id: result._id });
            }
            this.isDragging = true;
            this.lastSelectedIdx = idx;
        },

        handleMouseMove(e, result, idx) {
            if (!result.selected && !result.myBasket && !result.locked && this.isDragging) {
                // If dragging, select all records between last selected and current
                if (this.lastSelectedIdx !== null) {
                    const start = Math.min(this.lastSelectedIdx, idx);
                    const end = Math.max(this.lastSelectedIdx, idx);
                    for (let i = start; i <= end; i++) {
                        const rec = this.records[i];
                        if (!rec.myBasket && !rec.locked && !rec.selected) {
                            rec.selected = true;
                            this.selectedRecords.push({ collection: this.collection, record_id: rec._id });
                        }
                    }
                }
            }
        },

        handleMouseUp(e) {
            this.isDragging = false;
        },

        async sendToBasket(e) {
            e.preventDefault();
            const items = this.selectedRecords.slice(0, 100);
            if (items.length > 0) {
                await basket.createItems(this.api_prefix, 'userprofile/my_profile/basket', JSON.stringify(items))
                this.myBasket = await basket.getBasket(this.api_prefix);
                await this.refreshBasket();
                this.selectedRecords = [];
                // Update myBasket for all results
                this.records.forEach(r => {
                    r.myBasket = basket.contains(this.collection, r._id, this.myBasket);
                    r.selected = false;
                });
            }
        },
        togglePreview(event, recordId) {
            if (this.previewOpen === recordId) {
                this.previewOpen = false;
            } else if (recordId) {
                this.previewOpen = recordId;
            }
            return
        },
        // Necessary?
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

        showExportModal() {
            if (!this.records.length) {
                window.alert("No results to export");
                return;
            }

            // Show modal
            this.$refs.exportmodal?.show();
        },

        hideExportModal() {
            this.$refs.exportmodal?.hide();
        },

        confirmDelete() {
            $('#deleteConfirmModal').modal('show');
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
        'readonlyrecord': readonlyrecord,
        'recordfilecomponent': recordfilecomponent,    
        'exportmodal': exportmodal,
        'search-history': searchHistoryComponent,
        'itemadd': itemaddcomponent,
    }
}

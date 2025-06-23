import { sortcomponent } from "./search/sort.js";
import { countcomponent } from "./search/count.js";
import basket from "./api/basket.js";
import user from "./api/user.js";
//import { previewmodal } from "./modals/preview.js";
import { readonlyrecord } from "./readonly_record.js"
import { recordfilecomponent } from "./recordfiles.js";
import { exportmodal } from "./modals/export.js";

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
        <div class="col mb-2 d-flex justify-content-between">
            <div>
                <a class="result-link" 
                :class="{ 'text-muted': mode === 'simpleSearch' }"
                href="" 
                @click.prevent="mode='simpleSearch'"
                :aria-current="mode === 'simpleSearch' ? 'page' : null">
                Simple Search
                </a>
                <a class="result-link" 
                :class="{ 'text-muted': mode === 'advancedSearch' }"
                href="" 
                @click.prevent="mode='advancedSearch'"
                :aria-current="mode === 'advancedSearch' ? 'page' : null">
                Advanced Search
                </a>
            </div>
            <div class="d-flex align-items-center">
                <a v-if="subtype ==='speech'" class="result-link px-3" :href="uibase + '/records/speeches/review'">Speech Review</a>
                <a v-if="collection ==='auths'" class="result-link px-3" :href="uibase + '/records/auths/review'">Auth Review</a>
                <a class="result-link px-3" v-if="records.length > 0">
                    <i class="fas fa-share-square" title="Export Results" @click="showExportModal"></i>
                </a>
            </div>
        </div>

        <!-- Simple Search -->
        <div class="col text-center" v-if="mode=='simpleSearch'">
            <form @submit.prevent="submitSearch">

                <div class="input-group mb-3">
                    <input id="recordSearch" type="text" class="form-control" aria-label="Search Records" v-model="searchTerm" @keyup="updateSearchQuery">
                    <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="submit" :disabled="!searchTerm">Submit</button>
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
                        {{ advancedParams['searchField'+i] !== 'any' ? advancedParams['searchField'+i] : 'any field' }}
                    </button>
                    <div class="dropdown-menu">
                        <option class="dropdown-item" value="any" @click="setParameter('searchField'+i, {value: 'any'})">any field</option>
                        <option class="dropdown-item" v-for="field in searchFields" :key="field" @click="setParameter('searchField'+i, {value: field})">{{field}}</option>
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
            <div class="input-group-append mb-3">
                <button class="btn btn-outline-secondary" type="button" @click="submitAdvancedSearch" :disabled="!hasAdvancedTerms">Submit</button>
            </div>
        </div>

        <div v-if="collection == 'auths'" id="filters" class="col text-center">
            Filter: 
            <a v-for="headFilter in headFilters" 
                class="badge mx-1" 
                :class="{ 'badge-primary': activeFilters?.has(headFilter), 'badge-light': !activeFilters?.has(headFilter) }"
                href="#"
                @click.prevent="applyHeadFilter(headFilter)">
                {{headFilter}}
            </a>
        </div>

        <!-- Sort Controls -->
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
                <button class="btn btn-danger btn-sm" @click="cancelSearch">
                    Cancel Search
                </button>
            </div>

            <!-- Record Set Controls -->
            <div class="controls-header mb-3" v-if="records.length > 0">
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

            <!-- Results Table -->
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover w-100" v-if="records.length > 0">
                    <thead>
                        <tr>
                            <th></th>
                            <th style="width: 30px"></th>
                            <th style="width: 30px"></th>
                            <th style="width: 50px">#</th>
                            <th v-if="collection !== 'auths'" style="width: 150px">Files</th>
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
                            <td></td>
                            <td>
                                <i v-if="record.locked" 
                                    :id="record._id + '-basket'" 
                                    class="fas fa-lock"></i>
                                <i v-else-if="record.myBasket" 
                                    :id="record._id + '-basket'" 
                                    class="fas fa-folder-minus" 
                                    @click="toggleBasket($event, record._id)"></i>
                                <i v-else 
                                    :id="record._id + '-basket'" 
                                    class="fas fa-folder-plus" 
                                    @click="toggleBasket($event, record._id)"></i>
                            </td>
                            <td> 
                                <!-- Preview -->
                                <div>
                                    <i v-if="previewOpen === record._id" class="fas fa-window-close preview-toggle" v-on:click="togglePreview($event, record._id)" title="Preview record"></i>
                                    <i v-else class="fas fa-file preview-toggle" v-on:click="togglePreview($event, record._id)" title="Preview record"></i>
                                    <readonlyrecord v-if="previewOpen === record._id" :api_prefix="api_prefix" :collection="collection" :record_id="record._id" class="record-preview"></readonlyrecord>
                                </div>
                            </td>
                            
                            <!-- Record Data -->
                            <td>{{index + 1}}</td>
                            <td>
                                <recordfilecomponent v-if="collection !== 'auths'" 
                                                :api_prefix="api_prefix" 
                                                :record_id="record._id" 
                                                :desired_languages="['ar','zh','en','fr','ru','es']" />
                            </td>
                            <td class="title-cell">
                                <div>
                                    <a v-if="!record.locked" 
                                        :id="'link-' + record._id" 
                                        class="result-link record-title" 
                                        :href="uibase + '/editor?records=' + collection + '/' + record._id">
                                        <span v-if="collection == 'auths'">
                                            {{record.heading}}
                                        </span>
                                        <span v-else>
                                            {{record.title}}
                                        </span>
                                    </a>
                                    <a v-else 
                                        class="result-link record-title" 
                                        :id="'link-' + record._id" 
                                        :href="uibase + '/records/' + collection + '/' + record._id">
                                        {{record.title}}
                                    </a>
                                    <countcomponent v-if="collection == 'auths'" 
                                                :api_prefix="api_prefix" 
                                                :recordId="record._id">
                                    </countcomponent>
                                    <div class="record-details mt-1">
                                        {{record.alt}}
                                    </div>
                                    <div class="record-details mt-1">
                                        {{[record["f099c"]?.length > 0 ? record["f099c"].join(', ') : false, 
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
        <!-- No Results Message -->
        <div class="col">
            <div v-if="!isSearching && submitted && records.length === 0" class="text-center mt-3">
                <p class="text-muted">No results found for {{searchTerm}}.</p>
                <p class="text-muted">Try changing your search terms or using the advanced search options.</p>
            </div>
        </div>
        <exportmodal ref="exportmodal"
            :api_prefix="api_prefix"
            :collection="collection"
            :search-term="searchTerm">
        </exportmodal>

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
        let exportLinks = {
            'format': {
                'CSV': `${this.api_prefix}marc/${this.collection}/records?search=${encodeURIComponent(this.searchTerm)}&format=csv`,
                'JSON': `${this.api_prefix}marc/${this.collection}/records?search=${encodeURIComponent(this.searchTerm)}&format=json`,
                'XML': `${this.api_prefix}marc/${this.collection}/records?search=${encodeURIComponent(this.searchTerm)}&format=xml`,
                'MRK': `${this.api_prefix}marc/${this.collection}/records?search=${encodeURIComponent(this.searchTerm)}&format=mrk`
            }
        };
        return {
            subtype: null,
            records: [],
            submitted: false,
            sortColumns: [],
            showAgendaModal: false,
            abortController: null,
            showSpinner: false,
            agendas: [],
            searchTerm: "",
            searchQuery: "",
            myBasket: {},
            myProfile: {},
            selectedRecords: [],
            uibase: myUIBase,
            searchTime: 0,
            resultCount: 0,
            isSearching: false,
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
            activeFilters: null,
            isDeleting: false,
            searchError: null,
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
        }
    },
    created: async function () {
        // Get the user profile for permissions checking
        this.myProfile = await user.getProfile(this.api_prefix, 'my_profile')
        console.log(this.myProfile)

        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get("q");
        this.subtype = urlParams.get("subtype") || '';

        // Set default search parameters based on collection/subtype
        this.advancedParams = {
            ...this.advancedParams,
            ...this.defaultSearchParams
        };
        
        // Get sort parameters from URL or use defaults
        this.currentSort = urlParams.get("sort") || 'updated';
        this.currentDirection = urlParams.get("direction") || 'desc';

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
            this.parseSearchTerm();
            this.submitSearch();
        }

        this.refreshBasket();
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

            // Split into clauses and connectors, preserving quoted strings
            const parts = [];
            let currentPart = '';
            let inQuotes = false;
            let i = 0;
            
            while (i < this.searchTerm.length) {
                const char = this.searchTerm[i];
                // Check for connectors first
                if (!inQuotes && /\s/.test(char)) {
                    if (currentPart) {
                        // Look ahead for NOT after AND/OR
                        if (currentPart.toUpperCase() === 'AND' || currentPart.toUpperCase() === 'OR') {
                            const remainingText = this.searchTerm.substring(i).trim();
                            if (remainingText.toUpperCase().startsWith('NOT ')) {
                                currentPart += ' NOT';
                                i += 4; // Skip "NOT "
                            }
                        }
                        parts.push(currentPart.trim());
                        currentPart = '';
                    }
                } else if (char === '"' || char === "'") {
                    inQuotes = !inQuotes;
                    currentPart += char;
                } else {
                    currentPart += char;
                }
                i++;
            }
            if (currentPart) parts.push(currentPart.trim());

            // Process parts
            let paramIndex = 1;
            i = 0;
            while (i < parts.length && paramIndex <= 3) {
                let part = parts[i];
                let connector = 'AND';
                
                // Check if next part is a connector, now including compound connectors
                if (i + 1 < parts.length) {
                    const nextPart = parts[i + 1].toUpperCase();
                    if (['AND NOT', 'OR NOT', 'AND', 'OR'].includes(nextPart)) {
                        connector = nextPart;
                        i += 2;
                    } else {
                        i++;
                    }
                } else {
                    i++;
                }

                // Check for field:value pattern
                const fieldMatch = part.match(/^(\w+):(.+)$/);
                //console.log(fieldMatch, this.searchFields)
                if (fieldMatch && this.searchFields.includes(fieldMatch[1])) {
                    const field = fieldMatch[1];
                    const value = fieldMatch[2];

                    // Look ahead for same field patterns
                    const terms = [];
                    
                    // Handle the first term based on its format
                    if (value.startsWith('"') && value.endsWith('"')) {
                        // field:"term" -> partial phrase
                        this.advancedParams[`searchField${paramIndex}`] = field;
                        this.advancedParams[`searchTerm${paramIndex}`] = value.slice(1, -1);
                        this.advancedParams[`searchType${paramIndex}`] = 'partial';
                    } else if (value.startsWith("'") && value.endsWith("'")) {
                        // field:'term' -> exact phrase
                        this.advancedParams[`searchField${paramIndex}`] = field;
                        this.advancedParams[`searchTerm${paramIndex}`] = value.slice(1, -1);
                        this.advancedParams[`searchType${paramIndex}`] = 'exact';
                    } else {
                        terms.push(value);
                        
                        // Look ahead for field:term AND field:term pattern
                        while (i < parts.length && 
                            parts[i] === 'AND' && 
                            i + 1 < parts.length &&
                            parts[i + 1].startsWith(`${field}:`)) {
                            const nextTerm = parts[i + 1].replace(`${field}:`, '');
                            terms.push(nextTerm);
                            i += 2;
                        }

                        this.advancedParams[`searchField${paramIndex}`] = field;
                        this.advancedParams[`searchTerm${paramIndex}`] = terms.join(' ');
                        this.advancedParams[`searchType${paramIndex}`] = 'all'; // Always treat as 'all' for fielded searches
                    }

                    //console.log(`terms: ${terms}`)
                } else {
                    // Handle non-fielded search
                    if (part.startsWith('"') && part.endsWith('"')) {
                        this.advancedParams[`searchField${paramIndex}`] = 'any';
                        this.advancedParams[`searchTerm${paramIndex}`] = part.slice(1, -1);
                        this.advancedParams[`searchType${paramIndex}`] = 'partial';
                    } else if (part.startsWith("'") && part.endsWith("'")) {
                        this.advancedParams[`searchField${paramIndex}`] = 'any';
                        this.advancedParams[`searchTerm${paramIndex}`] = part.slice(1, -1);
                        this.advancedParams[`searchType${paramIndex}`] = 'exact';
                    } else {
                        this.advancedParams[`searchField${paramIndex}`] = 'any';
                        this.advancedParams[`searchTerm${paramIndex}`] = part;
                        this.advancedParams[`searchType${paramIndex}`] = 'all';
                    }
                }

                if (paramIndex < 3) {
                    this.advancedParams[`searchConnector${paramIndex}`] = connector;
                }
                paramIndex++;
            }
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
                            queryPart = term.split(/\s+/)
                                .map(t => `${field}:${t}`)
                                .join(' AND ');
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
            this.parseSearchTerm();
            window.history.replaceState(null, "", url);
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

            // Apply all active filters to original results
            this.records = this._originalRecords.filter(record => {
                return Array.from(this.activeFilters).some(tag => {
                    return record.heading_tag === tag;
                });
            });

            // Update result count even if zero
            this.resultCount = this.records.length;
        },

        // Add cleanup method for when search changes
        clearFilters() {
            this._originalRecords = null;
            this.activeFilters = null;
        },

        // When user submits simple search, parse into advancedParams and search
        async submitSearch() {
            this.searchError = null;
            if (!this.searchTerm) {
                this.searchError = "Search term required";
                return;
            }

            if (this.abortController) {
                this.abortController.abort();
            }

            this.abortController = new AbortController();

            this.clearFilters();

            this.parseSearchTerm();
            this.records = []
            this.showSpinner = true
            this.isSearching = true;
            this.resultCount = 0;
            const startTime = Date.now();
            const seenIds = [];

            // Build base URL with sort parameters
            let next = `${this.api_prefix}marc/${this.collection}/records?search=${this.searchTerm}&format=brief&sort=${this.currentSort}&direction=${this.currentDirection}`;
            
            if (this.subtype && this.subtype !== 'default') {
                if (this.subtype === 'speech' || this.subtype === 'vote') {
                    next = `${this.api_prefix}marc/${this.collection}/records?search=${this.searchTerm}&subtype=${this.subtype}&format=brief&sort=${this.currentSort}&direction=${this.currentDirection}`;
                } else {
                    next = `${this.api_prefix}marc/${this.collection}/records?search=${this.searchTerm}&subtype=${this.subtype}&format=brief_${this.subtype}&sort=${this.currentSort}&direction=${this.currentDirection}`;
                }
            }

            const timeUpdater = setInterval(() => {
                this.searchTime = ((Date.now() - startTime) / 1000)
            }, 100)
            
            try {
                while (1) {
                    let records;
                    
                    try {
                        const response = await fetch(next, {
                            signal: this.abortController.signal,
                        });

                        if (!response.ok) {
                            if (response.status === 408) {
                                // Handle timeout specifically
                                const errorData = await response.json();
                                throw new Error(`Search timed out after ${errorData.timeout/1000} seconds. Please try refining your search.`);
                            }
                            throw new Error(`Search failed with status: ${response.status}`);
                        }

                        const json = await response.json();
                        next = json['_links']['_next'];
                        records = json['data'];
                    } catch (e) {
                        if (e.name === 'AbortError') {
                            throw new Error("Search cancelled by user");
                        }
                        throw e;
                    }

                    if (records.length === 0) {
                        break
                    }

                    records.forEach(record => {
                        if (!seenIds.includes(record._id)) {
                            seenIds.push(record._id);
                            this.records.push(record);
                            this.resultCount++;
                        }
                    });
                }
                
            } catch (error) {
                if (error.message === "Search cancelled by user") {
                    console.log("Search cancelled by user");
                } else {
                    console.error("Error during search:", error);
                }
                this.searchError = error.message;
            } finally {
                clearInterval(timeUpdater);
                this.isSearching = false;
                this.showSpinner = false;
                this.abortController = null;
                this.searchTime = ((Date.now() - startTime) / 1000);
                this.submitted = true;
                this.records.forEach(r => {
                    r.myBasket = basket.contains(this.collection, r._id, this.myBasket);
                });
                let ui_url = `${this.api_prefix.replace("/api/", "")}/records/${this.collection}/review?q=${this.foundQ}`
                window.history.replaceState({}, ui_url);
            }
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
                if (!result.myBasket && !result.locked) {
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
        },
        handleMouseDown(e, result, idx) {
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
        handleMouseMove(e, result, idx) {
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
        cancelDrag: function() {
            this.isDragging = false;
            this.dragStartIdx = null;
            this.dragEndIdx = null;
            document.removeEventListener('mouseup', this.cancelDrag);
        },
        updateDragSelection() {
            let arr = [...this.records];
            let [start, end] = [this.dragStartIdx, this.dragEndIdx].sort((a, b) => a - b);
            arr.forEach((r, i) => {
                if (!r.myBasket && !r.locked) r.selected = (i >= start && i <= end);
                if (r.selected) {
                    if (!this.selectedRecords.some(x => x.record_id === r._id && x.collection === this.collection)) {
                        this.selectedRecords.push({ collection: this.collection, record_id: r._id });
                    }
                } else {
                    const idx = this.selectedRecords.findIndex(x => x.record_id === r._id && x.collection === this.collection);
                    if (idx !== -1) this.selectedRecords.splice(idx, 1);
                }
            });
        },
        async sendToBasket(e) {
            e.preventDefault();
            const items = this.selectedRecords.slice(0, 100);
            if (items.length > 0) {
                await basket.createItems(this.api_prefix, 'userprofile/my_profile/basket', JSON.stringify(items))
                await this.refreshBasket();
                this.refreshBasket();
                this.selectedRecords = [];
                // Update myBasket for all results
                this.records.forEach(r => {
                    r.myBasket = basket.contains(this.collection, r._id, this.myBasket);
                    r.selected = false;
                });
            }
        },
        async toggleBasket(e, recordId) {
            // Find the result object
            let result = [...this.records].find(r => r._id === recordId);
            if (!result) return;

            if (!result.myBasket) {
                // Add to basket
                await basket.createItem(this.api_prefix, 'userprofile/my_profile/basket', this.collection, recordId);
                result.myBasket = true;
                result.selected = false; // Deselect if added to basket
            } else {
                // Remove from basket
                await basket.deleteItem(this.myBasket, this.collection, recordId);
                result.myBasket = false;
                result.selected = false; // Deselect if removed from basket
            }
            // Refresh basket state for the component
            this.refreshBasket();
        },
        togglePreview(event, recordId) {
            if (event.target.classList.contains("preview-toggle") && this.previewOpen === recordId) {

                this.previewOpen = false;
            } else if (recordId) {
                this.previewOpen = recordId;
            } else {
                this.previewOpen = false;
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
        //'previewmodal': previewmodal,
        'readonlyrecord': readonlyrecord,
        'recordfilecomponent': recordfilecomponent,    
        'exportmodal': exportmodal,
    }
}
import { readonlyrecord } from "./readonly_record.js"
import { Jmarc } from "../api/jmarc.mjs"

export let callbacksearchcomponent = {
    props: ["api_prefix"],
    template: `
        <div class="search-component">
            <form @submit.prevent="handleSearch">
                <div class="form-group">
                    <label for="central-db-id">Central Database ID:</label>
                    <input 
                        type="text" 
                        id="central-db-id" 
                        v-model="centralDbId" 
                        class="form-control"
                        placeholder="Enter Central Database ID"
                    />
                </div>

                <div class="form-group">
                    <label for="undl-id">UNDL ID:</label>
                    <input 
                        type="text" 
                        id="undl-id" 
                        v-model="undlId" 
                        class="form-control"
                        placeholder="Enter UNDL ID"
                    />
                </div>

                <div class="form-group">
                    <label for="search-date">Date:</label>
                    <input 
                        type="date" 
                        id="search-date" 
                        v-model="searchDate" 
                        class="form-control"
                    />
                </div>

                <div class="form-group">
                    <button type="submit" class="btn btn-primary" :disabled="isSearching || !isFormValid">
                        {{ isSearching ? 'Searching...' : 'Search' }}
                    </button>
                    <button type="button" class="btn btn-secondary ml-2" @click="clearSearch" :disabled="isSearching">
                        Clear
                    </button>
                </div>
                
                <p v-if="formError" class="text-danger mt-2">{{ formError }}</p>
            </form>

            <div v-if="results.length > 0" class="mt-4">
                <h3>Search Results ({{ results.length }})</h3>
                <div class="table-responsive">
                    <table class="table table-striped table-sm">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Central DB ID</th>
                                <th>UNDL ID</th>
                                <th>Record Type</th>
                                <th>UNDL Load Status</th>
                                <th>Searchable in UNDL</th>
                                <th>Date Processed</th>
                                <th>UNDL URL</th>
                                <th>Diff</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="result in results" :key="result.id">
                                <td>
                                    <div>
                                        <i v-if="previewOpen === result.central_db_id" class="fas fa-window-close preview-toggle" @click="togglePreview(null, result.central_db_id, result.record_type)" title="Close preview"></i>
                                        <i v-else class="fas fa-file preview-toggle" @click="togglePreview(null, result.central_db_id, result.record_type)" title="Preview record"></i>
                                    </div>
                                </td>
                                <td>
                                    <a 
                                        :href="getRecordLink(result.record_type, result.central_db_id)" 
                                        class="result-link"
                                        :title="'View record ' + result.central_db_id"
                                        target="_blank"
                                    >
                                        {{ result.central_db_id }}
                                    </a>
                                    <i class="fa fa-external-link-alt"></i>
                                </td>
                                <td>{{ result.undl_id }}</td>
                                <td>{{ result.record_type }}</td>
                                <td>
                                    <span v-if="result.success" class="badge badge-success">Success</span>
                                    <span v-else class="badge badge-danger">Failed</span>
                                </td>
                                <td>
                                    <span v-if="result.dlMatch === 'match'" class="badge badge-success">✓ Exact match</span>
                                    <span v-else-if="result.dlMatch === 'multiple'" class="badge badge-warning">Multiple matches</span>
                                    <span v-else-if="result.dlMatch === 'none'" class="badge badge-secondary">No match</span>
                                    <span v-else class="badge badge-light">—</span>
                                </td>
                                <td>{{ formatDate(result.time) }}</td>
                                <td>
                                    <a v-if="result.url" :href="result.url" target="_blank" class="result-link">
                                        View Record
                                    </a>
                                    <i class="fa fa-external-link-alt"></i>
                                    <span v-else class="text-muted">—</span>
                                </td>
                                <td>
                                    <button 
                                        type="button" 
                                        class="btn btn-sm btn-outline-secondary"
                                        @click="toggleDiff(result.central_db_id, result.record_type, result.marcxml)"
                                        v-if="result.marcxml"
                                    >
                                        {{ diffOpen === result.central_db_id ? 'Hide' : 'Show' }}
                                    </button>
                                </td>
                            </tr>
                            <tr v-for="result in results" :key="'diff-' + result.id" v-if="diffOpen === result.central_db_id">
                                <td colspan="9">
                                    <div class="diff-container p-4">
                                        <h6 class="mb-3">MARCXML Diff</h6>
                                        <p v-if="diffLoading" class="text-muted">Loading records for comparison...</p>
                                        <div v-else-if="diffError" class="alert alert-danger mb-0">{{ diffError }}</div>
                                        <div v-else-if="diffData" class="diff-view">
                                            <div class="row">
                                                <div class="col-lg-6">
                                                    <div class="diff-column">
                                                        <h6 class="diff-header diff-header-central">Central DB Record</h6>
                                                        <pre class="diff-pre diff-pre-central"><code>{{ diffData.central }}</code></pre>
                                                    </div>
                                                </div>
                                                <div class="col-lg-6">
                                                    <div class="diff-column">
                                                        <h6 class="diff-header diff-header-undl">UNDL Record</h6>
                                                        <pre class="diff-pre diff-pre-undl"><code>{{ diffData.undl }}</code></pre>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <p v-if="isSearching" class="mt-3">⌕ Fetching results...</p>
            <p v-if="searchPerformed && results.length === 0 && !isSearching" class="text-muted mt-3">No results found.</p>

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
                                :collection="previewCollection"
                                :record_id="previewOpen"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            centralDbId: "",
            undlId: "",
            searchDate: "",
            results: [],
            isSearching: false,
            searchPerformed: false,
            formError: "",
            expandedMarcxml: [],
            previewOpen: false,
            previewContent: "",
            previewCollection: "",
            diffOpen: false,
            diffLoading: false,
            diffError: "",
            diffData: null,
            uiBase: this.api_prefix.replace("/api/", "")
        }
    },
    computed: {
        isFormValid: function() {
            return this.centralDbId.trim() !== "" || this.undlId.trim() !== "" || this.searchDate.trim() !== "";
        }
    },
    watch: {
        centralDbId: function() {
            this.updateUrl();
        },
        undlId: function() {
            this.updateUrl();
        },
        searchDate: function() {
            this.updateUrl();
        }
    },
    mounted: function() {
        // Load parameters from URL on component mount
        this.loadFromUrl();
        // Set the jmarc API URL
        Jmarc.apiUrl = this.api_prefix;
    },
    methods: {
        handleSearch: async function() {
            this.formError = "";
            this.results = [];
            this.isSearching = true;
            this.searchPerformed = true;
            this.expandedMarcxml = [];

            try {
                // Build query parameters
                let params = new URLSearchParams();
                if (this.centralDbId.trim()) {
                    params.append("central_db_id", this.centralDbId.trim());
                }
                if (this.undlId.trim()) {
                    params.append("undl_id", this.undlId.trim());
                }
                if (this.searchDate) {
                    params.append("date", this.searchDate);
                }

                // Fetch from local API
                let url = `${this.api_prefix}reports/callback-search?${params.toString()}`;
                let response = await fetch(url);
                let data = await response.json();

                if (!response.ok) {
                    this.formError = "Search failed. Please try again.";
                    this.isSearching = false;
                    return;
                }

                // Map results directly from API response
                this.results = data.data.map((record) => {
                    return {
                        id: record.id,
                        central_db_id: record.central_db_id,
                        undl_id: record.undl_id,
                        record_type: record.record_type,
                        success: record.success,
                        url: record.url,
                        marcxml: record.marcxml,
                        time: record.time,
                        dlMatch: null
                    };
                });

                this.isSearching = false;
                
                // Start async UN Digital Library search
                this.searchUnDigitalLibrary();

            } catch (error) {
                this.formError = "An error occurred during search. Please try again.";
                console.error(error);
                this.isSearching = false;
            }
        },
        searchUnDigitalLibrary: async function() {
            for (let result of this.results) {
                try {
                    let response = await fetch(
                        `${this.api_prefix}reports/undl-search/${result.undl_id}`
                    );
                    let data = await response.json();
                    result.dlMatch = data.data.match;
                } catch (error) {
                    console.log(`Could not check UN Digital Library for ${result.undl_id}`);
                    result.dlMatch = "error";
                }
                this.$set(result, 'dlMatch', result.dlMatch);
            }
        },
        clearSearch: function() {
            this.centralDbId = "";
            this.undlId = "";
            this.searchDate = "";
            this.results = [];
            this.formError = "";
            this.expandedMarcxml = [];
            this.searchPerformed = false;
            this.previewOpen = false;
            this.diffOpen = false;
            this.updateUrl();
        },
        updateUrl: function() {
            let params = new URLSearchParams();
            if (this.centralDbId.trim()) {
                params.append("central_db_id", this.centralDbId.trim());
            }
            if (this.undlId.trim()) {
                params.append("undl_id", this.undlId.trim());
            }
            if (this.searchDate) {
                params.append("date", this.searchDate);
            }
            
            let newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        },
        loadFromUrl: function() {
            let params = new URLSearchParams(window.location.search);
            this.centralDbId = params.get("central_db_id") || "";
            this.undlId = params.get("undl_id") || "";
            this.searchDate = params.get("date") || "";
        },
        formatDate: function(dateString) {
            if (!dateString) return "—";
            let date = new Date(dateString);
            return date.toLocaleString();
        },
        toggleDiff: async function(recordId, collection, undlMarcxml) {
            if (this.diffOpen === recordId) {
                this.diffOpen = false;
                this.diffData = null;
                this.diffError = "";
                return;
            }

            this.diffOpen = recordId;
            this.diffLoading = true;
            this.diffError = "";
            this.diffData = null;

            // Pluralize collection name
            let pluralCollection = collection;
            if (collection === 'bib') {
                pluralCollection = 'bibs';
            } else if (collection === 'auth') {
                pluralCollection = 'auths';
            }

            try {
                // Fetch Central DB record
                const centralResponse = await fetch(
                    `${this.api_prefix}marc/${pluralCollection}/records/${recordId}`
                );
                const centralData = await centralResponse.json();

                if (!centralResponse.ok) {
                    this.diffError = "Could not fetch Central DB record";
                    this.diffLoading = false;
                    return;
                }

                // Parse both records using Jmarc
                const centralRecord = new Jmarc(pluralCollection);
                centralRecord.parse(centralData.data);
                const centralStr = centralRecord.toStr();

                // Parse UNDL record from MARCXML
                const undlRecord = new Jmarc(pluralCollection);
                // Create a minimal parsed object from the MARCXML
                // This is a simplified version - you may need to enhance the MARCXML parser
                const undlStr = this.extractMarcxmlFields(undlMarcxml);

                this.diffData = {
                    central: centralStr,
                    undl: undlStr
                };

            } catch (error) {
                this.diffError = `Error loading records for comparison: ${error.message}`;
                console.error(error);
            } finally {
                this.diffLoading = false;
            }
        },
        extractMarcxmlFields: function(marcxml) {
            // Parse MARCXML and return a formatted string similar to jmarc.toStr()
            const parser = new DOMParser();
            const doc = parser.parseFromString(marcxml, "text/xml");
            let output = "";

            // Get all datafields
            const datafields = doc.querySelectorAll("datafield");
            datafields.forEach(field => {
                const tag = field.getAttribute("tag");
                const subfields = field.querySelectorAll("subfield");   
                let fieldStr = `: ${tag} `;

                subfields.forEach(sf => {
                    const code = sf.getAttribute("code");
                    const value = sf.textContent;
                    fieldStr += `$${code} ${value} `;
                });

                fieldStr += "|";
                output += fieldStr + "\n";
            });

            return output;
        },
        highlightDiff: function(text, type) {
            if (!text) return "";
            
            // Split text into lines and highlight differences
            const lines = text.split("\n");
            return lines.map(line => {
                if (!line.trim()) return ""; // Skip empty lines
                
                if (type === 'removed') {
                    return `<span class="diff-line diff-removed">${this.escapeHtml(line)}</span>`;
                } else {
                    return `<span class="diff-line diff-added">${this.escapeHtml(line)}</span>`;
                }
            }).join("\n");
        },
        escapeHtml: function(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        },
        toggleMarcxml: function(recordId) {
            let index = this.expandedMarcxml.indexOf(recordId);
            if (index > -1) {
                this.expandedMarcxml.splice(index, 1);
            } else {
                this.expandedMarcxml.push(recordId);
            }
        },
        togglePreview: function(event, recordId, collection) {
            if (this.previewOpen === recordId) {
                this.previewOpen = false;
                this.previewCollection = "";
            } else if (recordId) {
                this.previewOpen = recordId;
                // Pluralize collection name
                let pluralCollection = collection;
                if (collection === 'bib') {
                    pluralCollection = 'bibs';
                } else if (collection === 'auth') {
                    pluralCollection = 'auths';
                }
                this.previewCollection = pluralCollection;
            }
        },
        getRecordLink: function(collection, recordId) {
            let pluralCollection = collection;
            if (collection === 'bib') {
                pluralCollection = 'bibs';
            } else if (collection === 'auth') {
                pluralCollection = 'auths';
            }
            return `${this.uiBase}/editor?records=${pluralCollection}/${recordId}`;
        }
    },
    components: {
        'readonlyrecord': readonlyrecord
    }
}
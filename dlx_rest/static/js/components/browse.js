import { Jmarc } from "../api/jmarc.mjs";
import user from "../api/user.js";
import basket from "../api/basket.js";
import { readonlyrecord } from "./readonly_record.js";
import { itemaddcomponent } from "./itemadd.js";

export let browsecomponent = {
    props: {
        api_prefix: { type: String, required: true },
        collection: { type: String, required: true },
        index: { type: String, required: false },
        q: { type: String, required: false }
    },
    template: `
    <div class="col pt-2" id="app1" style="background-color:white;">
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
        <div v-if="q && index">
            <div class="controls-header mb-3 d-flex align-items-center justify-content-between" style="position:sticky;top:0;z-index:10;background:white;">
                <div>
                    <h3 class="mb-0">Browsing {{displaySubtype}}/{{index}} at {{q}}</h3>
                    <form class="form-inline" @submit.prevent="resubmitBrowse(index)">
                        <input id="searchAgain" type="text" class="form-control form-control-sm mr-2" placeholder="Search again..." v-model="q" autocomplete="off">
                        <button type="submit" class="btn btn-primary btn-sm">Search</button>
                    </form>
                </div>
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
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover w-100" v-if="results_after.length > 0 || results_before.length > 0">
                    <thead>
                        <tr>
                            <th style="width: 30px"></th>
                            <th style="width: 30px"></th>
                            <th style="width: 30px"></th>
                            <th style="width: 50px">#</th>
                            <th>Value</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(result, idx) in [...results_before]" 
                            :key="result.value + '-' + idx"
                            :class="{selected: result.selected}"
                            @mousedown="handleMouseDown($event, result, idx)"
                            @mousemove="handleMouseMove($event, result, idx)"
                            @mouseup="handleMouseUp($event)">
                            <td></td>
                            <td>
                                <div v-if="result.count === 1 && result.recordId">
                                    <itemadd
                                        :api_prefix="api_prefix"
                                        :collection="collection"
                                        :recordId="result.recordId"
                                        :myBasket="myBasket"
                                        @mousedown.native.stop
                                        @mouseup.native.stop
                                        @click.native.stop
                                    ></itemadd>
                                </div>
                            </td>
                            <td>
                                <div v-if="result.count === 1 && result.recordId" class="preview">
                                    <i v-if="previewOpen === result.recordId" class="fas fa-window-close preview-toggle" v-on:click="togglePreview($event, result.recordId)" title="Preview record"></i>
                                    <i v-else class="fas fa-file preview-toggle" v-on:click="togglePreview($event, result.recordId)" title="Preview record"></i>
                                    <!-- <readonlyrecord v-if="previewOpen === result.recordId" :api_prefix="api_prefix" :collection="collection" :record_id="result.recordId" class="record-preview"></readonlyrecord> -->
                                </div>
                            </td>
                            <td>{{idx + 1}}</td>
                            <td>
                                <a
                                    v-if="!result.locked && result.recordId && result.count === 1"
                                    :id="'link-' + result.recordId"
                                    class="result-link record-title"
                                    :href="base_url + '/editor?records=' + collection + '/' + result.recordId"
                                >
                                    {{result.value}}
                                </a>
                                <a
                                    v-else-if="result.count > 1"
                                    class="result-link record-title"
                                    :href="browseSearchQuery(index, result.value, subtype)"
                                >
                                    {{result.value}}
                                </a>
                                <a
                                    v-else
                                    class="result-link record-title disabled"
                                    :id="'link-' + result.recordId"
                                    :href="base_url + '/records/' + collection + '/' + result.recordId"
                                >
                                    {{result.value}}
                                </a>
                                <span v-if="result.see || result.seeAlso">
                                    <span v-if="result.see" class="see text-muted"><br>See: {{result.see}}</span>
                                    <span v-if="result.seeAlso" class="see-also text-muted"><br>See also: {{result.seeAlso}}</span>
                                </span>
                            </td>
                            <td>{{result.count !== null ? result.count : '' }}</td>
                        </tr>

                        <tr class="table-info">
                            <td style="width: 30px"></td>
                            <td style="width: 30px"></td>
                            <td style="width: 30px"></td>
                            <td style="width: 50px"></td>
                            <td>{{q}}</td>
                            <td></td>
                        </tr>

                        <tr v-for="(result, idx) in [...results_after]" 
                            :key="result.value + '-' + idx+3"
                            :class="{selected: result.selected}"
                            @mousedown="handleMouseDown($event, result, idx+3)"
                            @mousemove="handleMouseMove($event, result, idx+3)"
                            @mouseup="handleMouseUp($event)">
                            <td></td>
                            <td>
                                <div v-if="result.count === 1 && result.recordId">
                                    <itemadd
                                        :api_prefix="api_prefix"
                                        :collection="collection"
                                        :recordId="result.recordId"
                                        :myBasket="myBasket"
                                        @mousedown.native.stop
                                        @mouseup.native.stop
                                        @click.native.stop
                                    ></itemadd>
                                </div>
                            </td>
                            <td>
                                <div v-if="result.count === 1 && result.recordId" class="preview">
                                    <i v-if="previewOpen === result.recordId" class="fas fa-window-close preview-toggle" v-on:click="togglePreview($event, result.recordId)" title="Preview record"></i>
                                    <i v-else class="fas fa-file preview-toggle" v-on:click="togglePreview($event, result.recordId)" title="Preview record"></i>
                                </div>
                            </td>
                            <td>{{idx + 4}}</td>
                            <td>
                                <a
                                    v-if="!result.locked && result.recordId && result.count === 1"
                                    :id="'link-' + result.recordId"
                                    class="result-link record-title"
                                    :href="base_url + '/editor?records=' + collection + '/' + result.recordId"
                                >
                                    {{result.value}}
                                </a>
                                <a
                                    v-else-if="result.count > 1"
                                    class="result-link record-title"
                                    :href="browseSearchQuery(index, result.value, subtype)"
                                >
                                    {{result.value}}
                                </a>
                                <a
                                    v-else
                                    class="result-link record-title disabled"
                                    :id="'link-' + result.recordId"
                                    :href="base_url + '/records/' + collection + '/' + result.recordId"
                                >
                                    {{result.value}}
                                </a>
                                <span v-if="result.see || result.seeAlso">
                                    <span v-if="result.see" class="see text-muted"><br>See: {{result.see}}</span>
                                    <span v-if="result.seeAlso" class="see-also text-muted"><br>See also: {{result.seeAlso}}</span>
                                </span>
                            </td>
                            <td>{{result.count !== null ? result.count : '' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="row">
                <div id="after-spinner" class="col d-flex justify-content-center" v-if="loading['after-spinner']">
                    <div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>
                </div>
            </div>
        </div>

        <!-- Index browsing section -->
        <div v-else class="col pt-2">
            <h3>Browsing {{displaySubtype}}</h3>
            <div class="col pt-2 m-auto" style="background-color:white;">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Logical Field Name</th>
                            <th>Starts with</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(field, idx) in logicalFields" :key="field">
                            <td>{{ logicalFieldLabels[field] || field }}</td>
                            <td>
                                <form @submit.prevent="submitBrowse(idx)">
                                    <input autofocus autocomplete="off" :id="field" placeholder="starts with..." type="text" class="form-control input">
                                </form>
                            </td>
                            <td>
                                <button type="button mx-2" class="btn btn-primary" @click="submitBrowse(idx)">Submit</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `,
    style: `
    .selected {
        background-color: #70a9e1 !important;
    }
    `,
    data() {
        Jmarc.apiUrl = this.api_prefix;
        let baseUrl = this.api_prefix.replace("/api", "");
        let subtype = this.getSubtype();
        let displaySubtype = subtype === "default" ? this.collection : subtype;
        return {
            results_before: [],
            results_after: [],
            beforeOffset: 1,
            afterOffset: 1,
            hasMoreBefore: true,
            hasMoreAfter: true,
            logicalFields: [],
            base_url: baseUrl,
            subtype,
            displaySubtype,
            user: null,
            myBasket: {},
            loading: { 'before-spinner': true, 'after-spinner': true },
            scrollTimeout: null,
            previewOpen: false,
            isDragging: false,
            dragStartIdx: null,
            dragEndIdx: null,
            lastSelectedIdx: null,
            selectedRecords: [],
            logicalFieldLabels: {
                // We can add more logical field labels here if needed
                "body": "Series Symbol"
            }
        }
    },
    computed: {
        paginationLinks() {
            return [
                { label: "Previous", url: this.prev },
                { label: "Next", url: this.next }
            ];
        },
        browseSearchQuery() {
            return (index, value, subtype) =>
                this.base_url +
                'records/' +
                this.collection +
                '/search?q=' +
                encodeURIComponent(index + ":'" + value + "'") +
                '&subtype=' +
                subtype;
        },
    },
    async created() {
        // Fetch logical fields for this collection/subtype
        let logicalFieldsUrl = `${this.api_prefix}marc/${this.collection}/logical_fields`;
        if (this.subtype) {
            logicalFieldsUrl += `?subtype=${this.subtype}`;
        }
        try {
            const resp = await fetch(logicalFieldsUrl);
            const json = await resp.json();
            this.logicalFields = json.data.logical_fields || [];
        } catch (e) {
            this.logicalFields = [];
        }

        const myProfile = await user.getProfile(this.api_prefix, 'my_profile');
        if (myProfile) {
            this.user = myProfile.data.email;
            this.myBasket = await basket.getBasket(this.api_prefix);
        }
        if (this.q && this.index) {
            await this.initialFetch();
        }
    },
    beforeDestroy() {
        window.removeEventListener('scroll', this.handleScroll);
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    },
    methods: {
        getSubtype() {
            const match = window.location.search.match(/subtype=(\w+)/);
            return match ? match[1] : this.collection;
        },
        async initialFetch() {
            document.title += ` Browse (${this.displaySubtype})`;
            await Promise.all([
                this.fetchBrowseResults('before'),
                this.fetchBrowseResults('after')
            ]);
            window.addEventListener('scroll', this.handleScroll);
        },
        async fetchBrowseResults(direction) {
            const isBefore = direction === 'before';
            const limit = isBefore ? 3 : 50;
            const compare = isBefore ? 'less' : 'greater';
            const offset = isBefore ? this.beforeOffset : this.afterOffset;
            const url = `${this.api_prefix}marc/${this.collection}/records/browse?subtype=${encodeURIComponent(this.subtype)}&search=${this.index}:${encodeURIComponent(this.q)}&compare=${compare}&limit=${limit}&start=${offset}`;
            const spinnerId = isBefore ? 'before-spinner' : 'after-spinner';
            this.loading[spinnerId] = true;
            try {
                const response = await fetch(url);
                const jsondata = await response.json();
                if (!jsondata.data || !jsondata.data.length) {
                    if (isBefore) this.hasMoreBefore = false;
                    else this.hasMoreAfter = false;
                    return;
                }
                const newResults = [];
                const updatePromises = [];
                for (const result of jsondata.data) {
                    const qstr = result.search.split("?")[1];
                    const params = new URLSearchParams(qstr);
                    const search = params.get("search");
                    const subtype = params.get("subtype");
                    const searchUrl = `${this.base_url}/records/${this.collection}/search?q=${encodeURIComponent(search)}&subtype=${subtype}`;
                    const resultObj = {
                        value: result.value,
                        valueSafe: encodeURIComponent(result.value),
                        url: searchUrl,
                        //checkboxDisabled: true,
                        recordId: null,
                        count: null,
                        recordUrl: searchUrl,
                        see: "",
                        seeAlso: ""
                    };
                    newResults.push(resultObj);
                    updatePromises.push(this.updateResultCountAndLink(result, resultObj));
                }
                await Promise.all(updatePromises);
                if (isBefore) {
                    // Reverse so oldest results are at the top, newest at the bottom
                    this.results_before = [...newResults, ...this.results_before];
                    this.beforeOffset += newResults.length;
                } else {
                    this.results_after = [...this.results_after, ...newResults];
                    this.afterOffset += newResults.length;
                    //console.log(this.afterOffset)
                }
            } catch (error) {
                // Optionally handle error
            } finally {
                this.loading[spinnerId] = false;
            }
        },
        async updateResultCountAndLink(result, resultObj) {
            try {
                // Fetch count if needed
                let count = result.count;
                if (typeof count !== "number") {
                    const countResp = await fetch(result.count);
                    const countJson = await countResp.json();
                    count = countJson.data;
                }
                resultObj.count = count;

                if (count !== 1) {
                    // Not a single record, nothing else to do
                    return;
                }

                // Fetch recordId
                const recordResp = await fetch(result.search);
                const recordJson = await recordResp.json();
                const apiUrl = recordJson.data[0];
                const recordId = apiUrl.split("/").pop();
                resultObj.recordId = recordId;
                resultObj.recordUrl = `${this.base_url}records/${this.collection}/${recordId}`;

                // Basket and lock status
                resultObj.myBasket = basket.contains(this.collection, recordId, this.myBasket);
                resultObj.locked = false;
                //resultObj.checkboxDisabled = !!resultObj.myBasket;

                // Check lock status if user is logged in
                if (this.user && recordId) {
                    const itemLocked = await basket.itemLocked(this.api_prefix, this.collection, recordId);
                    if (itemLocked.locked && itemLocked.by !== this.user) {
                        resultObj.locked = true;
                        //resultObj.checkboxDisabled = true;
                    }
                }

                // For auths, fetch see/seeAlso
                if (this.collection === "auths" && recordId) {
                    const jmarc = await Jmarc.get(this.collection, recordId);
                    let heading = jmarc.fields.filter(x => x.tag.match(/^1/))[0]?.subfields.map(x => x.value).join(" ") || "";
                    resultObj.see = heading === resultObj.value ? "" : heading;
                    resultObj.seeAlso = jmarc.fields.filter(x => x.tag.match(/^5/))
                        .map(x => x.subfields.filter(sf => sf.code === "a").map(sf => sf.value))
                        .flat(2).join(" | ");
                }
            } catch (e) {
                // Optionally handle error
            }
        },
        submitBrowse(idx) {
            const field = this.logicalFields[idx];
            const val = document.getElementById(field).value;
            if (val) {
                const targetUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/browse/${field}?q=${encodeURIComponent(val)}&subtype=${this.subtype}`;
                history.pushState({}, window.location.href);
                setTimeout(() => window.location.href = targetUrl, 0);
            }
        },
        resubmitBrowse(index) {
            const val = document.getElementById("searchAgain").value;
            const targetUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/browse/${index}?q=${encodeURIComponent(val)}&subtype=${this.subtype}`;
            history.pushState({}, window.location.href);
            setTimeout(() => window.location.href = targetUrl, 0);
        },
        toggleSelect(e, result) {
            result.selected = !result.selected;
            if (result.selected) {
                if (!this.selectedRecords.some(r => r.record_id === result.recordId && r.collection === this.collection)) {
                    this.selectedRecords.push({ collection: this.collection, record_id: result.recordId });
                }
            } else {
                const idx = this.selectedRecords.findIndex(r => r.record_id === result.recordId && r.collection === this.collection);
                if (idx !== -1) this.selectedRecords.splice(idx, 1);
            }
        },
        selectAll() {
            [...this.results_before, ...this.results_after].forEach(result => {
                //if (!result.checkboxDisabled) {
                if (!result.myBasket && !result.locked && this.selectedRecords.length < 100) {
                    result.selected = true;
                    if (!this.selectedRecords.some(r => r.record_id === result.recordId && r.collection === this.collection)) {
                        this.selectedRecords.push({ collection: this.collection, record_id: result.recordId });
                    }
                }
            });
        },
        selectNone() {
            [...this.results_before, ...this.results_after].forEach(result => {
                result.selected = false;
            });
            this.selectedRecords = [];
            this.lastSelectedIdx = null;
        },

        // Handle click and drag selection and shift+click and drag selection
        handleMouseDown(e, result, idx) {
            if (e.button !== 0) return;

            if (!e.shiftKey) {
                this.results_before.forEach(r => r.selected = false);
                this.results_after.forEach(r => r.selected = false);
                this.selectedRecords = [];
            }
            if (!result.selected && !result.myBasket && !result.locked) {
                result.selected = true;
                this.selectedRecords.push({ collection: this.collection, record_id: result.recordId });
            }
            this.isDragging = true;
            this.lastSelectedIdx = idx;
        },

        handleMouseMove(e, result, idx) {
            let arr = [...this.results_before, ...this.results_after];
            if (!result.selected && !result.myBasket && !result.locked && this.isDragging) {
                // If dragging, select all records between last selected and current
                if (this.lastSelectedIdx !== null) {
                    const start = Math.min(this.lastSelectedIdx, idx);
                    const end = Math.max(this.lastSelectedIdx, idx);
                    for (let i = start; i <= end; i++) {
                        const rec = arr[i];
                        if (!rec.myBasket && !rec.locked && !rec.selected) {
                            rec.selected = true;
                            this.selectedRecords.push({ collection: this.collection, record_id: rec.recordId });
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
                // Update myBasket and checkboxDisabled for all results
                this.results_before.forEach(r => {
                    r.myBasket = basket.contains(this.collection, r.recordId, this.myBasket);
                    //r.checkboxDisabled = r.myBasket || r.locked;
                    r.selected = false;
                });
                this.results_after.forEach(r => {
                    r.myBasket = basket.contains(this.collection, r.recordId, this.myBasket);
                    //r.checkboxDisabled = r.myBasket || r.locked;
                    r.selected = false;
                });
            }
        },
        async refreshBasket() {
            this.myBasket = await basket.getBasket(this.api_prefix);
        },
        togglePreview(event, recordId) {
            if (this.previewOpen === recordId) {
                this.previewOpen = false;
            } else if (recordId) {
                this.previewOpen = recordId;
            }

            return
        },
        handleScroll() {
            if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                const scrollY = window.scrollY || window.pageYOffset;
                const windowHeight = window.innerHeight;
                const docHeight = document.documentElement.scrollHeight;

                // Load more after results when near bottom
                if (this.hasMoreAfter && !this.loading['after-spinner'] && (scrollY + windowHeight > docHeight - 200)) {
                    this.fetchBrowseResults('after');
                }
            }, 200); // 200ms debounce
        },
    },
    components: {
        'readonlyrecord': readonlyrecord,
        'itemadd': itemaddcomponent
    }
}
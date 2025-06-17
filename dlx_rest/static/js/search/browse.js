import { Jmarc } from "../jmarc.mjs";
import user from "../api/user.js";
import basket from "../api/basket.js";
import { readonlyrecord } from "../readonly_record.js";

export let browsecomponent = {
    props: {
        api_prefix: { type: String, required: true },
        collection: { type: String, required: true },
        index: { type: String, required: false },
        q: { type: String, required: false },
        index_list: { type: String, required: false }
    },
    template: `
    <div class="col pt-2" id="app1" style="background-color:white;">
        <div v-if="q && index">
            <div class="controls-header mb-3 d-flex align-items-center justify-content-between" style="position:sticky;top:0;z-index:10;background:white;">
                <div>
                    <h3 class="mb-0">Browsing {{displaySubtype}}/{{index}} at {{q}}</h3>
                </div>
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
                            <th>See</th>
                            <th>See Also</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(result, idx) in [...results_before, ...results_after]" 
                            :key="result.value + '-' + idx"
                            @mousedown="handleMouseDown($event, result, idx)"
                            @mousemove="handleMouseMove($event, result, idx)"
                            @mouseup="handleMouseUp($event)">
                            <td>
                                <input type="checkbox"
                                    :data-recordid="result.recordId"
                                    v-model="result.selected"
                                    :disabled="result.checkboxDisabled"
                                    @change="toggleSelect($event, result)">
                            </td>
                            <td>
                                <i v-if="result.locked"
                                   :id="result.recordId + '-basket'"
                                   class="fas fa-lock"></i>
                                <i v-else-if="result.myBasket"
                                   :id="result.recordId + '-basket'"
                                   class="fas fa-folder-minus"
                                   @click="toggleBasket($event, result.recordId)"></i>
                                <i v-else
                                   :id="result.recordId + '-basket'"
                                   class="fas fa-folder-plus"
                                   @click="toggleBasket($event, result.recordId)"></i>
                            </td>
                            <td>
                                <div>
                                    <i v-if="previewOpen === result.recordId" class="fas fa-window-close preview-toggle" v-on:click="togglePreview($event, result.recordId)" title="Preview record"></i>
                                    <i v-else class="fas fa-file preview-toggle" v-on:click="togglePreview($event, result.recordId)" title="Preview record"></i>
                                    <readonlyrecord v-if="previewOpen === result.recordId" :api_prefix="api_prefix" :collection="collection" :record_id="result.recordId" class="record-preview"></readonlyrecord>
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
                            </td>
                            <td>{{result.count !== null ? result.count : '' }}</td>
                            <td>{{result.see}}</td>
                            <td>{{result.seeAlso}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="row">
                <div id="after-spinner" class="col d-flex justify-content-center" v-if="loading['after-spinner']">
                    <div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>
                </div>
            </div>
            <!-- Preview modal for mobile/small screens -->
            <div v-if="previewVisible"
                class="modal fade show d-block"
                tabindex="-1"
                style="background:rgba(0,0,0,0.3)"
                @mousedown.self="closePreview">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content" @mousedown.stop>
                        <div class="modal-header">
                            <h5 class="modal-title">Record Preview</h5>
                            <button type="button" class="close" @click="closePreview"><span>&times;</span></button>
                        </div>
                        <div class="modal-body">
                            <readonlyrecord
                                :api_prefix="previewApiPrefix"
                                :collection="previewCollection"
                                :record_id="previewRecordId"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <div class="row"><h3>Browsing {{displaySubtype}}</h3></div>
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
                        <tr v-for="(item, idx) in indexListJson" :key="item">
                            <td>{{item}}</td>
                            <td>
                                <form @submit.prevent="submitBrowse(idx)">
                                    <input autofocus autocomplete="off" :id="item" placeholder="starts with..." type="text" class="form-control input">
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
    data() {
        Jmarc.apiUrl = this.api_prefix;
        let baseUrl = this.api_prefix.replace("/api", "");
        let subtype = this.getSubtype();
        let displaySubtype = subtype === "default" ? this.collection : subtype;
        return {
            results_before: [],
            results_after: [],
            beforeOffset: 0,
            afterOffset: 0,
            hasMoreBefore: true,
            hasMoreAfter: true,
            indexListJson: null,
            base_url: baseUrl,
            subtype,
            displaySubtype,
            user: null,
            myBasket: {},
            loading: { 'before-spinner': true, 'after-spinner': true },
            previewRecordId: null,
            previewCollection: null,
            previewApiPrefix: null,
            previewVisible: false,
            scrollTimeout: null,
            previewOpen: false,
            isDragging: false,
            dragStartIdx: null,
            dragEndIdx: null,
            selectedRecords: [],
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
                '/records/' +
                this.collection +
                '/search?q=' +
                encodeURIComponent(index + ":'" + value + "'") +
                '&subtype=' +
                subtype;
        },
    },
    async created() {
        const myProfile = await user.getProfile(this.api_prefix, 'my_profile');
        if (myProfile) {
            this.user = myProfile.data.email;
            this.myBasket = await basket.getBasket(this.api_prefix);
        }
    },
    async mounted() {
        if (!(this.q && this.index)) {
            this.indexListJson = JSON.parse(this.index_list);
            return;
        }
        document.title += ` Browse (${this.displaySubtype})`;
        await Promise.all([
            this.fetchBrowseResults('before'),
            this.fetchBrowseResults('after')
        ]);
        window.addEventListener('scroll', this.handleScroll);
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
        async fetchBrowseResults(direction) {
            const isBefore = direction === 'before';
            const limit = isBefore ? 3 : 50;
            const compare = isBefore ? 'less' : 'greater';
            const offset = isBefore ? this.beforeOffset : this.afterOffset;
            const url = `${this.api_prefix}marc/${this.collection}/records/browse?subtype=${encodeURIComponent(this.subtype)}&search=${this.index}:${encodeURIComponent(this.q)}&compare=${compare}&limit=${limit}&offset=${offset}`;
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
                        checkboxDisabled: true,
                        recordId: null,
                        count: null,
                        recordUrl: searchUrl,
                        see: "",
                        seeAlso: ""
                    };
                    newResults.push(resultObj);
                    this.updateResultCountAndLink(result, resultObj);
                }
                if (isBefore) {
                    // Reverse so oldest results are at the top, newest at the bottom
                    this.results_before = [...newResults.reverse(), ...this.results_before];
                    this.beforeOffset += newResults.length;
                } else {
                    this.results_after = [...this.results_after, ...newResults];
                    this.afterOffset += newResults.length;
                }
            } catch (error) {
                // Optionally handle error
            } finally {
                this.loading[spinnerId] = false;
            }
        },
        async updateResultCountAndLink(result, resultObj) {
            try {
                const countResp = await fetch(result.count);
                const countJson = await countResp.json();
                const count = countJson.data;
                resultObj.count = count;
                if (count === 1) {
                    const recordResp = await fetch(result.search);
                    const recordJson = await recordResp.json();
                    const apiUrl = recordJson.data[0];
                    const recordId = apiUrl.split("/").pop();
                    resultObj.recordId = recordId;
                    resultObj.recordUrl = `${this.base_url}records/${this.collection}/${recordId}`;
                    if (this.user) {
                        //recordUrl = `${this.base_url}editor?records=${this.collection}/${recordId}`;
                        const inputEl = document.getElementById(`input-${result.value}`);
                        const hiddenInputEl = inputEl?.nextElementSibling;
                        if (hiddenInputEl) hiddenInputEl.value = recordId;
                        // Enable checkbox if not in basket and not locked
                        if (!basket.contains(this.collection, recordId, this.myBasket)) {
                            resultObj.checkboxDisabled = false;
                        }
                        // Disable if locked by someone else
                        const itemLocked = await basket.itemLocked(this.api_prefix, this.collection, recordId);
                        if (itemLocked.locked && itemLocked.by !== this.user) {
                            resultObj.checkboxDisabled = true;
                        }
                    } else {
                        recordUrl = `${this.base_url}records/${this.collection}/${recordId}`;
                    }
                    document.getElementById(`link-${result.value}`).href = recordUrl;
                    // Show see/see also for auths
                    if (this.collection === "auths") {
                        const jmarc = await Jmarc.get(this.collection, recordId);
                        let heading = jmarc.fields.filter(x => x.tag.match(/^1/))[0]?.subfields.map(x => x.value).join(" ") || "";
                        resultObj.see = heading === resultObj.value ? "" : heading;
                        resultObj.seeAlso = jmarc.fields.filter(x => x.tag.match(/^5/))
                            .map(x => x.subfields.filter(sf => sf.code === "a").map(sf => sf.value))
                            .flat(2).join(" | ");
                    }
                }
            } catch (e) {
                // Optionally handle error
            }
        },
        submitBrowse(index) {
            const id = this.indexListJson[index];
            const val = document.getElementById(id).value;
            if (val) {
                const targetUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/browse/${id}?q=${encodeURIComponent(val)}&subtype=${this.subtype}`;
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
                if (!result.checkboxDisabled) {
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
        },
        handleMouseDown(e, result, idx) {
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
            let arr = [...this.results_before, ...this.results_after];
            let [start, end] = [this.dragStartIdx, this.dragEndIdx].sort((a, b) => a - b);
            arr.forEach((r, i) => {
                if (!r.checkboxDisabled) r.selected = (i >= start && i <= end);
                if (r.selected) {
                    if (!this.selectedRecords.some(x => x.record_id === r.recordId && x.collection === this.collection)) {
                        this.selectedRecords.push({ collection: this.collection, record_id: r.recordId });
                    }
                } else {
                    const idx = this.selectedRecords.findIndex(x => x.record_id === r.recordId && x.collection === this.collection);
                    if (idx !== -1) this.selectedRecords.splice(idx, 1);
                }
            });
        },
        sendToBasket(e) {
            e.preventDefault();
            const items = this.selectedRecords.slice(0, 100);
            if (items.length > 0) {
                basket.createItems(this.api_prefix, 'userprofile/my_profile/basket', JSON.stringify(items))
                    .then(() => window.location.reload(false));
            }
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
        dismissPreview: function () {
            for (let d of document.getElementsByClassName("preview")) {
                if (!d.classList.contains("hidden")) {
                    d.classList.toggle("hidden")
                }
            }
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
        readonlyrecord
    }
}
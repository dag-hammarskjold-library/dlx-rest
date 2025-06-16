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
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <div v-if="q && index">
            <div class="row"><h3>Browsing {{displaySubtype}}/{{index}} at {{q}}</h3></div>
            <div class="row" style="position:sticky;top:0;z-index:10;background:white;">
                <form>
                    <div class="form-group">
                        <label for="searchAgain">Your search: </label>
                        <input id="searchAgain" type="text" :value="q">
                        <button type="button mx-2" class="btn btn-primary" @click="resubmitBrowse(index)">Search Again</button>
                    </div>
                </form>
            </div>
            <div class="row" v-if="user">
                Select 
                <a class="mx-1 result-link" href="#" @click="selectAll">All</a>
                <a class="mx-1 result-link" href="#" @click="selectNone">None</a>
                <a class="mx-1 result-link" href="#" @click="sendToBasket">Send Selected to Basket (limit: 100)</a>
            </div>
            <div class="row">
                <div id="before-spinner" class="col d-flex justify-content-center" v-if="loading['before-spinner']">
                    <div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>
                </div>
            </div>
            <div v-for="(result, idx) in results_before" class="row my-2" :key="result.value + '-' + idx">
                <div class="col-1" v-if="user">
                    <input :id="'input-' + result.valueSafe" type="checkbox" :disabled="result.checkboxDisabled" data-toggle="tooltip" title="Select/deselect record"/>
                    <input type="hidden" :value="result.recordId || ''" />
                </div>
                <div class="col">
                    <!-- Preview icon for count == 1 -->
                    <a v-if="result.count === 1 && result.recordId"
                        href="#"
                        @click.prevent="showPreview(result.recordId)"
                        title="Preview record (read-only)"
                        class="ml-2 text-dark">
                        <i class="fas fa-file"></i>
                    </a>
                    <a :id="'link-' + result.valueSafe" :href="result.recordUrl" target="_blank" class="result-link">
                        {{result.value}}&nbsp;
                        <span>
                            <span v-if="result.count !== null">({{result.count}})</span>
                            <i v-else class="fas fa-spinner"></i>
                        </span>
                    </a>
                    <br>
                    <small><em>
                        <span v-if="result.see || result.seeAlso">
                            <span v-if="result.see">see: {{result.see}}<br></span>
                            <span v-if="result.seeAlso">see also: {{result.seeAlso}}</span>
                        </span>
                    </em></small>
                </div>
            </div>
            <div class="row">
                <div class="col-1"></div>
                <div class="col"><i class="fas fa-angle-double-right mr-2 text-success"></i><span class="text-success">{{q}}</span></div>
            </div>
            <div class="row">
                <div id="after-spinner" class="col d-flex justify-content-center" v-if="loading['after-spinner']">
                    <div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>
                </div>
            </div>
            <div v-for="(result, idx) in results_after" class="row my-2" :key="result.value + '-' + idx">
                <div class="col-1" v-if="user">
                    <input :id="'input-' + result.valueSafe" type="checkbox" :disabled="result.checkboxDisabled" data-toggle="tooltip" title="Select/deselect record"/>
                    <input type="hidden" :value="result.recordId || ''" />
                </div>
                <div class="col">
                    <!-- Preview icon for count == 1 -->
                    <a v-if="result.count === 1 && result.recordId"
                        href="#"
                        @click.prevent="showPreview(result.recordId)"
                        title="Preview record (read-only)"
                        class="ml-2 text-dark">
                        <i class="fas fa-file"></i>
                    </a>
                    <a :id="'link-' + result.valueSafe" :href="result.recordUrl" target="_blank" class="result-link">
                        {{result.value}}&nbsp;
                        <span>
                            <span v-if="result.count !== null">({{result.count}})</span>
                            <i v-else class="fas fa-spinner"></i>
                        </span>
                    </a>
                    <br>
                    <small><em>
                        <span v-if="result.see || result.seeAlso">
                            <span v-if="result.see">see: {{result.see}}<br></span>
                            <span v-if="result.seeAlso">see also: {{result.seeAlso}}</span>
                        </span>
                    </em></small>
                </div>
            </div>
            <!-- Preview modal -->
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
    components: {
        readonlyrecord
    },
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
            scrollTimout: null,
        }
    },
    computed: {
        paginationLinks() {
            return [
                { label: "Previous", url: this.prev },
                { label: "Next", url: this.next }
            ];
        }
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
        selectAll(e) {
            e.preventDefault();
            Array.from(document.getElementsByTagName("input"))
                .filter(inputEl => inputEl.type === "checkbox" && !inputEl.disabled)
                .forEach(inputEl => inputEl.checked = true);
        },
        selectNone(e) {
            e.preventDefault();
            Array.from(document.getElementsByTagName("input"))
                .filter(inputEl => inputEl.type === "checkbox")
                .forEach(inputEl => inputEl.checked = false);
        },
        sendToBasket(e) {
            e.preventDefault();
            const items = [];
            let idx = 0;
            Array.from(document.getElementsByTagName("input"))
                .filter(inputEl => inputEl.type === "checkbox" && inputEl.checked)
                .forEach(inputEl => {
                    if (idx < 100) {
                        const record_id = inputEl.nextElementSibling.value;
                        items.push({ collection: this.collection, record_id });
                        idx++;
                    }
                });
            if (items.length > 0) {
                basket.createItems(this.api_prefix, 'userprofile/my_profile/basket', JSON.stringify(items))
                    .then(() => window.location.reload(false));
            }
        },
        showPreview(recordId) {
            this.previewRecordId = recordId;
            this.previewCollection = this.collection;
            this.previewApiPrefix = this.api_prefix;
            this.previewVisible = true;
        },
        closePreview() {
            this.previewVisible = false;
            this.previewRecordId = null;
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
    }
}
import { Jmarc } from "../jmarc.mjs";
import user from "../api/user.js";
import basket from "../api/basket.js";

export let browsecomponent = {
    props: {
        api_prefix: {
            type: String,
            required: true
        },
        collection: {
            type: String,
            required: true
        },
        index: {
            type: String,
            required: false
        },
        q: {
            type: String,
            required: false
        },
        index_list: {
            type: String,
            required: false
        }
    },
    template: `
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <div v-if="q && index">
            <div class="row"><h3>Browsing {{recordType}}/{{index}} at {{q}}</h3></div>
            <div class="row">
                <form>
                <div class="form-group">
                    <label for="searchAgain">Your search: </label>
                    <input id="searchAgain" type="text" :value=q>
                    <button type="button mx-2" class="btn btn-primary" value="Search" @click="resubmitBrowse(index)">Search Again</button></td>
                </div>
                </form>
            </div>
            <nav>
                <ul class="pagination pagination-md justify-content-left">
                    <li v-if="prev" class="page-item"><a class="page-link" :href="prev">Previous</a></li>
                    <li v-else class="page-item disabled"><a class="page-link" href="">Previous</a></li>
                    <li v-if="next" class="page-item"><a class="page-link" :href="next">Next</a></li>
                    <li v-else class="page-item disabled"><a class="page-link" href="">Next</a></li>
                </ul>
            </nav>
            <div class="row" v-if="user">
                Select 
                <a class="mx-1 result-link" href="#" @click="selectAll">All</a>
                <a class="mx-1 result-link" href="#" @click="selectNone">None</a>
                <a class="mx-1 result-link" href="#" @click="sendToBasket">Send Selected to Basket (limit: 100)</a>
            </div>
            <div class="row">
                <div id="before-spinner" class="col d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
            <div v-for="result in results_before" class="row my-2">
                <!-- <div class="col"><a :href="result.url" target="_blank">{{result.value}} ({{result.count}})</a></div> -->
                <div class="col-1" v-if="user">
                    <input :id="'input-' + result.value" type="checkbox" disabled="true" data-toggle="tooltip" title="Select/deselect record"/>
                    <input type="hidden" />
                </div>
                <div class="col">
                    <a :id="'link-' + result.value" :href=result.url target="_blank" class="result-link">
                        {{result.value}}&nbsp;
                        <span :id="'count-' + result.value">
                            <i class="fas fa-spinner"></i>
                        </span>
                    </a>
                    <br>
                    <small>
                        <em>
                            <span :id="'seealso-' + result.value"></span>
                        </em>
                    </small>
                </div>
            </div>
            <div class="row">
                <div class="col-1"></div>
                <div class="col"><i class="fas fa-angle-double-right mr-2 text-success"></i><span class="text-success">{{q}}</span></div>
            </div>
            <div class="row">
                <div id="after-spinner" class="col d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
            <div v-for="result in results_after" class="row my-2">
                <!-- <div class="col"><a :href="result.url" target="_blank">{{result.value}} ({{result.count}})</a></div> -->
                <div class="col-1" v-if="user">
                    <input :id="'input-' + result.value" type="checkbox" disabled="true" data-toggle="tooltip" title="Select/deselect record"/>
                    <input type="hidden" />
                </div>
                <div class="col">
                    <a :id="'link-' + result.value" :href=result.url target="_blank" class="result-link">
                        {{result.value}}&nbsp;
                        <span :id="'count-' + result.value">
                            <i class="fas fa-spinner"></i>
                        </span>
                    </a>
                    <br>
                    <small>
                        <em>
                            <span :id="'seealso-' + result.value"></span>
                        </em>
                    </small>
                </div>
            </div>
            <nav>
                <ul class="pagination pagination-md justify-content-left">
                    <li v-if="prev" class="page-item"><a class="page-link" :href="prev">Previous</a></li>
                    <li v-else class="page-item disabled"><a class="page-link" href="">Previous</a></li>
                    <li v-if="next" class="page-item"><a class="page-link" :href="next">Next</a></li>
                    <li v-else class="page-item disabled"><a class="page-link" href="">Next</a></li>
                </ul>
            </nav>
        </div>
        <div v-else>
        <div class="row"><h3>Browsing {{recordType}}</h3></div>
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
                        <tr v-for="(item, index) in indexListJson">
                            <td>{{item}}</td>
                            <td>
                                <form @submit.prevent="submitBrowse(index)">
                                    <input autofocus autocomplete="off" :id="indexListJson[index]" placeholder="starts with..." type="text" class="form-control input">
                                    
                                </form>
                            </td>
                            <td><button type="button mx-2" class="btn btn-primary" value="Search" @click="submitBrowse(index)">Submit</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>`,
    data: function () {
        Jmarc.apiUrl = this.api_prefix;
        let baseUrl = this.api_prefix.replace("/api", "");
        
        return {
            results_before: [],
            results_after: [],
            search_term: null,
            next: null,
            prev: null,
            indexListJson: null,
            base_url: baseUrl,
            recordType: window.location.search.match(/type=(\w+)/)[1],
            user: null,
            myBasket: {}
        }
    },
    created: async function () {
        let myProfile = await user.getProfile(this.api_prefix, 'my_profile')
        if (myProfile != null) {
            this.user = myProfile.data.email
            await basket.getBasket(this.api_prefix).then( basket => this.myBasket = basket )
        }
    },
    mounted: async function () {
        if (! (this.q && this.index)) {
            this.indexListJson = JSON.parse(this.index_list);
            return
        }

        // todo
        let matches = window.location.search.match(/type=(\w+)/)
        let recordType = this.recordType;

        let beforeBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?type=${this.recordType}&search=${this.index}:${encodeURIComponent(this.q)}&compare=less&limit=3`
        let afterBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?type=${this.recordType}&search=${this.index}:${encodeURIComponent(this.q)}&compare=greater&limit=50`

        document.title = document.title + ` Browse (${this.recordType})`

        for (let url of [beforeBrowse, afterBrowse]) {
            let resultsList = url === beforeBrowse ? this.results_before : this.results_after;
            
            fetch(url)
                .then(response => {
                    return response.json()
                })
            .then(jsondata => {
                let searchStr = decodeURIComponent(jsondata.data[0].search);
                searchStr = searchStr.split('search=')[1]; 
                let field = searchStr.split(":")[0]; // the logical field that is being browsed on

                if (url === beforeBrowse) {
                    this.prev = `${this.base_url}/records/${this.collection}/browse/${field}?type=${this.recordType}&q=${encodeURIComponent(jsondata.data[0].value)}`;
                } else {
                    this.next = `${this.base_url}/records/${this.collection}/browse/${field}?type=${this.recordType}&q=${encodeURIComponent(jsondata.data[jsondata.data.length-1].value)}`;
                }

                for (let result of jsondata.data) {
                    // tanslate api search to app search
                    let searchStr = result.search.split('search=')[1];
                    let searchUrl = `${this.base_url}/records/${this.collection}/search?q=${encodeURIComponent(searchStr)}`;
                    resultsList.push({'value': result.value, 'url': searchUrl});
                    
                    // get the count
                    fetch(result.count).then(response => response.json())
                        .then(json => {
                            let count = json.data;
                            document.getElementById(`count-${result.value}`).innerHTML = `(${count})`;
                        
                            if (count === 1) {
                                // return direct link to record
                                fetch(result.search)
                                    .then(response => response.json())
                                    .then(json => {
                                            let apiUrl = json.data[0];
                                            let parts = apiUrl.split("/");
                                            let recordId = parts[parts.length-1];
                                            let recordUrl;

                                            if (this.user != null) {
                                                recordUrl = `${this.base_url}editor?records=${this.collection}/${recordId}`
                                                let inputEl = document.getElementById(`input-${result.value}`)
                                                let hiddenInputEl = inputEl.nextElementSibling
                                                hiddenInputEl.value = `${recordId}`
                                                
                                                // enable the checkbox if the basket does not contain the record
                                                if (!basket.contains(this.collection, recordId, this.myBasket)) {
                                                    inputEl.disabled = false                                               
                                                }
                                                // But disable it again it's in someone else's basket (locked)
                                                basket.itemLocked(this.api_prefix, this.collection, recordId).then(
                                                    itemLocked => {
                                                        if (itemLocked["locked"] == true && itemLocked["by"] != this.user) {
                                                            inputEl.disabled = true
                                                        }
                                                    }
                                                );
                                                
                                            } else {
                                                recordUrl = `${this.base_url}records/${this.collection}/${recordId}`;
                                            }
                                            
                                            document.getElementById(`link-${result.value}`).href = recordUrl

                                            return recordId
                                    })
                                    .then(recordId => {
                                            if (this.collection !== "auths") return

                                            Jmarc.get(this.collection, recordId).then(jmarc => {
                                                // "see" (the prefLabel)
                                                // skip if this value is the record's prefLabel
                                                // not great way to get the value. to refactor
                                                let textValue = document.getElementById(`link-${result.value}`).innerText;
                                                textValue = textValue.replace(/\s+\(\d+\)$/, "");
                                                let heading = jmarc.fields.filter(x => x.tag.match(/^1/))[0].subfields.map(x => x.value).join(" ");
                                                let see = heading === textValue ? "" : heading;

                                                // "see also" (related)
                                                let seeAlso = 
                                                    jmarc.fields.filter(x => x.tag.match(/^5/))
                                                    .map(x => x.subfields.filter(x => x.code === "a")
                                                    .map(x => x.value))
                                                    .flat(2)
                                                    .join(" | ");

                                                let el = document.getElementById(`seealso-${result.value}`)
                                                el.innerText = see ? `see: ${see}\n` : "";
                                                el.innerText += seeAlso ? `see also: ${seeAlso}` : "";
                                            });
                                    })
                            }
                        }
                    )
                }
            })
            .then(() => {
                let spinner = document.getElementById(url === beforeBrowse ? 'before-spinner' : 'after-spinner');
                spinner.remove()
            })
            .catch(error => {
                let spinner = document.getElementById(url === beforeBrowse ? 'before-spinner' : 'after-spinner');
                spinner.remove()
            });
        }
    },
    methods: {
        submitBrowse(index) {
            let id = this.indexListJson[index]
            let el = document.getElementById(id)
            let val = el.value

            let targetUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/browse/${id}?q=${encodeURIComponent(val)}&type=${this.recordType}`
            if (val) { 
                history.pushState({}, window.location.href);
                setTimeout(function(){
                    window.location.href=targetUrl;
                },0)
            }
        },
        resubmitBrowse(index) {
            let val = document.getElementById("searchAgain").value
            let targetUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/browse/${index}?q=${encodeURIComponent(val)}&type=${this.recordType}`
            history.pushState({}, window.location.href);
            setTimeout(function(){
                window.location.href=targetUrl;
            },0)
        },
        selectAll(e) {
            e.preventDefault()
            for (let inputEl of document.getElementsByTagName("input")) {
                if (inputEl.type == "checkbox" && !inputEl.disabled) {
                    inputEl.checked = true
                }
            }
        },
        selectNone(e) {
            e.preventDefault()
            for (let inputEl of document.getElementsByTagName("input")) {
                if (inputEl.type == "checkbox") {
                    inputEl.checked = false
                }
            }
        },
        sendToBasket(e) {
            e.preventDefault()
            let items = []
            let limit = 100     // Really shouldn't send more than that
            let idx = 0
            for (let inputEl of document.getElementsByTagName("input")) {
                if (inputEl.type == "checkbox" && inputEl.checked) {
                    if (idx >= limit) {
                        continue
                    }
                    let hiddenInputEl = inputEl.nextElementSibling
                    let record_id = hiddenInputEl.value
                    items.push({
                        "collection": `${this.collection}`,
                        "record_id": `${record_id}`
                    })
                    idx++
                }
            }
            if (items.length > 0) {
                basket.createItems(this.api_prefix, 'userprofile/my_profile/basket', JSON.stringify(items)).then( () => window.location.reload(false) )
            }
        }
    }
}
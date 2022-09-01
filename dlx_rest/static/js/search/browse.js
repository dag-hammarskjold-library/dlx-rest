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
        },
        logged_in: {
            type: String,
            required: true
        }
    },
    template: `
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
        <div v-if="q && index">
            <div class="row"><h3>Browsing {{recordType}}/{{index}} at {{q}}</h3></div>
            <nav>
                <ul class="pagination pagination-md justify-content-left">
                    <li v-if="prev" class="page-item"><a class="page-link" :href="prev">Previous</a></li>
                    <li v-else class="page-item disabled"><a class="page-link" href="">Previous</a></li>
                    <li v-if="next" class="page-item"><a class="page-link" :href="next">Next</a></li>
                    <li v-else class="page-item disabled"><a class="page-link" href="">Next</a></li>
                </ul>
            </nav>
            <div class="row">
                <div id="before-spinner" class="col d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
            <div v-for="result in results_before" class="row my-2">
                <!-- <div class="col"><a :href="result.url" target="_blank">{{result.value}} ({{result.count}})</a></div> -->
                <div class="col">
                    <a :id="'link-' + result.value" :href=result.url target="_blank">
                        {{result.value}}&nbsp;
                        <span :id="'count-' + result.value">
                            <i class="fas fa-spinner"></i>
                        </span>
                    </a>
                </div>
            </div>
            <div class="row">
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
                <div class="col ">
                    <a :id="'link-' + result.value" :href=result.url target="_blank">
                        {{result.value}}&nbsp;
                        <span :id="'count-' + result.value">
                            <i class="fas fa-spinner"></i>
                        </span>
                    </a>
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
        let baseUrl = this.api_prefix.replace("/api", "");
        
        return {
            results_before: [],
            results_after: [],
            search_term: null,
            next: null,
            prev: null,
            indexListJson: null,
            base_url: baseUrl,
            recordType: window.location.search.match(/type=(\w+)/)[1]
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

        let beforeBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?type=${this.recordType}&search=${this.index}:${this.q}&compare=less`
        let afterBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?type=${this.recordType}&search=${this.index}:${this.q}&compare=greater`

        for (let url of [beforeBrowse, afterBrowse]) {
            let resultsList = url === beforeBrowse ? this.results_before : this.results_after;
            
            fetch(url).then(
                response => {
                    return response.json()
                }
            ).then(
                jsondata => {
                    let searchStr = decodeURIComponent(jsondata.data[0].search);
                    searchStr = searchStr.split('search=')[1]; 
                    let field = searchStr.split(":")[0]; // the logical field that is being browsed on

                    if (url === beforeBrowse) {
                        this.prev = `${this.base_url}/records/${this.collection}/browse/${field}?type=${this.recordType}&q=${jsondata.data[0].value}`;
                    } else {
                        this.next = `${this.base_url}/records/${this.collection}/browse/${field}?type=${this.recordType}&q=${jsondata.data[jsondata.data.length-1].value}`;
                    }

                    for (let result of jsondata.data) {
                        // tanslate api search to app search
                        let searchStr = result.search.split('search=')[1];
                        let searchUrl = `${this.base_url}/records/${this.collection}/search?q=${searchStr}`;
                        resultsList.push({'value': result.value, 'url': searchUrl});
                        
                        // get the count
                        fetch(result.count).then(
                            response => response.json()
                        ).then(
                            json => {
                                let count = json.data;
                                document.getElementById(`count-${result.value}`).innerHTML = `(${count})`;
                            
                                if (count === 1) {
                                    // return direct link to record
                                    fetch(result.search).then(
                                        response => response.json()
                                    ).then(
                                        json => {
                                            let apiUrl = json.data[0];
                                            let parts = apiUrl.split("/");
                                            let recordId = parts[parts.length-1];
                                            let recordUrl;
                                            
                                            if (this.logged_in) {
                                                recordUrl = `${this.base_url}/editor?records=${this.collection}/${recordId}`
                                            } else {
                                                recordUrl = `${this.base_url}records/${this.collection}/${recordId}`;
                                            }
                                            
                                            document.getElementById(`link-${result.value}`).href = recordUrl
                                        }
                                    )
                                }
                            }
                        )
                    }
                }
            ).then( 
                () => {
                    let spinner = document.getElementById(url === beforeBrowse ? 'before-spinner' : 'after-spinner');
                    spinner.remove()
                }
            ).catch(
                error => {
                    console.log(error)
                }
            );
        }
    },
    methods: {
        submitBrowse(index) {
            let id = this.indexListJson[index]
            let el = document.getElementById(id)
            let val = el.value

            let targetUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/browse/${id}?q=${val}&type=${this.recordType}`
            if (val) { 
                history.pushState({}, window.location.href);
                setTimeout(function(){
                    window.location.href=targetUrl;
                },0)
            }
        }
    }
}
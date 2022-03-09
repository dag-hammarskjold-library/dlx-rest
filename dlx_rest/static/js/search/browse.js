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
            <a><<< Previous</a>
            <!--
            <nav>
                <ul class="pagination pagination-md justify-content-center">
                    <li v-if="prev" class="page-item"><a class="page-link" :href="prev">Previous</a></li>
                    <li v-else class="page-item disabled"><a class="page-link" href="">Previous</a></li>
                    <li v-if="next" class="page-item"><a class="page-link" :href="next">Next</a></li>
                    <li v-else class="page-item disabled"><a class="page-link" href="">Next</a></li>
                </ul>
            </nav>
            -->
            <div class="row">
                <div id="before-spinner" class="col d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
            <div v-for="result in results_before" class="row my-2">
                <div class="col"><a :href="result.url" target="_blank">{{result.value}} ({{result.count}})</a></div>
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
                <div class="col"><a :href="result.url" target="_blank">{{result.value}} ({{result.count}})</a></div>
            </div>
            <div>
                <a>Next >>></a>
            </div>
        </div>
        <div v-else>
            <div class="col pt-2 m-auto" style="background-color:white;">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Logical Field Name</th>
                            <th>Starts with</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in indexListJson">
                            <td>{{item}}</td>
                            <td>
                                <form @submit.prevent="submitBrowse(index)">
                                    <input autofocus autocomplete="off" :id="indexListJson[index]" placeholder="starts with..." type="text">
                                    <button type="button mx-2" class="btn btn-primary" value="Search">Submit</button>
                                </form>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>`,
    data: function () {
        return {
            results_before: [],
            results_after: [],
            search_term: null,
            next: null,
            prev: null,
            indexListJson: null
        }
    },
    mounted: async function () {
        if (this.q && this.index) {
            let beforeBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?search=${this.index}:${this.q}&compare=less`
            let afterBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?search=${this.index}:${this.q}&compare=greater`
            
            // TODO do both less and greater fetches in one block
            
            // Less than
            fetch(beforeBrowse).then(
                response => {
                    return response.json()
                }
            ).then(
                jsondata => {
                    let json = jsondata;
                    //this.prev = json._links._prev;
                    
                    for (let result of json.data) {
                        // tanslate api search to app search
                        let searchStr = result.search.split('search=')[1];
                        let searchUrl = `${this.api_prefix.replace("/api", "")}records/${this.collection}/search?q=${searchStr}`
                        
                        // get the count
                        fetch(result.count).then(
                            response => response.json()
                        ).then(
                            json => {
                                let count = json.data;
                                
                                if (count === 1) {
                                    // return direct link to record
                                    fetch(result.search).then(
                                        response => {
                                            return response.json()
                                        }
                                    ).then(
                                        json => {
                                            let apiUrl = json.data[0];
                                            let parts = apiUrl.split("/");
                                            let recordId = parts[parts.length-1];
                                            let recordUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/${recordId}`;
                                            this.results_before.push({'value': result.value, 'count': count, 'url': recordUrl})
                                        }
                                    )
                                }
                                else {
                                    // return link to search results list
                                    this.results_after.push({'value': result.value, 'count': count, 'url': searchUrl})
                                }
                            }
                        )
                    }
                }
            ).then( 
                () => {
                    let spinner = document.getElementById('before-spinner')
                    spinner.remove()
                }
            );
            
            // Greater than
            fetch(afterBrowse).then(
                response => {
                    return response.json()
                }
            ).then(
                jsondata => {
                    let json = jsondata;
                    //this.next = json._links._next;
                       
                    for (let result of json.data) {
                        // tanslate api search to app search
                        let searchStr = result.search.split('search=')[1];
                        let searchUrl = `${this.api_prefix.replace("/api", "")}records/${this.collection}/search?q=${searchStr}`
                        
                        // get the count
                        fetch(result.count).then(
                            response => response.json()
                        ).then(
                            json => {
                                let count = json.data;
                                
                                if (count === 1) {
                                    // return direct link to record
                                    fetch(result.search).then(
                                        response => {
                                            return response.json()
                                        }
                                    ).then(
                                        json => {
                                            let apiUrl = json.data[0];
                                            let parts = apiUrl.split("/");
                                            let recordId = parts[parts.length-1];
                                            let recordUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/${recordId}`;
                                            this.results_after.push({'value': result.value, 'count': count, 'url': recordUrl})
                                        }
                                    )
                                }
                                else {
                                    // return link to search results list
                                    this.results_after.push({'value': result.value, 'count': count, 'url': searchUrl})
                                }
                            }
                        )
                    }
                }
            ).then( 
                () => {
                    let spinner = document.getElementById('after-spinner')
                    spinner.remove()
                }
            )
        } 
        else {
            this.indexListJson = JSON.parse(this.index_list)
        }
    },
    methods: {
        submitBrowse(index) {
            let id = this.indexListJson[index]
            let el = document.getElementById(id)
            let val = el.value
            let targetUrl = `${this.api_prefix.replace('/api','')}records/${this.collection}/browse/${id}?q=${val}`
            if (val) { 
                history.pushState({}, window.location.href);
                setTimeout(function(){
                    window.location.href=targetUrl;
                },0)
            }
        }
    }
}
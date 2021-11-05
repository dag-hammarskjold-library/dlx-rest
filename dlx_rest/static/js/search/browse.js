export let browsecomponent = {
    props: {
        api_prefix: {
            type: String,
            required: true
        },
        collection: {
            type: String,
            required: false
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
            <nav>
                <ul class="pagination pagination-md justify-content-center">
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
                <div class="col"><a :href="result.url" target="_blank">{{result.value}}</a></div>
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
                <div class="col"><a :href="result.url" target="_blank">{{result.value}}</a></div>
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
                        <tr v-for="item in indexListJson">
                            <td>{{item}}</td>
                            <td>
                                <form @submit.prevent="submitBrowse">
                                    <input id="q" :name="item" v-model="item" type="text" placeholder="starts with..."></input>
                                    <button type="button mx-2" class="btn btn-primary" value="Search">Search</button>
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
            fetch(beforeBrowse).then(response => {
                response.json().then(jsondata => {
                    //this.results_before = jsondata.data
                    for (let result of jsondata.data) {
                        let myRecordId = result.url.split('/').pop()
                        let myUrl = `${this.api_prefix.replace("/api", "")}records/${this.collection}/${myRecordId}`
                        let myValues = result.value.join(" | ")
                        this.results_before.push({'url': myUrl, 'value': myValues})
                    }
                    this.prev = jsondata._links._next
                }).then( () => {
                    let spinner = document.getElementById('before-spinner')
                    spinner.remove()
                })
            })
            fetch(afterBrowse).then(response => {
                response.json().then(jsondata => {
                    this.next = jsondata._links._next
                    for (let result of jsondata.data) {
                        let myRecordId = result.url.split('/').pop()
                        let myUrl = `${this.api_prefix.replace("/api", "")}records/${this.collection}/${myRecordId}`
                        let myValues = result.value.join(" | ")
                        this.results_after.push({'url': myUrl, 'value': myValues})
                    }
                })
            }).then( () => {
                let spinner = document.getElementById('after-spinner')
                spinner.remove()
            })
        } else {
            console.log(this.index_list)
            this.indexListJson = JSON.parse(this.index_list)
        }
    },
    methods: {
        submitBrowse(submitEvent) {
            console.log(submitEvent)
        }
    }
}
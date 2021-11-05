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
            required: true
        },
        q: {
            type: String,
            default: 'a'
        }
    },
    template: `
    <div class="col-sm-8 pt-2" id="app1" style="background-color:white;">
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
    </div>`,
    data: function () {
        return {
            results_before: [],
            results_after: [],
            search_term: null,
            next: null,
            prev: null
        }
    },
    mounted: async function () {
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
    }
}
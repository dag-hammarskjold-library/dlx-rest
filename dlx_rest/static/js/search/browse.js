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
        <div class="row"></div>
        <div class="row">
            <div id="before-spinner" class="col d-flex justify-content-center">
                <div class="spinner-border" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            </div>
        </div>
        <div v-for="result in results_before" class="row">
            <div class="col">{{result.value.join(', ')}}</div>
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
        <div v-for="result in results_after" class="row">
            <div class="col">{{result.value.join(', ')}}</div>
        </div>
    </div>`,
    data: function () {
        return {
            results_before: [],
            results_after: [],
            search_term: null
        }
    },
    mounted: async function () {
        let beforeBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?search=${this.index}:${this.q}&compare=less`
        let afterBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?search=${this.index}:${this.q}&compare=greater`
        fetch(beforeBrowse).then(response => {
            response.json().then(jsondata => {
                this.results_before = jsondata.data
            }).then( () => {
                let spinner = document.getElementById('before-spinner')
                spinner.remove()
            })
        })
        fetch(afterBrowse).then(response => {
            response.json().then(jsondata => {
                this.results_after = jsondata.data
            })
        }).then( () => {
            let spinner = document.getElementById('after-spinner')
            spinner.remove()
        })
    }
}
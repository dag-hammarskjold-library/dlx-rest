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
        <div v-for="result in results_before" class="row">{{result}}</div>
        <div class="row">{{search_term}}</div>
        <div v-for="result in results_after" class="row">{{result}}</div>
    </div>`,
    data: function () {
        return {
            results_before: [],
            results_after: [],
            search_term: null
        }
    },
    created: async function () {
        let beforeBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?search=${this.index}:${this.q}&compare=less`
        let afterBrowse = `${this.api_prefix}marc/${this.collection}/records/browse?search=${this.index}:${this.q}&compare=greater`
        fetch(beforeBrowse).then(response => {
            response.json().then(data => {
                console.log(data)
            })
        })
    }
}
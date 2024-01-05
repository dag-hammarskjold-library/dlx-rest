export let searchresults = {
    props: {
        api_prefix: {
            type: String,
            required: true
        },
        collection: {
            type: String,
            required: true
        },
        results: {
            type: Array
        }
    },
    template:`
    <div>
        <div id="results-list" v-for="result in results" :key="result._id">
            {{result}}
        </div>
    </div>
    `,
    data: function () {
        return {}
    },
    methods: {

    }
}
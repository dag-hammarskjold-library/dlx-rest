export let countcomponent = {
    props: ["api_prefix", "recordId"],
    template: `<span class="lead mx-2">({{search_count}})</span>`,
    data: function() {
        return {
            search_count: 0
        }
    },
    created: async function() {
        let url = `${this.api_prefix}/marc/auths/records/${this.recordId}/use_count?use_type=bibs`;
        const response = await fetch(url);
        const json = await response.json();
        this.search_count = json.data;
    }
}
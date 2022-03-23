/* Used to display the use count in auth search results */

export let countcomponent = {
    props: ["api_prefix", "recordId"],
    template: `<span class="lead mx-2">(<a :href="uiBase + 'records/bibs/search?q=xref:' + recordId">{{search_count}}</a>)</span>`,
    data: function() {
        let uiBase = this.api_prefix.replace("/api", "")
        return {
            search_count: 0,
            uiBase: uiBase
        }
    },
    created: async function() {
        let url = `${this.api_prefix}marc/auths/records/${this.recordId}/use_count?use_type=bibs`;
        const response = await fetch(url);
        const json = await response.json();
        this.search_count = json.data;
    }
}
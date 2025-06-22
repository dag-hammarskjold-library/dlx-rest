/* Used to display the use count in auth search results */
// This could be turned into a Vue mixin or composable if 
// we remove the template 

export let countcomponent = {
    props: ["api_prefix", "recordId"],
    template: `
        <span class="mx-2 count-component">
            <a class="result-link" :href="uiBase + 'records/bibs/search?q=xref:' + recordId + '&subtype=all'" :title="search_count === '⌕' ? 'Use count pending' : ''">({{search_count}})</a>
        </span>
    `,
    data: function() {
        let uiBase = this.api_prefix.replace("/api", "")
        return {
            search_count: "⌕", // search glyph
            uiBase: uiBase
        }
    },
    created: async function() {
        let url = `${this.api_prefix}marc/auths/records/${this.recordId}/use_count?use_type=bibs`;

        fetch(url).then(
            response => response.json()
        ).then(
            json => {
                this.search_count = json.data;
            }
        )
    }
}
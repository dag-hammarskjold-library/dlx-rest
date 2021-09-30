export let countcomponent = {
    props: ['search_name', 'heading_tag', 'lookup_map', 'search_term'],
    template: `<a href="#"><span class="badge badge-secondary">{{search_name}}: {{search_count}}</span></a>`,
    data: function() {
        return {
            search_count: 0
        }
    },
    created: async function() {
        // Find the source of the authority control and run the count search for it
    }
}
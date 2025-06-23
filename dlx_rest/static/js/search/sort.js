export let sortcomponent = {
    props: {
        uibase: String,
        collection: String,
        subtype: String,
        searchTerm: String,
        currentSort: {
            type: String,
            default: 'updated'
        },
        currentDirection: {
            type: String,
            default: 'desc'
        }
    },

    template: `
    <div class="container-fluid pt-1">
        <div class="row d-flex w-100 justify-content-center">
            <div class="col">Sort by</div>
            <div class="col">Direction</div>
        </div>
        <div class="row d-flex w-100 justify-content-center">
            <div class="col">
                <ul class="list-inline">
                    <li v-for="field in sortFields" :key="field.searchString" class="list-inline-item">
                        <a href="#" 
                           @click.prevent="updateSort(field)"
                           :class="['nav-link', 'small', 'p-0', 
                                  { 'disabled': field.searchString === currentSort,
                                    'result-link': field.searchString !== currentSort }]">
                            {{field.displayName}}
                        </a>
                    </li>
                </ul>
            </div>
            <div class="col">
                <ul class="list-inline">
                    <li v-for="dir in sortDirections" :key="dir.searchString" class="list-inline-item">
                        <a href="#"
                           @click.prevent="updateDirection(dir.searchString)"
                           :class="['nav-link', 'small', 'p-0',
                                  { 'disabled': dir.searchString === currentDirection,
                                    'result-link': dir.searchString !== currentDirection }]">
                            {{dir.displayName}}
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            sortFields: this.getSortFields(),
            sortDirections: [
                { displayName: "ascending", searchString: "asc" },
                { displayName: "descending", searchString: "desc" }
            ]
        }
    },

    methods: {
        getSortFields() {
            const vcoll = ["vote", "speech"].includes(this.subtype) ? this.subtype : this.collection;
            const baseFields = [
                { displayName: 'updated', searchString: 'updated', sortDir: 'desc' },
                { displayName: 'created', searchString: 'created', sortDir: 'desc' }
            ];

            const collectionFields = {
                bibs: [
                    { displayName: 'publication date', searchString: 'date', sortDir: 'desc' },
                    { displayName: 'symbol', searchString: 'symbol', sortDir: 'asc' },
                    { displayName: 'title', searchString: 'title', sortDir: 'asc' },
                    { displayName: 'relevance', searchString: 'relevance', sortDir: 'desc' }
                ],
                vote: [
                    { displayName: 'voting date', searchString: 'date', sortDir: 'asc' },
                    { displayName: 'symbol', searchString: 'symbol', sortDir: 'asc' },
                    { displayName: 'body', searchString: 'body', sortDir: 'asc' },
                    { displayName: 'agenda', searchString: 'agenda', sortDir: 'asc' },
                    { displayName: 'relevance', searchString: 'relevance', sortDir: 'desc' }
                ],
                speech: [
                    { displayName: 'meeting date', searchString: 'date', sortDir: 'asc' },
                    { displayName: 'meeting record', searchString: 'symbol', sortDir: 'desc' },
                    { displayName: 'speaker', searchString: 'speaker', sortDir: 'asc' },
                    { displayName: 'country/org', searchString: 'country_org', sortDir: 'asc' },
                    { displayName: 'relevance', searchString: 'relevance', sortDir: 'desc' }
                ],
                auths: [
                    { displayName: 'heading', searchString: 'heading', sortDir: 'asc' }
                ]
            };

            return [...baseFields, ...(collectionFields[vcoll] || [])];
        },

        updateSort(field) {
            this.$emit('sort-changed', {
                sort: field.searchString,
                direction: field.sortDir
            });
        },

        updateDirection(direction) {
            this.$emit('direction-changed', direction);
        }
    }
}
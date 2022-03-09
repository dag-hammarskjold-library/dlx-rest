export let sortcomponent = {
    props: ['uibase', 'collection', 'params'],
    template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white text-center">
        <div class="collapse navbar-collapse" id="resultsNavbarToggle">
            <ul class="navbar-nav mr-auto">
                <li class="nav-item"><a class="nav-link disabled">Results per page:</a></li>
                <li v-for="o in rpp" class="nav-item">
                    <a id="limit" :data-searchString="o.searchString" v-if="o.searchString === parseInt(params.limit)" class="nav-link disabled sortcomponent">{{o.displayName}}</a>
                    <a id="limit" :data-searchString="o.searchString" v-else class="nav-link sortcomponent">{{o.displayName}}</a>
                </li>
                <li class="nav-item"><a class="nav-link disabled">&nbsp;|&nbsp;</a></li>
                <li class="nav-item"><a class="nav-link disabled">Sort:</a></li>
                <li v-for="o in sortFields" class="nav-item">
                    <a id="sort" :data-searchString="o.searchString" v-if="o.searchString === params.sort" class="nav-link disabled sortcomponent">{{o.displayName}}</a>
                    <a id="sort" :data-searchString="o.searchString" v-else class="nav-link sortcomponent">{{o.displayName}}</a>
                </li>
                <li class="nav-item"><a class="nav-link disabled">&nbsp;|&nbsp;</a></li>
                <li class="nav-item"><a class="nav-link disabled">Direction:</a></li>
                <li v-for="o in sortDirections" class="nav-item">
                    <a id="direction" :data-searchString="o.searchString" v-if="o.searchString === params.direction" class="nav-link disabled sortcomponent">{{o.displayName}}</a>
                    <a id="direction" :data-searchString="o.searchString" v-else class="nav-link sortcomponent">{{o.displayName}}</a>
                </li>
            </ul>
        </div>
    </nav>
    `,
    data: function() {
        let mySortFields = [{'displayName':'updated', 'searchString': 'updated'}];
        /* Once we have more fields to use for sorting, we can add them here */
        if (this.collection == "bibs") {
            mySortFields.push({'displayName':'publication date', 'searchString': 'date'});
            mySortFields.push({'displayName':'symbol', 'searchString': 'symbol'});
            mySortFields.push({'displayName':'title', 'searchString': 'title'});
            // sort by relevance only works for free text search
            // TODO disable relevance sort link for non free text searches
            mySortFields.push({'displayName':'relevance', 'searchString': 'relevance'});
        } else if (this.collection == "auths") {
            mySortFields.push({'displayName':'heading', 'searchString': 'heading'})
        }
        if (this.params.search) {
            /* TODO get query "type" from backend [not implemented yet] */
            for (let term of this.params.search.split(/ +/)) {
                if (! term.includes(":") && term !== "AND" && term !== "OR" && term !== "NOT") {
                    // looks like the search contains a free text term
                    this.isFreeText = true
                }
            }
        }
        return {
            rpp: [
                {"displayName": "10", "searchString": 10},
                {"displayName": "50", "searchString": 50},
                {"displayName": "100", "searchString": 100}
            ],
            sortFields: mySortFields,
            sortDirections: [
                {"displayName": "asc", "searchString": "asc"},
                {"displayName": "desc", "searchString": "desc"}
            ],
            freeText: this.isFreeText
        }
    },
    mounted: function() {
        for (let el of document.getElementsByClassName('sortcomponent')) {
            el.href = this.rebuildUrl(el.id, el.getAttribute("data-searchString"));
        }
    },
    methods: {
        rebuildUrl(param, value) {
            let myUrl = `${this.uibase}/records/${this.collection}/search`;
            let myParams = Object.assign({},this.params);
            myParams[param] = value;
            const qs = Object.keys(myParams)
                .map(key => `${key.replace('search','q')}=${encodeURIComponent(myParams[key])}`)
                .join('&');
            return `${myUrl}?${qs}`;
        }
    }
}

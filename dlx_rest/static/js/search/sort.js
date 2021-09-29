export let sortcomponent = {
    props: ['uibase', 'collection', 'params'],
    template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white text-center">
        <div class="collapse navbar-collapse" id="resultsNavbarToggle">
            <ul class="navbar-nav mr-auto">
                <li class="nav-item"><a class="nav-link disabled">Results per page:</a></li>
                <li v-for="o in this.rpp" class="nav-item">
                    <a id="limit" v-if="o === parseInt(params.limit)" class="nav-link disabled sortcomponent">{{o}}</a>
                    <a id="limit" v-else class="nav-link sortcomponent">{{o}}</a>
                </li>
                <li class="nav-item"><a class="nav-link disabled">&nbsp;|&nbsp;</a></li>
                <li class="nav-item"><a class="nav-link disabled">Sort:</a></li>
                <li v-for="o in this.sortFields" class="nav-item">
                    <a id="sort" :data-searchString="o.searchString" v-if="o.searchString === params.sort" class="nav-link disabled sortcomponent">{{o.displayName}}</a>
                    <a id="sort" :data-searchString="o.searchString" v-else class="nav-link sortcomponent">{{o.displayName}}</a>
                </li>
                <li class="nav-item"><a class="nav-link disabled">&nbsp;|&nbsp;</a></li>
                <li class="nav-item"><a class="nav-link disabled">Direction:</a></li>
                <li v-for="o in this.sortDirections" class="nav-item">
                    <a id="direction" v-if="o === params.direction" class="nav-link disabled sortcomponent">{{o}}</a>
                    <a id="direction" v-else class="nav-link sortcomponent">{{o}}</a>
                </li>
            </ul>
        </div>
    </nav>
    `,
    data: function() {
        let mySortFields = [{'displayName':'updated', 'searchString': 'updated'}];
        /* Once we have more fields to use for sorting, we can add them here */
        if (this.collection == "bibs") {
            mySortFields.push({'displayName':'title', 'searchString': 'title'});
            mySortFields.push({'displayName':'symbol', 'searchString': 'symbol'});
            mySortFields.push({'displayName':'publication date', 'searchString': 'date'});
        } else if (this.collection == "auths") {
            mySortFields.push({'displayName':'heading', 'searchString': 'heading'})
        }
        return {
            rpp: [10,50,100,500,1000],
            sortFields: mySortFields,
            sortDirections: ["asc", "desc"]
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

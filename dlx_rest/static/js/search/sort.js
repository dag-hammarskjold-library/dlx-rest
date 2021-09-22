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
                    <a id="sort" v-if="o === params.sort" class="nav-link disabled sortcomponent">{{o}}</a>
                    <a id="sort" v-else class="nav-link sortcomponent">{{o}}</a>
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
        let mySortFields = ['updated'];
        /* Once we have more fields to use for sorting, we can add them here
        if (this.collection == "bibs") {
            mySortFields.push('title')
        } else if (this.collection == "auths") {
            mySortFields.push('heading')
        }
        */
        return {
            rpp: [10,50,100,500,1000],
            sortFields: mySortFields,
            sortDirections: ["asc", "desc"]
        }
    },
    mounted: function() {
        for (let el of document.getElementsByClassName('sortcomponent')) {
            el.href = this.rebuildUrl(el.id, el.innerText);
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

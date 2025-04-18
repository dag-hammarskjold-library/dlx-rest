export let sortcomponent = {
    props: ['uibase', 'collection', 'subtype', 'params'],
    template: `
    <div class="container-fluid pt-1">
        <div class="row d-flex w-100 justify-content-center">
            <div class="col">Results per page</div>
            <div class="col">Sort</div>
            <div class="col" v-if="['bibs','speeches','votes'].includes(vcoll)">Filter</div>
            <div class="col">Direction</div>
        </div>
        <div class="row d-flex w-100 justify-content-center">
            <div class="col">
                <ul class="list-inline">
                    <li v-for="o in rpp" class="list-inline-item">
                        <a id="limit" :data-searchString="o.searchString" v-if="o.searchString === parseInt(params.limit)" class="nav-link disabled sortcomponent small p-0">{{o.displayName}}</a>
                        <a id="limit" :data-searchString="o.searchString" v-else class="nav-link result-link sortcomponent small p-0">{{o.displayName}}</a>
                    </li>
                </ul>
            </div>
            <div class="col">
                <ul class="list-inline">
                    <li v-for="o in sortFields" class="list-inline-item">
                        <a id="sort" :data-searchString="o.searchString" :data-defaultSortDir="o.sortDir" v-if="o.searchString === params.sort" class="nav-link disabled sortcomponent small p-0">{{o.displayName}}</a>
                        <a id="sort" :data-searchString="o.searchString" :data-defaultSortDir="o.sortDir" v-else class="nav-link result-link sortcomponent small p-0">{{o.displayName}}</a>
                    </li>
                </ul>
            </div>
            <div class="col" v-if="['bibs','speeches','votes'].includes(vcoll)">
                <ul class="list-inline">
                    <li class="list-inline-item">
                        <a id="subtype" data-searchString="all" class="nav-link disabled result-link sortcomponent small p-0" v-if="params.subtype==='all'">All</a>
                        <a id="subtype" data-searchString="all" class="nav-link result-link sortcomponent small p-0" v-else>All</a>
                    </li>
                    <li class="list-inline-item">
                        <a id="subtype" data-searchString="default" class="nav-link disabled result-link sortcomponent small p-0" v-if="params.subtype==='default'">Docs & Pubs</a>
                        <a id="subtype" data-searchString="default" class="nav-link result-link sortcomponent small p-0" v-else>Docs & Pubs</a>
                    </li>
                    <li class="list-inline-item">
                        <a id="subtype" data-searchString="speech" class="nav-link disabled result-link sortcomponent small p-0" v-if="params.subtype==='speech'">Speeches</a>
                        <a id="subtype" data-searchString="speech" class="nav-link result-link sortcomponent small p-0" v-else>Speeches</a>
                    </li>
                    <li class="list-inline-item">
                        <a id="subtype" data-searchString="vote" class="nav-link disabled result-link sortcomponent small p-0" v-if="params.subtype==='vote'">Votes</a>
                        <a id="subtype" data-searchString="vote" class="nav-link result-link sortcomponent small p-0" v-else>Votes</a>
                    </li>
                </ul>
            </div>
            <div class="col">
                <ul class="list-inline">
                    <li v-for="o in sortDirections" class="list-inline-item">
                        <a id="direction" :data-searchString="o.searchString" v-if="o.searchString === params.direction" class="nav-link disabled sortcomponent small p-0">{{o.displayName}}</a>
                        <a id="direction" :data-searchString="o.searchString" v-else class="nav-link result-link sortcomponent small p-0">{{o.displayName}}</a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    `,
    data: function() {
        let vcoll = ["vote", "speech"].includes(this.subtype) ? this.subtype : this.collection
        
        if (this.params.search) {
            /* TODO get query "type" from backend [not implemented yet] */
            for (let term of this.params.search.split(/ +/)) {
                if (! term.includes(":") && term !== "AND" && term !== "OR" && term !== "NOT") {
                    // looks like the search contains a free text term
                    this.isFreeText = true
                }
            }
        }
        let mySortFields = [
            {'displayName':'updated', 'searchString': 'updated', 'sortDir': 'desc'},
            {'displayName': 'created', 'searchString': 'created', 'sortDir': 'desc'}
        ];

        if (vcoll === "bibs") {
            mySortFields.push({'displayName':'publication date', 'searchString': 'date', 'sortDir': 'desc'});
            mySortFields.push({'displayName':'symbol', 'searchString': 'symbol', 'sortDir': 'asc'});
            mySortFields.push({'displayName':'title', 'searchString': 'title', 'sortDir': 'asc'});    
            mySortFields.push({'displayName':'relevance', 'searchString': 'relevance', 'sortDir': 'desc'});
        } else if (vcoll === "vote") {
            mySortFields.push({'displayName':'voting date', 'searchString': 'date', 'sortDir': 'asc'});
            mySortFields.push({'displayName':'symbol', 'searchString': 'symbol', 'sortDir': 'asc'});
            mySortFields.push({'displayName':'body', 'searchString': 'body', 'sortDir': 'asc'});
            mySortFields.push({'displayName':'agenda', 'searchString': 'agenda', 'sortDir': 'asc'});
            mySortFields.push({'displayName':'relevance', 'searchString': 'relevance', 'sortDir': 'desc'});
        } else if (vcoll === "speech") {
            mySortFields.push({'displayName':'meeting date', 'searchString': 'date', 'sortDir': 'asc'});
            mySortFields.push({'displayName':'meeting record', 'searchString': 'symbol', 'sortDir': 'desc'});
            mySortFields.push({'displayName':'speaker', 'searchString': 'speaker', 'sortDir': 'asc'});
            mySortFields.push({'displayName':'country/org', 'searchString': 'country_org', 'sortDir': 'asc'});
            mySortFields.push({'displayName':'relevance', 'searchString': 'relevance', 'sortDir': 'desc'});
        } else if (vcoll === "auths") {
            mySortFields.push({'displayName':'heading', 'searchString': 'heading', 'sortDir': 'asc'})
        }

        console.log(vcoll)
        
        return {
            rpp: [
                {"displayName": "100", "searchString": 100},
                {"displayName": "250", "searchString": 250},
                {"displayName": "500", "searchString": 500},
                {"displayName": "1000", "searchString": 1000}
            ],
            sortFields: mySortFields,
            sortDirections: [
                {"displayName": "asc", "searchString": "asc"},
                {"displayName": "desc", "searchString": "desc"}
            ],
            freeText: this.isFreeText,
            vcoll: vcoll
        }
    },
    mounted: function() {
        for (let el of document.getElementsByClassName('sortcomponent')) {
            if (el.id == "sort") {
                let el_href1 = this.rebuildUrl(el.id, el.getAttribute("data-searchString"))
                let el_href2 = el_href1.replace("direction=desc", `direction=${el.getAttribute("data-defaultSortDir")}`).replace("direction=asc", `direction=${el.getAttribute("data-defaultSortDir")}`)
                if (!el_href2.includes("&direction")) {
                    el_href2 += `&direction=${el.getAttribute("data-defaultSortDir")}`
                }
                el.href = el_href2
            } else {
                el.href = this.rebuildUrl(el.id, el.getAttribute("data-searchString"));
            }
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

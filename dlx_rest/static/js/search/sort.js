export let sortcomponent = {
    props: ['uibase', 'collection', 'params'],
    template: `
    <div class="container-fluid pt-1">
        <div class="row d-flex w-100 justify-content-center">
            <div class="col">Results per page</div>
            <div class="col">Sort</div>
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
        let vcoll = "bibs"
        if (this.params.search) {
            /* TODO get query "type" from backend [not implemented yet] */
            for (let term of this.params.search.split(/ +/)) {
                if (! term.includes(":") && term !== "AND" && term !== "OR" && term !== "NOT") {
                    // looks like the search contains a free text term
                    this.isFreeText = true
                }
            }
            if (this.params.search.includes("089:'B22'")) {
                vcoll = "speeches"
            }
            // todo: remove the type cretieria from the search input, update criteria
            if (this.params.search.includes("089:'B23'")) {
                vcoll = "votes"
            }
        }
        let mySortFields = [
            {'displayName':'updated', 'searchString': 'updated', 'sortDir': 'desc'},
            {'displayName': 'created', 'searchString': 'created', 'sortDir': 'desc'}
        ];
        /* Once we have more fields to use for sorting, we can add them here */
        if (this.collection == "bibs") {
            console.log(vcoll)
            if (vcoll == "bibs") {
                mySortFields.push({'displayName':'publication date', 'searchString': 'date', 'sortDir': 'desc'});
                mySortFields.push({'displayName':'symbol', 'searchString': 'symbol', 'sortDir': 'asc'});
                mySortFields.push({'displayName':'title', 'searchString': 'title', 'sortDir': 'asc'});    
            } else if (vcoll == "votes") {
                mySortFields.push({'displayName':'symbol', 'searchString': 'symbol', 'sortDir': 'asc'});
                mySortFields.push({'displayName':'body', 'searchString': 'body', 'sortDir': 'asc'});
                mySortFields.push({'displayName':'agenda', 'searchString': 'agenda', 'sortDir': 'asc'});
            } else if (vcoll == "speeches") {
                mySortFields.push({'displayName':'meeting date', 'searchString': 'date', 'sortDir': 'asc'});
                mySortFields.push({'displayName':'meeting record', 'searchString': 'symbol', 'sortDir': 'desc'});
                mySortFields.push({'displayName':'speaker', 'searchString': 'speaker', 'sortDir': 'asc'});
                mySortFields.push({'displayName':'country/org', 'searchString': 'country_org', 'sortDir': 'asc'});
            }
            mySortFields.push({'displayName':'relevance', 'searchString': 'relevance', 'sortDir': 'desc'});
        } else if (this.collection == "auths") {
            mySortFields.push({'displayName':'heading', 'searchString': 'heading', 'sortDir': 'asc'})
        }
        
        return {
            rpp: [
                {"displayName": "10", "searchString": 10},
                {"displayName": "25", "searchString": 25},
                {"displayName": "50", "searchString": 50},
                {"displayName": "100", "searchString": 100},
                {"displayName": "1000", "searchString": 1000}
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
            if (el.id == "sort") {
                let el_href1 = this.rebuildUrl(el.id, el.getAttribute("data-searchString"))
                let el_href2 = el_href1.replace("direction=desc", `direction=${el.getAttribute("data-defaultSortDir")}`).replace("direction=asc", `direction=${el.getAttribute("data-defaultSortDir")}`)
                if (!el_href2.includes("&direction")) {
                    el_href2 += `&direction=${el.getAttribute("data-defaultSortDir")}`
                }
                console.log("hrefs", el_href1, el_href2)
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

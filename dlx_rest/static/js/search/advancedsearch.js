export let advancedsearchform = {
    props: ["collection", "api_prefix"],
    template: `
    <div id="advanced-search" class="row pt-2">
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <button id="searchType1" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">All of the words:</button>
                <div class="dropdown-menu">
                    <option class="dropdown-item" v-for="t in searchTypes" :value=t.value @click="setParameter('searchType1',t)">{{t.name}}</option>
                </div>
            </div>
            <input id="searchTerm1" type="text" class="form-control" aria-label="Text input with dropdown button" v-model="advancedParams.searchTerm1" @keydown.enter="submitAdvancedSearch">
            <div class="input-group-prepend"><span class="input-group-text">in</span></div>
            <div class="input-group-prepend">
                <button id="searchField1" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">any field</button>
                <div class="dropdown-menu">
                    <option class="dropdown-item" v-for="field in searchFields" @click="setParameter('searchField1',field)">{{field}}</option>
                </div>
            </div>
            <div class="input-group-append">
                <button id="searchConnector1" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">AND</button>
                <div class="dropdown-menu">
                    <option class="dropdown-item" value="AND" @click="setParameter('searchConnector1','AND')">AND</option>
                    <option class="dropdown-item" value="OR" @click="setParameter('searchConnector1','OR')">OR</option>
                    <option class="dropdown-item" value="ANDNOT" @click="setParameter('searchConnector1','AND NOT')">AND NOT</option>
                    <option class="dropdown-item" value="ORNOT" @click="setParameter('searchConnector1','OR NOT')">OR NOT</option>
                </div>
            </div>
        </div>
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <button id="searchType2" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">All of the words:</button>
                <div class="dropdown-menu">
                    <option class="dropdown-item" v-for="t in searchTypes" :value=t.value @click="setParameter('searchType2', t)">{{t.name}}</option>
                </div>
            </div>
            <input id="searchTerm2" type="text" class="form-control" aria-label="Text input with dropdown button" v-model="advancedParams.searchTerm2" @keydown.enter="submitAdvancedSearch">
            <div class="input-group-prepend"><span class="input-group-text">in</span></div>
            <div class="input-group-prepend">
                <button id="searchField2" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">any field</button>
                <div class="dropdown-menu">
                    <option class="dropdown-item" v-for="field in searchFields" @click="setParameter('searchField2',field)">{{field}}</option>
                </div>
            </div>
            <div class="input-group-append">
                <button id="searchConnector2" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">AND</button>
                <div class="dropdown-menu">
                    <option class="dropdown-item" value="AND" @click="setParameter('searchConnector2','AND')">AND</option>
                    <option class="dropdown-item" value="OR" @click="setParameter('searchConnector2','OR')">OR</option>
                    <option class="dropdown-item" value="ANDNOT" @click="setParameter('searchConnector1','AND NOT')">AND NOT</option>
                    <option class="dropdown-item" value="ORNOT" @click="setParameter('searchConnector1','OR NOT')">OR NOT</option>
                </div>
            </div>
        </div>
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <button id="searchType3" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">All of the words:</button>
                <div class="dropdown-menu">
                    <option class="dropdown-item" v-for="t in searchTypes" :value=t.value @click="setParameter('searchType3', t)">{{t.name}}</option>
                </div>
            </div>
            <input id="searchTerm3" type="text" class="form-control" aria-label="Text input with dropdown button" v-model="advancedParams.searchTerm3" @keydown.enter="submitAdvancedSearch">
            <div class="input-group-prepend"><span class="input-group-text">in</span></div>
            <div class="input-group-append">
                <button id="searchField3" class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">any field</button>
                <div class="dropdown-menu">
                    <option class="dropdown-item" v-for="field in searchFields" @click="setParameter('searchField3',field)">{{field}}</option>
                </div>
            </div>
        </div>
        <input class="btn btn-primary" type="submit" id="search-btn" value="Search" @click="submitAdvancedSearch">
    </div>`,
    data: function() {
        return {
            advancedParams: {
                'searchType1': 'all',
                'searchTerm1': null,
                'searchField1': 'any',
                'searchConnector1': 'AND',
                'searchType2': 'all',
                'searchTerm2': null,
                'searchField2': 'any',
                'searchConnector2': 'AND',
                'searchType3': 'all',
                'searchTerm3': null,
                'searchField3': 'any'
            },
            searchFields: [],
            searchTypes: [
                {'name': 'All of the words:', 'value': 'all'},
                {'name': 'Any of the words:', 'value': 'any'},
                {'name': 'Exact phrase:', 'value': 'exact'},
                {'name': 'Partial phrase:', 'value': 'partial'},
                {'name': 'Regular expression:', 'value': 'regex'},
            ],
        }
    },
    methods: {
        submitAdvancedSearch(e) {
            return true
        }
    }
}
export let simplesearchform = {
    props: ["collection", "api_prefix"],
    template: `
    <div id="simple-search" class="row pt-2">
        <form class="form-inline mr-auto col-lg-12" :action="action">
            <input id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :placeholder="'Search ' + collection + ' collection'" aria-label="Search this collection" v-model="searchTerm" @keyup="updateParentSearchQuery">
            <input v-for="v,k in params" type="hidden" :id="k" :name="k" :value="v">
            <button class="btn btn-primary" type="submit" id="search-btn" value="Search">Search</button>
            <button class="btn btn-sm btn-default" type="button" value="Cancel search" title="Cancel" v-on:click="$emit('cancel')">
                <span>X</span>
            </button>
        </form>    
    </div>`,
    data: function() {
        let myUIBase = this.api_prefix.replace('/api/','')
        return {
            params: {},
            searchTerm: "",
            action: `${myUIBase}/records/${this.collection}/search`,
        }
    },
    created: function() {
        const url = new URL(window.location)
        this.searchTerm = url.searchParams.get("q")
    },
    methods: {
        updateParentSearchQuery() {
            this.$parent.searchTerm = this.searchTerm
            this.$parent.updateSearchQuery()
        }
    }
}
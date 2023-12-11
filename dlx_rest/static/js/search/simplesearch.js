export let simplesearchform = {
    props: ["collection", "api_prefix"],
    template: `
    <div id="simple-search" class="row pt-2">
        <form class="form-inline mr-auto col-lg-12" :action="action">
            <input v-if="params.search" id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :aria-label="'Search ' + collection + ' collection'" :value="params.search">
            <input v-else id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :placeholder="'Search ' + collection + ' collection'" aria-label="Search this collection">
            <input v-for="v,k in params" type="hidden" :id="k" :name="k" :value="v">
            <button class="btn btn-primary" type="submit" id="search-btn" value="Search">Search</button>
            <button class="btn btn-sm btn-default" type="button" value="Cancel search" title="Cancel" v-on:click="cancelSearch()">
                <span>X</span>
            </button>
        </form>    
    </div>`,
    data: function() {
        let myUIBase = this.api_prefix.replace('/api/','')
        return {
            params: {},
            action: `${myUIBase}/records/${this.collection}/search`,
        }
    }
}
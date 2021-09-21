export let searchcomponent = {
    // onclick="addRemoveBasket("add","{{record['id']}}","{{coll}}","{{prefix}}")"
    props: {
        prefix: {
            type: String,
            required: true
        },
        search_url: {
            type: String,
            required: true
        },
        collection: {
            type: String,
            required: true
        },
        q: {
            type: String
        }
    },
    template: ` 
    <div class="col-sm-10 pt-2" id="app1" style="background-color:white;">
        <div class="row">
            <form class="form-inline mr-auto col-lg-12" :action="action">
                <input v-if="q" id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :aria-label="'Search ' + collection + ' collection'" :value="q">
                <input v-else id="q" name="q" class="form-control mr-sm-2 col-lg-10" type="search" :placeholder="'Search ' + collection + ' collection'" aria-label="Search this collection">
                <button class="btn btn-primary" type="submit" id="search-btn" value="Search">Search</button>
            </form>
        </div>
        <div v-for="result in this.results" :key="result._id">
            <div class="row pt-2 border-bottom">
                <div class="col-sm-11">
                    <div class="row">
                        <a class="lead" href="#">
                            {{result.first_line}}
                        </a>
                    </div>
                    <div class="row">
                        <p>{{result.second_line}}</p>
                    </div>
                </div>
                <div class="col-sm-1">
                    <!-- need to test if authenticated here -->
                    <div class="row ml-auto">
                        <a><i :id="'icon-' + collection + '-' + result._id" class="fas fa-folder-plus addRemoveIcon" data-toggle="tooltip" title="Add to your basket"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </div>`,
    created: async function() {
        let response = await fetch(this.search_url);
        if (response.ok) {
            let jsonData = await response.json();
            this.links = jsonData["_links"];
            for (let result of jsonData["data"]) {
                let myResult = { "_id": result["_id"]}
                if (this.collection == "bibs") {
                    myResult["first_line"] = result["title"]
                    myResult["second_line"] = [result["types"], result["date"], result["symbol"]].join(" | ")
                } else if (this.collection == "auths") {
                    myResult["first_line"] = result["heading"]
                    myResult["second_line"] = result["alt"]
                } else if (this.collection == "files") {
                    // not implemented yet
                }
                this.results.push(myResult);
            }
        }
    },
    data: function () {
        return {
            visible: true,
            results: [],
            links: {},
            action: `/records/${this.collection}`
        }
    },
    methods: {
        buildPagination() {

        },
        buildCount() {

        }
    }
}
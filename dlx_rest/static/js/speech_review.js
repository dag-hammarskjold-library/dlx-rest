import { sortcomponent } from "./search/sort.js";
import { countcomponent } from "./search/count.js";
import basket from "./api/basket.js";
import user from "./api/user.js";

export let speechreviewcomponent = {
    props: {
        api_prefix: {
            type: String,
            required: true
        }
    },
    template: `<div class="col pt-2" id="app1" style="background-color:white;">
    <div class="col text-center">
        <h1>Speech Review</h1>
        <form>
            <label for="speechSearch">Search Speeches</label>
            <div class="input-group mb-3">
                <input id="speechSearch" type="text" class="form-control" aria-label="Search Speeches">
                <div class="input-group-append">
                    <a class="btn btn-outline-secondary" type="button" @click="submitSearch">Submit</a>
                </div>
            </div>
        </form>
    </div>
    <div class="col">
        <div v-if="submitted">{{speeches.length}} results</div>
        <div class="mx-2" v-if="speeches.length > 0"></div>
        <table class="table table-sm table-striped table-hover" v-if="speeches.length > 0">
            <thead>
                <tr>
                    <th scope="col">Meeting Record (791) 
                        <i data-target="symbol" class="fas fa-sort-alpha-up ml-1 text-secondary" @click="processSort($event, 'symbol','asc')"></i>
                        <i data-target="symbol" class="fas fa-sort-alpha-down ml-1 text-secondary" @click="processSort($event, 'symbol','desc')"></i>
                    </th>
                    <th scope="col">Speaker (700)
                        <i data-target="speaker" class="fas fa-sort-alpha-up ml-1 text-secondary" @click="processSort($event, 'speaker','asc')"></i>
                        <i data-target="speaker" class="fas fa-sort-alpha-down ml-1 text-secondary" @click="processSort($event, 'speaker','desc')"></i>
                    </th>
                    <th scope="col">Country/Organization (710 or 711)
                        <i data-target="country" class="fas fa-sort-alpha-up ml-1 text-secondary" @click="processSort($event, 'country','asc')"></i>
                        <i data-target="country" class="fas fa-sort-alpha-down ml-1 text-secondary" @click="processSort($event, 'country','desc')"></i>
                    </th>
                    <th scope="col">Date (992 or 269)
                        <i data-target="date" class="fas fa-sort-alpha-up ml-1 text-secondary" @click="processSort($event, 'date','asc')"></i>
                        <i data-target="date" class="fas fa-sort-alpha-down ml-1 text-secondary" @click="processSort($event, 'date','desc')"></i>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="speech in sortedSpeeches" :key="speech._id">
                    <td>{{speech.symbol}}</td>
                    <td>{{speech.speaker}}</td>
                    <td>{{speech.country}}</td>
                    <td>{{speech.date}}</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>`,
    data: function() {
        return {
            speeches: [],
            params: {},
            submitted: false,
            sortColumns: [
                {column: "symbol", direction: "desc"}
            ]
        }
    },
    computed: {
        sortedSpeeches: function() {
            return this.speeches.sort((a,b) => {
                console.log(this.sortColumns.length)
                if (this.sortColumns.length === 1) {
                    if (this.sortColumns[0].direction == "asc") {
                        return a[this.sortColumns[0].column].localeCompare(b[this.sortColumns[0].column]) 
                    } else { 
                        return b[this.sortColumns[0].column].localeCompare(a[this.sortColumns[0].column]) 
                    }
                }
            })
        }
    },
    methods: {
        submitSearch() {
            let q = document.getElementById("speechSearch").value
            let qs = encodeURIComponent(["089:B22",q].join(" AND "))
            let search_url = `${this.api_prefix}marc/bibs/records?search=${qs}&format=brief_speech&start=1&limit=1000`
            fetch(search_url).then(response => {
                response.json().then(jsonData => {
                    this.speeches = jsonData.data
                }).then( () => {
                    this.submitted = true
                })
            })
        },
        processSort: function(e, column, direction) {
            /*
            // Figure out if the shift key was pressed with the sort select. If so, add the column to this.sortColumns
            let sortCharacterization = `${column}${direction}`
            if (e.shiftKey) {
                // Lock or unlock the column
                console.log("Toggling lock state")
                if (this.sortColumns.includes({column: column, direction: direction})) {
                    this.sortColumns = this.sortColumns.filter(x => x.columnn !== column && x.direction !== direction)
                } else {
                    this.sortColumns.push({column: column, direction: direction})
                }
            }
            console.log(sortCharacterization, this.sortColumns)

            // Now iterate through this.sortColumns if its length is > 0 and apply sorting in order

            // Otherwise just do a simple single column sort
            if (direction == "asc") {
                return this.speeches.sort((a,b) => { 
                    return a[column].localeCompare(b[column]) 
                })
            }
            else {
                return this.speeches.sort((a,b) => { 
                    return b[column].localeCompare(a[column]) 
                })
            }
            */
        }
    },
    components: {
        'sortcomponent': sortcomponent, 
        'countcomponent': countcomponent
    }
}
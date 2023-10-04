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
        <form @submit.prevent="submitSearch">
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
        <div v-if="speeches.length > 0">Sorting:<span class="mx-1" v-for="sc in sortColumns">{{sc.column}}: {{sc.direction}}</span></div>
        <table class="table table-sm table-striped table-hover" v-if="speeches.length > 0">
            <thead>
                <tr>
                    <th scope="col"></th>
                    <th scope="col">#</th>
                    <th scope="col" @click="processSort($event, 'symbol')">Meeting Record (791)
                        <i data-target="symbol" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="symbol-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col" @click="processSort($event, 'date')">Date (992 or 269)
                        <i data-target="date" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="date-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col" @click="processSort($event, 'speaker')">Speaker (700)
                        <i data-target="speaker" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="speaker-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                    <th scope="col" @click="processSort($event, 'country')">Country/Organization (710 or 711)
                        <i data-target="country" class="fas fa-sort-alpha-up text-secondary"></i>
                        <span id="country-badge" class="badge badge-pill badge-dark">0</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(speech, index) in sortedSpeeches" :key="speech._id">
                    <td><input type="checkbox" :data-recordid="speech._id"></td>
                    <td>{{index + 1}}</td>
                    <td>{{speech.symbol}}</td>
                    <td>{{speech.date}}</td>
                    <td>{{speech.speaker}}</td>
                    <td>{{speech.country}}</td>
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
            sortColumns: []
        }
    },
    computed: {
        sortedSpeeches: function () {
            return this.speeches.sort( (a, b) => {
                for (const i in this.sortColumns) {
                    const column = this.sortColumns[i].column
                    const direction = this.sortColumns[i].direction
                    let comparison = a[column].localeCompare(b[column])
                    if (direction == "desc") {
                        comparison *= -1
                    }
                    if (comparison !== 0) {
                        return comparison
                    }
                }
                return 0
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
        processSort: function(e, column) {
            // reset sort indicators
            for (let i of document.getElementsByTagName("i")) {
                i.classList.replace("text-dark", "text-secondary")
            }
            // reset badges
            for (let b of document.getElementsByClassName("badge")) {
                b.innerText = "0"
            }
            // reset other variables
            //this.sortColumns = []
            let existingColumn = this.sortColumns.find((sc) => sc.column === column)
            if (existingColumn) {
                if (e.shiftKey) {
                    let direction = ""
                    existingColumn.direction == "asc" ? direction = "desc" : direction = "asc"
                    if (existingColumn.direction === direction) {
                        // This column and direction alreday exist in this.sortColumns, so we want to remove the object
                        this.sortColumns.splice(existingColumn)
                    } else {
                        // Otherwise we are changing the sort direction
                        existingColumn.direction = direction
                    }
                } else {                    
                    existingColumn.direction == "asc" ? existingColumn.direction = "desc" : existingColumn.direction = "asc"
                    this.sortColumns = [existingColumn]
                }
            } else {
                if (e.shiftKey) {
                    this.sortColumns.push({column: column, direction: "asc"})
                } else {
                    this.sortColumns = [{column:column, direction:"asc"}]
                }
            }
            var idx = 1
            for (let sc of this.sortColumns) {
                for (let i of document.getElementsByTagName("i")) {
                    if (i.getAttribute("data-target") == sc.column) {
                        sc.direction === "desc" ? i.classList.replace("fa-sort-alpha-up", "fa-sort-alpha-down") : i.classList.replace("fa-sort-alpha-down", "fa-sort-alpha-up")
                        i.classList.replace("text-secondary", "text-dark")
                        let badge = document.getElementById(`${sc.column}-badge`)
                        console.log(badge)
                        badge.innerText = idx
                        idx++
                    }
                }
            }
        }
    },
    components: {
        'sortcomponent': sortcomponent, 
        'countcomponent': countcomponent
    }
}
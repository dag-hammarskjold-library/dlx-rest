//import { basket } from '../api/basket.js' 
import { Jmarc } from '../jmarc.mjs'

/* 
Modal for batch editing records using basket functionality
*/

export let batcheditmodal = {
    props: ["api_prefix"],
    template: `
        <div class="modal fade" id="batchActions" role="dialog" aria-labelledby="batchActionsModalTitle" aria-hidden="true">
            <div v-if="confirm" class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">Results</div>
                    <div class="modal-body">
                        <div class="row" v-for="result in results">
                            <div class="col">
                                {{result.record}}
                                <p v-for="field in result.fields">{{field.field}} -- {{field.message}}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Okay</button>
                    </div>
                </div>
            </div>
            <div v-else class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="batchActionsModalTitle"><i class="fas fa-tasks pr-2" />Basket Update</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <h6>Select Action</h6>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" id="add" name="actions" value="add" checked @change="includeReferrer=false">
                        <label class="form-check-label" for="add">Add</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" id="delete" name="actions" value="delete" @change="includeReferrer=true">
                        <label class="form-check-label" for="delete">Delete</label>
                    </div>
                    <div class="row pt-1" v-if="selectedFields.length == 0">
                        <div class="col">You have no selected fields</div>
                    </div>
                    <h6 class="pt-1" v-else>These fields:</h6>
                    <div class="row">
                        <div class="col"><p v-for="field in selectedFields" :key="field.tag">{{field.tag}} {{field.toStr()}}</p></div>
                    </div>
                    <div class="row pt-2">
                        <div class="col">
                            <h6>Select records from the basket:</h6>
                            <div class="row">
                                <div class="col">
                                Select <a href="#" @click="select" id="all">All</a> or <a href="#" @click="select" id="none">None</a>
                                </div>
                            </div>
                            <table class="table table-striped table-hover">
                                <tbody>
                                <tr v-for="item in basketItems" :key="item._id">
                                    <td>
                                        <input v-if="matchesReferrer(item.collection, item._id) && includeReferrer" class="field-checkbox record-selector" type="checkbox" :id="item._id" :data-collection="item.collection" @click="toggleSelect">
                                        <input v-if="!matchesReferrer(item.collection, item._id)" class="field-checkbox record-selector" type="checkbox" :id="item._id" :data-collection="item.collection" @click="toggleSelect">
                                    </td>
                                    <td><label class="form-check-label" :for="item._id">{{item.title}} ({{item.collection}}/{{item._id}})</label></td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" v-if="selectedFields.length > 0" @click="applySelection" id="batchUpdateSubmit" disabled>Apply</button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
                </div>
            </div>
        </div>`,
    data: function () {
        return {
            referringRecord: null,
            includeReferrer: false,
            basketItems: [],
            selectedFields: [],
            selectedRecords: [],
            confirm: false,
            results: []
        }
    },
    emits: ['update-records'],
    created: function () {
        this.basketItems = this.$root.$refs.basketcomponent.basketItems
    },
    watch: {
        selectedRecords() {
            let button = document.getElementById("batchUpdateSubmit")
            if (button) {
                button.disabled = this.selectedRecords.length == 0
            }
        },
        includeReferrer() {
            if (!this.includeReferrer) {
                this.selectedRecords.splice(this.selectedRecords.indexOf(this.referringRecord), 1)
            }
        }
    },
    methods: {
        matchesReferrer: function (collection, recordId) {
            let testRecord = [collection, recordId].join("/")
            return testRecord === this.referringRecord
        },
        toggleSelect(event) {
            let record = [event.target.dataset.collection, event.target.id].join("/")
            if (event.target.checked) {
                this.selectedRecords.push(record)
            } else {
                this.selectedRecords.splice(this.selectedRecords.indexOf(record), 1)
            }
        },
        select(event) {
            event.preventDefault()
            let which = event.target.id
            let checkboxes = document.querySelectorAll('input.record-selector[type="checkbox"]')
            for (let checkbox of checkboxes) {
                let record = [checkbox.dataset.collection, checkbox.id].join("/")
                if (which == "all") {
                    if (checkbox.checked == false) {
                        checkbox.checked = true
                        this.selectedRecords.push(record)
                    }
                } else if (which == "none") {
                    checkbox.checked = checkbox.checked == false ? false : false
                    this.selectedRecords.splice(this.selectedRecords.indexOf(record), 1)
                }
            }
        },
        applySelection() {
            // Find which radio button is selected and call the corresponding function when the Update Records button is clicked
            let selected = document.querySelector('input[name="actions"]:checked').value
            if (this.selectedRecords.length > 0) {
                if (selected == "add") {
                    this.addToAll(this.selectedFields, this.selectedRecords)
                } else if (selected == "delete") {
                    this.deleteFromAll(this.selectedFields, this.selectedRecords)
                }
            } else {
                alert("Please select at least one record")
            }
        },
        addToAll(selectedFields, selectedRecords) {
            // Add the selected fields to the selected records in the basket
            // We need jmarc for each of the selected records, which we will update
            // by adding the selected fields.
            // ** TODO: Make all the messaging consistent **
            // Initialize Jmarc 
            Jmarc.api_prefix = this.api_prefix

            // 
            for (let record of selectedRecords) {
                let collection = record.split("/")[0]
                let recordId = record.split("/")[1]
                let result = {"record": record, "fields": []}
                // Fetch the record using Jmarc
                
                Jmarc.get(collection, recordId).then((jmarc) => {
                    // iterate through the selected fields and add them to the record
                    for (let field of selectedFields) {
                        // add the field to the record
                        // jmarc add field from the field object 
                        // Validate here at the field level
                        //let validationFlags = jmarc.validationWarnings()
                        
                        if (validationFlags.length > 0) {
                            // We have an error
                            result["fields"].push({"field": field.to_string(), "status": "error", "message": validationFlags })
                        } else {
                            // update the results returned 
                            result["fields"].push({"field": field.to_string(), "status": "OK", "message": null}) 
                        }
                        this.results.push(result)
                    }
                }).then((jmarc) => {
                    // Try to save the record now
                    /*
                    jmarc.put().then({

                    }).catch((err) => {

                    })
                    */
                }).catch( (err) => {
                    // Encountered an error, so note it for later
                })
            }
            // Show the confirmation screen
            this.confirm = true

            // If nothing else has been emitted by this point, return a processed response
            this.$emit('update-records', { "action": "add", "status": "processed", "results": this.results })  
        },
        deleteFromAll(selectedFields, selectedRecords) {
            // Delete the selected fields from the selected records in the basket
            // We need jmarc for each of the selected records, which we will update
            // by deleting the selected fields.

            // Show the confirmation screen
            this.confirm = true

            // If nothing else has been emitted by this point, return a processed response
            this.$emit('update-records', { "action": "delete", "status": "processed", "results": this.results } )
        }
    }
}
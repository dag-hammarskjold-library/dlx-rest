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
                                {{result}}
                                <!-- <p v-for="field in result.fields">{{field.field}} -- {{field.message}}</p> -->
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
        // Initialize Jmarc 
        Jmarc.api_prefix = this.api_prefix
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
        async addToAll(selectedFields, selectedRecords) {
            // Add the selected fields to the selected records in the basket
            // We need jmarc for each of the selected records, which we will update
            // by adding the selected fields.
            // ** TODO: Make all the messaging consistent **
            
            // collect the promises so we can await all of them in parrallel
            let promises = []
            
            for (let record of selectedRecords) {
                let collection = record.split("/")[0]
                let recordId = record.split("/")[1]
                // add the promise to the list
                promises.push(Jmarc.get(collection, recordId))
            }

            let jmarcRecords  = await Promise.all(promises)

            for (let jmarc of jmarcRecords) {
                let result = {"record": `${jmarc.collection}/${jmarc.recordId}`, "fields": []}
                
                // iterate through the selected fields and add them to the record
                for (let field of selectedFields) {
                    // add a copy of the field, not the reference to the origianl field object
                    // todo: add this as a clone field method in Jmarc
                    let newField = jmarc.createField(field.tag)

                    let subfields = []
                    for (let subfield of field.subfields) {
                        let newSubfield = newField.createSubfield(subfield.code)
                        if (subfield.xref !== undefined) {
                            newSubfield.xref = subfield.xref
                            subfields.push({"code": subfield.code, xref: subfield.xref})
                        } else {
                            newSubfield.value = subfield.value
                            subfields.push({"code": subfield.code, "value": subfield.value})
                        }
                    }
                    result["fields"].push({"field": field.tag, "subfields": subfields})
                }

                let validationFlags = jmarc.allValidationWarnings() // new method added to Jmarc to get flags at all levels (record, field, subfield)
                console.log(validationFlags)
                if (validationFlags.length > 0) {
                    // We have an error
                    result["invalid"] = true
                    result["message"] = validationFlags.map(x => x.message)
                } else {
                    // save record if no warnings
                    // do we want to do this here, or do we only want to make any updates if all records are valid?
                    jmarc.put().catch(err => {throw err})
                }

                this.results.push(result)
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
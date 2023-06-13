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
                        {{this.results}}
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
                        <input class="form-check-input" type="radio" id="add" name="actions" value="add" checked>
                        <label class="form-check-label" for="add">Add</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" id="delete" name="actions" value="delete">
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
            basketItems: [],
            selectedFields: [],
            selectedRecords: [],
            confirm: false,
            results: []
        }
    },
    computed: {
        
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
        }
    },
    methods: {
        updateSelectedFields(selectedFields) {
            this.selectedFields = selectedFields
        },
        setReferringRecord(collection, recordId) {
            this.referringRecord = `${collection}/${recordId}`
            console.log(this.referringRecord)
        },
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
            console.log(selected)
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
            console.log("Adding to all")
            console.log(selectedFields, selectedRecords)
            for (let record of selectedRecords) {
                let collection = record.split("/")[0]
                let recordId = record.split("/")[1]
                Jmarc.api_prefix = this.api_prefix;
                let result = {"record": record, "fields": []}
                await Jmarc.get(collection, recordId).then(jmarc => {
                    for (let field of selectedFields) {
                        let createdField = jmarc.createField(field.tag)
                        createdField.subfields = field.subfields
                        jmarc.put().then(() => {
                            //this.$emit('update-records', { "message": "Field(s) added", "count": this.selectedRecords.length })
                            result["fields"].push({"field": field.tag, "status": "success", "error": null})
                        } ).catch(err => {
                            //this.$emit('update-records', { "message": "Error adding field(s)", "error": err.message } )
                            result["fields"].push({"field": field.tag, "status": "failed", "error": err.message})
                        })
                    }
                }).catch(err => {
                    this.$emit('update-records', { "message": `Error fetching ${record}`, "error": err.message } )
                })
                this.results.push(result)
            }
            this.confirm = true
            this.$emit('update-records', { "message": "Records update complete.", "results": this.results })           
        },
        deleteFromAll(selectedFields, selectedRecords) {
            // Delete the selected fields from the selected records in the basket
            // We need jmarc for each of the selected records, which we will update
            // by deleting the selected fields.
            console.log("Deleting from all")
            this.$emit('update-records', { "message": "Field(s) deleted", "count": this.selectedRecords.length } )
        }
    }
}
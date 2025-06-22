import basket from '../api/basket.js';
import { Jmarc } from '../api/jmarc.mjs'

/* 
Modal for batch editing records using basket functionality
*/

export let batcheditmodal = {
    props: ["api_prefix"],
    template: `
        <div class="modal fade" id="batchActions" role="dialog" aria-labelledby="batchActionsModalTitle" aria-hidden="true" ref="modal">
            <div v-if="confirm" class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">Preview</div>
                    <div class="modal-body">
                        <div class="row" v-for="result in results">
                            <div class="col">
                                <p v-if="result.invalid">
                                    {{result.record}}
                                    <ul>
                                        <li v-for="m in result.message" class="text-danger">
                                            {{m}}
                                        </li>
                                    </ul>
                                </p>
                                <p v-else class="borderless">
                                    {{result.record}}
                                    <ul>
                                        <li v-for="field in result.fields">
                                            {{field.field}} <span class="mr-2" v-for="subfield in field.subfields">\${{subfield.code}} {{subfield.value}}</span><span class="mx-3 text-success">{{field.action}}</span>
                                        </li>
                                    </ul>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button v-if="results.filter(x => x.invalid === false).length > 0" type="button" class="btn btn-primary" @click="commitSelection" data-dismiss="modal">Commit & Close</button>
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
                                    <td><label class="form-check-label" :for="item._id">{{item.title}} ({{item.vcoll}}/{{item._id}})</label></td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" v-if="selectedFields.length > 0" @click="previewSelection" id="batchUpdateSubmit" disabled>Preview</button>
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
            stagedOperationMessage: null,
            stagedChanges: [],
            confirm: false,
            results: []
        }
    },
    emits: ['update-records'],
    async created() {
        await this.loadBasketItems();
        Jmarc.api_prefix = this.api_prefix;
    },
    methods: {
        async loadBasketItems() {
            // Fetch the basket items using the API
            const basketSet = await basket.getBasket(this.api_prefix);
            // Convert Set to Array if needed
            const items = Array.from(basketSet);
            // For each item, fetch details for title and vcoll
            this.basketItems = await Promise.all(items.map(async item => {
                let title = "[No Title]";
                let vcoll = item.collection;
                try {
                    const jmarc = await Jmarc.get(item.collection, item.record_id);
                    if (item.collection === "bibs") {
                        let titleField = jmarc.getField("249") || jmarc.getField("245") || jmarc.getField("700");
                        if (titleField && titleField.getSubfield("a")) {
                            title = titleField.getSubfield("a").value || "[No Title]";
                        }
                        let rtype = jmarc.getField("089");
                        if (rtype && rtype.getSubfield("b")) {
                            if (rtype.getSubfield("b").value === "B22") vcoll = "speeches";
                            if (rtype.getSubfield("b").value === "B23") vcoll = "votes";
                        }
                    } else if (item.collection === "auths") {
                        let headingField;
                        for (let tag of ["100", "110", "111", "130", "150", "190", "191"]) {
                            if (jmarc.getField(tag)) headingField = jmarc.getField(tag);
                        }
                        if (headingField) {
                            let text = [];
                            for (let sub of ["a", "b", "c", "d"]) {
                                text.push(headingField.getSubfield(sub) ? headingField.getSubfield(sub).value : "");
                            }
                            title = text.join(" ");
                        }
                    }
                } catch (e) {
                    title = "[Failed to load]";
                }
                return {
                    collection: item.collection,
                    vcoll,
                    _id: item.record_id,
                    title
                };
            }));
        },
        reinitialize() {
            this.includeReferrer = false
            this.confirm = false
            this.results = []
            this.selectedRecords = []
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
                    checkbox.checked = false
                    this.selectedRecords.splice(this.selectedRecords.indexOf(record), 1)
                }
            }
        },
        previewSelection() {
            let selected = document.querySelector('input[name="actions"]:checked').value
            if (this.selectedRecords.length > 0) {
                var selectedRecords = this.selectedRecords.filter((value, index, array) => array.indexOf(value) === index)
                var selectedFields = this.selectedFields.filter((value, index, array) => array.indexOf(value) === index)
                if (selected == "add") {
                    this.addToAll(selectedFields, selectedRecords)
                } else if (selected == "delete") {
                    this.deleteFromAll(selectedFields, selectedRecords)
                }
            } else {
                alert("Please select at least one record")
            }
        },
        commitSelection() {
            for (let jmarc of this.stagedChanges) {
                jmarc.put().catch(err => {
                    throw err
                })
            }
            this.$emit('update-records', { "message": this.stagedOperationMessage, "status": "success" } )
            this.stagedChanges = []
        },
        async addToAll(selectedFields, selectedRecords) {
            let promises = []
            let errors = 0
            
            for (let record of selectedRecords) {
                let collection = record.split("/")[0]
                let recordId = record.split("/")[1]
                promises.push(Jmarc.get(collection, recordId))
            }

            let jmarcRecords  = await Promise.all(promises)

            for (let jmarc of jmarcRecords) {
                let result = {"record": `${jmarc.collection}/${jmarc.recordId}`, "fields": []}
                
                for (let field of selectedFields) {
                    let newField = jmarc.createField(field.tag)
                    newField.indicators = field.indicators

                    let subfields = []
                    for (let subfield of field.subfields) {
                        let newSubfield = newField.createSubfield(subfield.code)
                        newSubfield.code = subfield.code
                        newSubfield.value = subfield.value
                        newSubfield.xref = subfield.xref
                        subfields.push(newSubfield)
                    }
                    result["fields"].push({"field": field.tag, "subfields": subfields, "action": "will be added"})
                }

                let validationFlags = jmarc.allValidationWarnings()
                result["invalid"] = false
                if (validationFlags.length > 0) {
                    if (!jmarc.getField("998")) {
                        result["invalid"] = true
                        result["message"] = validationFlags.map(x => x.message)
                        errors += 1
                    } else {
                        this.stagedChanges.push(jmarc)
                    }
                } else {
                    this.stagedChanges.push(jmarc)
                }
                jmarc.result = result

                this.results.push(result)
            }

            this.stagedOperationMessage = `Added fields to ${this.results.filter(x => x.invalid === false).length} record(s). ${errors} validation error(s) encountered.`
            this.confirm = true
        },
        async deleteFromAll(selectedFields, selectedRecords) {
            let promises = []
            let errors = 0
            
            for (let record of selectedRecords) {
                let collection = record.split("/")[0]
                let recordId = record.split("/")[1]
                promises.push(Jmarc.get(collection, recordId))
            }

            let jmarcRecords  = await Promise.all(promises)

            for (let jmarc of jmarcRecords) {
                let result = {"record": `${jmarc.collection}/${jmarc.recordId}`, "fields": []}

                for (let field of selectedFields) {
                    for (let targetField of jmarc.fields) {
                        if (targetField.tag == field.tag && targetField.toStr() == field.toStr()) {
                            jmarc.deleteField(targetField)
                            result["fields"].push({"field": field.tag, "subfields":field.subfields, "action": "will be deleted"})
                        }
                    }
                }

                let validationFlags = jmarc.allValidationWarnings()
                result["invalid"] = false
                if (validationFlags.length > 0) {
                    if (!jmarc.getField("998")) {
                        result["invalid"] = true
                        result["message"] = validationFlags.map(x => x.message)
                        errors += 1
                    } else {
                        this.stagedChanges.push(jmarc)
                    }
                } else {
                    this.stagedChanges.push(jmarc)
                }
                jmarc.result = result

                this.results.push(result)
            }

            this.stagedOperationMessage = `Deleted fields from ${this.results.filter(x => x.invalid === false).length} record(s). ${errors} validation error(s) encounterd.`
            this.confirm = true
        }
    },
    // Reload basket items every time the modal is shown
    mounted() {
        const modal = this.$refs.modal;
        if (modal && modal.addEventListener) {
            modal.addEventListener('shown.bs.modal', async () => {
                await this.loadBasketItems();
            });
        }
    }
}
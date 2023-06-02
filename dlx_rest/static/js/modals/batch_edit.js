//import { basket } from '../api/basket.js' 
import { Jmarc } from '../jmarc.mjs'

/* 
Modal for batch editing records using basket functionality
*/

export let batcheditmodal = {
    template: `
        <div class="modal fade" id="batchActions" role="dialog" aria-labelledby="batchActionsModalTitle" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="batchActionsModalTitle">Batch Actions</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <h6>Select your action</h6>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" id="add" name="actions" value="add" checked>
                        <label class="form-check-label" for="add">Add</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" id="delete" name="actions" value="delete">
                        <label class="form-check-label" for="delete">Delete</label>
                    </div>
                    <div class="row" v-if="selectedFields.length == 0">You have no selected fields</div>
                    <h6 class="pt-2" v-else>These fields:</h6>
                    <div class="row"><span class="mx-2" v-for="field in selectedFields" :key="field.tag">{{field.tag}} {{field.toStr()}}</span></div>
                    <div class="row py-3">
                        <h6>To/From these records</h6>
                        <div class="card" v-for="item in basketItems" :key="item._id">{{item.title}}</div></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" v-if="selectedFields.length > 0">Apply</button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
                </div>
            </div>
        </div>`,
    data: function () {
        return {
            basketItems: [],
            selectedFields: [],
            actions: ["Add to All", "Delete from All"],
            selected: "Add to All"
            //show: false
        }
    },
    created: function () {
        this.basketItems = this.$root.$refs.basketcomponent.basketItems
        console.log(this.basketItems)
    },
    methods: {
        updateSelectedFields(selectedFields) {
            this.selectedFields = selectedFields
            console.log(this.selectedFields)
        },
        handleClick() {
            // Find which radio button is selected and call the corresponding function when the Update Records button is clicked
        },
        addToAll(selectedFields, selectedRecords) {
            // Add the selected fields to the selected records in the basket
            //basket.addToAll(selectedFields)
        },
        deleteFromAll(selectedFields, selectedRecords) {
            // Delete the selected fields from the selected records in the basket
            //basket.deleteFromAll(selectedFields)
        }
    }
}
//import { basket } from '../api/basket.js' 
import { Jmarc } from '../jmarc.mjs'

/* 
Modal for batch editing records using basket functionality
*/

export let batcheditmodal = {
    //template: `<div class="modal fade" id="batchActions" tabindex="-1" role="dialog" aria-labelledby="batchActionsModalTitle" aria-hidden="true">
    //<div><p v-for="field in selectedFields" :key="field.id">{{field.name}}</p></div>
    //<div><p v-for="item in basketItems" :key="item.id">{{item.name}}</p></div>
    //</div>`,
    template: `
    <div v-if="show">
        <div class="modal fade" id="batchActions" tabindex="-1" role="dialog" aria-labelledby="batchActionsModalTitle" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="batchActionsModalTitle">Batch Actions</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div><p v-for="field in selectedFields" :key="field.id">{{field.name}}</p></div>
                    <div><p v-for="item in basketItems" :key="item.id">{{item.name}}</p></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
                </div>
            </div>
        </div>
    </div>`,
    data: function () {
        return {
            basketItems: [],
            selectedFields: [],
            show: false
        }
    },
    methods: {
        showModal: function() {
            console.log("Show?", this.show)
            this.show = true
            console.log("Show?", this.show)
            return true
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
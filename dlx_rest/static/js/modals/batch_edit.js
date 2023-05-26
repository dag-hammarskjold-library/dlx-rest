import { basket } from '../api/basket'
import { Jmarc } from '../jmarc.mjs'

/* 
Modal for batch editing records using basket functionality
*/

export let batchEdit = {
    template: `<div class="batch-edit">

    </div>`,
    data: function () {
        return {}
    },
    created: function () {},
    methods: {
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
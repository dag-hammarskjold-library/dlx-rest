/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

import { headercomponent } from "./header.js";
import { multiplemarcrecordcomponent } from "./record.js";
import { messagecomponent } from "./messagebar.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let vm_new_ui_component = new Vue({
    el: '#record_vm',
    components: { headercomponent, multiplemarcrecordcomponent, messagecomponent },
    data: {
      visible: false,
    },
    methods: {}
})
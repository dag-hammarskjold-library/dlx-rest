import { multiplemarcrecordcomponent } from "./record_stage.js";
//import { messagecomponent } from "./messagebar.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let record_stage_vm = new Vue({
    el: '#editor',
    components: { multiplemarcrecordcomponent },
    data: {
      visible: false,
    },
    created: function () {
      console.log("attaching record stage")
    },
    methods: {}
})
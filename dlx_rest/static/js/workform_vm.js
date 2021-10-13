/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

//import { Jmarc } from "./jmarc.mjs";
import { messagecomponent } from "./messagebar.js";
import { sidebarcomponent } from "./search/sidebar.js";
import { workformcomponent } from "./workform.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let vm_search_component = new Vue({
    el: '#workform_vm',
    components: { 
        messagecomponent, 
        sidebarcomponent, 
        workformcomponent
    },
    data: {
      visible: false,
    }
})
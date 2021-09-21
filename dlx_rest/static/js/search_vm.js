/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

//import { Jmarc } from "./jmarc.js";
import { messagecomponent } from "./messagebar.js";
import { sidebarcomponent } from "./search/sidebar.js";
import { searchcomponent } from "./search/search.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let vm_search_component = new Vue({
    el: '#search_vm',
    components: { messagecomponent, sidebarcomponent, searchcomponent},
    data: {
      visible: false,
    },
    methods: {}
})
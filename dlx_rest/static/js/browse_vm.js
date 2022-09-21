/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

//import { Jmarc } from "./jmarc.mjs";
import { messagecomponent } from "./messagebar.js";
import { sidebarcomponent } from "./search/sidebar.js";
import { browsecomponent } from "./search/browse.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let vm_search_component = new Vue({
    el: '#browse_vm',
    components: { sidebarcomponent, browsecomponent },
    data: {
      visible: false,
    },
    methods: {}
})
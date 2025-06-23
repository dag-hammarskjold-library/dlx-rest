/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

//import { Jmarc } from "./jmarc.mjs";
import { messagecomponent } from "./messagebar.js";
import { sidebarcomponent } from "./search/sidebar.js";
import { searchcomponent } from "./search.js";
import { basketcomponent } from "./basket.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let vm_search_component = new Vue({
    el: '#search_vm',
    components: { sidebarcomponent, searchcomponent, basketcomponent },
    data: {
      visible: false,
    },
    methods: {}
})
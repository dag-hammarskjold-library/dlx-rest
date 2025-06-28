/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

//import { Jmarc } from "./jmarc.mjs";
import { messagecomponent } from "./components/messagebar.js";
import { searchcomponent } from "./components/search.js";
import { basketcomponent } from "./components/basket.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let vm_search_component = new Vue({
    el: '#search_vm',
    components: { searchcomponent, basketcomponent },
    data: {
      visible: false,
    },
    methods: {}
})
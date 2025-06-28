/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

//import { Jmarc } from "./jmarc.mjs";
import { messagecomponent } from "./components/messagebar.js";
import { authreviewcomponent } from "./components/auth_review.js";
//import { browsecomponent } from "./search/browse.js";


/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let auth_review_vm = new Vue({
    el: '#auth_review_vm',
    components: { authreviewcomponent },//, browsecomponent },
    data: {
      visible: false,
    },
    methods: {}
})
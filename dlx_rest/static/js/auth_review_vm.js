/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

//import { Jmarc } from "./jmarc.mjs";
import { messagecomponent } from "./messagebar.js";
import { sidebarcomponent } from "./search/sidebar.js";
import { authreviewcomponent } from "./auth_review.js";
//import { browsecomponent } from "./search/browse.js";


/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let auth_review_vm = new Vue({
    el: '#auth_review_vm',
    components: { sidebarcomponent, authreviewcomponent },//, browsecomponent },
    data: {
      visible: false,
    },
    methods: {}
})
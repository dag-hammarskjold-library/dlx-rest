/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

import { Jmarc } from "./jmarc.js";
import { headercomponent } from "./header.js";
import { basketcomponent } from "./basket.js";
import { warningcomponent } from "./warning.js";
import { multiplemarcrecordcomponent } from "./record.js";
import { messagecomponent } from "./messagebar.js";
import { modalmergecomponent } from "./merge.js";
import { authcomponent } from "./auth.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let vm_new_ui_component = new Vue({
    el: '#new_ui_component',
    components: { headercomponent, basketcomponent, warningcomponent, multiplemarcrecordcomponent, messagecomponent , modalmergecomponent, authcomponent },
    data: {
      visible: false,
      recordToDisplay: "",
      recordDisplayed: [],
      maxRecordToDisplay: 26,
      records: [],
      showModal:false
    },
    methods: {}
  })
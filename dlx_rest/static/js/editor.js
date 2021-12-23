/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

import { Jmarc } from "./jmarc.mjs";
import { headercomponent } from "./header.js";
import { basketcomponent } from "./basket.js";
import { multiplemarcrecordcomponent } from "./record.js";
import { messagecomponent } from "./messagebar.js";
import { modalmergecomponent } from "./merge.js";
import { selectworkform } from "./modals/select_workform.js";

/////////////////////////////////////////////////////////////////
// VIEW MODEL DEFINITION
/////////////////////////////////////////////////////////////////
export let vm_new_ui_component = new Vue({
    el: '#new_ui_component',
    components: { headercomponent, basketcomponent, multiplemarcrecordcomponent, messagecomponent , modalmergecomponent, selectworkform },
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
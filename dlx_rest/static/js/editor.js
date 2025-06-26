/////////////////////////////////////////////////////////////////
// Imports
/////////////////////////////////////////////////////////////////

import { Jmarc } from "./api/jmarc.mjs";
import { headercomponent } from "./components/header.js";
import { basketcomponent } from "./components/basket.js";
import { multiplemarcrecordcomponent } from "./components/record.js";
import { messagecomponent } from "./components/messagebar.js";
import { modalmergecomponent } from "./components/merge.js";
import { selectworkform } from "./components/select_workform.js";

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
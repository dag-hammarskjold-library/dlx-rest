import { 
    Jmarc,
    TagValidationFlag,
    Indicator1ValidationFlag,
    Indicator2ValidationFlag,
    SubfieldCodeValidationFlag,
    SubfieldValueValidationFlag
} from "./jmarc.mjs";

export let recordcomponent = {
    props: ["api_prefix", "collection", "recordId", "viewType"],
    template: `<div class="container">
        <div class="row" id="record-controls"></div>
        <div class="row" id="record-editor">
            <div class="col">
                <div v-for="field of jmarc.fields">{{field}}</div>
            </div>
        </div>
    </div>`,
    data: function () {
        return {
            jmarc: {}
        }
    },
    created: async function () {
        // Initialize
        Jmarc.apiUrl = this.api_prefix;

        // Get current user and permissions to determine what buttons to display

        // Get the actual record data
        let jmarc = await Jmarc.get(collection, recordId)
        if (jmarc) {
            this.jmarc = jmarc
        }
    },
    methods: {
        saveRecord() {},
        cloneRecord() {},
        validateRecord() {},
        copyFields() {},
        pasteFields() {},
        viewHistory() {},
        addField() {},
        addSubfield() {},
        deleteField() {},
        deleteSubfield() {
            //this.jmarc.deleteField()
        },
    }
}
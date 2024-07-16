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
    template: `<table class="table table-striped table-hover">
        <thead><tr><th colspan="2"><nav class="nav d-flex flex-column flex-sm-row"></nav></th></tr></thead>
        <tbody>
            <tr v-for="field in jmarc.fields" v-bind:key="field.tag">
                <td>
                    <div class="d-flex flex-inline gap-1">
                        <input type="checkbox" />
                        <span :contentEditable="editMode" :tag="field.tag" @change="field.tag = $event.target.innerText">
                            {{field.tag}}
                        </span>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-inline flex-wrap gap-1">
                        <div v-for="subfield in field.subfields" v-bind:key="subfield">
                            <span class="mx-2" :contentEditable="editMode" :code="subfield.code" @change="subfield.code = $event.target.innerText">
                                {{subfield.code}}
                            </span>
                            <!--
                            <subfieldvalue :modelValue="subfield.value" :xref="subfield.xref ? subfield.xref : false" @update:modelValue="newValue => subfield.value = newValue" />
                            -->
                        </div>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>`,
    data: function () {
        return {
            editMode: true,
            jmarc: {}
        }
    },
    created: async function () {
        // Initialize
        Jmarc.apiUrl = this.api_prefix;
        console.log(this.api_prefix)

        // Get current user and permissions to determine what buttons to display

        // Get the actual record data
        Jmarc.get(this.collection, this.recordId).then( j => {
            this.jmarc = j
        })
        
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
        toggleEditMode(field) {
            field.editable = !field.editable
        },
    }
}
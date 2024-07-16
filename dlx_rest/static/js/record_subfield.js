export let subfieldvalue = {
    props: ["modelValue", "xref", "editMode"],
    template: `<span v-if="xref">
        <a ref="valSpan" :href="xref" :contentEditable="editMode" @keyup="authLookup" @dblclick="">
            {{modelValue}}
        </a>
    </span>
    <span v-else>
        <span ref="valSpan" :contentEditable="editMode" @keyup="updateValue">
            {{modelValue}}
        </span>
    </span>`,
    emits: ["update:modelValue", "warn", "inform"],
    data () {
        return {
            snapshot: this.modelValue
        }
    },
    created: function () {
        console.log("model value", this.modelValue)
    },
    methods: {
        authLookup: function () {
            return true
        },
        updateValue: function () {
            return trie
        }
    }
}
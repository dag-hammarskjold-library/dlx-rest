export const RecordFieldSubfield = {
    props: { 
        subfield: Object,
        readonly: { type: Boolean, required: false, default: false }
    },
    data() {
        return {
            initialValue: this.subfield.value,
            classes: {
                subfieldValue: {
                    "clickable-text": this.subfield.xref ? true : false,
                    "subfield-value__changed": false
                }
            }
        }
    },
    template: /* html */ `
    <span class="subfield-code">\${{ subfield.code }}</span>&nbsp;
    <span 
      :class="classes.subfieldValue" 
      :contenteditable="!readonly"
      @keydown="keyDown"
      @input="setValue"
    >
      {{ initialValue }}
    </span>
    &nbsp;
  `,
    methods: {
        keyDown(event) {
            if (event.key === "Enter") {
                event.preventDefault()
            }
        },
        setValue(event) {
            this.subfield.value = event.target.innerText
            this.classes.subfieldValue["subfield-value__changed"] = this.subfield.value !== this.initialValue
            this.$emit('field-changed')
        }
    }
}
import { RecordFieldSubfield } from "./record-field-subfield.mjs"

export const RecordField = {
    props: {
        field: Object,
        readonly: { type: Boolean, required: false, default: false }
    },
    components: { RecordFieldSubfield },
    data() {
        const highlightedFields = ["191", "791"]
        return {
            initialTag: this.field.tag,
            classes: {
                container: {
                    "record-field-container": true,
                    "record-field-container__highlighted": highlightedFields.includes(this.field.tag)
                },
                tag: { "record-field-tag": true }
            }
        }
    },
    template: /* html */ `
    <div :class="classes.container">
      <div
        :class="classes.tag"
        :contenteditable="!readonly"
        @keydown="keyDown"
        @input="setTag"
      >
        {{ initialTag }}
      </div>
      <div class="record-field-indicators">
        &nbsp;
        <span>{{ field.indicators[0] }}</span>
        <span>{{ field.indicators[1] }}</span>
        &nbsp;
      </div>
      <div class="subfield-container">
        <record-field-subfield 
          v-for="subfield in field.subfields" 
          :key="subfield.code" 
          :subfield="subfield"
          :readonly="readonly"
        />
      </div>
    </div>
  `,
    methods: {
        keyDown(event) {
            switch (event.key) {
                case 'Enter':
                    event.preventDefault()
                    event.target.blur()
                    return
                case "ArrowUp":
                case "ArrowDown":
                    return
            }
            if (event.target.innerText.length === 3 && event.key.length === 1 && event.key.charCodeAt() > 32) {
                event.preventDefault()
            }
        },
        setTag(event) {
            this.field.tag = event.target.innerText
            this.$emit('field-changed')
        }
    }
}
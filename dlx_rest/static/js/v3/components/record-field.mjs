import { RecordFieldSubfield } from "./record-field-subfield.mjs"
import { validationData } from "../../utils/validation.js"

export const RecordField = {
    props: {
        field: Object,
        readonly: { type: Boolean, required: false, default: false },
        collection: { type: String, required: true }
    },
    components: { RecordFieldSubfield },
    data() {
        const highlightedFields = ["191", "791"]
        return {
            initialTag: this.field.tag,
            showMenu: false,
            showIndicator1Menu: false,
            showIndicator2Menu: false,
            classes: {
                container: {
                    "record-field-container": true,
                    "record-field-container__highlighted": highlightedFields.includes(this.field.tag),
                    "field-row-selected": false
                },
                tag: { "record-field-tag": true }
            }
        }
    },
    computed: {
        indicator1Options() {
            return this.getIndicatorValues(0)
        },
        indicator2Options() {
            return this.getIndicatorValues(1)
        },
        hasEditableIndicator1() {
            return this.indicator1Options.length > 0
        },
        hasEditableIndicator2() {
            return this.indicator2Options.length > 0
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside)
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside)
    },
    methods: {
        getValidationDocument() {
            const collectionMap = {
                'speeches': 'speeches',
                'votes': 'votes',
                'auths': 'auths'
            }
            return validationData[collectionMap[this.collection] || 'bibs']
        },
        handleClickOutside(event) {
            if (!this.$el || !this.$el.querySelector) return
            
            const fieldMenuContainer = this.$el.querySelector('.field-menu-container')
            const indicator1Container = this.$el.querySelector('.indicator-1-container')
            const indicator2Container = this.$el.querySelector('.indicator-2-container')
            
            if (fieldMenuContainer && !fieldMenuContainer.contains(event.target)) {
                this.showMenu = false
            }
            if (indicator1Container && !indicator1Container.contains(event.target)) {
                this.showIndicator1Menu = false
            }
            if (indicator2Container && !indicator2Container.contains(event.target)) {
                this.showIndicator2Menu = false
            }
        },
        getIndicatorValues(indicatorIndex) {
            const collectionData = this.getValidationDocument()
            if (!collectionData || !collectionData[this.field.tag]) return []
            
            const fieldValidation = collectionData[this.field.tag]
            const indicatorKey = indicatorIndex === 0 ? 'validIndicators1' : 'validIndicators2'
            const options = fieldValidation[indicatorKey] || []
            
            // Filter out wildcard indicators and return
            return options.filter(opt => opt !== '*')
        },
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
        },
        setIndicator(index, value) {
            this.field.indicators[index] = value
            if (index === 0) {
                this.showIndicator1Menu = false
            } else {
                this.showIndicator2Menu = false
            }
            this.$emit('field-changed')
        },
        toggleIndicator1Menu() {
            this.showIndicator1Menu = !this.showIndicator1Menu
            this.showIndicator2Menu = false
        },
        toggleIndicator2Menu() {
            this.showIndicator2Menu = !this.showIndicator2Menu
            this.showIndicator1Menu = false
        },
        fieldSelected() {
            this.classes.container["field-row-selected"] = true
            this.field.selected = true
            this.$emit('field-selected', this.field)
        },
        addField() {
            this.showMenu = false
            this.$emit('add-field', this.field)
        },
        deleteField() {
            this.showMenu = false
            this.$emit('delete-field', this.field)
        },
        deleteSelectedFields() {
            this.showMenu = false
            this.$emit('delete-selected-fields', this.field)
        },
        toggleMenu() {
            this.showMenu = !this.showMenu
        }
    },
    template: /* html */ `
    <div :class="classes.container">
      <div class="record-field-wrapper">
        <div class="record-field-header">
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
            <div v-if="hasEditableIndicator1" class="indicator-1-container">
              <span 
                class="indicator indicator-editable"
                :title="'Indicator 1: ' + field.indicators[0]"
                @click="!readonly ? toggleIndicator1Menu() : null"
              >
                {{ field.indicators[0] }}
              </span>
              <div v-if="showIndicator1Menu" class="indicator-dropdown">
                <button 
                  v-for="option in indicator1Options"
                  :key="option"
                  @click="setIndicator(0, option)"
                  class="indicator-option"
                  :class="{ active: field.indicators[0] === option }"
                >
                  {{ option }}
                </button>
              </div>
            </div>
            <div v-else>
              <span class="indicator">{{ field.indicators[0] }}</span>
            </div>
            <div v-if="hasEditableIndicator2" class="indicator-2-container">
              <span 
                class="indicator indicator-editable"
                :title="'Indicator 2: ' + field.indicators[1]"
                @click="!readonly ? toggleIndicator2Menu() : null"
              >
                {{ field.indicators[1] }}
              </span>
              <div v-if="showIndicator2Menu" class="indicator-dropdown">
                <button 
                  v-for="option in indicator2Options"
                  :key="option"
                  @click="setIndicator(1, option)"
                  class="indicator-option"
                  :class="{ active: field.indicators[1] === option }"
                >
                  {{ option }}
                </button>
              </div>
            </div>
            <div v-else>
              <span class="indicator">{{ field.indicators[1] }}</span>
            </div>
            &nbsp;
          </div>
        </div>
        <div class="subfield-container">
          <record-field-subfield 
            v-for="subfield in field.subfields" 
            :key="subfield.code" 
            :subfield="subfield"
            :field="field"
            :collection="collection"
            :tag="field.tag"
            :readonly="readonly"
            @field-changed="$emit('field-changed')"
          />
        </div>
        <div class="field-menu-container" v-if="!readonly">
          <button class="field-menu-btn" @click.stop="toggleMenu" title="Field options">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <div v-if="showMenu" class="field-menu-dropdown">
            <button @click="addField" class="menu-item">Add field</button>
            <button @click="deleteField" class="menu-item">Delete field</button>
            <button @click="deleteSelectedFields" class="menu-item">Delete selected fields</button>
          </div>
        </div>
      </div>
    </div>
  `
}
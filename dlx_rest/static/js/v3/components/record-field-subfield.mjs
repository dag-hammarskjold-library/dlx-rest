import { validationData } from "../../utils/validation.js"

export const RecordFieldSubfield = {
    props: { 
        subfield: Object,
        field: Object,
        collection: { type: String, required: true },
        tag: { type: String, required: true },
        readonly: { type: Boolean, required: false, default: false }
    },
    data() {
        return {
            initialValue: this.subfield.value,
            showMenu: false,
            showCodeMenu: false,
            classes: {
                subfieldValue: {
                    "clickable-text": this.subfield.xref ? true : false,
                    "subfield-value__changed": false,
                    "authority-controlled": this.subfield.xref ? true : false
                }
            }
        }
    },
    computed: {
        isChanged() {
            return this.subfield.value !== this.initialValue
        },
        subfieldCodeOptions() {
            return this.getSubfieldCodes()
        },
        isWildcardSubfield() {
            const collectionData = this.getValidationDocument()
            if (!collectionData || !collectionData[this.tag]) return false
            
            const fieldValidation = collectionData[this.tag]
            const validSubfields = fieldValidation.validSubfields || []
            
            return validSubfields.length === 1 && validSubfields[0] === '*'
        },
        hasDropdownSubfield() {
            return this.subfieldCodeOptions.length > 0 && !this.isWildcardSubfield
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
            
            const menuContainer = this.$el.querySelector('.subfield-menu-container')
            const codeMenuContainer = this.$el.querySelector('.code-menu-container')
            
            if (menuContainer && !menuContainer.contains(event.target)) {
                this.showMenu = false
            }
            if (codeMenuContainer && !codeMenuContainer.contains(event.target)) {
                this.showCodeMenu = false
            }
        },
        getSubfieldCodes() {
            const collectionData = this.getValidationDocument()
            if (!collectionData || !collectionData[this.tag]) return []
            
            const fieldValidation = collectionData[this.tag]
            const validSubfields = fieldValidation.validSubfields || []
            
            // Filter out wildcard and return alphabetically sorted
            return validSubfields.filter(code => code !== '*').sort()
        },
        setSubfieldCode(newCode) {
            this.subfield.code = newCode
            this.showCodeMenu = false
            this.$emit('field-changed')
        },
        toggleCodeMenu() {
            this.showCodeMenu = !this.showCodeMenu
        },
        setCodeFromInput(event) {
            const input = event.target.innerText.trim()
            // Only allow single alphanumeric character
            if (input.length === 1 && /[a-zA-Z0-9]/.test(input)) {
                this.subfield.code = input
                this.$emit('field-changed')
            } else if (input.length === 0) {
                // Allow clearing
                return
            } else {
                // Revert to previous value
                event.target.innerText = '$' + this.subfield.code
            }
        },
        keyDown(event) {
            if (event.key === "Enter") {
                event.preventDefault()
                event.target.blur()
            }
        },
        setValue(event) {
            this.subfield.value = event.target.innerText
            this.classes.subfieldValue["subfield-value__changed"] = this.isChanged
            this.$emit('field-changed')
        },
        addSubfield() {
            this.showMenu = false
            this.$emit('add-subfield', this.subfield)
        },
        deleteSubfield() {
            this.showMenu = false
            this.$emit('delete-subfield', this.subfield)
        },
        moveSubfieldUp() {
            this.showMenu = false
            this.$emit('move-subfield', { subfield: this.subfield, direction: -1 })
        },
        moveSubfieldDown() {
            this.showMenu = false
            this.$emit('move-subfield', { subfield: this.subfield, direction: 1 })
        },
        toggleMenu() {
            this.showMenu = !this.showMenu
        },
        authLookup() {
            this.showMenu = false
            this.$emit('auth-lookup', this.subfield)
        }
    },
    template: /* html */ `
    <div class="subfield-row" v-if="hasDropdownSubfield || isWildcardSubfield">
      <div class="code-menu-container">
        <span 
          v-if="hasDropdownSubfield"
          class="subfield-code code-editable"
          @click="!readonly ? toggleCodeMenu() : null"
          :title="'Subfield code: $' + subfield.code"
        >
          \${{ subfield.code }}
        </span>
        <span 
          v-else-if="isWildcardSubfield"
          class="subfield-code code-editable"
          :contenteditable="!readonly"
          @keydown="keyDown"
          @input="setCodeFromInput"
          :title="'Subfield code: $' + subfield.code"
          @blur="(e) => e.target.innerText = '$' + subfield.code"
        >
          \${{ subfield.code }}
        </span>
        <div v-if="showCodeMenu && hasDropdownSubfield" class="code-dropdown">
          <button 
            v-for="code in subfieldCodeOptions"
            :key="code"
            @click="setSubfieldCode(code)"
            class="code-option"
            :class="{ active: subfield.code === code }"
          >
            \${{ code }}
          </button>
        </div>
      </div>
      &nbsp;
      <span 
        :class="classes.subfieldValue" 
        :contenteditable="!readonly"
        @keydown="keyDown"
        @input="setValue"
      >
        {{ initialValue }}
      </span>
      <div class="subfield-menu-container" v-if="!readonly">
        <button class="subfield-menu-btn" @click.stop="toggleMenu" title="Subfield options">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
        <div v-if="showMenu" class="subfield-menu-dropdown">
          <button @click="addSubfield" class="menu-item">Add subfield</button>
          <button @click="deleteSubfield" class="menu-item">Delete subfield</button>
          <button @click="moveSubfieldUp" class="menu-item">Move up</button>
          <button @click="moveSubfieldDown" class="menu-item">Move down</button>
          <button 
            v-if="subfield.xref"
            @click="authLookup" 
            class="menu-item"
          >
            Authority lookup
          </button>
        </div>
      </div>
      &nbsp;
    </div>
  `
}
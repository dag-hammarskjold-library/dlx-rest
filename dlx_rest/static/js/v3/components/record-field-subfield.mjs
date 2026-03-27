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
            showMenu: false,
            showCodeMenu: false,
            showValueMenu: false,
            activeCodeOptionIndex: -1,
            activeValueOptionIndex: -1,
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
        subfieldCodeOptions() {
            return this.getSubfieldCodes().filter(code => code !== this.subfield.code)
        },
        validationEnabled() {
            return !(this.field && this.field.parentRecord && typeof this.field.parentRecord.getField === 'function' && this.field.parentRecord.getField('998'))
        },
        fieldValidation() {
            if (!this.validationEnabled) return null

            const collectionData = this.getValidationDocument()
            if (!collectionData) return null

            return collectionData[this.tag] || null
        },
        isSubfieldCodeInvalid() {
            if (!this.fieldValidation) return false

            const validSubfields = this.fieldValidation.validSubfields || []
            return !validSubfields.includes('*') && !validSubfields.includes(this.subfield.code)
        },
        isSubfieldValueInvalid() {
            if (!this.fieldValidation) return false

            if (!this.subfield.value) return false

            const validStringsByCode = this.fieldValidation.validStrings || {}
            const allowedValues = validStringsByCode[this.subfield.code]
            const isInvalidByString = Array.isArray(allowedValues) && allowedValues.length > 0
                ? !allowedValues.includes(this.subfield.value)
                : false

            const isDateByCode = this.fieldValidation.isDate || {}
            const requiresDateFormat = this.subfield.code in isDateByCode
            const isInvalidByDate = requiresDateFormat
                ? !this.isValidDateValue(this.subfield.value)
                : false

            return isInvalidByString || isInvalidByDate
        },
        subfieldValueOptions() {
            const collectionData = this.getValidationDocument()
            if (!collectionData || !collectionData[this.tag]) return []

            const validStringsByCode = collectionData[this.tag].validStrings || {}
            const options = validStringsByCode[this.subfield.code]

            if (!Array.isArray(options)) return []
            return options.filter(valueOption => valueOption !== this.subfield.value)
        },
        hasDropdownValue() {
            return this.subfieldValueOptions.length > 0
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
        // Initialize valueEl with current value
        if (this.$refs.valueEl) {
            this.$refs.valueEl.textContent = this.subfield.value
        }
        // Initialize codeEl with current code
        if (this.$refs.codeEl) {
            this.$refs.codeEl.textContent = '$' + this.subfield.code
        }
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside)
    },
    watch: {
        'subfield.value'(newValue) {
            // Update display if value changes from outside
            if (this.$refs.valueEl && !this.$refs.valueEl.contains(document.activeElement)) {
                this.$refs.valueEl.textContent = newValue
            }
        },
        'subfield.code'(newCode) {
            // Update display if code changes from outside
            if (this.$refs.codeEl && !this.$refs.codeEl.contains(document.activeElement)) {
                this.$refs.codeEl.textContent = '$' + newCode
            }
        }
    },
    methods: {
        isValidDateValue(value) {
            const datePattern = /^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/
            const match = String(value || '').match(datePattern)
            if (!match) return false

            // YYYY-MM is valid at month precision.
            if (typeof match[3] === 'undefined') return true

            // For YYYY-MM-DD, enforce calendar-valid day values.
            const year = Number(match[1])
            const month = Number(match[2])
            const day = Number(match[3])
            const dt = new Date(Date.UTC(year, month - 1, day))
            return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day
        },
        getValidationCollection() {
            if (this.field && this.field.parentRecord && typeof this.field.parentRecord.getVirtualCollection === 'function') {
                return this.field.parentRecord.getVirtualCollection()
            }

            return this.collection
        },
        getValidationDocument() {
            const collectionMap = {
                'bibs': 'bibs',
                'speeches': 'speeches',
                'votes': 'votes',
                'auths': 'auths'
            }
            const validationCollection = this.getValidationCollection()
            return validationData[collectionMap[validationCollection] || 'bibs']
        },
        handleClickOutside(event) {
            if (!this.$el || !this.$el.querySelector) return

            const menuContainer = this.$el.querySelector('.subfield-menu-container')
            const codeMenuContainer = this.$el.querySelector('.code-menu-container')
            const valueMenuContainer = this.$el.querySelector('.value-menu-container')

            let menusClosed = false
            if (menuContainer && !menuContainer.contains(event.target)) {
                this.showMenu = false
            }
            if (codeMenuContainer && !codeMenuContainer.contains(event.target)) {
                const wasClosed = this.showCodeMenu
                this.showCodeMenu = false
                menusClosed = menusClosed || wasClosed
            }
            if (valueMenuContainer && !valueMenuContainer.contains(event.target)) {
                const wasClosed = this.showValueMenu
                this.showValueMenu = false
                menusClosed = menusClosed || wasClosed
            }
            
            if (menusClosed) {
                this.$emit('dropdown-state-changed', this.showCodeMenu || this.showValueMenu)
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
            if (this.readonly) return
            this.subfield.code = newCode
            this.showCodeMenu = false
            this.$emit('dropdown-state-changed', this.showValueMenu)
            this.$emit('field-changed')
        },
        openCodeMenu() {
            if (this.readonly || !this.hasDropdownSubfield) return
            this.showCodeMenu = true
            this.$emit('dropdown-state-changed', true)
            const selectedIndex = this.subfieldCodeOptions.indexOf(this.subfield.code)
            this.activeCodeOptionIndex = selectedIndex >= 0 ? selectedIndex : 0
        },
        toggleCodeMenu() {
            if (this.readonly) return
            this.showCodeMenu = !this.showCodeMenu
            this.$emit('dropdown-state-changed', this.showCodeMenu || this.showValueMenu)
        },
        setSubfieldValue(newValue) {
            if (this.readonly) return
            this.subfield.value = newValue
            this.showValueMenu = false
            this.$emit('dropdown-state-changed', false)
            this.$emit('field-changed')
        },
        openValueMenu() {
            if (this.readonly || !this.hasDropdownValue) return
            this.showValueMenu = true
            this.$emit('dropdown-state-changed', true)
            const selectedIndex = this.subfieldValueOptions.indexOf(this.subfield.value)
            this.activeValueOptionIndex = selectedIndex >= 0 ? selectedIndex : 0
        },
        toggleValueMenu() {
            if (this.readonly) return
            this.showValueMenu = !this.showValueMenu
            this.$emit('dropdown-state-changed', this.showCodeMenu || this.showValueMenu)
        },
        setCodeFromInput(event) {
            if (this.readonly) return
            const input = event.target.innerText.trim().replace('$', '')
            // Only allow single alphanumeric character
            if (input.length === 1 && /[a-zA-Z0-9]/.test(input)) {
                this.subfield.code = input
                this.$emit('field-changed')
            } else if (input.length === 0) {
                // Allow clearing for now
                return
            } else {
                // Revert to previous value
                event.target.innerText = '$' + this.subfield.code
            }
        },
        finalizeCode(event) {
            if (this.readonly) return
            const input = event.target.innerText.trim().replace('$', '')
            if (input.length === 1 && /[a-zA-Z0-9]/.test(input)) {
                this.subfield.code = input
                event.target.innerText = '$' + input
                this.$emit('field-changed')
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
            if (this.readonly) return
            this.subfield.value = event.target.innerText
            this.classes.subfieldValue["subfield-value__changed"] = this.subfield.value !== this.field.subfields[0].value
            this.$emit('field-changed')
        },
        finalizeValue(event) {
            if (this.readonly) return
            // Finalize and trim the value
            const value = event.target.innerText
            this.subfield.value = value
            this.$emit('field-changed')
        },
        addSubfield() {
            if (this.readonly) return
            this.showMenu = false
            this.$emit('add-subfield', this.subfield)
        },
        deleteSubfield() {
            if (this.readonly) return
            this.showMenu = false
            this.$emit('delete-subfield', this.subfield)
        },
        moveSubfieldUp() {
            if (this.readonly) return
            this.showMenu = false
            this.$emit('move-subfield', { subfield: this.subfield, direction: -1 })
        },
        moveSubfieldDown() {
            if (this.readonly) return
            this.showMenu = false
            this.$emit('move-subfield', { subfield: this.subfield, direction: 1 })
        },
        toggleMenu() {
            if (this.readonly) return
            this.showMenu = !this.showMenu
        },
        authLookup() {
            if (this.readonly) return
            this.showMenu = false
            this.$emit('auth-lookup', this.subfield)
        },
        onCodeFocus() {
            this.openCodeMenu()
        },
        onValueFocus() {
            this.openValueMenu()
        },
        handleCodeFocusOut(event) {
            const nextTarget = event.relatedTarget
            if (event.currentTarget && !event.currentTarget.contains(nextTarget)) {
                this.showCodeMenu = false
            }
        },
        handleValueFocusOut(event) {
            const nextTarget = event.relatedTarget
            if (event.currentTarget && !event.currentTarget.contains(nextTarget)) {
                this.showValueMenu = false
            }
        },
        getRefArray(refName) {
            const refs = this.$refs[refName]
            if (!refs) return []
            return Array.isArray(refs) ? refs : [refs]
        },
        focusCodeOption(index) {
            const options = this.getRefArray('codeOptionButtons')
            if (options.length === 0) return

            const normalizedIndex = ((index % options.length) + options.length) % options.length
            this.activeCodeOptionIndex = normalizedIndex
            const target = options[normalizedIndex]
            if (target && typeof target.focus === 'function') {
                target.focus()
            }
        },
        focusValueOption(index) {
            const options = this.getRefArray('valueOptionButtons')
            if (options.length === 0) return

            const normalizedIndex = ((index % options.length) + options.length) % options.length
            this.activeValueOptionIndex = normalizedIndex
            const target = options[normalizedIndex]
            if (target && typeof target.focus === 'function') {
                target.focus()
            }
        },
        onCodeTriggerKeyDown(event) {
            if (event.key === 'Tab') {
                this.showCodeMenu = false
                this.$emit('dropdown-state-changed', this.showValueMenu)
                return
            }

            if (event.key === 'Enter') {
                event.preventDefault()
                event.target.blur()
                return
            }

            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

            event.preventDefault()
            if (!this.showCodeMenu) {
                this.openCodeMenu()
            }

            const delta = event.key === 'ArrowDown' ? 1 : -1
            const start = this.activeCodeOptionIndex >= 0 ? this.activeCodeOptionIndex : 0
            this.$nextTick(() => this.focusCodeOption(start + delta))
        },
        onValueTriggerKeyDown(event) {
            if (event.key === 'Tab') {
                this.showValueMenu = false
                this.$emit('dropdown-state-changed', this.showCodeMenu)
                return
            }

            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

            event.preventDefault()
            if (!this.showValueMenu) {
                this.openValueMenu()
            }

            const delta = event.key === 'ArrowDown' ? 1 : -1
            const start = this.activeValueOptionIndex >= 0 ? this.activeValueOptionIndex : 0
            this.$nextTick(() => this.focusValueOption(start + delta))
        },
        onCodeOptionKeyDown(event, index) {
            if (event.key === 'Tab') {
                this.showCodeMenu = false
                this.$emit('dropdown-state-changed', this.showValueMenu)
                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                this.showCodeMenu = false
                this.$emit('dropdown-state-changed', this.showValueMenu)
                this.$nextTick(() => this.$refs.codeEl && this.$refs.codeEl.focus && this.$refs.codeEl.focus())
                return
            }

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                const delta = event.key === 'ArrowDown' ? 1 : -1
                this.focusCodeOption(index + delta)
            }
        },
        onValueOptionKeyDown(event, index) {
            if (event.key === 'Tab') {
                this.showValueMenu = false
                this.$emit('dropdown-state-changed', this.showCodeMenu)
                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                this.showValueMenu = false
                this.$emit('dropdown-state-changed', this.showCodeMenu)
                this.$nextTick(() => this.$refs.valueEl && this.$refs.valueEl.focus && this.$refs.valueEl.focus())
                return
            }

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                const delta = event.key === 'ArrowDown' ? 1 : -1
                this.focusValueOption(index + delta)
            }
        },
        onSubfieldShortcut(event) {
            if (this.readonly) return

            const hasPrimaryModifier = event.metaKey || event.ctrlKey
            if (!hasPrimaryModifier || !event.shiftKey) return

            const key = String(event.key || '').toLowerCase()
            const isAddShortcut = key === '=' || key === '+'
            const isRemoveShortcut = key === 'backspace' || key === 'delete'

            if (!isAddShortcut && !isRemoveShortcut) return

            event.preventDefault()
            event.stopPropagation()

            if (isAddShortcut) {
                this.addSubfield()
                return
            }

            this.deleteSubfield()
        }
    },
    template: /* html */ `
        <div class="subfield-row" @keydown.capture="onSubfieldShortcut">
      <div class="code-menu-container" @focusout="handleCodeFocusOut">
        <span 
          v-if="hasDropdownSubfield"
          ref="codeEl"
                    :class="['subfield-code', 'code-editable', { 'subfield-code__invalid': isSubfieldCodeInvalid }]"
          :contenteditable="!readonly"
          :tabindex="readonly ? -1 : 0"
          @keydown="onCodeTriggerKeyDown"
          @input="setCodeFromInput"
          @blur="finalizeCode"
          @focus="onCodeFocus"
          @click="!readonly ? openCodeMenu() : null"
                    :title="isSubfieldCodeInvalid ? 'Invalid subfield code for this field' : 'Subfield code: $' + subfield.code"
                ></span>
        <span 
          v-else-if="isWildcardSubfield"
          ref="codeEl"
                    :class="['subfield-code', 'code-editable', { 'subfield-code__invalid': isSubfieldCodeInvalid }]"
          :contenteditable="!readonly"
          :tabindex="readonly ? -1 : 0"
          @keydown="onCodeTriggerKeyDown"
          @input="setCodeFromInput"
          @blur="finalizeCode"
          @focus="onCodeFocus"
          @click="!readonly ? openCodeMenu() : null"
                    :title="isSubfieldCodeInvalid ? 'Invalid subfield code for this field' : 'Subfield code: $' + subfield.code"
                ></span>
                <span
                    v-else
                    ref="codeEl"
                                        :class="['subfield-code', { 'subfield-code__invalid': isSubfieldCodeInvalid }]"
                                        :title="isSubfieldCodeInvalid ? 'Invalid subfield code for this field' : 'Subfield code: $' + subfield.code"
                >
                    {{ subfield.code }}
                </span>
        <div v-if="showCodeMenu && hasDropdownSubfield" class="code-dropdown">
          <button 
                        v-for="(code, codeIdx) in subfieldCodeOptions"
            :key="code"
                        ref="codeOptionButtons"
            @click="setSubfieldCode(code)"
                        @keydown="onCodeOptionKeyDown($event, codeIdx)"
            class="code-option"
                                                :class="{ active: codeIdx === activeCodeOptionIndex }"
          >
            \${{ code }}
          </button>
        </div>
      </div>
      &nbsp;
                        <div v-if="hasDropdownValue" class="value-menu-container" @focusout="handleValueFocusOut">
                <span
                    ref="valueEl"
                    :class="[classes.subfieldValue, 'value-editable', { 'subfield-value__invalid': isSubfieldValueInvalid }]"
                    :title="isSubfieldValueInvalid ? 'Invalid subfield value for this code' : null"
                    :tabindex="readonly ? -1 : 0"
                                        @keydown="onValueTriggerKeyDown"
                    @focus="onValueFocus"
                    @click="!readonly ? openValueMenu() : null"
                >
                    {{ subfield.value }}
                </span>
                <div v-if="showValueMenu" class="value-dropdown">
                    <button
                                                v-for="(valueOption, valueIdx) in subfieldValueOptions"
                        :key="valueOption"
                                                ref="valueOptionButtons"
                        @click="setSubfieldValue(valueOption)"
                                                @keydown="onValueOptionKeyDown($event, valueIdx)"
                        class="value-option"
                        :class="{ active: valueIdx === activeValueOptionIndex }"
                    >
                        {{ valueOption }}
                    </button>
                </div>
            </div>
            <span
                v-else
                ref="valueEl"
                :class="[classes.subfieldValue, { 'subfield-value__invalid': isSubfieldValueInvalid }]"
                :title="isSubfieldValueInvalid ? 'Invalid subfield value for this code' : null"
                :contenteditable="!readonly"
                @keydown="keyDown"
                @input="setValue"
                @blur="finalizeValue"
            ></span>
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
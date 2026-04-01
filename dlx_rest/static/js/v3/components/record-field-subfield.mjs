import { ValidationRulesService } from "../services/ValidationRulesService.mjs"
import { AuthorityControlService } from "../services/AuthorityControlService.mjs"
import { DropdownInteractionService } from "../services/DropdownInteractionService.mjs"
import { AuthorityUiOrchestrationService } from "../services/AuthorityUiOrchestrationService.mjs"

export const RecordFieldSubfield = {
    props: {
        subfield: Object,
        field: Object,
        collection: { type: String, required: true },
        tag: { type: String, required: true },
        showValidationState: { type: Boolean, required: false, default: true },
        readonly: { type: Boolean, required: false, default: false }
    },
    data() {
        return {
            showMenu: false,
            showCodeMenu: false,
            showValueMenu: false,
            showAuthSearch: false,
            authDropdownUp: false,
            activeCodeOptionIndex: -1,
            activeValueOptionIndex: -1,
            activeAuthOptionIndex: -1,
            authSearchResults: [],
            authSearchQuery: '',
            authSearchTimeout: null,
            authSearching: false,
            isAuthUnmatched: false,
            classes: {
                subfieldValue: {
                    "clickable-text": false,
                    "subfield-value__changed": false,
                    "authority-controlled": false
                }
            }
        }
    },
    computed: {
        subfieldCodeOptions() {
            return this.getSubfieldCodes().filter(code => code !== this.subfield.code)
        },
        fieldValidation() {
            const validationCollection = ValidationRulesService.getValidationCollection(this.field, this.collection)
            const collectionData = ValidationRulesService.getValidationDocument(validationCollection)
            return ValidationRulesService.getTagValidation(collectionData, this.tag)
        },
        isSubfieldCodeInvalid() {
            if (!this.showValidationState) return false
            if (!this.fieldValidation) return false

            const validSubfields = this.fieldValidation.validSubfields || []
            return !validSubfields.includes('*') && !validSubfields.includes(this.subfield.code)
        },
        isSubfieldValueInvalid() {
            if (!this.showValidationState) return false
            if (!this.fieldValidation) return false

            return ValidationRulesService.isSubfieldValueInvalid(
                this.fieldValidation,
                this.subfield.code,
                this.subfield.value
            )
        },
        subfieldValueOptions() {
            if (!this.fieldValidation) return []

            const validStringsByCode = this.fieldValidation.validStrings || {}
            const options = validStringsByCode[this.subfield.code]

            if (!Array.isArray(options)) return []
            return options.filter(valueOption => valueOption !== this.subfield.value)
        },
        hasDropdownValue() {
            return this.subfieldValueOptions.length > 0
        },
        isWildcardSubfield() {
            if (!this.fieldValidation) return false
            const validSubfields = this.fieldValidation.validSubfields || []

            return validSubfields.length === 1 && validSubfields[0] === '*'
        },
        hasDropdownSubfield() {
            return this.subfieldCodeOptions.length > 0 && !this.isWildcardSubfield
        },
        isAuthorityControlled() {
            if (!this.field || !this.field.parentRecord) return false
            if (typeof this.field.parentRecord.isAuthorityControlled !== 'function') return false
            
            // Check if this subfield is authority-controlled using Jmarc's authMap
            return this.field.parentRecord.isAuthorityControlled(this.tag, this.subfield.code)
        },
        canCreateAuthority() {
            return !this.readonly
                && this.isAuthorityControlled
                && this.isAuthUnmatched
                && String(this.subfield.value || '').trim().length > 0
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside)
        // Initialize valueEl with current value
        if (this.$refs.valueEl) {
            this.$refs.valueEl.textContent = this.subfield.value
        }
        // Initialize authValueEl with current value for authority-controlled fields
        if (this.$refs.authValueEl) {
            this.$refs.authValueEl.textContent = this.subfield.value
        }
        // Initialize codeEl with current code
        if (this.$refs.codeEl) {
            this.$refs.codeEl.textContent = '$' + this.subfield.code
        }

        // Initialize authority visual state on first render
        if (this.isAuthorityControlled) {
            const hasXref = this.hasUsableXref(this.subfield.xref)
            this.isAuthUnmatched = !hasXref
            this.classes.subfieldValue['clickable-text'] = hasXref
            this.classes.subfieldValue['authority-controlled'] = hasXref
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
            if (this.$refs.authValueEl && !this.$refs.authValueEl.contains(document.activeElement)) {
                this.$refs.authValueEl.textContent = newValue
            }
        },
        'subfield.code'(newCode) {
            // Update display if code changes from outside
            if (this.$refs.codeEl && !this.$refs.codeEl.contains(document.activeElement)) {
                this.$refs.codeEl.textContent = '$' + newCode
            }
        },
        'subfield.xref'() {
            // Update authority-controlled styling when xref changes
            const hasXref = this.hasUsableXref(this.subfield.xref)
            this.classes.subfieldValue['clickable-text'] = hasXref
            this.classes.subfieldValue['authority-controlled'] = hasXref
            if (this.isAuthorityControlled) {
                this.isAuthUnmatched = !hasXref
            }
        },
        isAuthorityControlled(newVal) {
            // Update clickable styling based on authority-controlled status
            if (!this.hasUsableXref(this.subfield.xref)) {
                this.classes.subfieldValue['clickable-text'] = newVal
            }

            // When this row switches into authority-controlled mode,
            // initialize the contenteditable text once without forcing rerenders.
            if (newVal) {
                this.$nextTick(() => {
                    if (this.$refs.authValueEl) {
                        this.$refs.authValueEl.textContent = this.subfield.value || ''
                    }
                })
            }
        }
    },
    methods: {
        hasUsableXref(xref) {
            return !!xref && !(xref instanceof Error)
        },
        // Lookup endpoints are keyed by API collections (bibs/auths), while
        // validation can use virtual collections (speeches/votes).
        getLookupCollection() {
            return AuthorityControlService.getLookupCollection(this.field, this.collection)
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
            return ValidationRulesService.getSubfieldCodes(this.fieldValidation)
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
        async finalizeAuthorityValue(event) {
            if (this.readonly) return

            const value = event.target.innerText
            this.subfield.value = value

            if (!String(value || '').trim()) {
                delete this.subfield.xref
                this.isAuthUnmatched = true
                this.classes.subfieldValue['authority-controlled'] = false
                this.classes.subfieldValue['clickable-text'] = false
                this.$emit('field-changed')
                return
            }

            try {
                if (typeof this.subfield.detectAndSetXref === 'function') {
                    await this.subfield.detectAndSetXref()
                }
            } catch (error) {
                // Keep unmatched state if xref detection fails.
            }

            const hasXref = this.hasUsableXref(this.subfield.xref)
            this.isAuthUnmatched = !hasXref
            this.classes.subfieldValue['authority-controlled'] = hasXref
            this.classes.subfieldValue['clickable-text'] = hasXref
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
            if (DropdownInteractionService.shouldCloseOnFocusOut(event.currentTarget, nextTarget)) {
                this.showCodeMenu = false
            }
        },
        handleValueFocusOut(event) {
            const nextTarget = event.relatedTarget
            if (DropdownInteractionService.shouldCloseOnFocusOut(event.currentTarget, nextTarget)) {
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

            const normalizedIndex = DropdownInteractionService.normalizeIndex(index, options.length)
            this.activeCodeOptionIndex = normalizedIndex
            const target = options[normalizedIndex]
            if (target && typeof target.focus === 'function') {
                target.focus()
            }
        },
        focusValueOption(index) {
            const options = this.getRefArray('valueOptionButtons')
            if (options.length === 0) return

            const normalizedIndex = DropdownInteractionService.normalizeIndex(index, options.length)
            this.activeValueOptionIndex = normalizedIndex
            const target = options[normalizedIndex]
            if (target && typeof target.focus === 'function') {
                target.focus()
            }
        },
        onCodeTriggerKeyDown(event) {
            const intent = DropdownInteractionService.getMenuTriggerKeyIntent({ key: event.key, allowEnterBlur: true })
            const action = DropdownInteractionService.getMenuTriggerAction(intent)

            if (action === 'close') {
                this.showCodeMenu = false
                this.$emit('dropdown-state-changed', this.showValueMenu)
                return
            }

            if (action === 'blur') {
                event.preventDefault()
                event.target.blur()
                return
            }

            if (action !== 'navigate') return

            event.preventDefault()
            if (!this.showCodeMenu) {
                this.openCodeMenu()
            }

            const delta = DropdownInteractionService.getArrowDelta(event.key)
            const start = this.activeCodeOptionIndex >= 0 ? this.activeCodeOptionIndex : 0
            this.$nextTick(() => this.focusCodeOption(start + delta))
        },
        onValueTriggerKeyDown(event) {
            const intent = DropdownInteractionService.getMenuTriggerKeyIntent({ key: event.key, allowEnterBlur: false })
            const action = DropdownInteractionService.getMenuTriggerAction(intent)

            if (action === 'close') {
                this.showValueMenu = false
                this.$emit('dropdown-state-changed', this.showCodeMenu)
                return
            }

            if (action !== 'navigate') return

            event.preventDefault()
            if (!this.showValueMenu) {
                this.openValueMenu()
            }

            const delta = DropdownInteractionService.getArrowDelta(event.key)
            const start = this.activeValueOptionIndex >= 0 ? this.activeValueOptionIndex : 0
            this.$nextTick(() => this.focusValueOption(start + delta))
        },
        onCodeOptionKeyDown(event, index) {
            const intent = DropdownInteractionService.getMenuOptionKeyIntent(event.key)
            const action = DropdownInteractionService.getMenuOptionAction(intent)

            if (action === 'close') {
                this.showCodeMenu = false
                this.$emit('dropdown-state-changed', this.showValueMenu)
                return
            }

            if (action === 'close-focus-trigger') {
                event.preventDefault()
                this.showCodeMenu = false
                this.$emit('dropdown-state-changed', this.showValueMenu)
                this.$nextTick(() => this.$refs.codeEl && this.$refs.codeEl.focus && this.$refs.codeEl.focus())
                return
            }

            if (action === 'navigate') {
                event.preventDefault()
                const delta = DropdownInteractionService.getArrowDelta(event.key)
                this.focusCodeOption(index + delta)
            }
        },
        onValueOptionKeyDown(event, index) {
            const intent = DropdownInteractionService.getMenuOptionKeyIntent(event.key)
            const action = DropdownInteractionService.getMenuOptionAction(intent)

            if (action === 'close') {
                this.showValueMenu = false
                this.$emit('dropdown-state-changed', this.showCodeMenu)
                return
            }

            if (action === 'close-focus-trigger') {
                event.preventDefault()
                this.showValueMenu = false
                this.$emit('dropdown-state-changed', this.showCodeMenu)
                this.$nextTick(() => this.$refs.valueEl && this.$refs.valueEl.focus && this.$refs.valueEl.focus())
                return
            }

            if (action === 'navigate') {
                event.preventDefault()
                const delta = DropdownInteractionService.getArrowDelta(event.key)
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
        },
        async searchAuthorities(query) {
            if (!AuthorityControlService.shouldSearchQuery(query, 1)) {
                this.authSearchResults = []
                this.showAuthSearch = false
                return
            }

            this.authSearching = true

            try {
                // Get the API prefix from the parent record
                const apiPrefix = this.field.parentRecord.constructor.apiUrl
                const collection = this.getLookupCollection()

                this.authSearchResults = await AuthorityControlService.searchAuthorities({
                    apiPrefix,
                    collection,
                    tag: this.tag,
                    field: this.field,
                    subfield: this.subfield,
                    query
                })

                const displayState = AuthorityControlService.getSearchDisplayState(this.authSearchResults)
                this.authSearchResults = displayState.results
                this.showAuthSearch = displayState.showDropdown
                this.activeAuthOptionIndex = displayState.activeIndex

                if (displayState.transientNotFound) {
                    this.computeAuthDropdownDirection()
                    // Auto-hide after 1 second
                    setTimeout(() => {
                        this.authSearchResults = this.authSearchResults.filter(r => !r.notFound)
                        this.showAuthSearch = false
                    }, 1000)
                } else {
                    this.computeAuthDropdownDirection()
                }
            } catch (error) {
                console.error('Authority search error:', error)
                this.authSearchResults = []
                this.showAuthSearch = false
            } finally {
                this.authSearching = false
            }
        },
        async onAuthValueChange(event) {
            if (this.readonly) return
            
            const value = event.target.innerText
            this.authSearchQuery = value
            AuthorityControlService.applyAuthInputEditState({
                subfield: this.subfield,
                field: this.field,
                classes: this.classes,
                value
            })

            this.isAuthUnmatched = true
            
            this.$emit('field-changed')

            // Debounce authority search (750ms to match original)
            clearTimeout(this.authSearchTimeout)
            if (AuthorityControlService.shouldSearchQuery(value, 1)) {
                // Show searching indicator
                this.authSearching = true
                this.showAuthSearch = true
                this.computeAuthDropdownDirection()
                this.authSearchTimeout = setTimeout(() => {
                    this.searchAuthorities(value)
                }, 750)
            } else {
                this.showAuthSearch = false
                this.authSearchResults = []
            }
        },
        computeAuthDropdownDirection() {
            this.$nextTick(() => {
                const el = this.$el?.querySelector('.authority-value-menu-container')
                if (!el) return

                const rect = el.getBoundingClientRect()
                const recordContainer = el.closest('.record-container')
                const recordRect = recordContainer ? recordContainer.getBoundingClientRect() : null

                this.authDropdownUp = AuthorityControlService.shouldOpenDropdownUp({
                    elementBottom: rect.bottom,
                    containerBottom: recordRect ? recordRect.bottom : null,
                    windowInnerHeight: window.innerHeight,
                    minDropdownSpace: 320
                })
            })
        },
        selectAuthority(authority) {
            if (this.readonly || authority.notFound) return

            const controlledCodes = AuthorityControlService.getAuthorityControlledCodes(this.field, this.tag)
            const result = AuthorityControlService.applySelectedAuthority({
                field: this.field,
                subfield: this.subfield,
                tag: this.tag,
                authority,
                controlledCodes
            })
            const _authorityId = result && result.authorityId ? result.authorityId : ''

            const uiState = AuthorityUiOrchestrationService.getPostSelectionUiState()
            this.isAuthUnmatched = uiState.isAuthUnmatched
            this.showAuthSearch = uiState.showAuthSearch
            this.authSearchResults = uiState.authSearchResults
            AuthorityUiOrchestrationService.applyClassUpdates(this.classes.subfieldValue, uiState.classUpdates)

            // Keep the contenteditable text in sync immediately after selection.
            this.$nextTick(() => {
                AuthorityUiOrchestrationService.syncEditableText(this.$refs.authValueEl, this.subfield.value)
            })
            
            this.$emit('field-changed')
        },
        handleAuthValueFocusOut(event) {
            const nextTarget = event.relatedTarget
            const shouldClose = DropdownInteractionService.shouldCloseAuthDropdownOnFocusOut({
                currentTarget: event.currentTarget,
                nextTarget,
                isInDropdown: (target) => !!(target && this.$el.querySelector('.auth-dropdown')?.contains(target))
            })

            if (shouldClose) {
                this.showAuthSearch = false
            }
        },
        focusAuthOption(index) {
            const options = this.getRefArray('authOptionButtons')
            const focused = AuthorityUiOrchestrationService.resolveOptionFocusTarget({ optionRefs: options, index })
            if (focused.index < 0) return

            this.activeAuthOptionIndex = focused.index
            const target = focused.target
            if (target && typeof target.focus === 'function') {
                target.focus()
            }
        },
        moveAuthSelection(delta) {
            const nextIndex = AuthorityControlService.getNextSelectableIndex({
                items: this.authSearchResults,
                currentIndex: this.activeAuthOptionIndex,
                delta,
                isSelectable: (option) => !option.notFound
            })

            if (nextIndex < 0) return
            this.activeAuthOptionIndex = nextIndex
        },
        onAuthValueKeyDown(event) {
            if (!this.isAuthorityControlled) return

            const intent = DropdownInteractionService.getAuthValueKeyIntent({
                key: event.key,
                showDropdown: this.showAuthSearch,
                resultCount: this.authSearchResults.length,
                activeIndex: this.activeAuthOptionIndex
            })
            const action = AuthorityUiOrchestrationService.getAuthValueAction(intent)
            const patch = AuthorityUiOrchestrationService.getStatePatchForAuthAction(action)
            if (patch) {
                AuthorityUiOrchestrationService.applyStatePatch(this, patch)
            }

            if (action === 'close-reset') {
                return
            }

            if (action === 'navigate') {
                event.preventDefault()
                if (!this.showAuthSearch) {
                    this.showAuthSearch = true
                    this.computeAuthDropdownDirection()
                }

                const delta = DropdownInteractionService.getArrowDelta(event.key)
                this.moveAuthSelection(delta)
                return
            }

            if (action === 'close') {
                event.preventDefault()
                return
            }

            if (action === 'select-active') {
                event.preventDefault()
                const authority = this.authSearchResults[this.activeAuthOptionIndex]
                if (authority && !authority.notFound) {
                    this.selectAuthority(authority)
                }
                return
            }

            if (action === 'blur') {
                event.preventDefault()
                event.target.blur()
            }
        },
        onAuthOptionMouseDown(authority) {
            if (!AuthorityUiOrchestrationService.canSelectAuthority({ readonly: this.readonly, authority })) return

            // Use mousedown so selection is applied before auth value blur/focusout runs.
            this.selectAuthority(authority)
        },
        onAuthOptionKeyDown(event, index) {
            const intent = DropdownInteractionService.getAuthOptionKeyIntent(event.key)
            const action = AuthorityUiOrchestrationService.getAuthOptionAction(intent)
            const patch = AuthorityUiOrchestrationService.getStatePatchForAuthAction(action)
            if (patch) {
                AuthorityUiOrchestrationService.applyStatePatch(this, patch)
            }

            if (action === 'close') {
                return
            }

            if (action === 'close-focus-input') {
                event.preventDefault()
                this.$nextTick(() => this.$refs.authValueEl && this.$refs.authValueEl.focus && this.$refs.authValueEl.focus())
                return
            }

            if (action === 'select-index') {
                event.preventDefault()
                const authority = this.authSearchResults[index]
                if (authority && !authority.notFound) {
                    this.selectAuthority(authority)
                }
                return
            }

            if (action === 'navigate') {
                event.preventDefault()
                const delta = DropdownInteractionService.getArrowDelta(event.key)
                this.moveAuthSelection(delta)
            }
        },
        requestCreateAuthority() {
            if (!this.canCreateAuthority) return
            this.$emit('create-authority', this.subfield)
        }

    },
    template: /* html */ `
        <div class="subfield-row" @keydown.capture="onSubfieldShortcut">
      <div class="code-menu-container" @focusout="handleCodeFocusOut">
        <span 
                    v-if="hasDropdownSubfield || isWildcardSubfield"
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
            <div v-else-if="isAuthorityControlled" class="authority-value-menu-container" @focusout="handleAuthValueFocusOut">
                <span
                    ref="authValueEl"
                    :class="[classes.subfieldValue, 'value-editable', { 'authority-controlled': !isAuthUnmatched, 'authority-controlled-unmatched': isAuthUnmatched }]"
                    :contenteditable="!readonly"
                    :tabindex="readonly ? -1 : 0"
                    @keydown="onAuthValueKeyDown"
                    @input="onAuthValueChange"
                    @blur="finalizeAuthorityValue"
                    title="Authority-controlled field with live search. Type to search and select from results."
                ></span>
                <div v-if="showAuthSearch" class="auth-dropdown" :class="{ 'auth-dropdown--up': authDropdownUp }">
                    <div v-if="authSearching" class="auth-searching">
                        <i class="fa fa-spinner fa-spin"></i> Searching...
                    </div>
                    <button
                        v-for="(authority, authIdx) in authSearchResults"
                        :key="authority._id || authority.id"
                        ref="authOptionButtons"
                        @mousedown.prevent="onAuthOptionMouseDown(authority)"
                        @mouseenter="activeAuthOptionIndex = authIdx"
                        @keydown="onAuthOptionKeyDown($event, authIdx)"
                        :disabled="authority.notFound"
                        class="auth-option"
                        :class="{ active: authIdx === activeAuthOptionIndex, 'not-found': authority.notFound }"
                    >
                        <span v-if="authority.notFound" class="auth-not-found">
                            {{ authority.value }}
                        </span>
                        <span v-else class="auth-heading">
                            <template v-if="Array.isArray(authority.subfields) && authority.subfields.length > 0">
                                <span
                                    v-for="(sf, sfIdx) in authority.subfields"
                                    :key="(authority._id || authority.id || 'auth') + '-sf-' + sfIdx"
                                    class="auth-heading-subfield"
                                >
                                    <span class="auth-heading-subfield-code">\${{ sf.code }}</span>
                                    <span class="auth-heading-subfield-value">{{ sf.value }}</span>
                                </span>
                            </template>
                            <template v-else>
                                {{ authority.heading || authority.value }}
                            </template>
                        </span>
                    </button>
                </div>
                <button
                    v-if="canCreateAuthority"
                    class="create-authority-btn"
                    type="button"
                    title="Create authority for this value"
                    @click.stop="requestCreateAuthority"
                >
                    <i class="bi bi-plus-circle"></i>
                </button>
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
        </div>
      </div>
      &nbsp;
    </div>
  `
}
import { validationData } from "../../utils/validation.js"

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
            return this.getTagValidation()
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
        // Lookup endpoints are keyed by API collections (bibs/auths), while
        // validation can use virtual collections (speeches/votes).
        getLookupCollection() {
            const baseCollection =
                (this.field && this.field.parentRecord && this.field.parentRecord.collection)
                    ? this.field.parentRecord.collection
                    : this.collection

            // Lookup endpoints use API collections, not virtual collections.
            if (baseCollection === 'speeches' || baseCollection === 'votes') {
                return 'bibs'
            }

            return baseCollection || 'bibs'
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
        getTagValidation() {
            const collectionData = this.getValidationDocument()
            if (!collectionData) return null
            return collectionData[this.tag] || null
        },
        getAuthorityDisplayText(authRecord) {
            if (!authRecord || typeof authRecord !== 'object') return ''

            if (authRecord.heading) return String(authRecord.heading)
            if (authRecord.value) return String(authRecord.value)

            // Api lookup records typically expose the heading as a 1XX field key.
            const tagKeys = Object.keys(authRecord).filter(tag => /^1\d\d$/.test(tag)).sort()

            for (const tag of tagKeys) {
                const tagData = authRecord[tag]
                if (!Array.isArray(tagData) || tagData.length === 0) continue

                const firstField = tagData[0]
                const subfields = firstField && Array.isArray(firstField.subfields) ? firstField.subfields : []
                const text = subfields
                    .map(sf => (sf && sf.value ? String(sf.value).trim() : ''))
                    .filter(Boolean)
                    .join(' ')

                if (text) return text
            }

            // Some payloads include a normalized fields array
            if (Array.isArray(authRecord.fields)) {
                const headingField = authRecord.fields.find(f => f && /^1\d\d$/.test(f.tag || ''))
                if (headingField && Array.isArray(headingField.subfields)) {
                    const text = headingField.subfields
                        .map(sf => (sf && sf.value ? String(sf.value).trim() : ''))
                        .filter(Boolean)
                        .join(' ')

                    if (text) return text
                }
            }

            return ''
        },
        // Normalize heading subfields from lookup payload variants.
        getAuthorityHeadingSubfields(authRecord) {
            if (!authRecord || typeof authRecord !== 'object') return []

            const normalizeSubfields = rawSubfields => {
                if (!Array.isArray(rawSubfields)) return []
                return rawSubfields
                    .map(sf => ({
                        code: sf && typeof sf.code === 'string' ? sf.code : '',
                        value: sf && sf.value != null ? String(sf.value) : ''
                    }))
                    .filter(sf => sf.code && sf.value)
            }

            const tagKeys = Object.keys(authRecord).filter(tag => /^1\d\d$/.test(tag)).sort()
            for (const tag of tagKeys) {
                const tagData = authRecord[tag]
                if (!Array.isArray(tagData) || tagData.length === 0) continue
                const firstField = tagData[0]
                const subfields = normalizeSubfields(firstField && firstField.subfields)
                if (subfields.length > 0) return subfields
            }

            if (Array.isArray(authRecord.fields)) {
                const headingField = authRecord.fields.find(f => f && /^1\d\d$/.test(f.tag || ''))
                if (headingField && Array.isArray(headingField.subfields)) {
                    return normalizeSubfields(headingField.subfields)
                }
            }

            return []
        },
        getAuthorityControlledCodes() {
            if (!this.field || !this.field.parentRecord) return []

            const tagMap = this.field.parentRecord.authMap && this.field.parentRecord.authMap[this.tag]
            if (tagMap && typeof tagMap === 'object') {
                return Object.keys(tagMap)
            }

            // Fallback if authMap is not ready yet.
            const subfields = Array.isArray(this.field.subfields) ? this.field.subfields : []
            const hasAuthorityChecker = typeof this.field.parentRecord.isAuthorityControlled === 'function'
            return subfields
                .filter(sf => sf && typeof sf.code === 'string' && hasAuthorityChecker && this.field.parentRecord.isAuthorityControlled(this.tag, sf.code))
                .map(sf => sf.code)
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
            if (!this.fieldValidation) return []
            const validSubfields = this.fieldValidation.validSubfields || []

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
        },
        async searchAuthorities(query) {
            if (!query || query.length < 1) {
                this.authSearchResults = []
                this.showAuthSearch = false
                return
            }

            this.authSearching = true

            try {
                // Get the API prefix from the parent record
                const apiPrefix = this.field.parentRecord.constructor.apiUrl
                const collection = this.getLookupCollection()

                // Include all populated subfields so multi-key lookups rank more relevant results first.
                const params = new URLSearchParams()
                const subfields = Array.isArray(this.field && this.field.subfields) ? this.field.subfields : []

                for (const sf of subfields) {
                    if (!sf || typeof sf.code !== 'string' || sf.code.length === 0) continue

                    const rawValue = sf === this.subfield ? query : sf.value
                    const value = String(rawValue || '').trim()
                    if (!value) continue

                    params.append(sf.code, value)
                }

                // Ensure the active code/query is always included.
                if (!params.has(this.subfield.code)) {
                    const activeValue = String(query || '').trim()
                    if (activeValue) {
                        params.append(this.subfield.code, activeValue)
                    }
                }

                params.append('start', '1')

                const endpoint = `${apiPrefix}/marc/${collection}/lookup/${this.tag}?${params.toString()}`
                
                const response = await fetch(endpoint)
                if (response.ok) {
                    const data = await response.json()
                    const records = Array.isArray(data)
                        ? data
                        : Array.isArray(data && data.data)
                            ? data.data
                            : []
                    
                    // Extract records from the returned authority records
                    this.authSearchResults = records
                        .slice(0, 10)
                        .map(auth => ({
                            _id: auth.id || auth._id || '',
                            id: auth.id || auth._id || '',
                            heading: this.getAuthorityDisplayText(auth),
                            subfields: this.getAuthorityHeadingSubfields(auth),
                            fields: auth.fields || [],
                            value: this.getAuthorityDisplayText(auth)
                        }))
                    
                    if (this.authSearchResults.length === 0) {
                        // Show "not found" temporarily
                        this.authSearchResults.push({
                            _id: 'not-found',
                            value: 'Authority not found',
                            notFound: true
                        })
                        this.showAuthSearch = true
                        this.computeAuthDropdownDirection()
                        // Auto-hide after 1 second
                        setTimeout(() => {
                            this.authSearchResults = this.authSearchResults.filter(r => !r.notFound)
                            this.showAuthSearch = false
                        }, 1000)
                    } else {
                        this.showAuthSearch = true
                        this.computeAuthDropdownDirection()
                        this.activeAuthOptionIndex = 0
                    }
                } else {
                    this.authSearchResults = []
                    this.showAuthSearch = false
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
            this.subfield.value = value
            this.authSearchQuery = value
            this.classes.subfieldValue["subfield-value__changed"] = value !== this.field.subfields[0].value
            
            // Mark as unmatched when user edits
            this.isAuthUnmatched = true
            this.classes.subfieldValue['authority-controlled'] = false
            delete this.subfield.xref
            
            this.$emit('field-changed')

            // Debounce authority search (750ms to match original)
            clearTimeout(this.authSearchTimeout)
            if (value.length >= 1) {
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

                // Available space below the element relative to record container bottom
                const spaceBelow = recordRect ? (recordRect.bottom - rect.bottom) : (window.innerHeight - rect.bottom)
                // Need ~300px for dropdown + some buffer
                const needsUpward = spaceBelow < 320

                this.authDropdownUp = needsUpward
            })
        },
        selectAuthority(authority) {
            if (this.readonly || authority.notFound) return

            const authorityId = authority._id || authority.id || ''
            const authoritySubfields = Array.isArray(authority.subfields)
                ? authority.subfields.filter(sf => sf && sf.code && sf.value)
                : []
            const controlledCodes = this.getAuthorityControlledCodes()
            const controlledCodeSet = new Set(controlledCodes)
            const hasControlledCodeList = controlledCodeSet.size > 0
            
            // Apply all authority-controlled heading subfields from the selected authority.
            if (authoritySubfields.length > 0 && this.field && typeof this.field.getSubfield === 'function' && typeof this.field.createSubfield === 'function') {
                const incomingCodes = new Set()

                for (const authSubfield of authoritySubfields) {
                    if (hasControlledCodeList && !controlledCodeSet.has(authSubfield.code)) {
                        continue
                    }

                    incomingCodes.add(authSubfield.code)

                    let targetSubfield = this.field.getSubfield(authSubfield.code)
                    if (!targetSubfield) {
                        targetSubfield = this.field.createSubfield(authSubfield.code)
                    }

                    targetSubfield.value = authSubfield.value
                    if (authorityId) {
                        targetSubfield.xref = authorityId
                    }
                }

                if (incomingCodes.size > 0) {
                    const subfields = Array.isArray(this.field.subfields) ? [...this.field.subfields] : []
                    for (const existingSubfield of subfields) {
                        if (!existingSubfield || !existingSubfield.code) continue

                        const isAuthorityControlled = hasControlledCodeList
                            ? controlledCodeSet.has(existingSubfield.code)
                            : (this.field.parentRecord && typeof this.field.parentRecord.isAuthorityControlled === 'function' && this.field.parentRecord.isAuthorityControlled(this.tag, existingSubfield.code))

                        if (isAuthorityControlled && !incomingCodes.has(existingSubfield.code) && existingSubfield !== this.subfield) {
                            this.field.deleteSubfield(existingSubfield)
                        }
                    }

                    // Keep only one subfield per authority-controlled incoming code.
                    // This prevents duplicated authority values when prior edits left repeated codes.
                    for (const code of incomingCodes) {
                        const sameCode = (this.field.subfields || []).filter(sf => sf && sf.code === code)
                        if (sameCode.length <= 1) continue

                        for (let i = 1; i < sameCode.length; i++) {
                            this.field.deleteSubfield(sameCode[i])
                        }
                    }
                }
            } else {
                // Fallback for response payloads that do not provide parsed subfields.
                this.subfield.value = authority.heading || authority.value || ''
                if (authorityId) {
                    this.subfield.xref = authorityId
                }
            }
            
            // Mark as matched
            this.isAuthUnmatched = false
            this.classes.subfieldValue['authority-controlled'] = true
            this.classes.subfieldValue['clickable-text'] = true
            
            this.showAuthSearch = false
            this.authSearchResults = []

            // Keep the contenteditable text in sync immediately after selection.
            this.$nextTick(() => {
                if (this.$refs.authValueEl) {
                    this.$refs.authValueEl.textContent = this.subfield.value || ''
                }
            })
            
            this.$emit('field-changed')
        },
        handleAuthValueFocusOut(event) {
            const nextTarget = event.relatedTarget
            if (event.currentTarget && !event.currentTarget.contains(nextTarget)) {
                // Keep search open if navigating to dropdown options
                const isInDropdown = nextTarget && this.$el.querySelector('.auth-dropdown')?.contains(nextTarget)
                if (!isInDropdown) {
                    this.showAuthSearch = false
                }
            }
        },
        focusAuthOption(index) {
            const options = this.getRefArray('authOptionButtons')
            if (options.length === 0) return

            const normalizedIndex = ((index % options.length) + options.length) % options.length
            this.activeAuthOptionIndex = normalizedIndex
            const target = options[normalizedIndex]
            if (target && typeof target.focus === 'function') {
                target.focus()
            }
        },
        moveAuthSelection(delta) {
            const options = this.authSearchResults.filter(option => !option.notFound)
            if (options.length === 0) return

            const current = this.activeAuthOptionIndex >= 0 ? this.activeAuthOptionIndex : -1
            let next = current

            // Walk through the rendered list while skipping disabled/not-found rows.
            do {
                next = (next + delta + this.authSearchResults.length) % this.authSearchResults.length
            } while (this.authSearchResults[next] && this.authSearchResults[next].notFound)

            this.activeAuthOptionIndex = next
        },
        onAuthValueKeyDown(event) {
            if (!this.isAuthorityControlled) return

            if (event.key === 'Tab') {
                this.showAuthSearch = false
                this.activeAuthOptionIndex = -1
                return
            }

            if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && this.authSearchResults.length > 0) {
                event.preventDefault()
                if (!this.showAuthSearch) {
                    this.showAuthSearch = true
                    this.computeAuthDropdownDirection()
                }

                const delta = event.key === 'ArrowDown' ? 1 : -1
                this.moveAuthSelection(delta)
                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                this.showAuthSearch = false
                return
            }

            if (event.key === 'Enter') {
                event.preventDefault()
                if (this.showAuthSearch && this.authSearchResults.length > 0 && this.activeAuthOptionIndex >= 0) {
                    const authority = this.authSearchResults[this.activeAuthOptionIndex]
                    if (authority && !authority.notFound) {
                        this.selectAuthority(authority)
                    }
                    return
                }
                event.target.blur()
            }
        },
        onAuthOptionMouseDown(authority) {
            if (this.readonly || !authority || authority.notFound) return

            // Use mousedown so selection is applied before auth value blur/focusout runs.
            this.selectAuthority(authority)
        },
        onAuthOptionKeyDown(event, index) {
            if (event.key === 'Tab') {
                this.showAuthSearch = false
                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                this.showAuthSearch = false
                this.$nextTick(() => this.$refs.authValueEl && this.$refs.authValueEl.focus && this.$refs.authValueEl.focus())
                return
            }

            if (event.key === 'Enter') {
                event.preventDefault()
                const authority = this.authSearchResults[index]
                if (authority && !authority.notFound) {
                    this.selectAuthority(authority)
                }
                return
            }

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                const delta = event.key === 'ArrowDown' ? 1 : -1
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
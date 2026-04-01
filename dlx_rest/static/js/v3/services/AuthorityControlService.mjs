/**
 * AuthorityControlService
 *
 * Shared authority-control helpers for v3 subfield editing.
 */
export class AuthorityControlService {
    /**
     * Determine whether authority dropdown should open upward.
     *
     * @param {Object} options
     * @param {number} options.elementBottom
     * @param {number|null} options.containerBottom
     * @param {number} options.windowInnerHeight
     * @param {number} [options.minDropdownSpace=320]
     * @returns {boolean}
     */
    static shouldOpenDropdownUp({ elementBottom, containerBottom, windowInnerHeight, minDropdownSpace = 320 }) {
        const spaceBelow = Number.isFinite(containerBottom)
            ? (containerBottom - elementBottom)
            : (windowInnerHeight - elementBottom)

        return spaceBelow < minDropdownSpace
    }

    /**
     * Compute next active index while skipping non-selectable items.
     *
     * @param {Object} options
     * @param {Array<Object>} options.items
     * @param {number} options.currentIndex
     * @param {number} options.delta
     * @param {(item: Object) => boolean} [options.isSelectable]
     * @returns {number}
     */
    static getNextSelectableIndex({ items, currentIndex, delta, isSelectable = (item) => !item.notFound }) {
        if (!Array.isArray(items) || items.length === 0) return -1

        const selectableCount = items.filter(isSelectable).length
        if (selectableCount === 0) return -1

        let next = Number.isInteger(currentIndex) ? currentIndex : -1

        // Walk cyclically while skipping non-selectable rows.
        do {
            next = (next + delta + items.length) % items.length
        } while (!isSelectable(items[next]))

        return next
    }

    /**
     * Determine whether a query should trigger authority lookup.
     * @param {string} query
     * @param {number} [minLength=1]
     * @returns {boolean}
     */
    static shouldSearchQuery(query, minLength = 1) {
        return String(query || '').trim().length >= minLength
    }

    /**
     * Create a synthetic "not found" row for authority dropdown display.
     * @returns {{_id: string, value: string, notFound: boolean}}
     */
    static createNotFoundResult() {
        return {
            _id: 'not-found',
            value: 'Authority not found',
            notFound: true
        }
    }

    /**
     * Build display state for authority dropdown from search results.
     * @param {Array<Object>} results
     * @returns {{results: Array<Object>, showDropdown: boolean, activeIndex: number, transientNotFound: boolean}}
     */
    static getSearchDisplayState(results) {
        const normalized = Array.isArray(results) ? results : []
        if (normalized.length === 0) {
            return {
                results: [AuthorityControlService.createNotFoundResult()],
                showDropdown: true,
                activeIndex: -1,
                transientNotFound: true
            }
        }

        return {
            results: normalized,
            showDropdown: true,
            activeIndex: 0,
            transientNotFound: false
        }
    }

    /**
     * Apply unmatched authority state when user edits controlled value text.
     * @param {Object} options
     * @param {Object} options.subfield
     * @param {Object} options.field
     * @param {Object} options.classes
     * @param {string} options.value
     */
    static applyAuthInputEditState({ subfield, field, classes, value }) {
        subfield.value = value
        const firstValue = field && field.subfields && field.subfields[0] ? field.subfields[0].value : ''
        classes.subfieldValue['subfield-value__changed'] = value !== firstValue
        classes.subfieldValue['authority-controlled'] = false
        classes.subfieldValue['clickable-text'] = false
        delete subfield.xref
    }

    /**
     * Resolve API lookup collection from a record context.
     * @param {Object|null} field
     * @param {string} fallbackCollection
     * @returns {string}
     */
    static getLookupCollection(field, fallbackCollection) {
        const baseCollection =
            (field && field.parentRecord && field.parentRecord.collection)
                ? field.parentRecord.collection
                : fallbackCollection

        // Lookup endpoints use API collections, not virtual collections.
        if (baseCollection === 'speeches' || baseCollection === 'votes') {
            return 'bibs'
        }

        return baseCollection || 'bibs'
    }

    /**
     * Build a display heading string from authority record payload variants.
     * @param {Object} authRecord
     * @returns {string}
     */
    static getAuthorityDisplayText(authRecord) {
        if (!authRecord || typeof authRecord !== 'object') return ''

        if (authRecord.heading) return String(authRecord.heading)
        if (authRecord.value) return String(authRecord.value)

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
    }

    /**
     * Normalize heading subfields from authority record payload variants.
     * @param {Object} authRecord
     * @returns {Array<{code: string, value: string}>}
     */
    static getAuthorityHeadingSubfields(authRecord) {
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
    }

    /**
     * Resolve authority-controlled subfield codes for a tag.
     * @param {Object|null} field
     * @param {string} tag
     * @returns {string[]}
     */
    static getAuthorityControlledCodes(field, tag) {
        if (!field || !field.parentRecord) return []

        const tagMap = field.parentRecord.authMap && field.parentRecord.authMap[tag]
        if (tagMap && typeof tagMap === 'object') {
            return Object.keys(tagMap)
        }

        const subfields = Array.isArray(field.subfields) ? field.subfields : []
        const hasAuthorityChecker = typeof field.parentRecord.isAuthorityControlled === 'function'
        return subfields
            .filter(sf => sf && typeof sf.code === 'string' && hasAuthorityChecker && field.parentRecord.isAuthorityControlled(tag, sf.code))
            .map(sf => sf.code)
    }

    /**
     * Search authority records for a field/subfield query.
     * @param {Object} options
     * @param {string} options.apiPrefix
     * @param {string} options.collection
     * @param {string} options.tag
     * @param {Object} options.field
     * @param {Object} options.subfield
     * @param {string} options.query
     * @returns {Promise<Array<Object>>}
     */
    static async searchAuthorities({ apiPrefix, collection, tag, field, subfield, query }) {
        const params = new URLSearchParams()
        const subfields = Array.isArray(field && field.subfields) ? field.subfields : []

        for (const sf of subfields) {
            if (!sf || typeof sf.code !== 'string' || sf.code.length === 0) continue

            const rawValue = sf === subfield ? query : sf.value
            const value = String(rawValue || '').trim()
            if (!value) continue

            params.append(sf.code, value)
        }

        if (!params.has(subfield.code)) {
            const activeValue = String(query || '').trim()
            if (activeValue) {
                params.append(subfield.code, activeValue)
            }
        }

        params.append('start', '1')

        const endpoint = `${apiPrefix}/marc/${collection}/lookup/${tag}?${params.toString()}`
        const response = await fetch(endpoint)
        if (!response.ok) return []

        const data = await response.json()
        const records = Array.isArray(data)
            ? data
            : Array.isArray(data && data.data)
                ? data.data
                : []

        return records.slice(0, 10).map(auth => ({
            _id: auth.id || auth._id || '',
            id: auth.id || auth._id || '',
            heading: AuthorityControlService.getAuthorityDisplayText(auth),
            subfields: AuthorityControlService.getAuthorityHeadingSubfields(auth),
            fields: auth.fields || [],
            value: AuthorityControlService.getAuthorityDisplayText(auth)
        }))
    }

    /**
     * Apply selected authority data to field/subfield values.
     *
     * @param {Object} options
     * @param {Object} options.field
     * @param {Object} options.subfield
     * @param {string} options.tag
     * @param {Object} options.authority
     * @param {string[]} options.controlledCodes
     * @returns {{ authorityId: string, subfieldValue: string }}
     */
    static applySelectedAuthority({ field, subfield, tag, authority, controlledCodes = [] }) {
        const authorityId = authority && (authority._id || authority.id) ? (authority._id || authority.id) : ''
        const authoritySubfields = Array.isArray(authority && authority.subfields)
            ? authority.subfields.filter(sf => sf && sf.code && sf.value)
            : []

        const controlledCodeSet = new Set(controlledCodes)
        const hasControlledCodeList = controlledCodeSet.size > 0

        // Apply all authority-controlled heading subfields from the selected authority.
        if (authoritySubfields.length > 0 && field && typeof field.getSubfield === 'function' && typeof field.createSubfield === 'function') {
            const incomingCodes = new Set()

            for (const authSubfield of authoritySubfields) {
                if (hasControlledCodeList && !controlledCodeSet.has(authSubfield.code)) {
                    continue
                }

                incomingCodes.add(authSubfield.code)

                let targetSubfield = field.getSubfield(authSubfield.code)
                if (!targetSubfield) {
                    targetSubfield = field.createSubfield(authSubfield.code)
                }

                targetSubfield.value = authSubfield.value
                if (authorityId) {
                    targetSubfield.xref = authorityId
                }
            }

            if (incomingCodes.size > 0) {
                const subfields = Array.isArray(field.subfields) ? [...field.subfields] : []
                for (const existingSubfield of subfields) {
                    if (!existingSubfield || !existingSubfield.code) continue

                    const isAuthorityControlled = hasControlledCodeList
                        ? controlledCodeSet.has(existingSubfield.code)
                        : (field.parentRecord && typeof field.parentRecord.isAuthorityControlled === 'function' && field.parentRecord.isAuthorityControlled(tag, existingSubfield.code))

                    if (isAuthorityControlled && !incomingCodes.has(existingSubfield.code) && existingSubfield !== subfield) {
                        field.deleteSubfield(existingSubfield)
                    }
                }

                // Keep only one subfield per authority-controlled incoming code.
                for (const code of incomingCodes) {
                    const sameCode = (field.subfields || []).filter(sf => sf && sf.code === code)
                    if (sameCode.length <= 1) continue

                    for (let i = 1; i < sameCode.length; i++) {
                        field.deleteSubfield(sameCode[i])
                    }
                }
            }
        } else {
            // Fallback for response payloads that do not provide parsed subfields.
            subfield.value = (authority && (authority.heading || authority.value)) || ''
            if (authorityId) {
                subfield.xref = authorityId
            }
        }

        return {
            authorityId,
            subfieldValue: String((subfield && subfield.value) || '')
        }
    }
}

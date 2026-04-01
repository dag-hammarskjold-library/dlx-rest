import { validationData } from "../../utils/validation.js"
import { SubfieldDateValidator } from "./SubfieldDateValidator.mjs"

/**
 * ValidationRulesService
 *
 * Centralizes record/subfield validation rule lookups for v3 components.
 */
export class ValidationRulesService {
    /**
     * Resolve validation collection, preferring virtual collection when available.
     * @param {Object|null} field
     * @param {string} fallbackCollection
     * @returns {string}
     */
    static getValidationCollection(field, fallbackCollection) {
        if (field && field.parentRecord && typeof field.parentRecord.getVirtualCollection === 'function') {
            return field.parentRecord.getVirtualCollection()
        }

        return fallbackCollection
    }

    /**
     * Resolve validation data document by collection.
     * @param {string} validationCollection
     * @returns {Object|null}
     */
    static getValidationDocument(validationCollection) {
        const collectionMap = {
            bibs: 'bibs',
            speeches: 'speeches',
            votes: 'votes',
            auths: 'auths'
        }

        return validationData[collectionMap[validationCollection] || 'bibs'] || null
    }

    /**
     * Resolve tag-level validation rules.
     * @param {Object|null} validationDocument
     * @param {string} tag
     * @returns {Object|null}
     */
    static getTagValidation(validationDocument, tag) {
        if (!validationDocument) return null
        return validationDocument[tag] || null
    }

    /**
     * Get valid subfield codes for a tag, excluding wildcard values.
     * @param {Object|null} fieldValidation
     * @returns {string[]}
     */
    static getSubfieldCodes(fieldValidation) {
        if (!fieldValidation) return []
        const validSubfields = fieldValidation.validSubfields || []
        return validSubfields.filter(code => code !== '*').sort()
    }

    /**
     * Validate subfield value against string/date constraints.
     * @param {Object|null} fieldValidation
     * @param {string} code
     * @param {string} value
     * @returns {boolean}
     */
    static isSubfieldValueInvalid(fieldValidation, code, value) {
        if (!fieldValidation) return false
        if (!value) return false

        const validStringsByCode = fieldValidation.validStrings || {}
        const allowedValues = validStringsByCode[code]
        const isInvalidByString = Array.isArray(allowedValues) && allowedValues.length > 0
            ? !allowedValues.includes(value)
            : false

        const isDateByCode = fieldValidation.isDate || {}
        const requiresDateFormat = code in isDateByCode
        const isInvalidByDate = requiresDateFormat
            ? !SubfieldDateValidator.isValidDateValue(value)
            : false

        return isInvalidByString || isInvalidByDate
    }
}

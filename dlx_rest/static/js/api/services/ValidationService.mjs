"use strict";

/**
 * ValidationService encapsulates all MARC validation rules.
 * Separates validation logic from domain models.
 */
export class ValidationService {
    constructor(validationData) {
        this.validationData = validationData;
    }

    /**
     * Get validation rules for a specific field in a collection
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @returns {Object|null} Validation rules or null if not found
     */
    getFieldValidation(collection, tag) {
        return this.validationData[collection]?.[tag] || null;
    }

    /**
     * Validate that a tag is a valid MARC tag format (3 digits)
     * @param {string} tag - Tag to validate
     * @returns {boolean} True if valid tag format
     */
    isValidTagFormat(tag) {
        return /^\d{3}$/.test(tag);
    }

    /**
     * Check if a tag is a control field (00x)
     * @param {string} tag - MARC field tag
     * @returns {boolean} True if control field
     */
    isControlFieldTag(tag) {
        return /^00/.test(tag);
    }

    /**
     * Check if a tag is a data field (not 00x)
     * @param {string} tag - MARC field tag
     * @returns {boolean} True if data field
     */
    isDataFieldTag(tag) {
        return this.isValidTagFormat(tag) && !this.isControlFieldTag(tag);
    }

    /**
     * Validate subfield code against allowed subfields for a field
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @param {string} code - Subfield code
     * @returns {Object} { valid: boolean, message?: string }
     */
    validateSubfieldCode(collection, tag, code) {
        const fieldRules = this.getFieldValidation(collection, tag);
        
        if (!fieldRules) {
            return {
                valid: false,
                message: `No validation rules found for field ${tag}`
            };
        }

        const { validSubfields } = fieldRules;
        
        if (validSubfields.includes("*")) {
            return { valid: true };
        }

        if (!validSubfields.includes(code)) {
            return {
                valid: false,
                message: `Invalid subfield code "${code}". Valid codes: ${validSubfields.join(", ")}`
            };
        }

        return { valid: true };
    }

    /**
     * Validate subfield value against string validation rules
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @param {string} code - Subfield code
     * @param {string} value - Subfield value to validate
     * @returns {Object} { valid: boolean, message?: string }
     */
    validateSubfieldString(collection, tag, code, value) {
        if (!value) return { valid: true };

        const fieldRules = this.getFieldValidation(collection, tag);
        if (!fieldRules?.validStrings?.[code]) {
            return { valid: true };
        }

        const validStrings = fieldRules.validStrings[code];
        const isValid = validStrings.includes(value);

        return {
            valid: isValid,
            message: isValid ? null : 
                `Invalid value "${value}". Valid values: ${validStrings.join(", ")}`
        };
    }

    /**
     * Validate subfield value as a date (YYYY, YYYY-MM, or YYYY-MM-DD format)
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @param {string} code - Subfield code
     * @param {string} value - Subfield value to validate
     * @returns {Object} { valid: boolean, message?: string }
     */
    validateSubfieldDate(collection, tag, code, value) {
        if (!value) return { valid: true };

        const fieldRules = this.getFieldValidation(collection, tag);
        if (!fieldRules?.isDate?.[code]) {
            return { valid: true };
        }

        // Normalize date format for validation
        const dateStr = value
            .replace(" ", "-")
            .replace(/^(\d{4})(\d{2})/, "$1-$2")
            .replace(/^(\d{4})-(\d{2})(\d{2})$/, "$1-$2-$3");

        const date = new Date(dateStr);
        const isValid = date.toString() !== "Invalid Date" && 
                        [4, 7, 10].includes(dateStr.length);

        return {
            valid: isValid,
            message: isValid ? null : 
                `Invalid date format "${value}". Expected: YYYY, YYYY-MM, or YYYY-MM-DD`
        };
    }

    /**
     * Validate subfield value against regex patterns
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @param {string} code - Subfield code
     * @param {string} value - Subfield value to validate
     * @returns {Object} { valid: boolean, message?: string }
     */
    validateSubfieldRegex(collection, tag, code, value) {
        if (!value) return { valid: true };

        const fieldRules = this.getFieldValidation(collection, tag);
        if (!fieldRules?.validRegex?.[code]) {
            return { valid: true };
        }

        const validRegexes = fieldRules.validRegex[code];
        const isValid = validRegexes.some(pattern => {
            try {
                return new RegExp(pattern).test(value);
            } catch (e) {
                console.error(`Invalid regex pattern: ${pattern}`, e);
                return false;
            }
        });

        return {
            valid: isValid,
            message: isValid ? null : 
                `Value "${value}" does not match required pattern`
        };
    }

    /**
     * Validate indicator value
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @param {number} indicatorNum - 1 or 2
     * @param {string} value - Indicator value
     * @returns {Object} { valid: boolean, message?: string }
     */
    validateIndicator(collection, tag, indicatorNum, value) {
        if (![1, 2].includes(indicatorNum)) {
            return { valid: false, message: "Indicator must be 1 or 2" };
        }

        const fieldRules = this.getFieldValidation(collection, tag);
        if (!fieldRules) {
            return { valid: false, message: `No rules for field ${tag}` };
        }

        const key = indicatorNum === 1 ? 'validIndicators1' : 'validIndicators2';
        const validIndicators = fieldRules[key] || [];

        // Allow underscore (blank indicator)
        if (value === "_") return { valid: true };

        if (validIndicators.includes("*")) {
            return { valid: true };
        }

        const isValid = validIndicators.includes(value);

        return {
            valid: isValid,
            message: isValid ? null : 
                `Invalid indicator ${indicatorNum}. Valid: ${validIndicators.join(", ") || "None"}`
        };
    }

    /**
     * Check if a field is repeatable
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @returns {boolean} True if repeatable
     */
    isFieldRepeatable(collection, tag) {
        const fieldRules = this.getFieldValidation(collection, tag);
        return fieldRules?.repeatable !== false; // default to true
    }

    /**
     * Get required subfields for a field
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @returns {string[]} Array of required subfield codes
     */
    getRequiredSubfields(collection, tag) {
        const fieldRules = this.getFieldValidation(collection, tag);
        return fieldRules?.requiredSubfields || [];
    }

    /**
     * Get required fields for a collection
     * @param {string} collection - Collection name
     * @returns {string[]} Array of required field tags
     */
    getRequiredFields(collection) {
        const collectionData = this.validationData[collection] || {};
        return Object.keys(collectionData).filter(
            tag => collectionData[tag].required === true
        );
    }

    /**
     * Check if a collection requires heading field (for authorities)
     * @param {string} collection - Collection name
     * @returns {boolean} True if heading required
     */
    requiresHeadingField(collection) {
        return collection === "auths";
    }

    /**
     * Check if field has save actions
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @returns {boolean} True if field has save actions
     */
    hasSaveActions(collection, tag) {
        const fieldRules = this.getFieldValidation(collection, tag);
        return !!fieldRules?.saveActions;
    }

    /**
     * Get save actions for a field
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @returns {Object|null} Save actions or null
     */
    getSaveActions(collection, tag) {
        const fieldRules = this.getFieldValidation(collection, tag);
        return fieldRules?.saveActions || null;
    }

    /**
     * Check if a field has date formatting rules
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @returns {boolean} True if has date rules
     */
    hasDateFormatting(collection, tag) {
        const fieldRules = this.getFieldValidation(collection, tag);
        return !!fieldRules?.isDate;
    }

    /**
     * Get date formatting codes for field
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @returns {string[]} Array of subfield codes with date formatting
     */
    getDateFormattingCodes(collection, tag) {
        const fieldRules = this.getFieldValidation(collection, tag);
        return fieldRules?.isDate ? Object.keys(fieldRules.isDate) : [];
    }
}
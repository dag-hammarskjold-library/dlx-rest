"use strict";

import { Field } from './Field.mjs';

/**
 * MARC Control Field (00x tags)
 * Contains unstructured data without indicators or subfields
 */
export class ControlField extends Field {
    constructor(tag, value = "") {
        super(tag);

        // Validate control field tag format
        if (!this.isControlField()) {
            throw new Error(`Invalid Control Field tag: ${tag}. Control fields must be 00x`);
        }

        this.value = value;
    }

    /**
     * Validate control field structure
     * @throws {Error} If validation fails
     */
    validate() {
        super.validate();

        // Control fields should have a value (can be empty string but shouldn't be null/undefined)
        if (this.value === null || this.value === undefined) {
            throw new Error(`Control field ${this.tag} has invalid value`);
        }
    }

    /**
     * Get validation warnings for control field
     * @returns {Array} Array of ValidationWarning objects
     */
    validationWarnings() {
        const warnings = [];
        const validationService = this._getValidationService();
        const collection = this._getVirtualCollection();

        if (!validationService) return warnings;

        const fieldRules = validationService.getFieldValidation(collection, this.tag);
        
        if (!fieldRules) {
            const ValidationWarning = this._getValidationWarningClass();
            warnings.push(new ValidationWarning(
                `${this.tag} is not a valid field`,
                'error'
            ));
        }

        return warnings;
    }

    /**
     * Get ValidationWarning class from parent record
     * @private
     * @returns {Function} ValidationWarning constructor
     */
    _getValidationWarningClass() {
        // Import dynamically to avoid circular dependency
        return this.parentRecord?.constructor?.ValidationWarning || 
               class ValidationWarning {
               	constructor(message, level) {
               		this.message = message;
               		this.level = level;
               	}
               };
    }

    /**
     * Compile control field to API format
     * @returns {string} The field value
     */
    compile() {
        return this.value;
    }

    /**
     * Convert control field to string
     * @returns {string} The field value
     */
    toStr() {
        return this.value;
    }

    /**
     * Set field value
     * @param {string} value - New value
     */
    setValue(value) {
        this.value = value;
    }

    /**
     * Get field value
     * @returns {string} Current value
     */
    getValue() {
        return this.value;
    }

    /**
     * Check if field is empty
     * @returns {boolean} True if value is empty or whitespace
     */
    isEmpty() {
        return !this.value || /^\s+$/.test(this.value);
    }
}
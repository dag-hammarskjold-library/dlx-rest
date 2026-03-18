"use strict";

/**
 * Base Field class for MARC fields
 * Provides common functionality for both control and data fields
 */
export class Field {
    constructor(tag) {
        this.tag = tag;
        this.parentRecord = null;
    }

    /**
     * Check if this is a control field (00x)
     * @returns {boolean} True if control field
     */
    isControlField() {
        return /^00/.test(this.tag);
    }

    /**
     * Check if this is a data field (not 00x)
     * @returns {boolean} True if data field
     */
    isDataField() {
        return !this.isControlField();
    }

    /**
     * Get the record's validation service
     * @private
     * @returns {Object|null} ValidationService instance
     */
    _getValidationService() {
        return this.parentRecord?.validationService || null;
    }

    /**
     * Get the record's auth map service
     * @private
     * @returns {Object|null} AuthMapService instance
     */
    _getAuthMapService() {
        return this.parentRecord?.authMapService || null;
    }

    /**
     * Get the virtual collection (handles special cases like speeches/votes)
     * @private
     * @returns {string} Collection name
     */
    _getVirtualCollection() {
        return this.parentRecord?.getVirtualCollection?.() || this.parentRecord?.collection || null;
    }

    /**
     * Validate basic field structure (must be overridden)
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.tag) {
            throw new Error("Tag required");
        }

        if (!/^\d{3}$/.test(this.tag)) {
            throw new Error("Invalid tag format");
        }
    }

    /**
     * Get validation warnings (must be overridden)
     * @returns {Array} Array of ValidationWarning objects
     */
    validationWarnings() {
        return [];
    }

    /**
     * Compile field to API format (must be overridden)
     * @returns {*} Compiled field data
     */
    compile() {
        throw new Error("compile() must be implemented by subclass");
    }

    /**
     * Convert field to string representation
     * @returns {string} Field as string
     */
    toStr() {
        throw new Error("toStr() must be implemented by subclass");
    }
}
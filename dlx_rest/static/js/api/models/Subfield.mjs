"use strict";

/**
 * MARC Subfield
 * Part of a data field, identified by a code and containing a value
 */
export class Subfield {
    constructor(code, value = "", xref = null) {
        this.code = code;
        this.value = value;
        this.xref = xref;              // Authority record reference ID
        this.parentField = null;       // Reference to parent DataField
    }

    /**
     * Get the parent field's parent record
     * @private
     * @returns {Object|null} Record instance
     */
    _getParentRecord() {
        return this.parentField?.parentRecord || null;
    }

    /**
     * Get the validation service from parent record
     * @private
     * @returns {Object|null} ValidationService instance
     */
    _getValidationService() {
        return this._getParentRecord()?.validationService || null;
    }

    /**
     * Get the auth map service from parent record
     * @private
     * @returns {Object|null} AuthMapService instance
     */
    _getAuthMapService() {
        return this._getParentRecord()?.authMapService || null;
    }

    /**
     * Validate subfield code and value
     * @throws {Error} If validation fails
     */
    validate() {
        if (!this.code) {
            throw new Error("Subfield code required");
        }

        // If value is only whitespace, mark for deletion
        if (!this.value || /^\s+$/.test(this.value)) {
            if (this.parentField) {
                this.parentField.deleteSubfield(this);
            }
            return;
        }

        // Check authority control
        const record = this._getParentRecord();
        const authMap = this._getAuthMapService()?.getMap(record?.collection);
        
        if (authMap?.[this.parentField?.tag]?.[this.code] && !this.xref) {
            throw new Error(
                `Invalid authority-controlled value: ${this.parentField.tag} $${this.code} "${this.value}"`
            );
        }
    }

    /**
     * Get validation warnings for subfield
     * @returns {Array} Array of ValidationWarning objects
     */
    validationWarnings() {
        const warnings = [];
        const validationService = this._getValidationService();
        const record = this._getParentRecord();
        const collection = record?.getVirtualCollection?.() || record?.collection;
        const tag = this.parentField?.tag;

        if (!validationService || !collection || !tag) return warnings;

        const ValidationWarning = this._getValidationWarningClass();

        // Validate subfield code
        const codeValidation = validationService.validateSubfieldCode(collection, tag, this.code);
        if (!codeValidation.valid) {
            warnings.push(new ValidationWarning(
                `${tag}: ${codeValidation.message}`,
                'error'
            ));
        }

        if (!this.value) return warnings;

        // Validate subfield string values
        const stringValidation = validationService.validateSubfieldString(collection, tag, this.code, this.value);
        if (!stringValidation.valid) {
            warnings.push(new ValidationWarning(
                `${tag} $${this.code}: ${stringValidation.message}`,
                'error'
            ));
        }

        // Validate date format
        const dateValidation = validationService.validateSubfieldDate(collection, tag, this.code, this.value);
        if (!dateValidation.valid) {
            warnings.push(new ValidationWarning(
                `${tag} $${this.code}: ${dateValidation.message}`,
                'error'
            ));
        }

        // Validate regex patterns
        const regexValidation = validationService.validateSubfieldRegex(collection, tag, this.code, this.value);
        if (!regexValidation.valid) {
            warnings.push(new ValidationWarning(
                `${tag} $${this.code}: ${regexValidation.message}`,
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
        return this._getParentRecord?.().constructor?.ValidationWarning || 
               class ValidationWarning {
               	constructor(message, level) {
               		this.message = message;
               		this.level = level;
               	}
               };
    }

    /**
     * Compile subfield to API format
     * @returns {Object} { code, value, xref }
     */
    compile() {
        return {
            code: this.code,
            value: this.value,
            xref: this.xref
        };
    }

    /**
     * Convert subfield to string representation
     * @returns {string} Formatted as "$code value"
     */
    toStr() {
        let str = `$${this.code} ${this.value}`;

        if (this.xref) {
            str += ` @${this.xref}`;
        }

        return str;
    }

    /**
     * Detect and set xref by looking up the heading
     * @async
     * @returns {Promise<string|Error>} The xref ID or error
     */
    async detectAndSetXref() {
        const record = this._getParentRecord();
        const field = this.parentField;
        const authMap = this._getAuthMapService()?.getMap(record?.collection);

        if (!authMap) {
            throw new Error("Auth map not available");
        }

        const isAuthorityControlled = this._getAuthMapService().isAuthorityControlled(
            record.collection,
            field.tag,
            this.code
        );

        if (!isAuthorityControlled) {
            return null;
        }

        // Build search string from authority-controlled subfields
        const searchStr = field.subfields
            .filter(x => authMap[field.tag]?.[x.code])
            .map(x => `${authMap[field.tag][x.code]}__${x.code}:'${x.value}'`)
            .join(" AND ");

        const apiUrl = record.constructor.apiUrl;
        const url = `${apiUrl}marc/auths/records?search=${encodeURIComponent(searchStr)}`;

        try {
            const response = await fetch(url);
            const json = await response.json();
            const recordsList = json['data'];

            if (recordsList.length === 0) {
                this.xref = new Error("Heading does not exist");
            } else if (recordsList.length > 1) {
                this.xref = new Error("Ambiguous heading");
            } else {
                const parts = recordsList[0].split("/");
                this.xref = parts[parts.length - 1];
            }

            return this.xref;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if subfield is empty or whitespace
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return !this.value || /^\s+$/.test(this.value);
    }

    /**
     * Set the xref value
     * @param {string|null} xref - Authority record ID
     */
    setXref(xref) {
        this.xref = xref;
    }

    /**
     * Get the xref value
     * @returns {string|null} Authority record ID
     */
    getXref() {
        return this.xref;
    }
}
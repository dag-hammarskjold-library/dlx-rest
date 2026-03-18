"use strict";

import { Field } from './Field.mjs';
import { Subfield } from './Subfield.mjs';

/**
 * MARC Data Field (not 00x)
 * Contains indicators and subfields with structured data
 */
export class DataField extends Field {
    constructor(tag, indicators = [" ", " "], subfields = []) {
        super(tag);

        // Validate data field tag format
        if (this.isControlField()) {
            throw new Error(`Invalid Data Field tag: ${tag}. Data fields cannot be 00x`);
        }

        this.indicators = indicators;
        this.subfields = subfields;
        this.checked = false;
    }

    /**
     * Validate data field structure
     * @throws {Error} If validation fails
     */
    validate() {
        super.validate();

        if (!this.subfields || this.subfields.length === 0) {
            throw new Error(`Data field ${this.tag} requires at least one subfield`);
        }

        // Validate each subfield
        for (let subfield of this.subfields) {
            subfield.validate();
        }

        // Remove empty subfields
        this.subfields = this.subfields.filter(sf => !sf.isEmpty());

        if (this.subfields.length === 0) {
            if (this.parentRecord) {
                this.parentRecord.deleteField(this);
            }
        }
    }

    /**
     * Get validation warnings for data field
     * @returns {Array} Array of ValidationWarning objects
     */
    validationWarnings() {
        const warnings = [];
        const validationService = this._getValidationService();
        const collection = this._getVirtualCollection();

        if (!validationService) return warnings;

        const fieldRules = validationService.getFieldValidation(collection, this.tag);
        const ValidationWarning = this._getValidationWarningClass();

        if (!fieldRules) {
            warnings.push(new ValidationWarning(
                `${this.tag} is not a valid field`,
                'error'
            ));
            return warnings;
        }

        // Check repeatable
        if (!validationService.isFieldRepeatable(collection, this.tag)) {
            if (this.parentRecord?.getFields(this.tag)?.length > 1) {
                if (this !== this.parentRecord.getFields(this.tag)[0]) {
                    warnings.push(new ValidationWarning(
                        `${this.tag}: Field not repeatable`,
                        'error'
                    ));
                }
            }
        }

        // Validate indicators
        for (let i of [1, 2]) {
            const indicatorValidation = validationService.validateIndicator(
                collection,
                this.tag,
                i,
                this.indicators[i - 1]
            );

            if (!indicatorValidation.valid) {
                warnings.push(new ValidationWarning(
                    `${this.tag}: ${indicatorValidation.message}`,
                    'error'
                ));
            }
        }

        // Check required subfields
        const requiredSubfields = validationService.getRequiredSubfields(collection, this.tag);
        const subfieldCodes = this.subfields.map(x => x.code);

        requiredSubfields.forEach(code => {
            if (!subfieldCodes.includes(code)) {
                warnings.push(new ValidationWarning(
                    `${this.tag}: Required subfield "$${code}" is missing`,
                    'error'
                ));
            } else {
                const subfield = this.getSubfield(code);
                if (subfield?.isEmpty()) {
                    warnings.push(new ValidationWarning(
                        `${this.tag}: Required subfield "$${code}" is blank`,
                        'error'
                    ));
                }
            }
        });

        return warnings;
    }

    /**
     * Get ValidationWarning class from parent record
     * @private
     * @returns {Function} ValidationWarning constructor
     */
    _getValidationWarningClass() {
        return this.parentRecord?.constructor?.ValidationWarning || 
               class ValidationWarning {
               	constructor(message, level) {
               		this.message = message;
               		this.level = level;
               	}
               };
    }

    /**
     * Create a new subfield
     * @param {string} code - Subfield code
     * @param {number} place - Optional position to insert
     * @returns {Subfield} New subfield
     */
    createSubfield(code, place) {
        const subfield = new Subfield(code);

        if (place !== undefined) {
            this.subfields.splice(place, 0, subfield);
        } else {
            this.subfields.push(subfield);
        }

        subfield.parentField = this;
        return subfield;
    }

    /**
     * Get all subfields with a specific code
     * @param {string} code - Subfield code
     * @returns {Subfield[]} Array of matching subfields
     */
    getSubfields(code) {
        return this.subfields.filter(x => x.code === code);
    }

    /**
     * Get a specific subfield by code and position
     * @param {string} code - Subfield code
     * @param {number} place - Position (0-based)
     * @returns {Subfield|undefined} The subfield or undefined
     */
    getSubfield(code, place = 0) {
        return this.getSubfields(code)[place];
    }

    /**
     * Delete a subfield
     * @param {Subfield|string} subfieldOrCode - Subfield instance or code
     * @param {number} place - Position if using code
     */
    deleteSubfield(subfieldOrCode, place) {
        if (subfieldOrCode instanceof Subfield) {
            this.subfields = this.subfields.filter(x => x !== subfieldOrCode);
        } else {
            const code = subfieldOrCode;

            if (place !== undefined) {
                const subfield = this.getSubfield(code, place);
                if (subfield) {
                    this.deleteSubfield(subfield);
                }
            } else {
                this.subfields = this.subfields.filter(x => x.code !== code);
            }
        }
    }

    /**
     * Compile data field to API format
     * @returns {Object} { tag, indicators, subfields }
     */
    compile() {
        return {
            tag: this.tag,
            indicators: this.indicators,
            subfields: this.subfields.map(x => x.compile())
        };
    }

    /**
     * Convert data field to string representation
     * @returns {string} Indicators and subfields
     */
    toStr() {
        let str = "";

        for (let subfield of this.subfields.filter(x => x.value)) {
            str += `${subfield.toStr()} |`;
        }

        return str;
    }

    /**
     * Perform lookup for authority control
     * @async
     * @returns {Promise<DataField[]>} Array of matching authority fields
     */
    async lookup() {
        const collection = this instanceof BibDataField ? "bibs" : "auths";
        const lookupString = this.subfields
            .filter(x => x.value)
            .map(x => `${encodeURIComponent(x.code)}=${encodeURIComponent(x.value)}`)
            .join("&");
        
        let url = `${this.parentRecord.constructor.apiUrl}marc/${collection}/lookup/${this.tag}?${lookupString}`;

        // Determine the lookup type
        if (["191", "791", "991"].includes(this.tag)) {
            url += '&type=partial';
        } else {
            url += '&type=text';
        }

        try {
            const response = await fetch(url);
            const json = await response.json();
            const results = json['data'];
            const choices = [];

            for (let auth of results) {
                // Parse authority record to check for deprecation
                const Jmarc = this.parentRecord.constructor;
                const newJmarc = new Jmarc("auths").parse(auth);
                const this682 = newJmarc.getField('682');
                
                // Issue #190: Exclude deprecated authority terms from lookup
                if (this682) {
                    const this682_a = this682.getSubfield('a');
                    if (this682_a?.value?.toLowerCase() === 'deprecated') {
                        continue;
                    }
                }

                // Extract heading field (1XX)
                for (let tag of Object.keys(auth).filter(x => x.match(/^1\d\d/))) {
                    const field = this instanceof BibDataField ? 
                        new BibDataField(this.tag) : 
                        new AuthDataField(this.tag);
                    
                    field.indicators = auth[tag][0].indicators;

                    for (let sf of auth[tag][0]['subfields']) {
                        field.subfields.push(new Subfield(sf['code'], sf['value'], auth['_id']));
                    }

                    choices.push(field);
                }
            }

            return choices;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if field is empty
     * @returns {boolean} True if no subfields
     */
    isEmpty() {
        return this.subfields.length === 0;
    }

    /**
     * Set indicators
     * @param {string[]} indicators - Array of 2 indicator values
     */
    setIndicators(indicators) {
        if (indicators.length !== 2) {
            throw new Error("Indicators must be array of length 2");
        }
        this.indicators = indicators;
    }

    /**
     * Get indicators
     * @returns {string[]} Array of 2 indicator values
     */
    getIndicators() {
        return this.indicators;
    }
}

/**
 * Bibliographic Data Field
 */
export class BibDataField extends DataField {
    constructor(tag, indicators, subfields) {
        super(tag, indicators, subfields);
    }
}

/**
 * Authority Data Field
 */
export class AuthDataField extends DataField {
    constructor(tag, indicators, subfields) {
        super(tag, indicators, subfields);
    }
}
"use strict";

import { Record } from './Record.mjs';

/**
 * Bibliographic Record
 * Represents a bibliographic MARC record
 */
export class BibRecord extends Record {
    /**
     * Static services (injected by Jmarc.init())
     * @static
     */
    static apiUrl = null;
    static authMapService = null;
    static validationService = null;
    static repository = null;
    static ValidationWarning = null;

    constructor() {
        super('bibs');
    }

    /**
     * Fetch a bibliographic record by ID
     * @static
     * @async
     * @param {number} recordId - Record ID
     * @returns {Promise<BibRecord>} Loaded record
     */
    static async get(recordId) {
        if (!BibRecord.apiUrl) {
            throw new Error('BibRecord.apiUrl must be set');
        }
        if (!BibRecord.repository) {
            throw new Error('BibRecord.repository not initialized. Call Jmarc.init() first');
        }

        const record = new BibRecord();

        try {
            const data = await BibRecord.repository.getRecord('bibs', recordId);

            if (!data) {
                return null;
            }

            record.recordId = parseInt(recordId);
            record.url = `${BibRecord.apiUrl}marc/bibs/records/${recordId}`;
            record.parse(data);
            record.updateSavedState();
            record.files = data['files'] || [];

            return record;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate bibliographic-specific rules
     * @protected
     */
    _validateCollection() {
        // Bib-specific validation can go here
        // For now, just call parent
        super._validateCollection();
    }

    /**
     * Check if symbol is in use in other records
     * @async
     * @returns {Promise<boolean>} True if symbol used elsewhere
     */
    async symbolInUse() {
        let inUse = false;

        for (const tag of ['191', '791']) {
            for (const field of this.getFields(tag)) {
                const subfieldA = field.getSubfield('a');
                if (!subfieldA) continue;

                const searchStr = `${tag}__a:'${subfieldA.value}'`;

                try {
                    const results = await this.repository.searchRecords('bibs', searchStr, 1);
                    if (results.length > 0) inUse = true;
                } catch (error) {
                    throw error;
                }
            }
        }

        return inUse;
    }

    /**
     * Run save actions for bibs
     * @protected
     */
    runSaveActions() {
        if (!this.validationService) return;

        const validationData = this.validationService.validationData;
        const collection = this.collection;

        Object.keys(validationData[collection] || {}).forEach(tag => {
            const data = validationData[collection][tag];

            // Add dashes to dates
            if ('isDate' in data) {
                for (const field of this.getFields(tag)) {
                    for (const code of Object.keys(data.isDate)) {
                        for (const subfield of field.getSubfields(code)) {
                            subfield.value = subfield.value
                                .replace(' ', '-')
                                .replace(/^(\d{4})(\d{2})/, '$1-$2')
                                .replace(/^(\d{4})-(\d{2})(\d{2})$/, '$1-$2-$3');
                        }
                    }
                }
            }

            // Run save actions
            this._executeSaveActions(tag, data);
        });
    }

    /**
     * Execute save actions for a specific field
     * @private
     * @param {string} tag - MARC tag
     * @param {Object} data - Field validation data
     */
    _executeSaveActions(tag, data) {
        if (!('saveActions' in data)) return;

        this.deleteField(tag);

        for (const [criteria, map] of Object.entries(data.saveActions)) {
            if (this._evaluateSaveActionCriteria(criteria)) {
                const newField = this.createField(tag);
                newField.indicators = ['_', '_'];

                for (const [code, value] of Object.entries(map).sort()) {
                    if (value) {
                        newField.createSubfield(code).value = value;
                    }
                }
            }
        }
    }

    /**
     * Evaluate whether save action criteria is met
     * @private
     * @param {string} criteria - Criteria expression (e.g., "field:value AND other:value2")
     * @returns {boolean} True if criteria is met
     */
    _evaluateSaveActionCriteria(criteria) {
        const terms = criteria.split(/\s*(AND|OR|NOT)\s+/).filter(x => x);
        let modifier = '';
        let result = true;

        for (const term of terms) {
            if (['AND', 'OR', 'NOT'].includes(term)) {
                modifier += term;
            } else {
                const [fieldPart, value] = term.split(':');
                const [tag, code] = fieldPart.split('__');
                const evaluation = this._evaluateSaveActionTerm(tag, code, value);

                switch (modifier) {
                    case '':
                        result = evaluation;
                        break;
                    case 'NOT':
                        result = !evaluation;
                        break;
                    case 'AND':
                        result = result && evaluation;
                        break;
                    case 'ANDNOT':
                        result = result && !evaluation;
                        break;
                    case 'OR':
                        result = result || evaluation;
                        break;
                    case 'ORNOT':
                        result = result || !evaluation;
                        break;
                }

                modifier = '';
            }
        }

        return result;
    }

    /**
     * Evaluate a single save action term
     * @private
     * @param {string} tag - MARC tag
     * @param {string} code - Subfield code
     * @param {string} pattern - Pattern to match (regex or literal)
     * @returns {boolean} True if pattern matches
     */
    _evaluateSaveActionTerm(tag, code, pattern) {
        const fields = this.getFields(tag);
        let regex;

        if (pattern.startsWith('/') && pattern.endsWith('/')) {
            regex = new RegExp(pattern.slice(1, -1), 'i');
        } else {
            const escaped = pattern
                .replace(/\//g, '\\/')
                .replace(/\[/g, '\\[')
                .replace(/\]/g, '\\]')
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*');
            regex = new RegExp(escaped, 'i');
        }

        for (const field of fields) {
            const subfields = code ? field.getSubfields(code) : field.subfields;
            for (const subfield of subfields) {
                if (regex.test(subfield.value)) {
                    return true;
                }
            }
        }

        return false;
    }
}
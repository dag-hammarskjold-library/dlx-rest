"use strict";

import { Record } from './Record.mjs';

/**
 * Authority Record
 * Represents an authority MARC record
 */
export class AuthRecord extends Record {
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
        super('auths');
    }

    /**
     * Fetch an authority record by ID
     * @static
     * @async
     * @param {number} recordId - Record ID
     * @returns {Promise<AuthRecord>} Loaded record
     */
    static async get(recordId) {
        if (!AuthRecord.apiUrl) {
            throw new Error('AuthRecord.apiUrl must be set');
        }
        if (!AuthRecord.repository) {
            throw new Error('AuthRecord.repository not initialized. Call AuthRecord.init() first');
        }

        const record = new AuthRecord();

        try {
            const data = await AuthRecord.repository.getRecord('auths', recordId);

            if (!data) {
                return null;
            }

            record.recordId = parseInt(recordId);
            record.url = `${AuthRecord.apiUrl}marc/auths/records/${recordId}`;
            record.parse(data);
            record.updateSavedState();
            record.files = data['files'] || [];

            return record;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate authority-specific rules
     * @protected
     */
    _validateCollection() {
        // Authority records require a heading field (1XX)
        const hasHeading = this.fields.some(x => x.tag.match(/^1/));
        if (!hasHeading) {
            throw new Error('Heading field required');
        }
    }

    /**
     * Check if heading exists in other authority records
     * @async
     * @returns {Promise<boolean>} True if heading used elsewhere
     */
    async headingInUse() {
        const headingField = this.fields.find(x => x.tag.match(/^1/));

        if (!headingField) {
            return false;
        }

        const searchStr = headingField.subfields
            .filter(x => x.value)
            .map(x => `${headingField.tag}__${x.code}:'${x.value}'`)
            .join(' AND ');

        try {
            const count = await this.repository.countRecords('auths', searchStr);

            if (count === 0) {
                return false;
            } else if (count > 1000) {
                throw new Error('Too many records to fetch. Please notify administrators.');
            }

            const matches = await this.repository.searchRecords('auths', searchStr, count);
            const recordIds = matches.map(url => url.split('/').slice(-1)[0]);
            const records = await Promise.all(recordIds.map(id => AuthRecord.get(id)));

            // Check if any other record has the same heading
            for (const auth of records) {
                if (auth.recordId === this.recordId) continue;

                const otherHeading = auth.fields.find(x => x.tag.match(/^1/));
                if (headingField.toStr() === otherHeading?.toStr()) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if this exact record already exists
     * @async
     * @returns {Promise<boolean>} True if exists
     */
    async exists() {
        const headingField = this.fields.find(x => x.tag.match(/^1/));

        if (!headingField) {
            return false;
        }

        const searchStr = headingField.subfields
            .map(x => `${headingField.tag}__${x.code}:'${x.value}'`)
            .join(' AND ');

        try {
            const count = await this.repository.countRecords('auths', searchStr);
            return count === 1;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Run save actions for auths
     * @protected
     */
    runSaveActions() {
        // Authority records currently don't have save actions
        // but can be overridden as needed
    }
}
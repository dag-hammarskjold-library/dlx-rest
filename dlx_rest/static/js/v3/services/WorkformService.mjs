/**
 * WorkformService
 * 
 * Encapsulates workform-related operations for record editing.
 * Handles creation, updates, and file 998 field management.
 * 
 * Responsibilities:
 * - Save record as new workform
 * - Update existing workform
 * - Manage 998 field (control field for workforms)
 * - Handle user prompts for workform naming
 * - Clone records while preserving workform metadata
 */

import { Jmarc } from '../../api/jmarc.mjs'

export class WorkformService {
    constructor(record) {
        this.record = record
    }

    /**
     * Check if record is a persisted workform
     * @returns {boolean}
     */
    isPersistedWorkform() {
        return !!(this.record && this.record.workformName)
    }

    /**
     * Get workform name
     * @returns {string}
     */
    getWorkformName() {
        return (this.record?.workformName || '').trim()
    }

    /**
     * Get workform description
     * @returns {string}
     */
    getWorkformDescription() {
        return (this.record?.workformDescription || '').trim()
    }

    /**
     * Save current record as a new workform
     * @param {Object} options - Configuration options
     * @param {string} options.workformName - Name for the workform
     * @param {string} options.description - Description for the workform
     * @returns {Promise<Object>} Result with success status and message
     * @throws {Error} If save fails
     */
    async saveAsWorkform(options = {}) {
        if (!this.record || !this.record.collection) {
            throw new Error('Record or collection is not available')
        }

        let workformName = (options.workformName || this.record.workformName || '').trim()
        let description = (options.description || this.record.workformDescription || '').trim()

        // Prompt for name if not provided
        if (!workformName) {
            const nameInput = window.prompt('Workform name', '')
            if (nameInput === null) return { cancelled: true }
            workformName = String(nameInput || '').trim()
            
            if (!workformName) {
                throw new Error('Workform name is required')
            }
        }

        // Prompt for description if not provided
        if ('description' in options === false) {
            const descInput = window.prompt('Workform description', '')
            if (descInput === null) return { cancelled: true }
            description = String(descInput || '').trim()
        }

        try {
            // Clone to avoid modifying original
            const candidate = this.record.clone()
            await this._removeControlFields(candidate)
            
            // Save as workform
            await candidate.saveAsWorkform(workformName, description)

            // Update source record with workform metadata
            this.record.workformName = workformName
            this.record.workformDescription = description

            return {
                success: true,
                workformName,
                description,
                path: `${this.record.collection}/workforms/${workformName}`
            }
        } catch (error) {
            throw new Error(`Could not save workform: ${error?.message || String(error)}`)
        }
    }

    /**
     * Update existing workform
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} Result with success status and message
     * @throws {Error} If update fails
     */
    async updateWorkform(options = {}) {
        if (!this.record || !this.record.workformName) {
            throw new Error('Record is not a persisted workform')
        }

        const name = this.getWorkformName()
        if (!name) {
            throw new Error('Workform name is missing')
        }

        let description = (options.description || this.record.workformDescription || '').trim()

        // Prompt for description if not provided
        if ('description' in options === false) {
            const descInput = window.prompt('Workform description', this.record.workformDescription || '')
            if (descInput === null) return { cancelled: true }
            description = String(descInput || '').trim()
        }

        try {
            // Clone to avoid modifying original
            const candidate = this.record.clone()
            await this._removeControlFields(candidate)
            
            // Save workform
            await candidate.saveWorkform(name, description)

            // Reload the saved workform from API so editor reflects canonical saved data
            const refreshed = await Jmarc.fromWorkform(this.record.collection, name)
            if (refreshed) {
                this.record.fields = []
                this.record.parse(refreshed.compile())
                this.record.workformDescription = description
            }

            return {
                success: true,
                workformName: name,
                description,
                reloaded: !!refreshed
            }
        } catch (error) {
            throw new Error(`Could not update workform: ${error?.message || String(error)}`)
        }
    }

    /**
     * Remove control fields (998) from a record
     * @param {Object} record - The record to clean
     * @private
     */
    async _removeControlFields(record) {
        if (typeof record.getFields === 'function' && typeof record.deleteField === 'function') {
            const fields998 = record.getFields('998') || []
            fields998.forEach(field => record.deleteField(field))
        } else if (Array.isArray(record.fields)) {
            record.fields = record.fields.filter(field => field && field.tag !== '998')
        }
    }

    /**
     * Update workform metadata in the record
     * @param {string} name - Workform name
     * @param {string} description - Workform description
     */
    updateMetadata(name, description) {
        this.record.workformName = name
        this.record.workformDescription = description
    }

    /**
     * Clear workform metadata (when record is no longer bound to workform)
     */
    clearMetadata() {
        this.record.workformName = null
        this.record.workformDescription = null
    }
}

"use strict";

import { ControlField } from './ControlField.mjs';
import { DataField, BibDataField, AuthDataField } from './DataField.mjs';
import { UndoRedoManager } from '../services/UndoRedoManager.mjs';

/**
 * Base Record class for MARC records
 * Handles field management, parsing, compilation, and validation
 */
export class Record {
    /**
     * Static services injected by Jmarc.init()
     * @static
     */
    static authMapService = null;
    static validationService = null;
    static repository = null;

    constructor(collection) {
        if (!collection) {
            throw new Error('Collection required ("bibs" or "auths")');
        }

        this.collection = collection;
        this.recordId = null;
        this.url = null;
        this.fields = [];
        this.created = null;
        this.createdUser = null;
        this.updated = null;
        this.user = null;
        this.savedState = {};
        this.files = [];

        // Use static services from class
        this.authMapService = this.constructor.authMapService;
        this.validationService = this.constructor.validationService;
        this.repository = this.constructor.repository;

        // Undo/redo tracking
        this.undoRedoManager = new UndoRedoManager(1000);
    }

    /**
     * Get virtual collection (handles special cases like speeches/votes)
     * @returns {string} Collection name
     */
    getVirtualCollection() {
        let virtualCollection = this.collection;

        const field089 = this.getField('089');
        if (field089) {
            const recordType = field089.getSubfield('b');
            if (recordType?.value === 'B22') {
                virtualCollection = 'speeches';
            } else if (recordType?.value === 'B23') {
                virtualCollection = 'votes';
            }
        }

        return virtualCollection;
    }

    /**
     * Inject services from static context
     * @private
     * @param {Object} services - { authMapService, validationService, repository }
     */
    _injectServices(services) {
        this.authMapService = services.authMapService;
        this.validationService = services.validationService;
        this.repository = services.repository;
    }

    /**
     * Parse raw record data into fields
     * @param {Object} data - Raw record data from API
     * @returns {Record} This instance for chaining
     */
    parse(data = {}) {
        this.created = data['created'];
        this.createdUser = data['created_user'];
        this.updated = data['updated'];
        this.user = data['user'];

        // Extract field tags and sort numerically
        const tags = Object.keys(data)
            .filter(x => x.match(/^\d{3}/))
            .sort((a, b) => parseInt(a) - parseInt(b));

        // Update existing objects to preserve saved state
        for (const tag of tags) {
            for (const [i, fieldData] of data[tag].entries()) {
                let field = this.getField(tag, i) || this.createField(tag);
                field._seen = true;

                if (tag.match(/^00/)) {
                    // Control field
                    field.value = fieldData;
                } else {
                    // Data field
                    field.indicators = fieldData.indicators.map(x => x.replace(' ', '_'));
                    const seenSubfields = {};

                    for (const subfieldData of fieldData.subfields) {
                        const code = subfieldData.code;
                        const place = seenSubfields[code] || 0;
                        let subfield = field.getSubfield(code, place) || field.createSubfield(code);

                        subfield._seen = true;
                        subfield.value = subfieldData.value;

                        // Set xref if authority-controlled
                        if (this.authMapService?.isAuthorityControlled(this.collection, tag, code)) {
                            subfield.xref = subfieldData.xref;
                        }

                        seenSubfields[code] = (seenSubfields[code] || 0) + 1;
                    }
                }
            }
        }

        // Remove fields not in new data
        for (const field of this.getDataFields()) {
            if (!field._seen) {
                this.deleteField(field);
                continue;
            }

            delete field._seen;

            // Remove subfields not in new data
            for (const subfield of field.subfields) {
                if (!subfield._seen) {
                    field.deleteSubfield(subfield);
                }
                delete subfield._seen;
            }
        }

        return this;
    }

    /**
     * Compile record to API format
     * @returns {Object} Compiled record data
     */
    compile() {
        const recordData = {
            _id: this.recordId,
            created: this.created,
            created_user: this.createdUser,
            updated: this.updated,
            user: this.user
        };

        const tags = Array.from(new Set(this.fields.map(x => x.tag)));

        for (const tag of tags.sort((a, b) => parseInt(a) - parseInt(b))) {
            recordData[tag] = [];

            for (const field of this.getFields(tag)) {
                if (field.constructor.name === 'ControlField') {
                    recordData[tag].push(field.value);
                } else {
                    recordData[tag].push(field.compile());
                }
            }
        }

        return recordData;
    }

    /**
     * Convert record to string representation
     * @returns {string} Formatted field list
     */
    toStr() {
        return this.fields
            .filter(x => !x.tag.match(/^00/))
            .map(x => `: ${x.tag} ${x.toStr()}`)
            .join('\n');
    }

    /**
     * Stringify record to JSON
     * @returns {string} JSON string
     */
    stringify() {
        return JSON.stringify(this.compile());
    }

    /**
     * Check if record has unsaved changes
     * @returns {boolean} True if saved state differs from current
     */
    get saved() {
        return JSON.stringify(this.savedState) === JSON.stringify(this.compile());
    }

    /**
     * Update saved state (called after save)
     */
    updateSavedState() {
        this.savedState = this.compile();

        this.getDataFields().forEach(field => {
            field.savedState = field.compile();
            field.subfields.forEach(subfield => {
                subfield.savedState = subfield.compile();
            });
        });
    }

    /**
     * Create a new field
     * @param {string} tag - MARC tag
     * @param {number} place - Optional insertion position
     * @returns {Field} New field instance
     */
    createField(tag, place) {
        let field;

        if (tag.match(/^00/)) {
            field = new ControlField(tag);
        } else {
            field = this.collection === 'bibs' ? 
                new BibDataField(tag) : 
                new AuthDataField(tag);
        }

        if (tag && place) {
            // Insert at specific position within tag group
            let tagPosition = 0;
            let inserted = false;

            for (let [index, existingField] of this.fields.entries()) {
                if (existingField.tag === tag) {
                    if (tagPosition === place) {
                        this.fields.splice(index, 0, field);
                        inserted = true;
                        break;
                    }
                    tagPosition++;
                }
            }

            if (!inserted) {
                // Insert at end of tag group
                const lastFieldOfTag = this.getField(tag);
                const insertIndex = this.fields.indexOf(lastFieldOfTag) + this.getFields(tag).length;
                this.fields.splice(insertIndex, 0, field);
            }
        } else if (place !== undefined) {
            // Insert at absolute position
            this.fields.splice(place, 0, field);
        } else {
            // Append to end
            this.fields.push(field);
        }

        field.parentRecord = this;
        return field;
    }

    /**
     * Get all fields with a specific tag
     * @param {string} tag - MARC tag
     * @returns {Field[]} Array of matching fields
     */
    getFields(tag) {
        return this.fields.filter(x => x.tag === tag);
    }

    /**
     * Get a specific field by tag and position
     * @param {string} tag - MARC tag
     * @param {number} place - Position (0-based, default 0)
     * @returns {Field|undefined} The field or undefined
     */
    getField(tag, place = 0) {
        return this.getFields(tag)[place];
    }

    /**
     * Delete a field or all fields with a tag
     * @param {Field|string} fieldOrTag - Field instance or MARC tag
     * @param {number} place - Optional position if using tag
     */
    deleteField(fieldOrTag, place) {
        if (fieldOrTag instanceof DataField || fieldOrTag instanceof ControlField) {
            this.fields = this.fields.filter(x => x !== fieldOrTag);
        } else {
            const tag = fieldOrTag;

            if (place !== undefined) {
                const field = this.getField(tag, place);
                if (field) {
                    this.deleteField(field);
                }
            } else {
                // Delete all instances of tag
                this.fields = this.fields.filter(x => x.tag !== tag);
            }
        }
    }

    /**
     * Get all control fields (00x)
     * @returns {ControlField[]} Array of control fields
     */
    getControlFields() {
        return this.fields.filter(x => x.tag.match(/^0{2}/));
    }

    /**
     * Get all data fields (not 00x)
     * @returns {DataField[]} Array of data fields
     */
    getDataFields() {
        return this.fields.filter(x => !x.tag.match(/^0{2}/));
    }

    /**
     * Get a specific subfield
     * @param {string} tag - MARC tag
     * @param {string} code - Subfield code
     * @param {number} tagPlace - Field position (default 0)
     * @param {number} codePlace - Subfield position (default 0)
     * @returns {Subfield|undefined} The subfield or undefined
     */
    getSubfield(tag, code, tagPlace = 0, codePlace = 0) {
        const field = this.getField(tag, tagPlace);
        return field?.getSubfield(code, codePlace);
    }

    /**
     * Check if subfield is authority-controlled
     * @param {string} tag - MARC tag
     * @param {string} code - Subfield code
     * @returns {boolean} True if authority-controlled
     */
    isAuthorityControlled(tag, code) {
        return this.authMapService?.isAuthorityControlled(this.collection, tag, code) || false;
    }

    /**
     * Validate record structure
     * @throws {Error} If validation fails
     */
    validate() {
        // Validate all fields
        for (const field of this.fields) {
            if (!field.tag) {
                throw new Error('Tag required');
            }

            if (!field.tag.match(/\d{3}/)) {
                throw new Error('Invalid tag format');
            }

            field.validate();
        }

        // Collection-specific validation
        this._validateCollection();
    }

    /**
     * Validate collection-specific rules (override in subclass)
     * @protected
     */
    _validateCollection() {
        // Override in subclass
    }

    /**
     * Get validation warnings at record level
     * @returns {Array} Array of ValidationWarning objects
     */
    validationWarnings() {
        const warnings = [];
        
        if (!this.validationService) {
            return warnings;
        }

        const collection = this.getVirtualCollection();
        const requiredFields = this.validationService.getRequiredFields(collection);
        const existingTags = new Set(this.getDataFields().map(x => x.tag));

        for (const tag of requiredFields) {
            if (!existingTags.has(tag)) {
                warnings.push(this._createValidationWarning(
                    `Required field ${tag} is missing`,
                    'error'
                ));
            }
        }

        return warnings;
    }

    /**
     * Get all validation warnings (record, field, subfield levels)
     * @returns {Array} Flattened array of all warnings
     */
    allValidationWarnings() {
        let warnings = this.validationWarnings();

        this.getDataFields().forEach(field => {
            warnings.push(...field.validationWarnings());

            field.subfields.forEach(subfield => {
                warnings.push(...subfield.validationWarnings());
            });
        });

        return warnings.flat();
    }

    /**
     * Create a ValidationWarning instance
     * @protected
     * @param {string} message - Warning message
     * @param {string} level - Warning level (default 'warning')
     * @returns {ValidationWarning} Warning instance
     */
    _createValidationWarning(message, level = 'warning') {
        // Use static from class or create inline
        return this.constructor.ValidationWarning ? 
            new this.constructor.ValidationWarning(message, level) :
            { message, level };
    }

    /**
     * Clone record
     * @returns {Record} New instance with same data
     */
    clone() {
        const cloned = new this.constructor();
        return cloned.parse(this.compile());
    }

    /**
     * Start auto-tracking changes
     * @param {number} interval - Tracking interval in ms (default 1000)
     */
    startAutoTracking(interval = 1000) {
        this.undoRedoManager.startAutoTracking(
            () => this.compile(),
            (value) => {
                console.log(`Record ${this.recordId} change tracked`);
            }
        );
    }

    /**
     * Stop auto-tracking
     */
    stopAutoTracking() {
        this.undoRedoManager.stopAutoTracking();
    }

    /**
     * Undo last change
     * @returns {Object|null} Previous state
     */
    undo() {
        const previous = this.undoRedoManager.undo();
        if (previous) {
            this.parse(previous);
        }
        return previous;
    }

    /**
     * Redo last undone change
     * @returns {Object|null} Next state
     */
    redo() {
        const next = this.undoRedoManager.redo();
        if (next) {
            this.parse(next);
        }
        return next;
    }

    /**
     * Check if undo is available
     * @returns {boolean} True if can undo
     */
    canUndo() {
        return this.undoRedoManager.canUndo();
    }

    /**
     * Check if redo is available
     * @returns {boolean} True if can redo
     */
    canRedo() {
        return this.undoRedoManager.canRedo();
    }

    /**
     * Get undo/redo history
     * @returns {Array} History entries
     */
    getUndoRedoHistory() {
        return this.undoRedoManager.getHistory();
    }

    /**
     * Get current undo/redo position
     * @returns {Object} { current, total }
     */
    getUndoRedoPosition() {
        return this.undoRedoManager.getPosition();
    }

    /**
     * Get record history from repository
     * @async
     * @returns {Promise<Record[]>} Array of historical versions
     */
    async history() {
        if (!this.recordId || !this.repository) {
            return [];
        }

        try {
            const events = await this.repository.getRecordHistory(this.collection, this.recordId);
            const promises = events.map(async (event) => {
                try {
                    const recordData = await this.repository.getHistoryEvent(event.event);
                    const historicalRecord = new this.constructor();
                    historicalRecord._injectServices({
                        authMapService: this.authMapService,
                        validationService: this.validationService,
                        repository: this.repository
                    });
                    return historicalRecord.parse(recordData);
                } catch (error) {
                    console.error('Failed to fetch history event:', error);
                    return null;
                }
            });

            const results = await Promise.all(promises);
            return results.filter(r => r !== null);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a diff between this record and another
     * @param {Record} other - Record to compare against
     * @returns {Record} New diff record
     */
    diff(other) {
        if (!(other instanceof Record)) {
            throw new Error('First argument must be instance of Record');
        }

        const diffRecord = new this.constructor();
        diffRecord.parse(this.compile());

        for (const field of diffRecord.fields) {
            const otherFieldStrings = other.fields.map(x => x.toStr());
            field.isDiff = !otherFieldStrings.includes(field.toStr());
        }

        return diffRecord;
    }

    /**
     * Run save actions (subclass override)
     * @protected
     */
    runSaveActions() {
        // Override in subclass
    }

    /**
     * Save record to API
     * @async
     * @returns {Promise<Record>} Reloaded record from server
     * @throws {Error} If save fails
     */
    async save() {
        try {
            this.validate();
        } catch (error) {
            throw error;
        }

        this.runSaveActions();

        try {
            if (this.recordId) {
                // Update existing
                await this.repository.updateRecord(this.collection, this.recordId, this.compile());
            } else {
                // Create new
                const result = await this.repository.createRecord(this.collection, this.compile());
                this.url = result.url;
                this.recordId = result.recordId;
            }

            // Reload from server and update saved state
            const reloaded = await this.constructor.get(this.recordId);
            this.parse(reloaded.compile());
            this.updateSavedState();

            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete record from API
     * @async
     * @returns {Promise<Record>} This instance with ID cleared
     * @throws {Error} If delete fails
     */
    async delete() {
        if (!this.recordId) {
            throw new Error("Can't DELETE new record");
        }

        try {
            await this.repository.deleteRecord(this.collection, this.recordId);
            this.recordId = null;
            this.url = null;
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Save record as a workform template
     * @async
     * @param {string} workformName - Name for the workform
     * @param {string} description - Description of the workform
     * @returns {Promise<boolean>} True if saved successfully
     * @throws {Error} If save fails
     */
    async saveAsWorkform(workformName, description = '') {
        if (!this.repository) {
            throw new Error('Repository not initialized');
        }

        try {
            const workformData = {
                name: workformName,
                description: description,
                collection: this.collection,
                template: this.compile()
            };

            await this.repository.createWorkform(this.collection, workformName, workformData);
            return true;
        } catch (error) {
            console.error('Failed to save workform:', error);
            throw error;
        }
    }

    /**
     * Load a workform template
     * @static
     * @async
     * @param {string} workformName - Name of the workform
     * @returns {Promise<Record>} New record instance with workform data
     * @throws {Error} If workform not found
     */
    static async loadWorkform(workformName) {
        if (!this.repository) {
            throw new Error('Repository not initialized');
        }

        try {
            const workformData = await this.repository.getWorkform(this.collection, workformName);
            const record = new this();
            record.parse(workformData.template);
            return record;
        } catch (error) {
            console.error('Failed to load workform:', error);
            throw error;
        }
    }

    /**
     * Delete a workform template
     * @static
     * @async
     * @param {string} workformName - Name of the workform
     * @returns {Promise<boolean>} True if deleted successfully
     * @throws {Error} If delete fails
     */
    static async deleteWorkform(workformName) {
        if (!this.repository) {
            throw new Error('Repository not initialized');
        }

        try {
            await this.repository.deleteWorkform(this.collection, workformName);
            return true;
        } catch (error) {
            console.error('Failed to delete workform:', error);
            throw error;
        }
    }

    /**
     * List all workforms for this collection
     * @static
     * @async
     * @returns {Promise<string[]>} Array of workform names
     * @throws {Error} If list fails
     */
    static async listWorkforms() {
        if (!this.repository) {
            throw new Error('Repository not initialized');
        }

        try {
            const workforms = await this.repository.listWorkforms(this.collection);
            // Extract names from URLs if needed
            return workforms.map(wf => {
                if (typeof wf === 'string' && wf.includes('/workforms/')) {
                    return wf.split('/workforms/').pop();
                }
                return wf;  // ← Returns as-is if not a URL
            });
        } catch (error) {
            console.error('Failed to list workforms:', error);
            throw error;
        }
    }
}
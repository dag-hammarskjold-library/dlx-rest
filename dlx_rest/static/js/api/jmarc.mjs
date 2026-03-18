"use strict";

import { validationData } from "../utils/validation.js";
import { AuthMapService, ValidationService, UndoRedoManager } from "./services/index.mjs";
import { BibRecord, AuthRecord } from "./models/index.mjs";
import { RecordRepository } from "./repositories/index.mjs";

export class ValidationWarning {
    constructor(message, level = 'warning') {
        this.message = message;
        this.level = level;
    }

    toString() {
        return this.message;
    }
}

/**
 * Jmarc facade - maintains backward compatibility
 */
export class Jmarc {
    static apiUrl = null;
    static authMapService = null;
    static validationService = null;
    static repository = null;

    /**
     * Initialize static services (call once at app startup)
     * @param {string} apiUrl - Base API URL
     */
    static async init(apiUrl) {
        Jmarc.apiUrl = apiUrl;

        // Initialize services
        Jmarc.authMapService = new AuthMapService(apiUrl);
        await Jmarc.authMapService.load();

        Jmarc.validationService = new ValidationService(validationData);
        Jmarc.repository = new RecordRepository(apiUrl);

        // Inject into BibRecord class
        BibRecord.apiUrl = apiUrl;
        BibRecord.authMapService = Jmarc.authMapService;
        BibRecord.validationService = Jmarc.validationService;
        BibRecord.repository = Jmarc.repository;
        BibRecord.ValidationWarning = ValidationWarning;

        // Inject into AuthRecord class
        AuthRecord.apiUrl = apiUrl;
        AuthRecord.authMapService = Jmarc.authMapService;
        AuthRecord.validationService = Jmarc.validationService;
        AuthRecord.repository = Jmarc.repository;
        AuthRecord.ValidationWarning = ValidationWarning;

        // Inject into Record base class for new instances
        const Record = (await import('./models/Record.mjs')).Record;
        Record.authMapService = Jmarc.authMapService;
        Record.validationService = Jmarc.validationService;
        Record.repository = Jmarc.repository;

        return {
            authMapService: Jmarc.authMapService,
            validationService: Jmarc.validationService,
            repository: Jmarc.repository
        };
    }

    /**
     * Get record (facade method for backward compatibility)
     * @static
     * @async
     * @param {string} collection - Collection name (bibs, auths)
     * @param {number} recordId - Record ID
     * @returns {Promise<BibRecord|AuthRecord>} Loaded record
     */
    static async get(collection, recordId) {
        if (collection === 'bibs') {
            return BibRecord.get(recordId);
        } else if (collection === 'auths') {
            return AuthRecord.get(recordId);
        }
        throw new Error('Invalid collection');
    }

    /**
     * List workforms for a collection
     * @static
     * @async
     * @param {string} collection - Collection name
     * @returns {Promise<string[]>} Workform names
     */
    static async listWorkforms(collection) {
        if (!Jmarc.repository) {
            throw new Error('Jmarc.repository not initialized. Call Jmarc.init() first');
        }

        try {
            return await Jmarc.repository.listWorkforms(collection);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a workform
     * @static
     * @async
     * @param {string} collection - Collection name
     * @param {string} workformName - Workform name
     * @returns {Promise<boolean>} True if deleted
     */
    static async deleteWorkform(collection, workformName) {
        if (!Jmarc.repository) {
            throw new Error('Jmarc.repository not initialized. Call Jmarc.init() first');
        }

        try {
            return await Jmarc.repository.deleteWorkform(collection, workformName);
        } catch (error) {
            throw error;
        }
    }
}

// Backward compatibility aliases
export class Bib extends BibRecord {}
export class Auth extends AuthRecord {}

export class Workform {
    constructor(collection) {
        this.collection = collection;
    }
}

export class Diff {
    constructor(collection) {
        this.collection = collection;
    }
}
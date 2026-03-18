"use strict";

/**
 * AuthMapService manages authority control maps for MARC collections.
 * Handles loading and querying which fields/subfields are authority-controlled.
 */
export class AuthMapService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';
        this.maps = {
            bibs: {},
            auths: {},
            speeches: {},
            votes: {}
        };
        this.isLoaded = false;
    }

    /**
     * Load all authority maps from the API
     * @returns {Promise<Object>} The loaded maps
     */
    async load() {
        const collections = Object.keys(this.maps);
        const promises = collections.map(collection => 
            this._loadCollection(collection)
        );
        
        const results = await Promise.all(promises);
        
        collections.forEach((col, i) => {
            this.maps[col] = results[i];
        });
        
        this.isLoaded = true;
        return this.maps;
    }

    /**
     * Load a single collection's authority map
     * @private
     * @param {string} collection - Collection name ('bibs', 'auths', 'speeches', 'votes')
     * @returns {Promise<Object>} The collection's auth map
     */
    async _loadCollection(collection) {
        try {
            const response = await fetch(
                `${this.apiUrl}marc/${collection}/lookup/map`
            );
            
            if (!response.ok) {
                throw new Error(
                    `Failed to load auth map for ${collection}: ${response.statusText}`
                );
            }
            
            const json = await response.json();
            return json.data || {};
        } catch (error) {
            console.error(`Error loading auth map for ${collection}:`, error);
            return {};
        }
    }

    /**
     * Get the map for a specific collection
     * @param {string} collection - Collection name
     * @returns {Object} The collection's auth map
     */
    getMap(collection) {
        if (!this.isLoaded) {
            console.warn(
                `AuthMapService not loaded. Call load() first.`
            );
        }
        return this.maps[collection] || {};
    }

    /**
     * Check if a field/subfield combination is authority-controlled
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @param {string} code - Subfield code
     * @returns {boolean} True if authority-controlled
     */
    isAuthorityControlled(collection, tag, code) {
        const map = this.getMap(collection);
        return !!(map[tag] && map[tag][code]);
    }

    /**
     * Get all authority-controlled subfield codes for a field
     * @param {string} collection - Collection name
     * @param {string} tag - MARC field tag
     * @returns {string[]} Array of authority-controlled subfield codes
     */
    getAuthorityControlledSubfields(collection, tag) {
        const map = this.getMap(collection);
        return map[tag] ? Object.keys(map[tag]) : [];
    }

    /**
     * Clear all maps (useful for testing or cleanup)
     */
    clear() {
        Object.keys(this.maps).forEach(key => {
            this.maps[key] = {};
        });
        this.isLoaded = false;
    }
}
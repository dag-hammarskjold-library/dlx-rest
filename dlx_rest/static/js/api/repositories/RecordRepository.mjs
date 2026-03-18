"use strict";

/**
 * RecordRepository - Handles all API communication for records and workforms
 */
export class RecordRepository {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    /**
     * Get a record by ID
     * @async
     * @param {string} collection - Collection name (bibs, auths)
     * @param {number} recordId - Record ID
     * @returns {Promise<Object>} Record data
     * @throws {Error} If record not found
     */
    async getRecord(collection, recordId) {
        const url = `${this.apiUrl}marc/${collection}/records/${recordId}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Record ${recordId} not found`);
            }

            const json = await response.json();
            return json.data || json;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new record
     * @async
     * @param {string} collection - Collection name
     * @param {Object} recordData - Record data
     * @returns {Promise<Object>} { recordId, url }
     * @throws {Error} If creation fails
     */
    async createRecord(collection, recordData) {
        const url = `${this.apiUrl}marc/${collection}/records`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recordData)
            });

            if (!response.ok) {
                throw new Error(`Failed to create record: ${response.statusText}`);
            }

            const json = await response.json();
            const resultUrl = json.result || json.url;
            const recordId = parseInt(resultUrl.split('/').pop());

            return {
                recordId: recordId,
                url: resultUrl
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update an existing record
     * @async
     * @param {string} collection - Collection name
     * @param {number} recordId - Record ID
     * @param {Object} recordData - Record data
     * @returns {Promise<Object>} Updated record data
     * @throws {Error} If update fails
     */
    async updateRecord(collection, recordId, recordData) {
        const url = `${this.apiUrl}marc/${collection}/records/${recordId}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recordData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update record: ${response.statusText}`);
            }

            const json = await response.json();
            return json.data || json;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a record
     * @async
     * @param {string} collection - Collection name
     * @param {number} recordId - Record ID
     * @returns {Promise<void>}
     * @throws {Error} If delete fails
     */
    async deleteRecord(collection, recordId) {
        const url = `${this.apiUrl}marc/${collection}/records/${recordId}`;

        try {
            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete record: ${response.statusText}`);
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search records
     * @async
     * @param {string} collection - Collection name
     * @param {string} searchStr - Search string
     * @param {number} limit - Result limit
     * @returns {Promise<string[]>} Array of record URLs
     * @throws {Error} If search fails
     */
    async searchRecords(collection, searchStr, limit = 10) {
        const url = `${this.apiUrl}marc/${collection}/records?search=${encodeURIComponent(searchStr)}&limit=${limit}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Count records matching search
     * @async
     * @param {string} collection - Collection name
     * @param {string} searchStr - Search string
     * @returns {Promise<number>} Count of matching records
     * @throws {Error} If count fails
     */
    async countRecords(collection, searchStr) {
        const url = `${this.apiUrl}marc/${collection}/records/count?search=${encodeURIComponent(searchStr)}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Count failed: ${response.statusText}`);
            }

            const json = await response.json();
            return json.data || 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get record history
     * @async
     * @param {string} collection - Collection name
     * @param {number} recordId - Record ID
     * @returns {Promise<Array>} Array of history events
     * @throws {Error} If fetch fails
     */
    async getRecordHistory(collection, recordId) {
        const url = `${this.apiUrl}marc/${collection}/records/${recordId}/history`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch history: ${response.statusText}`);
            }

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get a specific history event
     * @async
     * @param {string} eventUrl - History event URL
     * @returns {Promise<Object>} Event data
     * @throws {Error} If fetch fails
     */
    async getHistoryEvent(eventUrl) {
        try {
            const response = await fetch(eventUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch history event: ${response.statusText}`);
            }

            const json = await response.json();
            return json.data || json;
        } catch (error) {
            throw error;
        }
    }

    /**
     * List all workforms for a collection
     * @async
     * @param {string} collection - Collection name
     * @returns {Promise<string[]>} Array of workform names
     * @throws {Error} If list fails
     */
    async listWorkforms(collection) {
        const url = `${this.apiUrl}marc/${collection}/workforms`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to list workforms: ${response.statusText}`);
            }

            const json = await response.json();
            const urls = json.data || [];

            // Extract names from URLs
            return urls.map(url => {
                if (typeof url === 'string' && url.includes('/workforms/')) {
                    return url.split('/workforms/').pop();
                }
                return url;
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get a specific workform
     * @async
     * @param {string} collection - Collection name
     * @param {string} workformName - Workform name
     * @returns {Promise<Object>} Workform data
     * @throws {Error} If workform not found
     */
    async getWorkform(collection, workformName) {
        const url = `${this.apiUrl}marc/${collection}/workforms/${workformName}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Workform ${workformName} not found`);
            }

            const json = await response.json();
            return json.data || json;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create a new workform
     * @async
     * @param {string} collection - Collection name
     * @param {string} workformName - Workform name
     * @param {Object} workformData - Workform data
     * @returns {Promise<Object>} Created workform data
     * @throws {Error} If creation fails
     */
    async createWorkform(collection, workformName, workformData) {
        const url = `${this.apiUrl}marc/${collection}/workforms`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workformData)
            });

            if (!response.ok) {
                throw new Error(`Failed to create workform: ${response.statusText}`);
            }

            const json = await response.json();
            return json.data || json;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a workform
     * @async
     * @param {string} collection - Collection name
     * @param {string} workformName - Workform name
     * @param {Object} workformData - Workform data
     * @returns {Promise<Object>} Updated workform data
     * @throws {Error} If update fails
     */
    async updateWorkform(collection, workformName, workformData) {
        const url = `${this.apiUrl}marc/${collection}/workforms/${workformName}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workformData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update workform: ${response.statusText}`);
            }

            const json = await response.json();
            return json.data || json;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete a workform
     * @async
     * @param {string} collection - Collection name
     * @param {string} workformName - Workform name
     * @returns {Promise<void>}
     * @throws {Error} If delete fails
     */
    async deleteWorkform(collection, workformName) {
        const url = `${this.apiUrl}marc/${collection}/workforms/${workformName}`;

        try {
            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete workform: ${response.statusText}`);
            }
        } catch (error) {
            throw error;
        }
    }
}
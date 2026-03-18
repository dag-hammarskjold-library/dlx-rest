"use strict";

/**
 * MockServer - Intercepts fetch calls and returns mock data
 * Allows testing without a real API server
 */
export class MockServer {
    constructor() {
        this.originalFetch = globalThis.fetch;
        this.recordStore = new Map(); // { "bibs:123": {...}, "auths:456": {...} }
        this.nextId = { bibs: 1000, auths: 1000 };
        this.history = new Map(); // { "bibs:123": [event1, event2] }

        // Intercept fetch
        globalThis.fetch = this.mockFetch.bind(this);
    }

    /**
     * Mock fetch implementation
     * @private
     */
    async mockFetch(url, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.parse(options.body) : null;

        // Parse URL
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const parts = pathname.split('/');

        console.log(`[MockServer] ${method} ${pathname}`);

        // Auth-map endpoint
        if (pathname.includes('/auth-map')) {
            return this._getAuthMap();
        }

        const collection = parts[3]; // /api/marc/{collection}/...
        const resource = parts[4]; // records, workforms, lookup, etc.

        // Routes
        if (resource === 'records') {
            if (method === 'GET') {
                return this._getRecord(collection, parts[5], urlObj);
            } else if (method === 'POST') {
                return this._createRecord(collection, body);
            } else if (method === 'PUT') {
                return this._updateRecord(collection, parts[5], body);
            } else if (method === 'DELETE') {
                return this._deleteRecord(collection, parts[5]);
            }
        }

        if (resource === 'lookup') {
            return this._lookup(collection, parts[5], urlObj);
        }

        if (resource === 'workforms') {
            if (method === 'GET' && parts[5]) {
                return this._getWorkform(collection, parts[5]);
            } else if (method === 'GET') {
                return this._listWorkforms(collection);
            } else if (method === 'POST') {
                return this._createWorkform(collection, body);
            } else if (method === 'PUT') {
                return this._updateWorkform(collection, parts[5], body);
            } else if (method === 'DELETE') {
                return this._deleteWorkform(collection, parts[5]);
            }
        }

        // Default 404
        return this._response(404, { message: 'Not found' });
    }

    /**
     * Get authority map
     * @private
     */
    _getAuthMap() {
        const authMap = {
            bibs: {
                100: { a: true, b: true, c: true, d: true },
                110: { a: true, b: true, d: true },
                111: { a: true, d: true },
                130: { a: true },
                600: { a: true, b: true, c: true, d: true },
                610: { a: true, b: true },
                611: { a: true },
                630: { a: true },
                650: { a: true },
                651: { a: true },
                655: { a: true },
                700: { a: true, b: true, c: true, d: true },
                710: { a: true, b: true },
                711: { a: true },
                730: { a: true },
                800: { a: true, b: true, c: true, d: true },
                810: { a: true, b: true },
                811: { a: true },
                830: { a: true }
            },
            auths: {
                100: { a: true },
                110: { a: true },
                111: { a: true },
                130: { a: true },
                400: { a: true },
                410: { a: true },
                411: { a: true },
                430: { a: true },
                500: { a: true },
                510: { a: true },
                511: { a: true },
                530: { a: true }
            }
        };

        return this._response(200, { data: authMap });
    }

    /**
     * Get a record
     * @private
     */
    _getRecord(collection, recordId, urlObj) {
        const key = `${collection}:${recordId}`;
        const record = this.recordStore.get(key);

        if (!record) {
            return this._response(404, { message: `Record ${recordId} not found` });
        }

        // Check for search query
        const searchParams = new URLSearchParams(urlObj.search);
        if (searchParams.has('search')) {
            const searchStr = searchParams.get('search');
            const limit = parseInt(searchParams.get('limit')) || 1;

            // Return array of matching record URLs
            const matches = Array.from(this.recordStore.entries())
                .filter(([k, v]) => k.startsWith(collection + ':'))
                .filter(([k, v]) => this._matchesSearch(v, searchStr))
                .slice(0, limit)
                .map(([k, v]) => `http://localhost:5000/api/marc/${collection}/records/${k.split(':')[1]}`);

            return this._response(200, { data: matches });
        }

        // Check for count query
        if (urlObj.pathname.includes('/count')) {
            const searchStr = searchParams.get('search');
            const count = Array.from(this.recordStore.entries())
                .filter(([k, v]) => k.startsWith(collection + ':'))
                .filter(([k, v]) => this._matchesSearch(v, searchStr))
                .length;

            return this._response(200, { data: count });
        }

        // Check for history
        if (urlObj.pathname.includes('/history')) {
            if (recordId === 'history') {
                // GET /records/{id}/history - list all events
                const actualId = parts[5];
                const historyEvents = this.history.get(`${collection}:${actualId}`) || [];
                const events = historyEvents.map((event, index) => ({
                    event: `http://localhost:5000/api/marc/${collection}/records/${actualId}/history/${index}`,
                    date: event.date,
                    user: event.user
                }));
                return this._response(200, { data: events });
            } else {
                // GET /records/{id}/history/{index} - get specific event
                const parts = urlObj.pathname.split('/');
                const actualId = parts[5];
                const eventIndex = parseInt(parts[7]);
                const historyEvents = this.history.get(`${collection}:${actualId}`) || [];
                const event = historyEvents[eventIndex];

                if (!event) {
                    return this._response(404, { message: 'History event not found' });
                }

                return this._response(200, { data: event.data });
            }
        }

        return this._response(200, { data: record });
    }

    /**
     * Create a new record
     * @private
     */
    _createRecord(collection, body) {
        const recordId = this.nextId[collection]++;
        const key = `${collection}:${recordId}`;

        const record = {
            _id: recordId,
            created: new Date().toISOString(),
            created_user: 'testing',
            updated: new Date().toISOString(),
            user: 'testing',
            ...body
        };

        this.recordStore.set(key, record);

        // Initialize history
        this.history.set(key, [{
            date: record.created,
            user: record.created_user,
            data: record
        }]);

        const url = `http://localhost:5000/api/marc/${collection}/records/${recordId}`;

        return this._response(201, {
            result: url,
            message: 'Record created'
        });
    }

    /**
     * Update an existing record
     * @private
     */
    _updateRecord(collection, recordId, body) {
        const key = `${collection}:${recordId}`;
        const existing = this.recordStore.get(key);

        if (!existing) {
            return this._response(404, { message: `Record ${recordId} not found` });
        }

        const updated = {
            ...existing,
            ...body,
            _id: recordId,
            updated: new Date().toISOString(),
            user: 'testing'
        };

        this.recordStore.set(key, updated);

        // Add to history
        const historyEvents = this.history.get(key) || [];
        historyEvents.push({
            date: updated.updated,
            user: updated.user,
            data: updated
        });
        this.history.set(key, historyEvents);

        return this._response(200, {
            data: updated,
            message: 'Record updated'
        });
    }

    /**
     * Delete a record
     * @private
     */
    _deleteRecord(collection, recordId) {
        const key = `${collection}:${recordId}`;

        if (!this.recordStore.has(key)) {
            return this._response(404, { message: `Record ${recordId} not found` });
        }

        // Check if auth record is in use (bibs reference it)
        if (collection === 'auths') {
            for (const [k, record] of this.recordStore.entries()) {
                if (k.startsWith('bibs:')) {
                    // Check if any field references this auth
                    for (const [tag, fields] of Object.entries(record)) {
                        if (tag.match(/^\d{3}$/)) {
                            for (const field of fields) {
                                if (field.subfields) {
                                    for (const sf of field.subfields) {
                                        if (sf.xref === parseInt(recordId)) {
                                            return this._response(403, {
                                                message: 'Auth record in use'
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        this.recordStore.delete(key);
        this.history.delete(key);

        // Return 204 No Content
        return this._noContentResponse();
    }

    /**
     * Lookup authority values
     * @private
     */
    _lookup(collection, tag, urlObj) {
        const searchParams = new URLSearchParams(urlObj.search);
        const code = searchParams.keys().next().value; // First param is code
        const value = searchParams.get(code);

        // Find matching records
        const matches = Array.from(this.recordStore.entries())
            .filter(([k, v]) => k.startsWith('auths:'))
            .filter(([k, v]) => {
                // Check if record has matching heading field
                const headingFields = v[`1${tag.slice(1)}`] || [];
                for (const field of headingFields) {
                    if (field.subfields) {
                        for (const sf of field.subfields) {
                            // Don't include deprecated records
                            const has682 = v['682'];
                            if (has682 && has682[0]?.subfields) {
                                const deprecated = has682[0].subfields.find(s => s.code === 'a' && s.value.toLowerCase() === 'deprecated');
                                if (deprecated) return false;
                            }

                            if (sf.code === code && sf.value.toLowerCase().includes(value?.toLowerCase())) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            });

        return this._response(200, {
            data: matches.map(([k, v]) => this._formatRecordData(k, v))
        });
    }

    /**
     * List workforms for a collection
     * @private
     */
    _listWorkforms(collection) {
        const workforms = Array.from(this.recordStore.entries())
            .filter(([k, v]) => k.startsWith(`workform:${collection}:`))
            .map(([k, v]) => {
                const name = k.split(':')[2];
                return name;
            });

        return this._response(200, { data: workforms });
    }

    /**
     * Get a specific workform
     * @private
     */
    _getWorkform(collection, workformName) {
        const key = `workform:${collection}:${workformName}`;
        const workform = this.recordStore.get(key);

        if (!workform) {
            return this._response(404, { message: `Workform ${workformName} not found` });
        }

        return this._response(200, { data: workform });
    }

    /**
     * Create a workform
     * @private
     */
    _createWorkform(collection, body) {
        const name = body.name;
        const key = `workform:${collection}:${name}`;

        if (this.recordStore.has(key)) {
            return this._response(409, { message: 'Workform already exists' });
        }

        // Store complete workform data
        const workformData = {
            name: body.name,
            description: body.description || '',
            collection: body.collection || collection,
            template: body.template || {}
        };

        this.recordStore.set(key, workformData);

        return this._response(201, {
            data: workformData,
            message: 'Workform created'
        });
    }

    /**
     * Update a workform
     * @private
     */
    _updateWorkform(collection, workformName, body) {
        const key = `workform:${collection}:${workformName}`;

        if (!this.recordStore.has(key)) {
            return this._response(404, { message: `Workform ${workformName} not found` });
        }

        this.recordStore.set(key, body);

        return this._response(200, {
            data: body,
            message: 'Workform updated'
        });
    }

    /**
     * Delete a workform
     * @private
     */
    _deleteWorkform(collection, workformName) {
        const key = `workform:${collection}:${workformName}`;

        if (!this.recordStore.has(key)) {
            return this._response(404, { message: `Workform ${workformName} not found` });
        }

        this.recordStore.delete(key);

        // Return 204 No Content
        return this._noContentResponse();
    }

    /**
     * Check if record matches search string
     * @private
     */
    _matchesSearch(record, searchStr) {
        if (!searchStr) return true;

        // Simple search: look for field__code:'value' patterns
        const terms = searchStr.split(/ AND | OR /i);

        for (const term of terms) {
            const match = term.match(/(\d{3})__(\w):'([^']+)'/);
            if (!match) continue;

            const [, tag, code, value] = match;
            const fields = record[tag] || [];

            let found = false;
            for (const field of fields) {
                if (field.subfields) {
                    for (const sf of field.subfields) {
                        if (sf.code === code && sf.value.includes(value)) {
                            found = true;
                            break;
                        }
                    }
                }
            }

            if (!found) return false;
        }

        return true;
    }

    /**
     * Format record data for API response
     * @private
     */
    _formatRecordData(key, record) {
        const [type, id] = key.split(':');
        return {
            _id: id,
            created: record.created,
            created_user: record.created_user,
            updated: record.updated,
            user: record.user,
            ...record
        };
    }

    /**
     * Create a response object with body
     * @private
     */
    _response(status, data) {
        return Promise.resolve(
            new Response(JSON.stringify(data), {
                status: status,
                headers: { 'Content-Type': 'application/json' }
            })
        );
    }

    /**
     * Create a 204 No Content response (special handling needed)
     * @private
     */
    _noContentResponse() {
        return Promise.resolve(
            new Response(null, {
                status: 204,
                headers: { 'Content-Type': 'application/json' }
            })
        );
    }

    /**
     * Restore original fetch
     */
    restore() {
        globalThis.fetch = this.originalFetch;
    }
}
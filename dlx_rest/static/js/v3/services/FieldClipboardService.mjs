/**
 * FieldClipboardService
 * 
 * Manages shared field clipboard state across the record editor.
 * Provides copy/paste functionality with serialization of field data.
 * 
 * Features:
 * - Global clipboard state accessible across multiple editors
 * - Event-based synchronization between editor instances
 * - Serialization of field data for clipboard transfer
 * - Copy count tracking
 */

const CLIPBOARD_CHANGE_EVENT = 'recordstage:shared-field-clipboard-changed'
let sharedClipboard = []

/**
 * Serialize a field for clipboard storage
 * @param {Object} field - Field object with tag, indicators, subfields
 * @returns {Object|null} Serialized field data or null if invalid
 */
function serializeField(field) {
    if (!field || !field.tag) return null

    return {
        tag: field.tag,
        indicators: Array.isArray(field.indicators) ? [...field.indicators] : ['_', '_'],
        subfields: (field.subfields || []).map(subfield => ({
            code: subfield.code,
            value: subfield.value,
            xref: subfield.xref
        }))
    }
}

/**
 * Publish clipboard change event to all listeners
 */
function publishClipboardChange() {
    window.dispatchEvent(new CustomEvent(CLIPBOARD_CHANGE_EVENT, {
        detail: { count: sharedClipboard.length }
    }))
}

export class FieldClipboardService {
    /**
     * Copy fields to clipboard
     * @param {Array<Object>} fields - Array of field objects to copy
     */
    static copyFields(fields) {
        if (!Array.isArray(fields)) {
            return
        }

        sharedClipboard = fields
            .map(field => serializeField(field))
            .filter(Boolean)

        publishClipboardChange()
    }

    /**
     * Get clipboard contents
     * @returns {Array<Object>} Array of serialized field objects
     */
    static getFields() {
        return [...sharedClipboard]
    }

    /**
     * Clear clipboard
     */
    static clear() {
        sharedClipboard = []
        publishClipboardChange()
    }

    /**
     * Get number of fields in clipboard
     * @returns {number}
     */
    static getCount() {
        return sharedClipboard.length
    }

    /**
     * Check if clipboard has fields
     * @returns {boolean}
     */
    static hasFields() {
        return sharedClipboard.length > 0
    }

    /**
     * Listen for clipboard changes
     * @param {Function} callback - Function to call on clipboard change
     * @returns {Function} Unsubscribe function
     */
    static onClipboardChange(callback) {
        const handler = (event) => {
            callback({
                count: event.detail?.count ?? sharedClipboard.length,
                fields: FieldClipboardService.getFields()
            })
        }

        window.addEventListener(CLIPBOARD_CHANGE_EVENT, handler)

        return () => {
            window.removeEventListener(CLIPBOARD_CHANGE_EVENT, handler)
        }
    }

    /**
     * Get clipboard change event name (for custom listeners)
     * @returns {string}
     */
    static getEventName() {
        return CLIPBOARD_CHANGE_EVENT
    }

    /**
     * Serialize fields to clipboard data (internal use)
     * @param {Array<Object>} fields - Array of field objects
     * @returns {Array<Object>} Serialized fields
     * @internal
     */
    static _serializeFields(fields) {
        return fields
            .map(field => serializeField(field))
            .filter(Boolean)
    }

    /**
     * Update clipboard directly with serialized data (internal use)
     * @param {Array<Object>} serializedFields - Already-serialized field data
     * @internal
     */
    static _setSharedClipboard(serializedFields) {
        sharedClipboard = Array.isArray(serializedFields) ? [...serializedFields] : []
        publishClipboardChange()
    }

    /**
     * Get raw shared clipboard array (internal use)
     * @returns {Array<Object>}
     * @internal
     */
    static _getRawClipboard() {
        return sharedClipboard
    }
}

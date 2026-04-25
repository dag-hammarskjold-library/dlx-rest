const CLIPBOARD_CHANGE_EVENT = 'recordstage:shared-field-clipboard-changed'
let sharedClipboard = []

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

function publishClipboardChange() {
    window.dispatchEvent(new CustomEvent(CLIPBOARD_CHANGE_EVENT, {
        detail: { count: sharedClipboard.length }
    }))
}

export class FieldClipboardService {
    static copyFields(fields) {
        if (!Array.isArray(fields)) {
            return
        }

        sharedClipboard = fields
            .map(field => serializeField(field))
            .filter(Boolean)

        publishClipboardChange()
    }

    static getFields() {
        return [...sharedClipboard]
    }

    static clear() {
        sharedClipboard = []
        publishClipboardChange()
    }

    static getCount() {
        return sharedClipboard.length
    }

    static hasFields() {
        return sharedClipboard.length > 0
    }

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

    static getEventName() {
        return CLIPBOARD_CHANGE_EVENT
    }

    static _serializeFields(fields) {
        return fields
            .map(field => serializeField(field))
            .filter(Boolean)
    }

    static _setSharedClipboard(serializedFields) {
        sharedClipboard = Array.isArray(serializedFields) ? [...serializedFields] : []
        publishClipboardChange()
    }

    static _getRawClipboard() {
        return sharedClipboard
    }
}

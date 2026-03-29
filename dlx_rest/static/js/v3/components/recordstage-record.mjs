import { RecordField } from "./record-field.mjs"
import { validationData } from "../../utils/validation.js"
import { Jmarc } from "../../api/jmarc.mjs"

const SHARED_CLIPBOARD_EVENT = 'recordstage:shared-field-clipboard-changed'
let sharedCopiedFieldPayloads = []

function serializeFieldForClipboard(field) {
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

function publishSharedClipboardChange() {
    window.dispatchEvent(new CustomEvent(SHARED_CLIPBOARD_EVENT, {
        detail: { count: sharedCopiedFieldPayloads.length }
    }))
}

export const RecordstageRecord = {
    props: {
        record: Object,
        readonly: { type: Boolean, required: false, default: false },
        recordState: { type: Object, required: false, default: null },
        isFocused: { type: Boolean, required: false, default: false },
        user: Object
    },
    components: { RecordField },
    data() {
        return {
            hasChanges: false,
            isSaving: false,
            currentValidationErrors: [],
            selectedFields: [],
            copiedFields: [],
            isDragSelecting: false,
            dragSelectValue: true,
            dragAdditive: false,
            changedFields: new Set(),
            historySnapshots: [],
            historyIndex: -1,
            isApplyingHistory: false,
            boundHandleKeydown: null,
            boundEndFieldSelection: null,
            boundHandleClipboardChange: null,
            sharedClipboardCount: sharedCopiedFieldPayloads.length,
            showHistoryModal: false,
            isHistoryLoading: false,
            historyLoadError: '',
            historyEntries: [],
            selectedHistoryIndex: -1,
            authUseCount: null,
            authUseCountLoading: false,
            controls: [
                {
                    id: 'undo',
                    label: 'Undo',
                    icon: 'bi-arrow-counterclockwise',
                    permission: 'updateRecord',
                    action: 'undoChange'
                },
                {
                    id: 'redo',
                    label: 'Redo',
                    icon: 'bi-arrow-clockwise',
                    permission: 'updateRecord',
                    action: 'redoChange'
                },
                {
                    id: 'save',
                    label: 'Save',
                    icon: 'bi-floppy',
                    permission: 'updateRecord',
                    action: 'saveRecord'
                },
                {
                    id: 'clone',
                    label: 'Clone',
                    icon: 'bi-files',
                    permission: 'createRecord',
                    action: 'cloneRecord'
                },
                {
                    id: 'paste',
                    label: 'Paste Fields',
                    icon: 'bi-clipboard',
                    permission: 'updateRecord',
                    action: 'pasteFields'
                },
                {
                    id: 'history',
                    label: 'History',
                    icon: 'bi-clock-history',
                    permission: 'updateRecord',
                    action: 'openHistoryModal'
                },
                {
                    id: 'save-workform',
                    label: 'Save as Workform',
                    icon: 'bi-file-earmark-plus',
                    permission: 'createWorkform',
                    action: 'saveAsWorkform'
                },
                {
                    id: 'delete',
                    label: 'Delete Record',
                    icon: 'bi-trash',
                    permission: 'deleteRecord',
                    action: 'deleteRecord'
                },
                {
                    id: 'batch',
                    label: 'Batch Actions',
                    icon: 'bi-list-check',
                    permission: 'updateRecord',
                    action: 'batchActions'
                }
            ]
        }
    },
    computed: {
        visibleControls() {
            return this.controls.filter(control => {
                if (control.id === 'save') {
                    return this.isWorkformEditingRecord ? this.hasWorkformUpdatePermission() : this.hasUpdatePermission()
                }

                if (control.id === 'delete' && this.isWorkformEditingRecord) {
                    return this.hasWorkformDeletePermission()
                }

                if (!this.user || !this.user.hasPermission(control.permission)) return false
                if (control.id === 'save-workform') return !this.isWorkformEditingRecord
                if (control.id === 'delete') {
                    return this.canDeleteCurrentRecord
                }
                return true
            })
        },
        isRecordReadonly() {
            if (this.readonly) return true
            return this.isWorkformEditingRecord ? !this.hasWorkformUpdatePermission() : !this.hasUpdatePermission()
        },
        isWorkformEditingRecord() {
            return !!(this.record && this.record._isWorkformEdit === true && this.record.workformName)
        },
        isAuthenticatedUser() {
            if (!this.user) return false

            if (typeof this.user.getAuthToken === 'function') {
                const token = String(this.user.getAuthToken() || '').trim()
                if (token.length > 0) return true
            }

            if (Array.isArray(this.user.permissions) && this.user.permissions.length > 0) {
                return true
            }

            return false
        },
        isUnauthenticated() {
            return !this.isAuthenticatedUser
        },
        showRecordControls() {
            return !this.isUnauthenticated
        },
        canSeeValidationState() {
            return this.hasUpdatePermission()
        },
        headerRecordLabel() {
            if (this.isWorkformEditingRecord) {
                return `${this.record.collection}/workforms/${this.record.workformName}`
            }

            return `${this.record.getVirtualCollection()}/${this.record.recordId}`
        },
        isPersistedAuthRecord() {
            return !!(this.record && this.record.collection === 'auths' && this.record.recordId)
        },
        canDeleteCurrentRecord() {
            if (this.isWorkformEditingRecord) return this.hasWorkformDeletePermission()
            if (!this.record || !this.record.recordId) return false

            if (this.isPersistedAuthRecord) {
                if (this.authUseCountLoading) return false
                return Number(this.authUseCount || 0) === 0
            }

            return true
        },
        validationCollection() {
            if (this.record && typeof this.record.getVirtualCollection === 'function') {
                return this.record.getVirtualCollection()
            }

            return this.record?.collection || 'bibs'
        },
        validationDocument() {
            const collectionMap = {
                bibs: 'bibs',
                speeches: 'speeches',
                votes: 'votes',
                auths: 'auths'
            }

            return validationData[collectionMap[this.validationCollection] || 'bibs'] || {}
        },
        // Records with field 998 still surface issues, but those issues are non-blocking.
        validationBypassedFor998() {
            return !!(this.record && typeof this.record.getField === 'function' && this.record.getField('998'))
        },
        validationErrors() {
            if (!this.canSeeValidationState) {
                return []
            }

            if (!this.record || typeof this.record.getDataFields !== 'function') {
                return []
            }

            const errors = []
            const dataFields = this.record.getDataFields()
            const fieldsByTag = new Map()

            dataFields.forEach((field, index) => {
                if (!fieldsByTag.has(field.tag)) {
                    fieldsByTag.set(field.tag, [])
                }
                fieldsByTag.get(field.tag).push({ field, index })
            })

            // Required tags must be present at least once.
            Object.entries(this.validationDocument).forEach(([tag, fieldValidation]) => {
                if (!fieldValidation || fieldValidation.required !== true) return
                if (!fieldsByTag.has(tag)) {
                    errors.push({ type: 'field-required-missing', tag })
                }
            })

            dataFields.forEach((field, index) => {
                const fieldValidation = this.validationDocument[field.tag]
                if (!fieldValidation) {
                    errors.push({ type: 'field-tag', tag: field.tag, index })
                    return
                }

                // Non-repeatable tags can only occur once.
                const sameTagFields = fieldsByTag.get(field.tag) || []
                if (fieldValidation.repeatable === false && sameTagFields.length > 1 && sameTagFields[0].field !== field) {
                    errors.push({ type: 'field-not-repeatable', tag: field.tag, index })
                }

                // Required subfields must be present and non-blank.
                const requiredSubfields = fieldValidation.requiredSubfields || []
                requiredSubfields.forEach(requiredCode => {
                    const matchingSubfields = field.subfields.filter(subfield => subfield.code === requiredCode)

                    if (matchingSubfields.length === 0) {
                        errors.push({
                            type: 'subfield-required-missing',
                            tag: field.tag,
                            index,
                            code: requiredCode
                        })
                        return
                    }

                    const hasNonBlankValue = matchingSubfields.some(subfield => String(subfield.value || '').trim().length > 0)
                    if (!hasNonBlankValue) {
                        errors.push({
                            type: 'subfield-required-blank',
                            tag: field.tag,
                            index,
                            code: requiredCode
                        })
                    }
                })

                const validSubfields = fieldValidation.validSubfields || []
                const validStringsByCode = fieldValidation.validStrings || {}
                const isDateByCode = fieldValidation.isDate || {}

                field.subfields.forEach(subfield => {
                    // Check if subfield has an empty value
                    const hasEmptyValue = String(subfield.value || '').trim().length === 0
                    if (hasEmptyValue) {
                        errors.push({
                            type: 'subfield-empty-value',
                            tag: field.tag,
                            code: subfield.code
                        })
                        return
                    }

                    if (!validSubfields.includes('*') && !validSubfields.includes(subfield.code)) {
                        errors.push({ type: 'subfield-code', tag: field.tag, code: subfield.code })
                    }

                    const allowedValues = validStringsByCode[subfield.code]
                    const isInvalidByString = subfield.value && Array.isArray(allowedValues) && allowedValues.length > 0
                        ? !allowedValues.includes(subfield.value)
                        : false

                    const requiresDateFormat = subfield.code in isDateByCode
                    const isInvalidByDate = subfield.value && requiresDateFormat
                        ? !this.isValidDateValue(subfield.value)
                        : false

                    if (isInvalidByString || isInvalidByDate) {
                        errors.push({
                            type: 'subfield-value',
                            tag: field.tag,
                            code: subfield.code,
                            value: subfield.value,
                            failedValidStrings: isInvalidByString,
                            failedIsDate: isInvalidByDate
                        })
                    }
                })
            })

            return errors
        },
        hasValidationErrors() {
            return this.currentValidationErrors.length > 0
        },
        hasBlockingValidationErrors() {
            return !this.validationBypassedFor998 && this.hasValidationErrors
        },
        validationSummaryEntries() {
            return this.currentValidationErrors.map(error => this.formatValidationError(error))
        },
        canUndo() {
            return this.historyIndex > 0
        },
        canRedo() {
            return this.historyIndex >= 0 && this.historyIndex < this.historySnapshots.length - 1
        },
        allFieldsSelected() {
            const selectableFields = this.getSelectableFields()
            return selectableFields.length > 0 && selectableFields.every(field => field.checked)
        },
        hasPasteFields() {
            return this.pasteFieldCount > 0
        },
        pasteFieldCount() {
            return this.sharedClipboardCount
        },
        lockStatus() {
            return this.recordState && this.recordState.lockStatus
                ? this.recordState.lockStatus
                : null
        },
        isLockedByOther() {
            return !!(this.recordState && this.recordState.reason === 'locked' && this.lockStatus && this.lockStatus.locked)
        },
        canUnlockForEditing() {
            return this.isLockedByOther && !!this.recordState.canUnlock
        },
        selectedHistoryEntry() {
            if (this.selectedHistoryIndex < 0) return null
            return this.historyEntries[this.selectedHistoryIndex] || null
        },
        currentRecordRows() {
            return this.buildComparisonRows(this.record, this.selectedHistoryEntry ? this.selectedHistoryEntry.record : null)
        },
        selectedHistoryRows() {
            const selected = this.selectedHistoryEntry
            if (!selected) return []
            return this.buildComparisonRows(selected.record, this.record)
        },
        authUseCountLabel() {
            if (!this.isPersistedAuthRecord) return ''
            if (this.authUseCountLoading) return 'Use: ...'
            return `Use: ${Number(this.authUseCount || 0)}`
        }
    },
    watch: {
        record: {
            handler(newRecord) {
                if (newRecord && newRecord.updateSavedState) {
                    newRecord.updateSavedState()
                    this.resetHistory()
                    this.updateChangeTracking()
                    this.runValidation()
                    this.refreshAuthUseCount()
                }
            },
            immediate: true
        }
    },
    mounted() {
        this.boundHandleKeydown = this.handleKeydown.bind(this)
        this.boundEndFieldSelection = this.endFieldSelection.bind(this)
        this.boundHandleClipboardChange = this.handleSharedClipboardChange.bind(this)
        window.addEventListener('mouseup', this.boundEndFieldSelection)
        window.addEventListener('keydown', this.boundHandleKeydown)
        window.addEventListener(SHARED_CLIPBOARD_EVENT, this.boundHandleClipboardChange)
    },
    beforeUnmount() {
        window.removeEventListener('mouseup', this.boundEndFieldSelection)
        window.removeEventListener('keydown', this.boundHandleKeydown)
        window.removeEventListener(SHARED_CLIPBOARD_EVENT, this.boundHandleClipboardChange)
    },
    methods: {
        handleSharedClipboardChange(event) {
            this.sharedClipboardCount = event && event.detail && typeof event.detail.count === 'number'
                ? event.detail.count
                : sharedCopiedFieldPayloads.length
        },
        syncSharedClipboardFromSelection() {
            sharedCopiedFieldPayloads = this.copiedFields
                .map(field => serializeFieldForClipboard(field))
                .filter(Boolean)

            this.sharedClipboardCount = sharedCopiedFieldPayloads.length
            publishSharedClipboardChange()
        },
        requestFocus() {
            if (!this.isFocused) {
                this.$emit('focus-record', this.record)
            }
        },
        requestUnlockForEditing() {
            if (!this.record) return
            this.$emit('unlock-record', this.record)
        },
        formatValidationError(error) {
            if (!error || !error.type) return 'Unknown validation error'

            switch (error.type) {
                case 'field-tag':
                    return `${error.tag}: field tag is not valid for this record type`
                case 'field-required-missing':
                    return `${error.tag}: required field is missing`
                case 'field-not-repeatable':
                    return `${error.tag}: field is not repeatable`
                case 'subfield-required-missing':
                    return `${error.tag} $${error.code}: required subfield is missing`
                case 'subfield-required-blank':
                    return `${error.tag} $${error.code}: required subfield is blank`
                case 'subfield-empty-value':
                    return `${error.tag} $${error.code}: subfield value cannot be empty`
                case 'subfield-code':
                    return `${error.tag} $${error.code}: subfield code is not valid`
                case 'subfield-value': {
                    const reasons = []
                    if (error.failedValidStrings) reasons.push('not in allowed values')
                    if (error.failedIsDate) reasons.push('must match YYYY-MM or YYYY-MM-DD')
                    const suffix = reasons.length > 0 ? ` (${reasons.join('; ')})` : ''
                    return `${error.tag} $${error.code}: invalid value "${error.value ?? ''}"${suffix}`
                }
                default:
                    return `${error.tag || 'Record'}: validation error (${error.type})`
            }
        },
        isValidDateValue(value) {
            const datePattern = /^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/
            const match = String(value || '').match(datePattern)
            if (!match) return false

            // YYYY-MM is valid at month precision.
            if (typeof match[3] === 'undefined') return true

            // For YYYY-MM-DD, enforce calendar-valid day values.
            const year = Number(match[1])
            const month = Number(match[2])
            const day = Number(match[3])
            const dt = new Date(Date.UTC(year, month - 1, day))
            return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day
        },
        hasUpdatePermission() {
            return !!(this.user && typeof this.user.hasPermission === 'function' && this.user.hasPermission('updateRecord'))
        },
        hasWorkformUpdatePermission() {
            return !!(this.user && typeof this.user.hasPermission === 'function' && this.user.hasPermission('updateWorkform'))
        },
        hasWorkformDeletePermission() {
            return !!(this.user && typeof this.user.hasPermission === 'function' && this.user.hasPermission('deleteWorkform'))
        },
        async refreshAuthUseCount() {
            if (!this.isPersistedAuthRecord || !this.record || typeof this.record.authUseCount !== 'function') {
                this.authUseCount = null
                this.authUseCountLoading = false
                return
            }

            this.authUseCountLoading = true
            try {
                this.authUseCount = await this.record.authUseCount('bibs')
            } catch (error) {
                this.authUseCount = null
            } finally {
                this.authUseCountLoading = false
            }
        },
        getSavedFieldSnapshot(field) {
            if (!this.record || !this.record.savedState) return null

            const savedFieldsForTag = this.record.savedState[field.tag]
            if (!Array.isArray(savedFieldsForTag)) return null

            const currentPlace = this.record.getFields(field.tag).indexOf(field)
            if (currentPlace < 0) return null

            return savedFieldsForTag[currentPlace] ?? null
        },
        fieldHasChanged(field) {
            if (field.savedState) {
                return JSON.stringify(field.savedState) !== JSON.stringify(field.compile())
            }

            const savedFieldSnapshot = this.getSavedFieldSnapshot(field)
            if (!savedFieldSnapshot) return true

            return JSON.stringify(savedFieldSnapshot) !== JSON.stringify(field.compile())
        },
        updateChangeTracking() {
            const dataFields = this.record.getDataFields()
            this.changedFields.clear()

            dataFields.forEach(field => {
                if (this.fieldHasChanged(field)) {
                    this.changedFields.add(field)
                }
            })

            // If we're at the first history snapshot, treat the record as unchanged.
            if (this.historySnapshots.length > 0 && this.historyIndex === 0) {
                this.hasChanges = false
                return
            }

            // Use Jmarc's built-in saved getter
            this.hasChanges = !this.record.saved
        },
        onFieldChanged() {
            if (!this.isApplyingHistory) {
                this.captureHistorySnapshot()
            }
            this.updateChangeTracking()
            this.runValidation()
        },
        runValidation() {
            this.currentValidationErrors = this.validationErrors
        },
        fieldToComparableLine(field) {
            if (!field) return ''
            const tag = String(field.tag || '').padEnd(3, '_')

            if (!Array.isArray(field.subfields)) {
                return `${tag} ${field.value ?? ''}`.trim()
            }

            const indicators = Array.isArray(field.indicators) ? field.indicators.join('') : '__'
            const subfieldText = field.subfields
                .map(subfield => `\$${subfield.code} ${subfield.value ?? ''}`.trim())
                .join(' ')

            return `${tag} ${indicators} ${subfieldText}`.trim()
        },
        buildComparisonRows(baseRecord, compareRecord) {
            if (!baseRecord || !Array.isArray(baseRecord.fields)) return []

            const compareCounts = new Map()
            if (compareRecord && Array.isArray(compareRecord.fields)) {
                compareRecord.fields.forEach(field => {
                    const line = this.fieldToComparableLine(field)
                    const count = compareCounts.get(line) || 0
                    compareCounts.set(line, count + 1)
                })
            }

            return baseRecord.fields.map(field => {
                const line = this.fieldToComparableLine(field)
                const availableCount = compareCounts.get(line) || 0
                const isDifferent = availableCount <= 0
                if (availableCount > 0) {
                    compareCounts.set(line, availableCount - 1)
                }

                return {
                    key: `${field.tag}-${line}`,
                    line,
                    isDifferent
                }
            })
        },
        async openHistoryModal() {
            this.showHistoryModal = true
            await this.loadHistoryEntries()
        },
        async saveAsWorkform() {
            if (!this.record || !this.record.collection) return

            const defaultName = this.record.workformName || ''
            const workformNameInput = window.prompt('Workform name', defaultName)
            if (workformNameInput === null) return

            const workformName = String(workformNameInput || '').trim()
            if (!workformName) {
                window.alert('Workform name is required.')
                return
            }

            const descriptionInput = window.prompt('Workform description', this.record.workformDescription || '')
            if (descriptionInput === null) return

            const description = String(descriptionInput || '')

            try {
                const candidate = this.record.clone()
                if (typeof candidate.getFields === 'function' && typeof candidate.deleteField === 'function') {
                    const fields998 = candidate.getFields('998') || []
                    fields998.forEach(field => candidate.deleteField(field))
                }
                await candidate.saveAsWorkform(workformName, description)

                this.record.workformName = workformName
                this.record.workformDescription = description
                window.alert(`Workform saved: ${this.record.collection}/workforms/${workformName}`)
            } catch (error) {
                window.alert(`Could not save workform: ${error && error.message ? error.message : String(error)}`)
            }
        },
        async updateWorkform() {
            if (!this.record || !this.record.workformName) return

            const name = String(this.record.workformName || '').trim()
            if (!name) {
                window.alert('Workform name is missing.')
                return
            }

            const descriptionInput = window.prompt('Workform description', this.record.workformDescription || '')
            if (descriptionInput === null) return

            const description = String(descriptionInput || '')

            try {
                const candidate = this.record.clone()
                if (typeof candidate.getFields === 'function' && typeof candidate.deleteField === 'function') {
                    const fields998 = candidate.getFields('998') || []
                    fields998.forEach(field => candidate.deleteField(field))
                }
                await candidate.saveWorkform(name, description)

                // Reload the saved workform from API so editor reflects canonical saved data.
                const refreshed = await Jmarc.fromWorkform(this.record.collection, name)
                this.record.fields = []
                this.record.parse(refreshed.compile())
                this.record.workformName = name
                this.record.workformDescription = refreshed.workformDescription || description
                this.record._isWorkformEdit = true
                this.record._isCloneDraft = false
                this.resetHistory()
                this.updateChangeTracking()
                this.runValidation()

                window.alert(`Workform updated: ${this.record.collection}/workforms/${name}`)
            } catch (error) {
                window.alert(`Could not update workform: ${error && error.message ? error.message : String(error)}`)
            }
        },
        async deleteWorkform() {
            if (!this.record || !this.record.workformName) return

            const name = String(this.record.workformName || '').trim()
            if (!name) return

            if (!window.confirm(`Delete workform ${this.record.collection}/workforms/${name}?`)) {
                return
            }

            try {
                await Jmarc.deleteWorkform(this.record.collection, name)
                this.$emit('close-record', this.record)
                window.alert(`Workform deleted: ${this.record.collection}/workforms/${name}`)
            } catch (error) {
                window.alert(`Could not delete workform: ${error && error.message ? error.message : String(error)}`)
            }
        },
        closeHistoryModal() {
            this.showHistoryModal = false
        },
        async loadHistoryEntries() {
            if (!this.record || !this.record.url) {
                this.historyLoadError = 'Record must be saved before history is available.'
                this.historyEntries = []
                this.selectedHistoryIndex = -1
                return
            }

            this.isHistoryLoading = true
            this.historyLoadError = ''

            try {
                const response = await fetch(this.record.url + '/history')
                const json = await response.json()
                if (!response.ok) {
                    throw new Error(json && json.message ? json.message : 'Failed to load history list')
                }

                const list = Array.isArray(json && json.data) ? json.data : []
                const loaded = await Promise.all(list.map(async (entry, index) => {
                    const eventResponse = await fetch(entry.event)
                    const eventJson = await eventResponse.json()
                    if (!eventResponse.ok) {
                        throw new Error(eventJson && eventJson.message ? eventJson.message : 'Failed to load a history revision')
                    }

                    const revision = new Jmarc(this.record.collection)
                    revision.parse(eventJson.data)
                    revision.recordId = this.record.recordId

                    return {
                        index,
                        label: `Revision ${index + 1}`,
                        time: entry.time || null,
                        user: entry.user || null,
                        record: revision
                    }
                }))

                // Show most recent first in the list.
                this.historyEntries = loaded.reverse()
                this.selectedHistoryIndex = this.historyEntries.length > 0 ? 0 : -1
            } catch (error) {
                this.historyLoadError = error && error.message ? error.message : String(error)
                this.historyEntries = []
                this.selectedHistoryIndex = -1
            } finally {
                this.isHistoryLoading = false
            }
        },
        selectHistoryEntry(index) {
            this.selectedHistoryIndex = index
        },
        revertToSelectedHistory() {
            const selected = this.selectedHistoryEntry
            if (!selected || !selected.record) return

            if (!window.confirm('Revert this record to the selected revision?')) {
                return
            }

            // Replace in-memory state with the chosen historical snapshot; user can then save normally.
            this.record.fields = []
            this.record.parse(selected.record.compile())
            this.clearFieldSelections()
            this.captureHistorySnapshot()
            this.updateChangeTracking()
            this.runValidation()
            this.closeHistoryModal()
        },
        resetHistory() {
            this.historySnapshots = []
            this.historyIndex = -1
            this.captureHistorySnapshot()
        },
        captureHistorySnapshot() {
            if (!this.record || typeof this.record.compile !== 'function') return

            const snapshot = JSON.stringify(this.record.compile())
            if (this.historyIndex >= 0 && this.historySnapshots[this.historyIndex] === snapshot) {
                return
            }

            if (this.historyIndex < this.historySnapshots.length - 1) {
                this.historySnapshots = this.historySnapshots.slice(0, this.historyIndex + 1)
            }

            this.historySnapshots.push(snapshot)
            this.historyIndex = this.historySnapshots.length - 1
        },
        applyHistorySnapshot(targetIndex) {
            if (!this.record || typeof this.record.parse !== 'function') return
            if (targetIndex < 0 || targetIndex >= this.historySnapshots.length) return

            try {
                this.isApplyingHistory = true
                const snapshotData = JSON.parse(this.historySnapshots[targetIndex])
                // Rebuild from snapshot to preserve exact field/subfield order.
                this.record.fields = []
                this.record.parse(snapshotData)
                this.historyIndex = targetIndex
                this.copiedFields = []
                this.syncSharedClipboardFromSelection()
                this.updateChangeTracking()
                this.runValidation()
            } finally {
                this.isApplyingHistory = false
            }
        },
        undoChange() {
            if (!this.canUndo) return
            this.applyHistorySnapshot(this.historyIndex - 1)
        },
        redoChange() {
            if (!this.canRedo) return
            this.applyHistorySnapshot(this.historyIndex + 1)
        },
        handleKeydown(event) {
            if (!this.isFocused || this.isRecordReadonly) return

            const key = String(event.key || '').toLowerCase()
            const hasModifier = event.metaKey || event.ctrlKey
            if (!hasModifier) return

            const isUndo = key === 'z' && !event.shiftKey
            const isRedo = (key === 'z' && event.shiftKey) || key === 'y'
            const isSave = key === 's' && !event.shiftKey
            const isAddField = key === 'enter' && event.shiftKey
            const isRemoveField = (key === 'backspace' || key === 'delete') && event.shiftKey

            if (!isUndo && !isRedo && !isSave && !isAddField && !isRemoveField) return

            event.preventDefault()
            event.stopPropagation()

            if (isAddField) {
                this.addFieldFrom(this.getFocusedFieldFromDom())
                return
            }

            if (isRemoveField) {
                this.deleteSelectedFieldsFrom(this.getFocusedFieldFromDom())
                return
            }

            if (isSave) {
                this.saveRecord()
                return
            }

            if (isUndo) {
                this.undoChange()
                return
            }

            this.redoChange()
        },
        isControlDisabled(control) {
            if (control.id === 'save' && this.isWorkformEditingRecord) return !this.hasWorkformUpdatePermission() || this.isSaving
            if (control.id === 'delete' && this.isWorkformEditingRecord) return !this.hasWorkformDeletePermission()
            if (this.isRecordReadonly) return true
            if (control.id === 'undo') return !this.canUndo
            if (control.id === 'redo') return !this.canRedo
            if (control.id === 'save') return this.hasBlockingValidationErrors || this.isSaving
            if (control.id === 'paste') return !this.hasPasteFields
            if (control.id === 'history') return false
            return false
        },
        handleControl(control) {
            this.requestFocus()

            switch (control.id) {
                case 'undo':
                    this.undoChange()
                    break
                case 'redo':
                    this.redoChange()
                    break
                case 'save':
                    if (this.isWorkformEditingRecord) {
                        this.updateWorkform()
                    } else {
                        this.saveRecord()
                    }
                    break
                case 'clone':
                    this.cloneRecord()
                    break
                case 'paste':
                    this.pasteFields()
                    break
                case 'history':
                    this.openHistoryModal()
                    break
                case 'save-workform':
                    this.saveAsWorkform()
                    break
                case 'delete':
                    if (this.isWorkformEditingRecord) {
                        this.deleteWorkform()
                    } else {
                        this.deleteRecord()
                    }
                    break
                case 'batch':
                    this.batchActions()
                    break
            }
        },
        async saveRecord() {
            this.runValidation()

            if (this.hasBlockingValidationErrors) {
                console.warn('Cannot save record with validation errors', this.validationErrors)
                return
            }

            if (this.isSaving) return

            this.isSaving = true
            try {
                console.log('Save record:', this.record)

                // Save a clone so Jmarc runSaveActions/validate side effects don't mutate
                // the active editor state (which can reorder fields in-place).
                const saveCandidate = this.record.clone()
                saveCandidate.recordId = this.record.recordId
                saveCandidate.url = this.record.url

                const savedRecord = this.record.recordId
                    ? await saveCandidate.put()
                    : await saveCandidate.post()

                if (savedRecord && savedRecord.url) {
                    this.record.url = savedRecord.url
                }
                if (savedRecord && savedRecord.recordId) {
                    this.record.recordId = savedRecord.recordId
                }

                if (this.record._isCloneDraft && this.record.recordId) {
                    delete this.record._isCloneDraft
                }

                // Keep undo/redo snapshots intact; only reset saved baseline.
                this.record.updateSavedState()
                this.updateChangeTracking()
                this.$emit('saveRecord', this.record)
            } catch (error) {
                const message = error && error.message ? error.message : String(error)
                console.error('Failed to save record:', message, error)
                window.alert(`Error saving record: ${message}`)
            } finally {
                this.isSaving = false
            }
        },
        cloneRecord() {
            if (!this.record || typeof this.record.clone !== 'function') return

            // Clone the in-memory record state, then strip 998 so the clone starts editable.
            const clonedRecord = this.record.clone()

            if (typeof clonedRecord.getFields === 'function' && typeof clonedRecord.deleteField === 'function') {
                const fields998 = clonedRecord.getFields('998') || []
                fields998.forEach(field => clonedRecord.deleteField(field))
            } else if (Array.isArray(clonedRecord.fields)) {
                clonedRecord.fields = clonedRecord.fields.filter(field => field && field.tag !== '998')
            }

            // Ensure clone is treated as a new unsaved record.
            clonedRecord.recordId = null
            clonedRecord.url = null
            if (typeof clonedRecord.updateSavedState === 'function') {
                clonedRecord.updateSavedState()
            }

            console.log('Clone record (without 998):', clonedRecord)
            this.$emit('clone-record', clonedRecord)
        },
        pasteFields() {
            if (sharedCopiedFieldPayloads.length === 0) {
                console.warn('No fields copied')
                return
            }

            const fieldsToPaste = [...sharedCopiedFieldPayloads]
            const pastedFields = []

            fieldsToPaste.forEach(sourceField => {
                if (!sourceField || !sourceField.tag) return

                const newField = this.record.createField(sourceField.tag)

                newField.indicators = Array.isArray(sourceField.indicators)
                    ? [...sourceField.indicators]
                    : ["_", "_"]

                    ; (sourceField.subfields || []).forEach(sf => {
                        const newSubfield = newField.createSubfield(sf.code)
                        newSubfield.value = sf.value
                        newSubfield.xref = sf.xref
                    })

                newField.checked = false
                pastedFields.push(newField)
            })

            if (pastedFields.length === 0) {
                console.warn('No fields were pasted')
                return
            }

            this.sortRecordFieldsByTag()
            this.clearFieldSelections()
            pastedFields.forEach(field => this.setFieldSelection(field, true))

            this.captureHistorySnapshot()
            this.updateChangeTracking()
            this.runValidation()
            this.$emit('pasteFields', { record: this.record, fields: pastedFields })
        },

        sortRecordFieldsByTag() {
            const byTag = (a, b) => {
                const ta = String(a?.tag ?? '')
                const tb = String(b?.tag ?? '')
                const na = Number.parseInt(ta, 10)
                const nb = Number.parseInt(tb, 10)
                const bothNumeric = !Number.isNaN(na) && !Number.isNaN(nb)

                if (bothNumeric && na !== nb) return na - nb
                return ta.localeCompare(tb)
            }

            // If Jmarc exposes a sorter, use it.
            if (typeof this.record.sortFields === 'function') {
                this.record.sortFields()
                return
            }

            // Sort underlying Jmarc storage (preferred).
            if (Array.isArray(this.record.fields)) {
                const controls = []
                const data = []

                this.record.fields.forEach(f => {
                    if (Array.isArray(f?.subfields)) data.push(f)
                    else controls.push(f)
                })

                data.sort(byTag)
                this.record.fields.splice(0, this.record.fields.length, ...controls, ...data)
                return
            }

            // Fallbacks
            if (Array.isArray(this.record.datafields)) {
                this.record.datafields.sort(byTag)
                return
            }

            const dataFields = this.record.getDataFields?.()
            if (Array.isArray(dataFields)) {
                dataFields.sort(byTag)
            }
        },
        deleteRecord() {
            if (confirm(`Are you sure you want to delete this record?`)) {
                console.log('Delete record:', this.record)
                this.$emit('delete-record', this.record)
            }
        },
        batchActions() {
            const selectedFields = this.copiedFields
                .map(field => serializeFieldForClipboard(field))
                .filter(Boolean)

            this.$emit('batch-actions', {
                sourceRecord: this.record,
                selectedFields
            })
        },
        getFocusedFieldFromDom() {
            const activeElement = document.activeElement
            if (!activeElement || !this.$el || !this.$el.contains(activeElement)) return null

            const fieldRow = activeElement.closest('.record-field-selectable')
            if (!fieldRow) return null

            const index = Number.parseInt(fieldRow.dataset.fieldIndex || '', 10)
            if (Number.isNaN(index)) return null

            const dataFields = this.record.getDataFields()
            return dataFields[index] || null
        },
        isProtectedField(field) {
            return !!(field && field.tag === '998')
        },
        getSelectableFields() {
            if (!this.record || typeof this.record.getDataFields !== 'function') return []
            return this.record.getDataFields().filter(field => !this.isProtectedField(field))
        },
        getDeletableFields(selectedFields, fallbackField) {
            const fallbackCandidates = fallbackField ? [fallbackField] : []
            return (selectedFields.length > 0 ? selectedFields : fallbackCandidates)
                .filter(field => !this.isProtectedField(field))
        },
        getDefaultSubfieldCodeForTag(tag) {
            const fieldValidation = this.validationDocument[tag]
            const defaultSubfields = fieldValidation && Array.isArray(fieldValidation.defaultSubfields)
                ? fieldValidation.defaultSubfields
                : []

            return defaultSubfields.length > 0 ? defaultSubfields[0] : 'a'
        },
        addFieldFrom(sourceField) {
            if (this.isRecordReadonly) return
            if (!this.record || typeof this.record.createField !== 'function') return

            const fieldIndex = sourceField && Array.isArray(this.record.fields)
                ? this.record.fields.indexOf(sourceField)
                : -1
            const insertAt = fieldIndex >= 0 ? fieldIndex + 1 : undefined
            const newField = this.record.createField('', insertAt)

            this.clearFieldSelections()
            if (newField) {
                this.setFieldSelection(newField, true)
            }
            this.onFieldChanged()

            // Move editing focus directly to the new field tag.
            this.$nextTick(() => {
                const selectedTag = this.$el?.querySelector('.record-field-selectable.is-selected .record-field-tag[contenteditable="true"]')
                if (selectedTag && typeof selectedTag.focus === 'function') {
                    selectedTag.focus()
                }
            })
        },
        deleteFieldFrom(targetField) {
            if (this.isRecordReadonly) return
            if (!targetField || !this.record || typeof this.record.deleteField !== 'function') return
            if (this.isProtectedField(targetField)) return

            this.record.deleteField(targetField)
            this.removeFieldFromCopyStack(targetField)
            this.onFieldChanged()
        },
        deleteSelectedFieldsFrom(fallbackField) {
            if (this.isRecordReadonly) return
            if (!this.record || typeof this.record.deleteField !== 'function') return

            const selectedFields = this.record.getDataFields().filter(field => field.checked)
            const fieldsToDelete = this.getDeletableFields(selectedFields, fallbackField)

            if (fieldsToDelete.length === 0) return

            fieldsToDelete.forEach(field => {
                this.record.deleteField(field)
                this.removeFieldFromCopyStack(field)
            })

            this.clearFieldSelections()
            this.onFieldChanged()
        },
        setFieldSelection(field, shouldSelect) {
            if (!field) return
            if (shouldSelect && this.isProtectedField(field)) {
                field.checked = false
                this.removeFieldFromCopyStack(field)
                return
            }

            field.checked = shouldSelect
            if (shouldSelect) {
                this.addFieldToCopyStack(field)
            } else {
                this.removeFieldFromCopyStack(field)
            }
        },
        clearFieldSelections() {
            const dataFields = this.record.getDataFields()
            dataFields.forEach(field => {
                field.checked = false
            })
            this.copiedFields = []
            this.syncSharedClipboardFromSelection()
        },
        selectAllSelectableFields() {
            const dataFields = this.getSelectableFields()
            dataFields.forEach(field => {
                this.setFieldSelection(field, true)
            })
        },
        clearAllFieldSelections() {
            this.clearFieldSelections()
        },
        beginFieldSelection(field, event) {
            if (event.button !== 0) return // left click only
            if (this.isProtectedField(field)) return

            // Let editable/interactive controls receive focus and cursor placement.
            const target = event.target
            const interactiveSelector = 'button, a, input, textarea, select, [contenteditable="true"]'
            if (target && (target.isContentEditable || target.closest(interactiveSelector))) {
                return
            }

            this.isDragSelecting = true
            this.dragAdditive = event.ctrlKey || event.metaKey // Ctrl on Win/Linux, Cmd on macOS
            this.dragSelectValue = this.dragAdditive ? !field.checked : true

            if (!this.dragAdditive) {
                this.clearFieldSelections()
            }

            this.setFieldSelection(field, this.dragSelectValue)
            event.preventDefault()
        },
        onFieldHoverSelection(field) {
            if (!this.isDragSelecting) return
            this.setFieldSelection(field, this.dragSelectValue)
        },
        endFieldSelection() {
            this.isDragSelecting = false
            this.dragAdditive = false
        },
        toggleSelectAllFields() {
            const dataFields = this.getSelectableFields()
            const shouldCheck = !this.allFieldsSelected

            dataFields.forEach(field => {
                this.setFieldSelection(field, shouldCheck)
            })
        },
        addFieldToCopyStack(field) {
            if (!this.copiedFields.includes(field)) {
                this.copiedFields.push(field)
                this.syncSharedClipboardFromSelection()
            }
        },
        removeFieldFromCopyStack(field) {
            const index = this.copiedFields.indexOf(field)
            if (index > -1) {
                this.copiedFields.splice(index, 1)
                this.syncSharedClipboardFromSelection()
            }
        },
        toggleFieldSelection(field, event) {
            if (this.isProtectedField(field)) return

            const additive = event && (event.ctrlKey || event.metaKey)
            if (additive) {
                this.setFieldSelection(field, !field.checked)
                return
            }

            this.clearFieldSelections()
            this.setFieldSelection(field, true)
        },
        async handleAuthLookup(field, subfield) {
            if (!this.record || typeof this.record.lookup !== 'function') return

            try {
                console.log(`Authority lookup for ${field.tag} $${subfield.code}: ${subfield.value}`)
                
                // Use Jmarc's lookup method to search for matching authority records
                const choices = await field.lookup()
                
                if (choices.length === 0) {
                    const created = await this.createAuthorityFromControlledField(field, subfield)
                    if (created) {
                        this.$emit('open-related-record', created)
                    }
                    return
                }
                
                if (choices.length === 1) {
                    // Auto-select single match
                    const matchedField = choices[0]
                    if (matchedField && matchedField.subfields && matchedField.subfields.length > 0) {
                        // Get the xref from the matched field
                        const xrefValue = matchedField.subfields[0].xref
                        if (xrefValue && !(xrefValue instanceof Error)) {
                            subfield.xref = xrefValue
                            this.onFieldChanged()
                            window.alert(`Authority linked to: ${subfield.value}`)
                        }
                    }
                    return
                }
                
                // Multiple matches - emit event to show selection UI
                this.$emit('authLookupChoices', {
                    field,
                    subfield,
                    choices
                })
            } catch (error) {
                console.error('Authority lookup error:', error)
                window.alert(`Authority lookup failed: ${error && error.message ? error.message : String(error)}`)
            }
        },
        async handleCreateAuthorityRequest(field, subfield) {
            const created = await this.createAuthorityFromControlledField(field, subfield)
            if (created) {
                this.$emit('open-related-record', created)
            }
        },
        async openLinkedAuthorityRecord(payload) {
            const xref = payload && payload.xref ? payload.xref : null
            if (!xref) return

            try {
                const authorityRecord = await Jmarc.get('auths', xref)
                this.$emit('open-related-record', authorityRecord)
            } catch (error) {
                window.alert(`Could not open linked authority: ${error && error.message ? error.message : String(error)}`)
            }
        },
        async createAuthorityFromControlledField(field, triggeringSubfield) {
            if (!field || !field.parentRecord || !field.parentRecord.authMap) {
                window.alert('Authority map not available for creating authority record.')
                return null
            }

            const tagMap = field.parentRecord.authMap[field.tag]
            if (!tagMap || !tagMap[triggeringSubfield.code]) {
                window.alert(`Cannot determine authority heading mapping for ${field.tag} $${triggeringSubfield.code}.`)
                return null
            }

            const headingTag = tagMap[triggeringSubfield.code]
            const authority = new Jmarc('auths')
            const headingField = authority.createField(headingTag)

            const includedSubfields = []
            for (const sf of (field.subfields || [])) {
                if (!sf || !sf.code || !sf.value) continue
                if (tagMap[sf.code] !== headingTag) continue

                const newSubfield = headingField.createSubfield(sf.code)
                newSubfield.value = sf.value
                includedSubfields.push(sf)
            }

            if (includedSubfields.length === 0 && triggeringSubfield && triggeringSubfield.value) {
                const fallback = headingField.createSubfield(triggeringSubfield.code)
                fallback.value = triggeringSubfield.value
                includedSubfields.push(triggeringSubfield)
            }

            try {
                const created = await authority.post()
                for (const sf of includedSubfields) {
                    sf.xref = created.recordId
                }
                this.onFieldChanged()
                window.alert(`Created authority record auths/${created.recordId} for "${triggeringSubfield.value}"`)
                return created
            } catch (error) {
                window.alert(`Could not create authority record: ${error && error.message ? error.message : String(error)}`)
                return null
            }
        }
    },
    template: /* html */ `
        <div
            class="record-container"
            :class="{ 'record-container--focused': isFocused }"
            @mousedown="requestFocus"
            @focusin="requestFocus"
        >
      <div class="record-header">
        <div class="record-header-id">
          <i 
                        v-if="showRecordControls"
            class="bi record-select-all"
            :class="allFieldsSelected ? 'bi-check-square' : 'bi-square'"
            @click="toggleSelectAllFields"
            title="Select/Unselect all fields"
          ></i>
          <span class="ms-2">{{ headerRecordLabel }}</span>
                                        <span v-if="isPersistedAuthRecord" class="record-use-count-badge">{{ authUseCountLabel }}</span>
                                        <span v-if="record._isCloneDraft && !record.recordId" class="record-focus-badge ms-2">Cloned</span>
                    <span v-if="isFocused" class="record-focus-badge">Active</span>
        </div>
                <div v-if="showRecordControls || isUnauthenticated" class="record-controls">
          <button
            v-for="control in visibleControls"
            :key="control.id"
                        :title="control.id === 'paste' && hasPasteFields ? control.label + ' (' + pasteFieldCount + ' ready)' : control.label"
            :data-action="control.id"
                        :class="['record-control-btn', { 'has-changes': control.id === 'save' && hasChanges, 'record-control-btn--paste-ready': control.id === 'paste' && hasPasteFields }]"
                        :disabled="isControlDisabled(control)"
            @click="handleControl(control)"
          >
            <i :class="['bi', control.icon]"></i>
                        <span v-if="control.id === 'paste' && hasPasteFields" class="record-paste-badge badge badge-info badge-pill ml-1">{{ pasteFieldCount }}</span>
          </button>
          <button
                        v-if="isUnauthenticated || !isRecordReadonly"
            class="record-control-btn record-close-btn"
            title="Close record"
                        @click="requestFocus(); $emit('close-record', record)"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
            <div v-if="canSeeValidationState && hasValidationErrors" class="record-validation-summary" :class="{ 'record-validation-summary--disabled': validationBypassedFor998 }">
                <div class="record-validation-summary-title">
                    Validation issues ({{ currentValidationErrors.length }})
                </div>
                <div v-if="validationBypassedFor998" class="record-validation-summary-note">
                    Field 998 is present. Validation issues are shown for review but will not block saving.
                </div>
                <ul class="record-validation-summary-list">
                    <li v-for="(entry, idx) in validationSummaryEntries" :key="'validation-' + idx">{{ entry }}</li>
                </ul>
            </div>
            <div v-else-if="canSeeValidationState && validationBypassedFor998" class="record-validation-summary record-validation-summary--disabled">
                Field 998 is present. Validation issues are shown for review but will not block saving.
            </div>
            <div v-if="isLockedByOther" class="record-lock-summary">
                <div class="record-lock-summary-title">
                    Locked for editing
                </div>
                <div class="record-lock-summary-text">
                    This record is in basket "{{ lockStatus.in }}" and locked by {{ lockStatus.by }}.
                </div>
                <button
                    v-if="canUnlockForEditing"
                    class="record-lock-unlock-btn"
                    type="button"
                    @click="requestUnlockForEditing"
                >
                    Unlock for editing
                </button>
            </div>
      <div
        v-for="(field, idx) in record.getDataFields()"
                :key="idx"
        :data-field-index="idx"
        class="record-field-selectable"
        :class="{ 'is-selected': field.checked, 'is-changed': changedFields.has(field) }"
        @mousedown="beginFieldSelection(field, $event)"
        @mouseenter="onFieldHoverSelection(field)"
        @mouseup="endFieldSelection"
      >
        <record-field 
          :field="field"
          :collection="record.getVirtualCollection()"
                    :show-validation-state="canSeeValidationState"
                    :readonly="isRecordReadonly"
          @field-changed="onFieldChanged"
          @field-selected="toggleFieldSelection(field, $event)"
                    @add-field="addFieldFrom"
                    @delete-field="deleteFieldFrom"
                    @delete-selected-fields="deleteSelectedFieldsFrom"
                    @auth-lookup="({ subfield }) => handleAuthLookup(field, subfield)"
                                        @create-authority="({ subfield }) => handleCreateAuthorityRequest(field, subfield)"
                                        @open-linked-authority="openLinkedAuthorityRecord"
        />
      </div>
            <teleport to="body">
                <div v-if="showHistoryModal" class="history-modal-overlay" @click.self="closeHistoryModal">
                    <div class="history-modal-dialog" role="dialog" aria-modal="true" aria-label="Record history">
                        <div class="history-modal-header">
                            <h3>Record history: {{ record.collection }}/{{ record.recordId }}</h3>
                            <button class="history-modal-close" type="button" @click="closeHistoryModal" aria-label="Close history">x</button>
                        </div>

                        <div v-if="isHistoryLoading" class="history-modal-loading">Loading history...</div>
                        <div v-else-if="historyLoadError" class="history-modal-error">{{ historyLoadError }}</div>
                        <div v-else-if="historyEntries.length === 0" class="history-modal-empty">No history revisions found.</div>
                        <div v-else class="history-modal-body">
                            <aside class="history-list-pane">
                                <div class="history-list-title">Revisions</div>
                                <button
                                    v-for="(entry, index) in historyEntries"
                                    :key="entry.label + '-' + entry.index"
                                    class="history-list-item"
                                    :class="{ 'history-list-item--selected': selectedHistoryIndex === index }"
                                    type="button"
                                    @click="selectHistoryEntry(index)"
                                >
                                    <div class="history-list-item-label">{{ entry.label }}</div>
                                    <div v-if="entry.time" class="history-list-item-meta">{{ entry.time }}</div>
                                    <div v-if="entry.user" class="history-list-item-meta">{{ entry.user }}</div>
                                </button>
                            </aside>

                            <section class="history-diff-pane" v-if="selectedHistoryEntry">
                                <div class="history-diff-columns">
                                    <div class="history-diff-column">
                                        <div class="history-diff-title">Current record</div>
                                        <div class="history-diff-lines">
                                            <div
                                                v-for="(row, idx) in currentRecordRows"
                                                :key="'current-' + idx + '-' + row.key"
                                                class="history-diff-line"
                                                :class="{ 'history-diff-line--changed': row.isDifferent }"
                                            >
                                                {{ row.line }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="history-diff-column">
                                        <div class="history-diff-title">Selected revision</div>
                                        <div class="history-diff-lines">
                                            <div
                                                v-for="(row, idx) in selectedHistoryRows"
                                                :key="'history-' + idx + '-' + row.key"
                                                class="history-diff-line"
                                                :class="{ 'history-diff-line--changed': row.isDifferent }"
                                            >
                                                {{ row.line }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="history-diff-footer">
                                    <button type="button" class="history-revert-btn" :disabled="isRecordReadonly" @click="revertToSelectedHistory">Revert to selected revision</button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </teleport>
    </div>
  `
}
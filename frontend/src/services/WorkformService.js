import { Jmarc } from '../api/jmarc.js'

export class WorkformService {
    constructor(record) {
        this.record = record
    }

    isPersistedWorkform() {
        return !!(this.record && this.record.workformName)
    }

    getWorkformName() {
        return (this.record?.workformName || '').trim()
    }

    getWorkformDescription() {
        return (this.record?.workformDescription || '').trim()
    }

    async saveAsWorkform(options = {}) {
        if (!this.record || !this.record.collection) {
            throw new Error('Record or collection is not available')
        }

        let workformName = (options.workformName || this.record.workformName || '').trim()
        let description = (options.description || this.record.workformDescription || '').trim()

        if (!workformName) {
            const nameInput = window.prompt('Workform name', '')
            if (nameInput === null) return { cancelled: true }
            workformName = String(nameInput || '').trim()

            if (!workformName) {
                throw new Error('Workform name is required')
            }
        }

        if ('description' in options === false) {
            const descInput = window.prompt('Workform description', '')
            if (descInput === null) return { cancelled: true }
            description = String(descInput || '').trim()
        }

        try {
            const candidate = this.record.clone()
            await this._removeControlFields(candidate)

            await candidate.saveAsWorkform(workformName, description)

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

    async updateWorkform(options = {}) {
        if (!this.record || !this.record.workformName) {
            throw new Error('Record is not a persisted workform')
        }

        const name = this.getWorkformName()
        if (!name) {
            throw new Error('Workform name is missing')
        }

        let description = (options.description || this.record.workformDescription || '').trim()

        if ('description' in options === false) {
            const descInput = window.prompt('Workform description', this.record.workformDescription || '')
            if (descInput === null) return { cancelled: true }
            description = String(descInput || '').trim()
        }

        try {
            const candidate = this.record.clone()
            await this._removeControlFields(candidate)

            await candidate.saveWorkform(name, description)

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

    async _removeControlFields(record) {
        if (typeof record.getFields === 'function' && typeof record.deleteField === 'function') {
            const fields998 = record.getFields('998') || []
            fields998.forEach(field => record.deleteField(field))
        } else if (Array.isArray(record.fields)) {
            record.fields = record.fields.filter(field => field && field.tag !== '998')
        }
    }

    updateMetadata(name, description) {
        this.record.workformName = name
        this.record.workformDescription = description
    }

    clearMetadata() {
        this.record.workformName = null
        this.record.workformDescription = null
    }
}

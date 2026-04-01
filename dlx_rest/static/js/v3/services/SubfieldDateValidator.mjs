/**
 * SubfieldDateValidator
 *
 * Shared date validation utilities for MARC subfield values.
 */
export class SubfieldDateValidator {
    /**
     * Validate a date value in YYYY-MM or YYYY-MM-DD format.
     * @param {string} value
     * @returns {boolean}
     */
    static isValidDateValue(value) {
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
    }
}

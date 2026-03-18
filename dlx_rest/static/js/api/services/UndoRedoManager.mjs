"use strict";

/**
 * UndoRedoManager handles undo/redo functionality for record changes.
 * Tracks history of record states and allows navigation through them.
 */
export class UndoRedoManager {
    constructor(autoTrackInterval = 1000) {
        this.vector = [];           // Array of undo/redo entries
        this.index = 0;             // Current position in history
        this.autoTrackInterval = autoTrackInterval;
        this.trackingHandle = null; // setInterval handle for auto-tracking
    }

    /**
     * Create an undo/redo entry
     * @private
     * @param {*} value - The value to store (typically compiled record)
     * @param {Object} metadata - Additional metadata
     * @returns {Object} The entry object
     */
    _createEntry(value, metadata = {}) {
        const now = new Date();
        
        return {
            dateEntry: this._formatDate(now),
            timeEntry: this._formatTime(now),
            valueEntry: value,
            ...metadata
        };
    }

    /**
     * Format date as YYYY-MM-DD
     * @private
     * @param {Date} date - Date to format
     * @returns {string} Formatted date
     */
    _formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * Format time as HH:MM:SS
     * @private
     * @param {Date} date - Date to extract time from
     * @returns {string} Formatted time
     */
    _formatTime(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    }

    /**
     * Check if a value already exists in the history
     * @private
     * @param {*} value - Value to check
     * @returns {boolean} True if value exists
     */
    _existsInVector(value) {
        return this.vector.some(entry =>
            JSON.stringify(entry.valueEntry) === JSON.stringify(value)
        );
    }

    /**
     * Add a new entry to the undo/redo history
     * @param {*} value - The value to store
     * @param {Object} metadata - Optional metadata (recordId, etc.)
     */
    addEntry(value, metadata = {}) {
        // Remove any entries after current index (branching history)
        this.vector = this.vector.slice(0, this.index + 1);
        
        const entry = this._createEntry(value, metadata);
        this.vector.push(entry);
        this.index = this.vector.length - 1;
    }

    /**
     * Move backward in history (undo)
     * @returns {*} The previous value or null if at beginning
     */
    undo() {
        if (this.vector.length === 0) {
            console.warn("No undo/redo history available");
            return null;
        }

        if (this.index > 0) {
            this.index--;
        } else {
            console.warn("Already at first entry in history");
        }

        return this.getCurrent();
    }

    /**
     * Move forward in history (redo)
     * @returns {*} The next value or null if at end
     */
    redo() {
        if (this.vector.length === 0) {
            console.warn("No undo/redo history available");
            return null;
        }

        if (this.index < this.vector.length - 1) {
            this.index++;
        } else {
            console.warn("Already at last entry in history");
        }

        return this.getCurrent();
    }

    /**
     * Get the current entry
     * @returns {Object|null} Current entry or null if no history
     */
    getCurrentEntry() {
        if (this.vector.length === 0) return null;
        return this.vector[this.index];
    }

    /**
     * Get the current value
     * @returns {*} Current value or null if no history
     */
    getCurrent() {
        const entry = this.getCurrentEntry();
        return entry ? entry.valueEntry : null;
    }

    /**
     * Get the entire history (read-only)
     * @returns {Object[]} Array of all entries
     */
    getHistory() {
        return [...this.vector];
    }

    /**
     * Get current position info
     * @returns {Object} { current: number, total: number }
     */
    getPosition() {
        return {
            current: this.index,
            total: this.vector.length
        };
    }

    /**
     * Check if undo is available
     * @returns {boolean} True if can undo
     */
    canUndo() {
        return this.index > 0;
    }

    /**
     * Check if redo is available
     * @returns {boolean} True if can redo
     */
    canRedo() {
        return this.index < this.vector.length - 1;
    }

    /**
     * Clear all history
     */
    clear() {
        this.vector = [];
        this.index = 0;
        this.stopAutoTracking();
    }

    /**
     * Start auto-tracking changes
     * @param {Function} getValueFn - Function that returns current value
     * @param {Function} onChangeFn - Callback when change detected (optional)
     */
    startAutoTracking(getValueFn, onChangeFn = null) {
        if (this.trackingHandle) {
            console.warn("Auto-tracking already active");
            return;
        }

        this.trackingHandle = setInterval(() => {
            const currentValue = getValueFn();
            
            if (!this._existsInVector(currentValue)) {
                this.addEntry(currentValue);
                onChangeFn?.(currentValue);
            }
        }, this.autoTrackInterval);
    }

    /**
     * Stop auto-tracking
     */
    stopAutoTracking() {
        if (this.trackingHandle) {
            clearInterval(this.trackingHandle);
            this.trackingHandle = null;
        }
    }

    /**
     * Check if auto-tracking is active
     * @returns {boolean} True if tracking
     */
    isTracking() {
        return this.trackingHandle !== null;
    }
}
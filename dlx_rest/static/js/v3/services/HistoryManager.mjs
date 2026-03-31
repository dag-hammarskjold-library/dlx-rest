/**
 * HistoryManager Service
 * 
 * Manages undo/redo functionality and record history snapshots.
 * Provides snapshot capture, history navigation, and history entry retrieval.
 * 
 * Key Responsibilities:
 * - Maintain snapshot stack for undo/redo
 * - Track current position in history
 * - Serialize/deserialize record states
 * - Load detailed history entries from API
 */

/**
 * Creates a HistoryManager instance for a record
 * @param {Object} record - The Jmarc record instance
 * @param {Object} options - Configuration options
 * @returns {HistoryManager} History manager instance
 */
export class HistoryManager {
    constructor(record, options = {}) {
        this.record = record
        this.snapshots = []
        this.currentIndex = -1
        this.isApplying = false
        this.maxSnapshots = options.maxSnapshots || 50
    }

    /**
     * Capture current record state as a snapshot
     * @returns {boolean} True if snapshot was captured, false if identical to current
     */
    captureSnapshot() {
        if (!this.record || typeof this.record.compile !== 'function') {
            return false
        }

        const snapshot = JSON.stringify(this.record.compile())
        
        // Don't capture duplicate snapshots
        if (this.currentIndex >= 0 && this.snapshots[this.currentIndex] === snapshot) {
            return false
        }

        // Trim history if we've undone and are now making a new change
        if (this.currentIndex < this.snapshots.length - 1) {
            this.snapshots = this.snapshots.slice(0, this.currentIndex + 1)
        }

        this.snapshots.push(snapshot)
        this.currentIndex = this.snapshots.length - 1

        // Limit history size
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift()
            this.currentIndex--
        }

        return true
    }

    /**
     * Apply a snapshot at the given index
     * @param {number} targetIndex - Index of snapshot to apply
     * @returns {boolean} True if snapshot was applied successfully
     */
    applySnapshot(targetIndex) {
        if (!this.record || typeof this.record.parse !== 'function') {
            return false
        }

        if (targetIndex < 0 || targetIndex >= this.snapshots.length) {
            return false
        }

        try {
            this.isApplying = true
            const snapshotData = JSON.parse(this.snapshots[targetIndex])
            
            // Rebuild from snapshot to preserve exact field/subfield order
            this.record.fields = []
            this.record.parse(snapshotData)
            this.currentIndex = targetIndex
            
            return true
        } catch (error) {
            console.error('Failed to apply history snapshot:', error)
            return false
        } finally {
            this.isApplying = false
        }
    }

    /**
     * Undo to previous snapshot
     * @returns {boolean} True if undo was successful
     */
    undo() {
        if (!this.canUndo) {
            return false
        }
        return this.applySnapshot(this.currentIndex - 1)
    }

    /**
     * Redo to next snapshot
     * @returns {boolean} True if redo was successful
     */
    redo() {
        if (!this.canRedo) {
            return false
        }
        return this.applySnapshot(this.currentIndex + 1)
    }

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    get canUndo() {
        return this.currentIndex > 0
    }

    /**
     * Check if redo is available
     * @returns {boolean}
     */
    get canRedo() {
        return this.currentIndex >= 0 && this.currentIndex < this.snapshots.length - 1
    }

    /**
     * Get list of history snapshots (for display/navigation)
     * @returns {Array<string>} Array of snapshot indices
     */
    getSnapshotIndices() {
        return this.snapshots.map((_, i) => i)
    }

    /**
     * Reset history (clear all snapshots)
     */
    reset() {
        this.snapshots = []
        this.currentIndex = -1
    }

    /**
     * Clear and reinitialize with initial snapshot
     */
    resetWithInitialSnapshot() {
        this.snapshots = []
        this.currentIndex = -1
        this.captureSnapshot()
    }

    /**
     * Get current snapshot index
     * @returns {number}
     */
    getCurrentIndex() {
        return this.currentIndex
    }

    /**
     * Get total number of snapshots
     * @returns {number}
     */
    getSnapshotCount() {
        return this.snapshots.length
    }

    /**
     * Check if currently applying history
     * @returns {boolean}
     */
    isApplyingSnapshot() {
        return this.isApplying
    }
}

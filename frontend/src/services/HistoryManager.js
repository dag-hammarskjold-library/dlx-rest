export class HistoryManager {
    constructor(record, options = {}) {
        this.record = record
        this.snapshots = []
        this.currentIndex = -1
        this.isApplying = false
        this.maxSnapshots = options.maxSnapshots || 50
    }

    captureSnapshot() {
        if (!this.record || typeof this.record.compile !== 'function') {
            return false
        }

        const snapshot = JSON.stringify(this.record.compile())

        if (this.currentIndex >= 0 && this.snapshots[this.currentIndex] === snapshot) {
            return false
        }

        if (this.currentIndex < this.snapshots.length - 1) {
            this.snapshots = this.snapshots.slice(0, this.currentIndex + 1)
        }

        this.snapshots.push(snapshot)
        this.currentIndex = this.snapshots.length - 1

        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift()
            this.currentIndex--
        }

        return true
    }

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

    undo() {
        if (!this.canUndo) {
            return false
        }
        return this.applySnapshot(this.currentIndex - 1)
    }

    redo() {
        if (!this.canRedo) {
            return false
        }
        return this.applySnapshot(this.currentIndex + 1)
    }

    get canUndo() {
        return this.currentIndex > 0
    }

    get canRedo() {
        return this.currentIndex >= 0 && this.currentIndex < this.snapshots.length - 1
    }

    getSnapshotIndices() {
        return this.snapshots.map((_, i) => i)
    }

    reset() {
        this.snapshots = []
        this.currentIndex = -1
    }

    resetWithInitialSnapshot() {
        this.snapshots = []
        this.currentIndex = -1
        this.captureSnapshot()
    }

    getCurrentIndex() {
        return this.currentIndex
    }

    getSnapshotCount() {
        return this.snapshots.length
    }

    isApplyingSnapshot() {
        return this.isApplying
    }
}

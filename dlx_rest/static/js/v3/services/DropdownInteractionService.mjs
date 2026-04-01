/**
 * DropdownInteractionService
 *
 * Shared keyboard/focus helpers for dropdown-style interactions.
 */
export class DropdownInteractionService {
    static MENU_TRIGGER_ACTION_BY_INTENT = {
        tab: 'close',
        enter: 'blur',
        navigate: 'navigate',
        noop: 'noop'
    }

    static MENU_OPTION_ACTION_BY_INTENT = {
        tab: 'close',
        escape: 'close-focus-trigger',
        navigate: 'navigate',
        noop: 'noop'
    }

    /**
     * Check whether a key is an arrow-navigation key.
     * @param {string} key
     * @returns {boolean}
     */
    static isArrowKey(key) {
        return key === 'ArrowDown' || key === 'ArrowUp'
    }

    /**
     * Resolve directional delta from an arrow key.
     * @param {string} key
     * @returns {number}
     */
    static getArrowDelta(key) {
        if (key === 'ArrowDown') return 1
        if (key === 'ArrowUp') return -1
        return 0
    }

    /**
     * Normalize index into a cyclic list range.
     * @param {number} index
     * @param {number} length
     * @returns {number}
     */
    static normalizeIndex(index, length) {
        if (!Number.isInteger(length) || length <= 0) return -1
        return ((index % length) + length) % length
    }

    /**
     * Determine if a menu should close on focusout.
     * @param {EventTarget|null} currentTarget
     * @param {EventTarget|null} nextTarget
     * @returns {boolean}
     */
    static shouldCloseOnFocusOut(currentTarget, nextTarget) {
        return !!(currentTarget && !currentTarget.contains(nextTarget))
    }

    /**
     * Determine whether auth dropdown should close on focusout.
     * @param {Object} options
     * @param {EventTarget|null} options.currentTarget
     * @param {EventTarget|null} options.nextTarget
     * @param {(target: EventTarget|null) => boolean} options.isInDropdown
     * @returns {boolean}
     */
    static shouldCloseAuthDropdownOnFocusOut({ currentTarget, nextTarget, isInDropdown }) {
        if (!currentTarget || currentTarget.contains(nextTarget)) {
            return false
        }

        return !isInDropdown(nextTarget)
    }

    /**
     * Resolve key intent for auth input keyboard handling.
     * @param {Object} options
     * @param {string} options.key
     * @param {boolean} options.showDropdown
     * @param {number} options.resultCount
     * @param {number} options.activeIndex
     * @returns {'tab'|'navigate'|'escape'|'select-active'|'blur'|'noop'}
     */
    static getAuthValueKeyIntent({ key, showDropdown, resultCount, activeIndex }) {
        if (key === 'Tab') return 'tab'
        if (key === 'Escape') return 'escape'

        if (DropdownInteractionService.isArrowKey(key) && resultCount > 0) {
            return 'navigate'
        }

        if (key === 'Enter') {
            if (showDropdown && resultCount > 0 && activeIndex >= 0) {
                return 'select-active'
            }
            return 'blur'
        }

        return 'noop'
    }

    /**
     * Resolve key intent for auth dropdown option keyboard handling.
     * @param {string} key
     * @returns {'tab'|'escape'|'enter'|'navigate'|'noop'}
     */
    static getAuthOptionKeyIntent(key) {
        if (key === 'Tab') return 'tab'
        if (key === 'Escape') return 'escape'
        if (key === 'Enter') return 'enter'
        if (DropdownInteractionService.isArrowKey(key)) return 'navigate'
        return 'noop'
    }

    /**
     * Resolve key intent for code/value editable trigger elements.
     * @param {Object} options
     * @param {string} options.key
     * @param {boolean} [options.allowEnterBlur=false]
     * @returns {'tab'|'enter'|'navigate'|'noop'}
     */
    static getMenuTriggerKeyIntent({ key, allowEnterBlur = false }) {
        if (key === 'Tab') return 'tab'
        if (allowEnterBlur && key === 'Enter') return 'enter'
        if (DropdownInteractionService.isArrowKey(key)) return 'navigate'
        return 'noop'
    }

    /**
     * Resolve key intent for code/value dropdown option elements.
     * @param {string} key
     * @returns {'tab'|'escape'|'navigate'|'noop'}
     */
    static getMenuOptionKeyIntent(key) {
        if (key === 'Tab') return 'tab'
        if (key === 'Escape') return 'escape'
        if (DropdownInteractionService.isArrowKey(key)) return 'navigate'
        return 'noop'
    }

    /**
     * Resolve normalized action for editable trigger intent.
     * @param {string} intent
     * @returns {'close'|'blur'|'navigate'|'noop'}
     */
    static getMenuTriggerAction(intent) {
        return DropdownInteractionService.MENU_TRIGGER_ACTION_BY_INTENT[intent] || 'noop'
    }

    /**
     * Resolve normalized action for dropdown option intent.
     * @param {string} intent
     * @returns {'close'|'close-focus-trigger'|'navigate'|'noop'}
     */
    static getMenuOptionAction(intent) {
        return DropdownInteractionService.MENU_OPTION_ACTION_BY_INTENT[intent] || 'noop'
    }
}

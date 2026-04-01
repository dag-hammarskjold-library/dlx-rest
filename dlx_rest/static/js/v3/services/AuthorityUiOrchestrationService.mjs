import { DropdownInteractionService } from './DropdownInteractionService.mjs'

/**
 * AuthorityUiOrchestrationService
 *
 * UI-state helpers for authority selection and dropdown orchestration.
 */
export class AuthorityUiOrchestrationService {
    static AUTH_VALUE_ACTION_BY_INTENT = {
        tab: 'close-reset',
        navigate: 'navigate',
        escape: 'close',
        'select-active': 'select-active',
        blur: 'blur',
        noop: 'noop'
    }

    static AUTH_OPTION_ACTION_BY_INTENT = {
        tab: 'close',
        escape: 'close-focus-input',
        enter: 'select-index',
        navigate: 'navigate',
        noop: 'noop'
    }

    /**
     * Build post-selection UI patch for authority-controlled fields.
     * @returns {{isAuthUnmatched: boolean, showAuthSearch: boolean, authSearchResults: Array, classUpdates: Object}}
     */
    static getPostSelectionUiState() {
        return {
            isAuthUnmatched: false,
            showAuthSearch: false,
            authSearchResults: [],
            classUpdates: {
                'authority-controlled': true,
                'clickable-text': true
            }
        }
    }

    /**
     * Apply class updates to subfield value class map.
     * @param {Object} classState
     * @param {Object} classUpdates
     */
    static applyClassUpdates(classState, classUpdates) {
        if (!classState || !classUpdates) return
        Object.keys(classUpdates).forEach((key) => {
            classState[key] = classUpdates[key]
        })
    }

    /**
     * Keep contenteditable text synchronized with latest model value.
     * @param {HTMLElement|null|undefined} element
     * @param {string} value
     */
    static syncEditableText(element, value) {
        if (!element) return
        element.textContent = value || ''
    }

    /**
     * Get state patch for closing auth dropdown.
     * @param {Object} [options]
     * @param {boolean} [options.resetActiveIndex=false]
     * @returns {{showAuthSearch: boolean, activeAuthOptionIndex?: number}}
     */
    static getCloseAuthDropdownState(options = {}) {
        const resetActiveIndex = !!options.resetActiveIndex
        return resetActiveIndex
            ? { showAuthSearch: false, activeAuthOptionIndex: -1 }
            : { showAuthSearch: false }
    }

    /**
     * Resolve action for auth input intent.
     * @param {string} intent
     * @returns {string}
     */
    static getAuthValueAction(intent) {
        return AuthorityUiOrchestrationService.AUTH_VALUE_ACTION_BY_INTENT[intent] || 'noop'
    }

    /**
     * Resolve action for auth option intent.
     * @param {string} intent
     * @returns {string}
     */
    static getAuthOptionAction(intent) {
        return AuthorityUiOrchestrationService.AUTH_OPTION_ACTION_BY_INTENT[intent] || 'noop'
    }

    /**
     * Resolve optional state patch for a normalized auth action.
     * @param {string} action
     * @returns {Object|null}
     */
    static getStatePatchForAuthAction(action) {
        if (action === 'close-reset') {
            return AuthorityUiOrchestrationService.getCloseAuthDropdownState({ resetActiveIndex: true })
        }
        if (action === 'close' || action === 'close-focus-input') {
            return AuthorityUiOrchestrationService.getCloseAuthDropdownState()
        }
        return null
    }

    /**
     * Check whether authority selection should be applied.
     * @param {Object} options
     * @param {boolean} options.readonly
     * @param {Object|null} options.authority
     * @returns {boolean}
     */
    static canSelectAuthority({ readonly, authority }) {
        return !readonly && !!authority && !authority.notFound
    }

    /**
     * Resolve normalized active option and focus target from option refs.
     * @param {Object} options
     * @param {Array<HTMLElement>} options.optionRefs
     * @param {number} options.index
     * @returns {{index: number, target: HTMLElement|null}}
     */
    static resolveOptionFocusTarget({ optionRefs, index }) {
        const refs = Array.isArray(optionRefs) ? optionRefs : []
        if (refs.length === 0) {
            return { index: -1, target: null }
        }

        const normalizedIndex = DropdownInteractionService.normalizeIndex(index, refs.length)
        return {
            index: normalizedIndex,
            target: refs[normalizedIndex] || null
        }
    }

    /**
     * Apply a state patch onto a component-like context object.
     * @param {Object} ctx
     * @param {Object} patch
     */
    static applyStatePatch(ctx, patch) {
        if (!ctx || !patch) return
        Object.keys(patch).forEach((key) => {
            ctx[key] = patch[key]
        })
    }
}

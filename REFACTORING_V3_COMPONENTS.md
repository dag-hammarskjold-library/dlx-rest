# V3 Component Refactoring Progress

## Overview
This document tracks the ongoing refactoring of the v3 component suite to improve readability, maintainability, and testability through component decomposition and service extraction.

## Current State (Phase 1: MOSTLY COMPLETE)

### Completed ✅ 

**Services Layer Created** (`dlx_rest/static/js/v3/services/`)
- ✅ **HistoryManager.mjs** - Undo/redo snapshot management (extracted from recordstage-record.mjs)
- ✅ **FieldClipboardService.mjs** - Global field clipboard state (extracted from recordstage-record.mjs)
- ✅ **WorkformService.mjs** - Workform save/update operations (extracted from recordstage-record.mjs)
- ✅ **index.mjs** - Service exports

### Recently Completed ✅

**recordstage-record.mjs integration**
- [x] Replaced internal history state with HistoryManager
- [x] Replaced clipboard state/events with FieldClipboardService
- [x] Replaced workform save/update internals with WorkformService
- [x] Added lifecycle-safe clipboard subscription/unsubscription
- [x] Updated undo/redo computed state to service-backed values

**Phase 1 service test coverage**
- [x] Added history manager tests: `dlx_rest/tests/v3/history-manager.test.mjs`
- [x] Added clipboard service tests: `dlx_rest/tests/v3/field-clipboard-service.test.mjs`
- [x] Added workform service tests: `dlx_rest/tests/v3/workform-service.test.mjs`
- [x] Verified full v3 test suite is green (`npm run test:js:v3`)

**Phase 1 JSDoc expansion (core workflows)**
- [x] Added/cleaned JSDoc for service integration lifecycle methods
- [x] Added JSDoc for history loading and keyboard shortcut handling
- [x] Added JSDoc for save, clone, paste, and field-selection workflows
- [x] Added JSDoc for authority lookup/create flows

**Phase 1 JSDoc expansion (utility methods)**
- [x] Added JSDoc for utility methods across permissions, validation, selection, and control routing
- [x] Added JSDoc for record close/unlock, batch actions, delete paths, and DOM-focused helpers
- [x] Completed utility-method JSDoc pass for `recordstage-record.mjs`

### In Progress 🚧

**Documentation hardening**
- [x] Add comprehensive JSDoc coverage to remaining lower-risk utility methods
- [~] Continue reducing `recordstage-record.mjs` method density via follow-on extractions

## Refactoring Roadmap

### Phase 1: Core Services + recordstage-record Integration (CURRENT)
**Goal**: Extract business logic from recordstage-record, reduce to ~1,000 lines

Services to integrate:
- [x] HistoryManager - manages snapshots, undo/redo
- [x] FieldClipboardService - global clipboard state  
- [x] WorkformService - workform operations
- [x] Integrate all three services into component
- [x] Add comprehensive JSDoc comments
- [x] Create test stubs for services

**Expected Outcome**: 
- recordstage-record.mjs: 1,595 → ~1,000 lines
- Improved code organization and reusability
- Services are now testable in isolation

---

### Phase 2: Simplify record-field-subfield (HIGH Priority)
**Goal**: Reduce from 1,120 → ~500 lines by extracting concerns

**Services to Create**:
1. **ValidationRulesService** - Consolidates field/subfield validation rules
   - `getSubfieldCodes(tag)` - available subfield codes for tag
   - `getSubfieldConstraints(tag, code)` - constraints for specific subfield
   - `validateSubfieldValue(tag, code, value)` - validate value against rules
   - `isDateField(tag, code)` - check if subfield expects date format
   - `getAllowedValues(tag, code)` - get dropdown options

2. **AuthorityControlService** - Authority control logic
   - `isAuthorityControlled(tag, code)` - check if field is auth-controlled
   - `searchAuthorities(query, type)` - search authority database
   - `resolveAuthority(xref)` - resolve xref to authority data
   - `hasValidXref(xref)` - validate xref format
   - `createAuthority(value, type)` - create new authority

3. **SubfieldDateValidator** - Specialized date validation
   - `isValidDate(value)` - validate YYYY-MM or YYYY-MM-DD
   - `parseDate(value)` - parse date string to components
   - `formatDate(year, month, day)` - format as YYYY-MM-DD

**Sub-Components to Extract**:
1. **AuthorityPreview.vue** - Authority xref display/preview component
2. **DropdownMenu.vue** - Reusable dropdown for codes/values
3. **DateInput.vue** - Specialized date input with validation

**Expected Outcome**:
- record-field-subfield.mjs: 1,120 → ~500 lines
- Services handle validation & authority logic
- Sub-components handle UI concerns
- Much easier to test and maintain

---

### Phase 3: Extract Shared Services (MEDIUM Priority)
**Goal**: Create reusable services for cross-cutting concerns

**New Services**:
1. **PermissionsService** - Centralized permission checks
   - `hasPermission(permission, context)` 
   - `canEditRecord(record, user)`
   - `canDeleteRecord(record, user)`
   - `canEditWorkform(workform, user)`

2. **KeyboardHandlerService** - Keyboard shortcut management
   - `registerShortcut(key, modifiers, action)`
   - `handleKeydown(event, context)`
   - `getShortcutHelp()` - documentation for shortcuts

3. **RecordValidationService** - Record-level validation
   - `validateRecord(record)` - run all validations
   - `validateField(field)` - validate single field
   - `formatValidationError(error)` - error formatting
   - `hasBlockingErrors(errors)` - check if errors prevent save

4. **BasketService** - Basket operations abstraction
   - `fetchBasket()` - get basket contents
   - `startPolling()` / `stopPolling()` - auto-refresh
   - `filterBasket(criteria)` - apply filters
   - `sortBasket(sortBy)` - sort records

**Expected Outcome**:
- Services reusable across components
- Reduced props drilling
- Better code organization
- Easier testing

---

### Phase 4: Extract Sub-Components (MEDIUM Priority)
**Goal**: Break down large components into focused, single-responsibility components

**Components to Extract** (from recordstage-record):
1. **RecordControlBar.vue** - Undo/Redo/Save/Clone/Delete buttons
2. **ValidationSummary.vue** - Error display and collapsible errors
3. **HistoryModal.vue** - History viewer modal (with timeline)
4. **RecordMetadata.vue** - Display record ID, workform name, auth use count

**Components to Extract** (from basket):
1. **BasketFilter.vue** - Filter controls
2. **BasketSort.vue** - Sort dropdown
3. **BasketRefreshStatus.vue** - Poll status indicator

**Expected Outcome**:
- recordstage-record.mjs → 700 lines (removed UI separables)
- Main component focuses on orchestration
- Better component reusability
- Easier to test UI in isolation

---

### Phase 5: Vue 3 Composables (OPTIONAL)
**Goal**: Modernize with Vue 3 Composition API

**Composables to Create**:
1. `useRecordHistory()` - history state and methods
2. `useFieldSelection()` - field selection management
3. `useRecordValidation()` - validation state and methods
4. `useBasketPolling()` - polling state management
5. `useAuthorityTooltip()` - tooltip positioning and content
6. `useKeyboardShortcuts()` - keyboard handler setup

**Migration Path**:
- Can coexist with Options API initially
- Migrate components incrementally as needed
- Test each composable independently
- Document migration patterns

**Expected Outcome**:
- Modern, testable composition patterns
- Shared logic across components
- Better TypeScript support (future)
- Easier to understand data flow

---

## Architecture Improvements

### Current Pain Points → Solutions

| Problem | Current | New Approach | Phase |
|---------|---------|--------------|-------|
| **1,595-line component** | Monolithic | Service + Sub-components | 1, 4 |
| **Props drilling 4+ levels** | Stage → Record → Field → Subfield | Services + Event bus | 3 |
| **Scattered validation** | 3+ files | ValidationService | 2, 3 |
| **Permission checks duplicate** | In multiple methods | PermissionsService | 3 |
| **History management mixed in UI** | Long methods with logic | HistoryManager service | 1 ✅ |
| **Authority control logic unclear** | 40 lines in subfield | AuthorityControlService | 2 |
| **Keyboard handling scattered** | recordstage + recordstage-record | KeyboardHandlerService | 3 |
| **Clipboard state mutable global** | Module-level array | FieldClipboardService (private) | 1 ✅ |
| **No JSDoc comments** | Code-only documentation | JSDoc on all public methods | 1+ |
| **Hard to test logic** | Tightly coupled to Vue | Extracted services testable | 1-3 |

### New Directory Structure (Target)

```
dlx_rest/static/js/v3/
├── components/
│   ├── stage.mjs
│   ├── basket.mjs
│   ├── basket-record.mjs
│   ├── batch-basket-modal.mjs
│   ├── recordstage.mjs
│   ├── recordstage-record.mjs (REDUCED ~700 lines)
│   ├── record-field.mjs
│   ├── record-field-subfield.mjs (REDUCED ~500 lines)
│   └── modals/
│       ├── HistoryModal.mjs
│       ├── CreateRecordModal.mjs
│       ├── BatchActionsModal.mjs
│       └── AuthorityPreviewModal.mjs
│
├── services/
│   ├── index.mjs
│   ├── HistoryManager.mjs ✅
│   ├── FieldClipboardService.mjs ✅
│   ├── WorkformService.mjs ✅
│   ├── ValidationService.mjs (Phase 3)
│   ├── PermissionsService.mjs (Phase 3)
│   ├── KeyboardHandlerService.mjs (Phase 3)
│   ├── AuthorityControlService.mjs (Phase 2)
│   ├── RecordValidationService.mjs (Phase 3)
│   └── BasketService.mjs (Phase 3)
│
├── composables/
│   ├── useRecordHistory.mjs (Phase 5)
│   ├── useFieldSelection.mjs (Phase 5)
│   ├── useRecordValidation.mjs (Phase 5)
│   ├── useBasketPolling.mjs (Phase 5)
│   ├── useAuthorityTooltip.mjs (Phase 5)
│   └── useKeyboardShortcuts.mjs (Phase 5)
│
└── tests/
    ├── services/
    │   ├── HistoryManager.spec.mjs
    │   ├── FieldClipboardService.spec.mjs
    │   └── ... (unit tests for services)
    └── components/
        └── ... (existing component tests)
```

---

## Integration Checklist - Phase 1

### recordstage-record.mjs Integration Steps

1. **Import new services**
   ```javascript
   import { HistoryManager } from '../services/HistoryManager.mjs'
   import { FieldClipboardService } from '../services/FieldClipboardService.mjs'
   import { WorkformService } from '../services/WorkformService.mjs'
   ```

2. **Initialize services in data()**
   ```javascript
   data() {
       return {
           historyManager: null,
           workformService: null,
           // Remove: historySnapshots, historyIndex, isApplyingHistory
           // Remove: sharedClipboardCount, sharedCopiedFieldPayloads
           // ... other data
       }
   }
   ```

3. **Setup services in mounted()**
   - Create HistoryManager instance
   - Create WorkformService instance
   - Initialize FieldClipboardService listener

4. **Replace history methods**
   - `undoChange()` → `this.historyManager.undo()`
   - `redoChange()` → `this.historyManager.redo()`
   - `captureHistorySnapshot()` → `this.historyManager.captureSnapshot()`
   - `applyHistorySnapshot()` → `this.historyManager.applySnapshot()`

5. **Replace clipboard methods**
   - `syncSharedClipboardFromSelection()` → `FieldClipboardService.copyFields()`
   - `handleSharedClipboardChange()` → listener from service
   - Remove shared module-level state

6. **Replace workform methods**
   - `saveAsWorkform()` → `this.workformService.saveAsWorkform()`
   - `updateWorkform()` → `this.workformService.updateWorkform()`

7. **Add JSDoc comments**
   - Document all public methods
   - Add parameter types and return types
   - Explain complex logic with inline comments

8. **Test integration**
   - Run existing tests to ensure no regression
   - Verify undo/redo still works
   - Verify clipboard operations
   - Verify workform save/update

---

## Testing Strategy

### Unit Tests (Services)
- HistoryManager: snapshot capture, undo/redo, edge cases
- FieldClipboardService: copy, paste, clear, event publishing
- WorkformService: save, update, metadata management

### Integration Tests (Components)
- recordstage-record with services integrated
- Focus on event flow and state management
- Keyboard shortcuts with services

### E2E Tests
- Multi-record editing with undo/redo
- Copy/paste across records
- Workform save and updates

---

## Documentation Improvements

### JSDoc Comments
All public methods should include:
- Clear description of what the method does
- @param tags with types
- @returns tag with type
- @throws tag if applicable
- Usage examples for complex methods

### Code Comments
Complex logic should have:
- Why (intent, not what)
- What (one-line summary before complex section)
- Refs to related code (other methods, services)

### README Updates
- Service documentation
- Architecture diagrams
- Component interaction flows
- Development guidelines

---

## Performance Considerations

### Memory
- HistoryManager: Max 50 snapshots (configurable), each is JSON string
- FieldClipboardService: Stores copies of field objects (typically < 10 fields)
- Minor compared to full record objects

### Speed
- Snapshot capture is JSON.stringify (offloaded, not blocking)
- Apply snapshot is JSON.parse + record rebuild (~0-5ms)
- Negligible impact on user experience

### Future Optimizations
- Partial snapshots (only changed fields)
- Compression of snapshots
- IndexedDB for history persistence
- Lazy-loading of history modal details

---

## Rollout Plan

### Immediate (This Sprint)
1. ✅ Create services (Phase 1 - DONE)
2. ✅ Integrate services into recordstage-record
3. ✅ Add JSDoc documentation
4. ✅ Test thoroughly
5. [ ] Create PR with Phase 1 complete

### Short Term (Next Sprint)
1. Phase 2: Simplify record-field-subfield
2. Create sub-components (DropdownMenu, AuthorityPreview, DateInput)
3. Extract AuthorityControlService

### Medium Term (2-3 Sprints)
1. Phase 3: Shared services (Validation, Permissions, Keyboard, Basket)
2. Phase 4: Extract remaining sub-components (RecordControlBar, ValidationSummary, etc)
3. Update tests

### Future (Optional)
1. Phase 5: Vue 3 Composables
2. TypeScript migration
3. Performance optimization (partial snapshots, etc)

---

## Notes & Observations

### Key Insights
1. **Services are stateful** - They manage their own internal state (snapshots, clipboard), which is safer than component-level state
2. **Events bridge components** - FieldClipboardService uses events to notify changes across components
3. **Separation of concerns** - Business logic (HistoryManager) is separate from UI (Component methods)
4. **Backward compatible** - Services don't change public APIs, just refactor internals

### Potential Challenges
1. **Service initialization** - Ensure services are created before use
2. **Event cleanup** - Remove event listeners on unmount
3. **Circular dependencies** - WorkformService imports Jmarc at top level (may affect tests)
4. **Props passing** - Still needed for parent-child, but can reduce with service-based state

### Future Considerations
1. Consider Vue 3 provide/inject for services
2. Consider Pinia store for complex state
3. Consider service factory pattern for better testing
4. Consider TypeScript for better API contracts

---

## Related Files

- Main components: `dlx_rest/static/js/v3/components/`
- Tests: `dlx_rest/tests/v3/`
- Validation data: `dlx_rest/static/utils/validation.js`
- Jmarc API: `dlx_rest/static/js/api/jmarc.mjs`

---

**Last Updated**: 2026-03-31 (Phase 1 integration + tests + JSDoc complete)
**Next Review**: After Phase 1 integration complete
**Maintained By**: Engineering Team

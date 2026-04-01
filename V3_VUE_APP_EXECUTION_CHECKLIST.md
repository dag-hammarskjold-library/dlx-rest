# V3 Standalone Vue 3 App Execution Checklist

Goal: break out the current V3 component set into a standalone Vue 3 application with a build step that outputs to dlx_rest/static/js/v3, while preserving current behavior and enabling isolated development, testing, and package management.

## Definition of Done

- A standalone frontend workspace owns V3 source code.
- Build output is written to dlx_rest/static/js/v3.
- Flask template integration works end-to-end.
- Existing V3 behavior and tests remain stable.
- Frontend dependency management is isolated from backend Python tooling.

## PR 1 - Scaffold Frontend Workspace

### Tasks

- [x] Create a new frontend workspace directory (recommended: frontend-v3 at repo root).
- [x] Initialize package management for the frontend workspace.
- [x] Add Vue 3 and Vite.
- [x] Add scripts for dev, build, test, lint.
- [x] Configure Vite build output to dlx_rest/static/js/v3.
- [x] Configure deterministic output naming for initial Flask integration.
- [x] Add a minimal app entry and mount target smoke path.

### Acceptance Criteria

- [x] Running frontend build creates artifacts under dlx_rest/static/js/v3.
- [x] No backend code changes required for build completion.
- [x] Frontend install and build can run independently of Python setup.

## PR 2 - Move App Entry and Runtime Bootstrap

### Tasks

- [ ] Create a frontend app bootstrap that accepts server-provided values (api_prefix, records, current user context).
- [ ] Move inline app boot logic from the template into frontend source.
- [ ] Keep compatibility with current behavior for loading basket/profile before mount.
- [ ] Keep current URL records param behavior unchanged.
- [ ] Preserve migration-safe file names/paths expected by current template.

### Acceptance Criteria

- [ ] App mounts from built entrypoint with the same user-facing behavior.
- [ ] Record opening and initial load sequence are unchanged.
- [ ] No regressions in unauthenticated/authenticated state handling.

## PR 3 - Extract Component Source Ownership

### Tasks

- [ ] Move V3 components into frontend source tree.
- [ ] Move V3 API wrappers used by components into frontend source tree.
- [ ] Replace direct vendor Vue usage with package-based Vue imports.
- [ ] Add temporary compatibility re-exports only where needed.
- [ ] Keep module boundaries stable while migration is in progress.

### Acceptance Criteria

- [ ] Stage, recordstage, basket, and related components resolve from frontend-managed source.
- [ ] Build output still lands in dlx_rest/static/js/v3.
- [ ] Existing runtime interactions continue to work.

## PR 4 - Move App Styling into Frontend

### Tasks

- [ ] Move V3 inline style rules from template into frontend CSS.
- [ ] Ensure style loading is handled by frontend build output.
- [ ] Validate layout and interaction states for editor views.
- [ ] Confirm desktop and mobile rendering remain usable.

### Acceptance Criteria

- [ ] Template no longer owns V3-specific inline styles.
- [ ] Visual parity is acceptable for core editor workflows.
- [ ] No CSS regressions for basket, recordstage, and modal flows.

## PR 5 - Test Migration and Hardening

### Tasks

- [ ] Repoint V3 unit tests to frontend-owned source (or compatibility exports during transition).
- [ ] Add or migrate to Vitest for Vue-oriented unit testing.
- [ ] Preserve current Node-based behavioral tests until parity is confirmed.
- [ ] Add smoke test that verifies Flask-served built app mounts correctly.
- [ ] Document local test commands for frontend and backend.

### Acceptance Criteria

- [ ] Existing V3 behavior tests pass.
- [ ] Frontend unit tests pass in CI.
- [ ] Flask integration smoke test passes.

## PR 6 - Flask Integration Simplification

### Tasks

- [ ] Switch template integration to a single built app entrypoint.
- [ ] Remove direct multi-module imports from template once parity is proven.
- [ ] Keep rollback toggle/path available during rollout window.
- [ ] Verify cache/static serving behavior for updated assets.

### Acceptance Criteria

- [ ] Template references one stable app entrypoint for V3.
- [ ] End-to-end editor workflows pass on UAT/staging.
- [ ] Rollback path is documented and tested.

## PR 7 - Cleanup Legacy Static Source

### Tasks

- [ ] Remove obsolete hand-maintained V3 source files from static path.
- [ ] Remove bundled vendor Vue file no longer needed.
- [ ] Retain only build artifacts in dlx_rest/static/js/v3.
- [ ] Update developer docs and onboarding notes.

### Acceptance Criteria

- [ ] Single source of truth is frontend workspace.
- [ ] Static V3 directory is artifact output only.
- [ ] Repo docs reflect final architecture and commands.

## CI Checklist

- [ ] Add frontend install step.
- [ ] Add frontend build step.
- [ ] Add frontend test step.
- [ ] Keep backend test steps unchanged.
- [ ] Ensure pipeline fails on frontend build/test failures.

## Risk Register and Mitigations

- [ ] Risk: template/build path mismatch.
  Mitigation: deterministic filenames first; move to hashed manifest later.
- [ ] Risk: test coupling to built artifacts.
  Mitigation: point tests at frontend source modules.
- [ ] Risk: behavior drift in async startup and auth handling.
  Mitigation: lock baseline tests before migration and run per PR.
- [ ] Risk: CSS regressions after moving inline styles.
  Mitigation: screenshot checks for core views and interaction states.

## Rollout Strategy

- [ ] Phase A: compatibility output with existing import contracts.
- [ ] Phase B: single entrypoint integration in template.
- [ ] Phase C: remove compatibility shims and legacy static sources.

## Quick Tracking Grid

- [ ] PR 1 merged
- [ ] PR 2 merged
- [ ] PR 3 merged
- [ ] PR 4 merged
- [ ] PR 5 merged
- [ ] PR 6 merged
- [ ] PR 7 merged

# Running Tests

This project includes both Python and JavaScript tests for the v3 component set.

## Quick Start

Run all tests (JavaScript first, then Python):
```bash
./runtests.sh
```

## Test Commands

### Run All Tests
```bash
./runtests.sh all      # or just ./runtests.sh
```

### Run Only JavaScript Tests
```bash
./runtests.sh js
npm run test:js        # or directly
npm run test:js:v3     # or specific v3 component tests
```

### Run Only Python Tests
```bash
./runtests.sh py
pytest -W ignore -vv   # or directly
```

## JavaScript Tests

**Location:** `dlx_rest/tests/v3/`

**Test Framework:** Node.js built-in `node:test`

**Test Files:**
- Logic tests (pure component methods):
  - `app-stage.test.mjs`
  - `app-basket.test.mjs`
  - `basket-record.test.mjs`
  - `batch-basket-modal.test.mjs`
  - `app-recordstage.test.mjs`
  - `record-field.test.mjs`
  - `record-field-subfield.test.mjs`
  - `recordstage-record.test.mjs`

- Interaction tests (DOM events, state changes, menu behavior):
  - `app-stage-interactions.test.mjs`
  - `app-basket-interactions.test.mjs`
  - `app-recordstage-interactions.test.mjs`
  - `record-field-interactions.test.mjs`
  - `record-field-subfield-interactions.test.mjs`
  - `recordstage-record-interactions.test.mjs`

**Total Coverage:** 87 tests covering all v3 components

**Run Tests:**
```bash
npm run test:js:v3
```

## Python Tests

**Location:** `dlx_rest/tests/`

**Test Framework:** pytest

**Run Tests:**
```bash
export DLX_REST_TESTING=True
pytest -W ignore -vv
```

## CI/CD Integration

Tests run automatically on pull requests via GitHub Actions:
- **Workflow:** `.github/workflows/python-tests.yml`
- **On:** Pull request (opened, synchronize, reopened)
- **Tests:** Both Python and JavaScript test suites
- **Python Versions:** 3.10, 3.11, 3.12, 3.13, 3.14
- **Node.js Version:** 24

## Writing New Tests

### JavaScript Tests (v3 components)

1. Create a `.test.mjs` file in `dlx_rest/tests/v3/`
2. Import the component and test utilities:
   ```javascript
   import assert from 'node:assert/strict'
   import test from 'node:test'
   import { ComponentName } from '../../static/js/v3/components/component-name.mjs'
   ```
3. Write tests using the Node.js test syntax:
   ```javascript
   test('ComponentName does something', () => {
     const ctx = { /* mock context */ }
     ComponentName.methods.someMethod.call(ctx)
     assert.equal(ctx.someValue, expectedValue)
   })
   ```

### Python Tests

1. Create test files in `dlx_rest/tests/` with names matching `test_*.py`
2. Use pytest fixtures and assertions as normal
3. Ensure `DLX_REST_TESTING` environment variable is set

## Test Coverage Goals

- **JavaScript:** 87 tests across 8 v3 components, covering logic, interactions, and edge cases
- **Python:** Existing test suite for Flask app and API endpoints
- **Target:** Maintain >80% combined coverage

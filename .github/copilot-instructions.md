# Copilot instructions for `dlx-rest`

## Build, test, and run commands

Use these commands from the repository root:

```bash
# install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# run full Python test suite (same test runner used in CI)
pytest -W ignore -vv

# quick local test command used by maintainers
./runtests.sh
```

Run a single test (file / class / test function):

```bash
python -m pytest dlx_rest/tests/test_app.py::test_login -v
python -m pytest dlx_rest/tests/test_search_history.py::TestSearchHistoryModel -v
python -m pytest dlx_rest/tests/test_search_history.py::TestSearchHistoryModel::test_add_search_term_new -v
```

Run the app locally in a specific environment:

```bash
./quickstart.sh DEV    # starts flask run --reload with DLX_REST_DEV=True
./quickshell.sh DEV    # opens flask shell in the selected env
```

Docker build used in GitHub Actions:

```bash
docker build -t dlx-rest:local --build-arg APP=dev_app --build-arg DLX_REST_ENV=DEV -f Dockerfile .
docker run --rm dlx-rest:local pytest
```

There is currently no dedicated lint workflow/tooling configured in this repository.

## High-level architecture

- `dlx_rest/config.py` is the runtime switchboard. Exactly one `DLX_REST_*` environment mode is expected (`TESTING`, `LOCAL`, `DEV`, `QAT`, `UAT`, `PRODUCTION`), and it controls Mongo connection details, SSM-backed secrets, S3 bucket selection, and flags like `TESTING`.
- `dlx_rest/app.py` boots Flask + Flask-Login + CORS, connects both `dlx.DB` and `mongoengine`, and imports routes/API modules for side-effect registration. It also exposes `dev_app` and `uat_app` dispatcher variants used by deployment/runtime configuration.
- `dlx_rest/routes.py` serves the server-rendered editor/admin UI and authentication/session flows. These routes rely on model-level permission decorators and render templates in `dlx_rest/templates`.
- `dlx_rest/api/__init__.py` is the main REST surface (`/api/*`) built with Flask-RESTX. It handles MARC record CRUD/search/export, file endpoints, workforms, basket/profile endpoints, views, and search history.
- MARC and file business logic is implemented through the external `dlx` library (`Bib/Auth/BibSet/AuthSet`, `Query/AtlasQuery`, `File`, etc.), while local wrappers/formatters live in `dlx_rest/api/utils.py`.
- Data and auth model layer is in `dlx_rest/models.py` (users, roles, permissions, baskets, views, sync log). Role/permission constraints can be collection-only or granular (`collection|field|subfield|value`).
- Search performance behavior in API includes optional Valkey cache initialization plus Mongo `_search_cache` pagination caching for record list queries.

## Codebase-specific conventions

- **Set environment mode before importing app/config in tests or scripts.** Tests consistently set `os.environ['DLX_REST_TESTING'] = 'True'` at module top before importing `dlx_rest.app` or `Config`.
- **Prefer `ApiResponse` + schema-backed responses for API endpoints.** API handlers typically return `{_links, _meta, data}` and use schema names from `Schemas.get(...)` in `dlx_rest/api/utils.py`.
- **Use existing permission primitives, not ad-hoc checks.** UI routes use `@requires_permission(...)`; API endpoints use `has_permission(...)` against role constraints.
- **When adding permissioned capabilities, keep `init-roles` and test fixtures aligned.** Role/permission seeds are duplicated in `dlx_rest/commands.py` and `dlx_rest/tests/conftest.py`; update both when introducing new permissions/roles.
- **Collection routing and dispatch should stay centralized.** For MARC endpoints, use `ClassDispatch.by_collection(...)` / `batch_by_collection(...)` rather than ad-hoc class branching.

# dlx-rest

`dlx-rest` is a Flask application and REST API for DLX MARC records. It serves the web UI, JSON API, and a small set of maintenance commands used to manage users, roles, permissions, and record data.

## What this repository contains

- A Flask application bootstrap in `dlx_rest/app.py`
- Web routes and page rendering in `dlx_rest/routes.py`
- A Flask-RESTX API under `dlx_rest/api/`
- Database models, forms, utilities, and CLI commands in `dlx_rest/`
- Front-end assets, templates, and test fixtures used by the app

## Requirements

- Python 3.11
- MongoDB or a compatible MongoDB service for non-test environments
- A Valkey server for cache-backed API behavior, when available
- AWS credentials or access to the expected SSM parameters in dev, UAT, or production

Install the Python dependencies with:

```bash
pip install -r requirements.txt
```

The included `Dockerfile` installs the same Python dependencies and runs the app with Gunicorn.

## Configuration

Runtime behavior is selected with environment variables in `dlx_rest/config.py`.

- `DLX_REST_TESTING` enables test mode with `mongomock://localhost`
- `DLX_REST_LOCAL` enables local development against a local MongoDB instance
- `DLX_REST_DEV` enables the shared development environment and loads secrets from AWS SSM
- `DLX_REST_QAT` enables QAT configuration
- `DLX_REST_UAT` enables UAT configuration
- `DLX_REST_PRODUCTION` enables production configuration

The app also uses `JWT_SECRET_KEY` when present. In dev, UAT, and production, several connection and secret values are read from AWS SSM parameters.

## Run Locally

For local development, set the environment first and then start Flask:

```bash
export DLX_REST_LOCAL=True
export FLASK_APP=dlx_rest.app
flask run
```

If you want to use the shared dev environment instead, set `DLX_REST_DEV=True` before starting Flask. The app bootstrap in `dlx_rest/app.py` also defines alternate WSGI entry points for the deployment prefixes used by the hosted environments.

### Docker

The container image is built from Python 3.11 slim and starts Gunicorn with the app object selected by the `APP` argument.

## CLI Commands

The application registers a set of Flask CLI commands in `dlx_rest/commands.py`.

- `flask create-user EMAIL USERNAME` creates a new user and prints a generated password
- `flask make-admin EMAIL` grants the admin role to an existing user
- `flask init-usernames` initializes usernames from email prefixes
- `flask init-roles` rebuilds roles and permissions
- `flask create-permission ACTION` creates a permission, with optional constraint flags
- `flask align-baskets` syncs basket item state back into record data
- `flask import-thesaurus URI` imports or updates an authority record from a thesaurus URI

## Testing

Tests are located under `dlx_rest/tests/`. The test fixtures set `DLX_REST_TESTING=True` and expect the config to resolve to `mongomock://localhost`.

Run the test suite with pytest from the repository root:

```bash
pytest
```

## Repository Layout

- `dlx_rest/app.py` - Flask app setup, middleware, and WSGI variants
- `dlx_rest/routes.py` - Web routes and page rendering
- `dlx_rest/api/` - REST API resources and helpers
- `dlx_rest/models.py` - Database models and permissions helpers
- `dlx_rest/forms.py` - WTForms definitions
- `dlx_rest/static/` - CSS, JavaScript, images, and client-side assets
- `dlx_rest/templates/` - Jinja templates for pages and admin views
- `dlx_rest/tests/` - Test fixtures and automated tests

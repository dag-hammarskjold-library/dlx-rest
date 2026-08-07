# DLX REST

A RESTful API and web interface for the DLX (Digital Library eXtension) system, built with Flask and MongoDB.

## Overview

This repository contains the DLX REST API and web application that provides:
- RESTful API endpoints for managing MARC records (bibliographic and authority)
- Web interface for record management, searching, and administration
- User authentication and role-based permissions
- File management and import capabilities
- Administrative tools for user and role management

## Features

- **REST API**: Full CRUD operations for MARC records with JSON/XML/MRK/CSV/TSV output formats
- **Web Interface**: Responsive UI for browsing, searching, and managing records
- **Authentication**: User login system with role-based access control
- **File Management**: Upload and manage files associated with records
- **Import Tools**: MARC record import functionality
- **Administration**: User and role management interfaces
- **Dashboard**: Reporting and analytics views

## Installation

### Prerequisites

- Python 3.11+
- MongoDB instance
- Git

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd dlx-rest
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
# Set one of the following environment variables to specify the runtime environment:
export DLX_REST_DEV=true          # Development environment
export DLX_REST_UAT=true          # UAT environment
export DLX_REST_PRODUCTION=true   # Production environment
export DLX_REST_TESTING=true      # Testing environment
export DLX_REST_LOCAL=true        # Local development
```

4. Initialize the database (if needed):
```bash
# The application will connect to MongoDB using the connection string
# specified in the config based on the environment variable
```

### Docker Deployment

The application can be deployed using Docker:

```bash
docker build -t dlx-rest .
docker run -p 5000:5000 \
  -e DLX_REST_DEV=true \
  -e METADATA_CACHE_KEY=<your-key> \
  -e DEV_ISSU_ADMIN_CONNECT_STRING=<your-connection-string> \
  -e SENTRY_DSN_DEV=<your-sentry-dns> \
  -e SENTRY_ME_JS_DEV=<your-sentry-js-url> \
  dlx-rest
```

## API Endpoints

### Authentication
- `GET /token` - Obtain authentication token

### Records
- `GET /api/marc/{collection}/records` - List records (bibs/auths)
- `GET /api/marc/{collection}/records/{record_id}` - Get specific record
- `POST /api/marc/{collection}/records` - Create new record
- `PUT /api/marc/{collection}/records/{record_id}` - Update record
- `DELETE /api/marc/{collection}/records/{record_id}` - Delete record
- `GET /api/marc/{collection}/records/count` - Get record count
- `GET /api/marc/{collection}/records/browse` - Browse records by field

### Files
- `GET /api/marc/{collection}/records/{record_id}/files` - Get files for record

### Utilities
- `GET /api/schemas` - List available schemas
- `GET /api/schemas/{schema_name}` - Get specific schema
- `GET /api/marc/{collection}` - Get collection info
- `GET /api/marc/{collection}/logical_fields` - Get logical fields

## Web Interface Routes

- `/` - Home page (redirects to bibs search)
- `/editor` - Record editor interface
- `/help` - Help documentation
- `/workform` - Workform management
- `/login` / `/logout` - Authentication
- `/admin` - Administration dashboard
- `/files` - File management
- `/import` - MARC import
- `/reports/dashboard02` / `/reports/dashboard03` - Reporting dashboards

## Configuration

Configuration is managed through `dlx_rest/config.py` and supports multiple environments:
- Development (`DLX_REST_DEV`)
- UAT (`DLX_REST_UAT`)
- Production (`DLX_REST_PRODUCTION`)
- Testing (`DLX_REST_TESTING`)
- Local (`DLX_REST_LOCAL`)

Each environment can specify different database connections, S3 buckets, and other settings.

## Dependencies

Key dependencies include:
- Flask 3.1.3
- MongoEngine 0.29.3
- Flask-Login 0.6.3
- Flask-CORS 6.0.5
- DLX library (from GitHub)
- Flask-RESTX 1.3.2
- And others listed in requirements.txt

## Testing

Run tests with pytest:
```bash
pytest
```
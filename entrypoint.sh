#!/bin/sh
set -e

# Default to dev_app if APP is not set
APP_MODULE="${APP:-dev_app}"

exec gunicorn -b 0.0.0.0:5000 dlx_rest.app:$APP_MODULE --workers 4 --timeout 120
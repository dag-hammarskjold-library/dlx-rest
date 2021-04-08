
echo "Starting $1 environment"

source venv/bin/activate
export FLASK_APP="dlx_rest.app"
export DLX_REST_$1="True"
flask run --reload
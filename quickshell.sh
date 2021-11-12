# Use this to quickstart the Flask shell. Note that the environment must
# be in all caps, e.g., DEV, QAT, UAT, PROD
echo "Starting shell for the $1 environment"

PWD=`pwd`

. $PWD/venv/bin/activate
export FLASK_APP="dlx_rest.app"
export DLX_REST_$1="True"
flask shell
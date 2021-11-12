# Use this to quickstart the Flask shell. Note that the environment must
# be in all caps, e.g., DEV, QAT, UAT, PROD

ENV=$1

if [ -z $1 ]
then
	ENV="DEV"
fi

echo "Starting shell for the $ENV environment"

PWD=`pwd`

. $PWD/venv/bin/activate
unset DLX_REST_
unset DLX_REST_DEV
unset DLX_REST_QAT
unset DLX_REST_UAT
unset DLX_REST_PROD
export FLASK_APP="dlx_rest.app"
export DLX_REST_$ENV="True"
flask shell
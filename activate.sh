# Use this script to activate  one of the four deployment environments we have
# configured: DEV, QAT, UAT, and PROD

ENV=$1

if [ -z $1 ]
then
	ENV="DEV"
fi

echo "Activating $ENV environment"

PWD=`pwd`

. $PWD/venv/bin/activate
unset DLX_REST_
unset DLX_REST_DEV
unset DLX_REST_QAT
unset DLX_REST_UAT
unset DLX_REST_PRODUCTION
export FLASK_APP="dlx_rest.app"
export DLX_REST_$ENV="True"
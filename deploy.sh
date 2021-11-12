# Use this script to deploy to one of the four deployment environments we have
# configured: dev, qat, uat, and prod
ENV=$1

if [ -z $1 ]
then
	ENV="dev"
fi
echo "Deploying to $ENV environment"

PWD=`pwd`

git pull
. $PWD/venv/bin/activate
pip install --upgrade git+https://github.com/dag-hammarskjold-library/dlx#egg=dlx
zappa update $ENV
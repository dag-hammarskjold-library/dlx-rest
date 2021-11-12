# Use this script to deploy to one of the four deployment environments we have
# configured: dev, qat, uat, and prod
echo "Deploying to $1 environment"

PWD=`pwd`

git pull
. $PWD/venv/bin/activate
pip install --upgrade git+https://github.com/dag-hammarskjold-library/dlx#egg=dlx
zappa update $1
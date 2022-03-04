# Use this script to deploy to one of the four deployment environments we have
# configured: dev, qat, uat, and prod.
#
# This script presumes there is a venv named "venv" in the root of the project 
# directory. If it does not already exist, create it with `python -m venv venv` 
# [rename  venv?]
#
# AWS credentials must be configured in this environment and the Python library
# `zappa` must be installed to succesfully deploy the app. If it is not installed
# run `pip install zappa`. [add zappa to requirements.txt?]
#
# If the deploy fails, run `zappa tail <environment>` to find the exception. 
# Sometimes certain Python versions have differing core libraries. We may
# need to install or uninstall certain core libraries depending on the host 
# environment.

ENV=$1
VENV=$2
PWD=`pwd`

if [ -z $1 ]
then
	ENV="dev"
fi

if [ -z $2 ]
then
	VENV="venv"
fi

# update the project code
git pull origin master

if [ ! $? -eq 0 ]
then
    # git pull returned an error exit code
    echo "Git pull failed"
    exit 1
fi

# activate the venv
. $PWD/$VENV/bin/activate

if [ -z $VIRTUAL_ENV ]
then
    # the venv was not found or something went wrong
    echo "Virtual environment not activated"
    exit 1
fi

# install requirements and test
pip uninstall -r $PWD/requirements.txt -y
pip install -r $PWD/requirements.txt
pytest

if [ $? -eq 0 ]
then
    # the tests passed
    echo "Deploying to $ENV environment"
    zappa update $ENV
fi


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
if [ $ENV -eq "dev"]
then
    git pull origin master
else
    git checkout $ENV
    git pull
fi




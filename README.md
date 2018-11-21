git clone https://github.com/dag-hammarskjold-library/datamanager

cd datamanager

virtualenv venv

$ source venv/bin/activate

or

> .\venv\Scripts\activate.ps1 

(use .bat if not using PowerShell)

pip install -r requirements.txt

export FLASK_APP="datamanager.app"

or

$env:FLASK_APP="datamanager.app"

Copy datamanager/config.default.py to datamanager/config.py

Edit datamanager/config.py to match your database settings.

If you want to deploy to Zappa:

Copy zappa_settings.default.json to zappa_settings.json

Edit zappa_settings.json to match your Zappa configuration

zappa deploy dev

Otherwise just run it:

flask run
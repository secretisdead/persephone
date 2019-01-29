@echo off

setlocal

call ./environment/Scripts/activate.bat
set FLASK_DEBUG=ON
set FLASK_APP=./persephone_wsgi.py
flask run --host 0.0.0.0 --port 5000

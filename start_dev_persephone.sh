#!/bin/bash

persephone=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "${persephone}"

source ./environment/bin/activate
export FLASK_DEBUG=ON
export FLASK_APP=./persephone_wsgi.py
python3 -m flask run --host 0.0.0.0 --port 5000

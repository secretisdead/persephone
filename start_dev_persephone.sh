#!/bin/bash

persephone=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "${persephone}"

python=python3
${python} --version || (
	python=python
)

source ./environment/bin/activate
export FLASK_DEBUG=ON
export FLASK_APP=./persephone_wsgi.py
export PERSEPHONE_DIR=${persephone}
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
${python} -m flask run --host 0.0.0.0 --port 5000

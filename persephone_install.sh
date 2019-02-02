#!/bin/bash

echo checking for git
which git && (
	echo  success
) || (
	echo  failure
	echo   git not found
	echo   git is required to clone necessary persephone component repos
	echo   please ensure you have git installed
	exit 1
)

python=python3
${python} --version || (
	python=python
)

echo checking for python
which ${python} && (
	echo  success
) || (
	echo  failure
	echo   python not found
	echo   please ensure you have python 3.6+ installed
	exit 1
)

echo  checking python version
py_version="$(cut -d' ' -f2 <<< `${python} --version`)"
py_version_major="$(cut -d'.' -f1 <<< $py_version)"
if (( $py_version_major > 3 ));
then
	echo   success
else
	if (( $py_version_major == 3 ));
	then
		py_version_minor="$(cut -d'.' -f2 <<< $py_version)"
		if (( $py_version_minor > 4 ));
		then
			echo success
		else
			echo   failure
			echo    python version $py_version
			echo    please ensure you have python 3.5+ installed
			exit 1
		fi
	else
		echo   failure
		echo    python version $py_version
		echo    please ensure you have python 3.5+ installed
		exit 1
	fi
fi

echo checking for pip
${python} -m pip --version && (
	echo  success
) || (
	echo  failure
	echo   pip not found
	echo   please ensure you have pip for python installed
	exit 1
)

read -p "enter the directory to install persephone to: " persephone

read -p "install persephone to \"${persephone}\" (y/[n])? " confirm
if [ "$confirm" != "y" ]
then
	exit 1
fi

if [ -d "${persephone}" ]
then
	echo  directory exists
else (
	mkdir -p "${persephone}" || (
		echo  problem creating specified directory
		exit 1
	)
) fi

cd "${persephone}"

echo checking for venv and creating virtual environment
${python} -m venv environment && (
	echo  success
) || (
	echo  failure
	echo   venv not found
	echo   please ensure you have venv for python installed
	exit 1
)

echo activating virtual environment
source "${persephone}/environment/bin/activate"

# latest versions should be fine, if there end up being problems later i'll make it more specific
echo installing required python packages
echo  flask...
${python} -m pip install flask && (
	echo   success
) || (
	echo   failure
	echo    problem installing flask
	exit 1
)
echo  sqlalchemy...
${python} -m pip install sqlalchemy && (
	echo   success
) || (
	echo   failure
	echo    problem installing sqlalchemy
	exit 1
)
echo  python-dateutil...
${python} -m pip install python-dateutil && (
	echo   success
) || (
	echo   failure
	echo    problem installing python-dateutil
	exit 1
)
echo  werkzeug...
${python} -m pip install werkzeug && (
	echo   success
) || (
	echo   failure
	echo    problem installing werkzeug
	exit 1
)
echo  Pillow...
${python} -m pip install Pillow && (
	echo   success
) || (
	echo   failure
	echo    problem installing Pillow
	exit 1
)
echo  python3-openid...
${python} -m pip install python3-openid && (
	echo   success
) || (
	echo   failure
	echo    problem installing python3-openid
	exit 1
)
echo  passlib...
${python} -m pip install passlib && (
	echo   success
) || (
	echo   failure
	echo    problem installing passlib
	exit 1
)
echo  python-magic...
${python} -m pip install python-magic && (
	echo   success
) || (
	echo   failure
	echo    problem installing python-magic
	exit 1
)
if [ "$(uname)" == "Darwin" ]
then
	echo  python-libmagic...
	${python} -m pip install python-libmagic && (
		echo   success
	) || (
		echo   failure
		echo    problem installing python-libmagic
		exit 1
	)
fi

echo deactivating virtual environment
deactivate

echo creating directories
mkdir -p "${persephone}/config"
mkdir -p "${persephone}/db"
mkdir -p "${persephone}/files"
mkdir -p "${persephone}/files/accounts"
mkdir -p "${persephone}/files/media"
mkdir -p "${persephone}/files/media/originals"
mkdir -p "${persephone}/files/media/originals/nonprotected"
mkdir -p "${persephone}/files/media/originals/protected"
mkdir -p "${persephone}/files/media/summaries"
mkdir -p "${persephone}/files/media/summaries/nonprotected"
mkdir -p "${persephone}/files/media/tags"
mkdir -p "${persephone}/files/media/summaries/protected"
mkdir -p "${persephone}/files/stickers"
mkdir -p "${persephone}/files/stickers/images"
mkdir -p "${persephone}/files/stickers/placements"
mkdir -p "${persephone}/repos"
mkdir -p "${persephone}/repos/accesslog"
mkdir -p "${persephone}/repos/accounts"
mkdir -p "${persephone}/repos/bans"
mkdir -p "${persephone}/repos/bansfrontend"
mkdir -p "${persephone}/repos/comments"
mkdir -p "${persephone}/repos/commentsfrontend"
mkdir -p "${persephone}/repos/legal"
mkdir -p "${persephone}/repos/media"
mkdir -p "${persephone}/repos/mediafrontend"
mkdir -p "${persephone}/repos/patreon"
mkdir -p "${persephone}/repos/patreonfrontend"
mkdir -p "${persephone}/repos/persephone"
mkdir -p "${persephone}/repos/stickers"
mkdir -p "${persephone}/repos/stickersfrontend"
mkdir -p "${persephone}/repos/thirdpartyauth"
mkdir -p "${persephone}/repos/users"
mkdir -p "${persephone}/repos/base64_url"
mkdir -p "${persephone}/repos/idcollection"
mkdir -p "${persephone}/repos/pagination_from_request"
mkdir -p "${persephone}/repos/parse_id"
mkdir -p "${persephone}/repos/shortener"
mkdir -p "${persephone}/repos/statement_helper"
mkdir -p "${persephone}/static"
mkdir -p "${persephone}/static/links"
mkdir -p "${persephone}/static/scripts"
mkdir -p "${persephone}/temp"
mkdir -p "${persephone}/temp/accounts"
mkdir -p "${persephone}/temp/media"
mkdir -p "${persephone}/temp/stickers"
mkdir -p "${persephone}/templates"

echo cloning persephone projects to repos directory and symlinking their components to the working directory
cd "${persephone}/repos"
echo  accesslog...
git clone https://github.com/secretisdead/accesslog.git
ln -s "${persephone}/repos/accesslog/accesslog" "${persephone}/accesslog"
echo  accounts...
git clone https://github.com/secretisdead/accounts.git
ln -s "${persephone}/repos/accounts/accounts" "${persephone}/accounts"
echo  bans...
ln -s "${persephone}/repos/bans/bans" "${persephone}/bans"
git clone https://github.com/secretisdead/bans.git
echo  bansfrontend...
ln -s "${persephone}/repos/bansfrontend/bansfrontend" "${persephone}/bansfrontend"
git clone https://github.com/secretisdead/bansfrontend.git
echo  comments...
ln -s "${persephone}/repos/comments/comments" "${persephone}/comments"
git clone https://github.com/secretisdead/comments.git
echo  commentsfrontend...
ln -s "${persephone}/repos/commentsfrontend/commentsfrontend" "${persephone}/commentsfrontend"
git clone https://github.com/secretisdead/commentsfrontend.git
echo  legal...
git clone https://github.com/secretisdead/legal.git
ln -s "${persephone}/repos/legal/legal" "${persephone}/legal"
echo  media...
git clone https://github.com/secretisdead/media.git
ln -s "${persephone}/repos/media/media" "${persephone}/media"
echo  mediafrontend...
git clone https://github.com/secretisdead/mediafrontend.git
ln -s "${persephone}/repos/mediafrontend/mediafrontend" "${persephone}/mediafrontend"
echo  patreon...
git clone https://github.com/secretisdead/patreon.git
ln -s "${persephone}/repos/patreon/patreon" "${persephone}/patreon"
echo  patreonfrontend...
git clone https://github.com/secretisdead/patreonfrontend.git
ln -s "${persephone}/repos/patreonfrontend/patreonfrontend" "${persephone}/patreonfrontend"
echo  persephone...
git clone https://github.com/secretisdead/persephone.git
ln -s "${persephone}/repos/persephone/persephone" "${persephone}/persephone"
ln -s "${persephone}/repos/persephone/persephone_wsgi.py" "${persephone}/persephone_wsgi.py"
ln -s "${persephone}/repos/persephone/start_dev_persephone.sh" "${persephone}/start_dev_persephone.sh"
ln -s "${persephone}/repos/persephone/templates/*" "${persephone}/templates/"
echo  stickers...
git clone https://github.com/secretisdead/stickers.git
ln -s "${persephone}/repos/stickers/stickers" "${persephone}/stickers"
echo  stickersfrontend...
git clone https://github.com/secretisdead/stickersfrontend.git
ln -s "${persephone}/repos/stickersfrontend/stickersfrontend" "${persephone}/stickersfrontend"
echo  thirdpartyauth...
git clone https://github.com/secretisdead/thirdpartyauth.git
ln -s "${persephone}/repos/thirdpartyauth/thirdpartyauth" "${persephone}/thirdpartyauth"
echo  users...
git clone https://github.com/secretisdead/users.git
ln -s "${persephone}/repos/users/users" "${persephone}/users"
echo  base64_url...
git clone https://github.com/secretisdead/base64_url.git
ln -s "${persephone}/repos/base64_url/base64_url.py" "${persephone}/base64_url.py"
echo  idcollection...
git clone https://github.com/secretisdead/idcollection.git
ln -s "${persephone}/repos/idcollection/idcollection.py" "${persephone}/idcollection.py"
echo  pagination_from_request...
git clone https://github.com/secretisdead/pagination_from_request.git
ln -s "${persephone}/repos/pagination_from_request/pagination_from_request.py" "${persephone}/pagination_from_request.py"
echo  parse_id...
git clone https://github.com/secretisdead/parse_id.git
ln -s "${persephone}/repos/parse_id/parse_id.py" "${persephone}/parse_id.py"
echo  shortener...
git clone https://github.com/secretisdead/shortener.git
ln -s "${persephone}/repos/shortener/shortener.py" "${persephone}/shortener.py"
echo  statement_helper...
git clone https://github.com/secretisdead/statement_helper.git
ln -s "${persephone}/repos/statement_helper/statement_helper.py" "${persephone}/statement_helper.py"

echo copying example configuration files
cp "${persephone}/repos/accesslog/access_log_config-example.json" "${persephone}/config/access_log_config.json"
cp "${persephone}/repos/accounts/users_config-example.json" "${persephone}/config/users_config.json"
cp "${persephone}/repos/bansfrontend/bans_config-example.json" "${persephone}/config/bans_config.json"
cp "${persephone}/repos/commentsfrontend/comments_config-example.json" "${persephone}/config/comments_config.json"
cp "${persephone}/repos/accounts/credentials-example.json" "${persephone}/config/credentials.json"
cp "${persephone}/repos/legal/legal_config-example.json" "${persephone}/config/legal_config.json"
cp "${persephone}/repos/mediafrontend/media_config-example.json" "${persephone}/config/media_config.json"
cp "${persephone}/repos/patreonfrontend/patreon_config-example.json" "${persephone}/config/patreon_config.json"
cp "${persephone}/repos/persephone/persephone_config-example.json" "${persephone}/config/persephone_config.json"
cp "${persephone}/repos/stickersfrontend/stickers_config-example.json" "${persephone}/config/stickers_config.json"

echo creating other supplemental files
echo  config/shortener_config.json...
echo {}> "${persephone}/config/shortener_config.json"
echo  static/links/custom.css...
touch "${persephone}/static/links/custom.css"

echo ...
echo installation finished
echo edit configuration files to customize your installation
echo "later this install script will automatically add default file paths to config files, but for now be sure to point them at the correct directories in ${persephone}/files"
echo "make a copy of any templates you wish to customize to the main project templates folder (${persephone}/templates) and edit them"
echo "usually ${persephone}/persephone/views/templates/about.html, ${persephone}/legal/views/templates/legal_terms.html, and ${persephone}/legal/views/templates/legal_rules.html"
echo "custom style rules can go in ${persephone}/static/links/custom.css"
echo "you can run the debug server in development mode by running ${persephone}/start_dev_persephone.sh"
echo "point your production webserver at ${persephone}/persephone_wsgi.py to go live"

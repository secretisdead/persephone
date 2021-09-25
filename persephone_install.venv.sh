#!/bin/bash

echo checking for git...
if ! test -x "$(command -v git)"
then
	echo  git not found
	echo  git is required to clone necessary persephone component repos
	echo  please ensure you have git installed
	exit 1
fi

echo checking for python3 alias...
python=python3
if ! test -x "$(command -v ${python})"
then
	echo  python3 alias not found
	echo  using python
	python=python
fi

echo checking for python...
if ! test -x "$(command -v ${python})"
then
	echo  python not found
	echo  please ensure you have python 3.5+ installed
	exit 1
fi

echo  checking python version...
py_version="$(cut -d' ' -f2 <<< `${python} --version`)"
py_version_major="$(cut -d'.' -f1 <<< $py_version)"
if (( $py_version_major < 3 ))
then
	echo   python version $py_version
	echo   please ensure you have python 3.5+ installed
	exit 1
else
	if (( $py_version_major == 3 ))
	then
		py_version_minor="$(cut -d'.' -f2 <<< $py_version)"
		if (( $py_version_minor < 5 ))
		then
			echo   python version $py_version
			echo   please ensure you have python 3.5+ installed
			exit 1
		fi
	fi
fi

echo checking for pip...
${python} -c "import pip"
if ! test $?
then
	echo  pip not found
	echo  please ensure you have pip for python3 installed
	exit 1
fi

read -p "enter the directory to install persephone to (absolute path, with no trailing slash e.g. /home/secret/persephone): " persephone

read -p "install persephone to \"${persephone}\" (y/[n])? " confirm
if test "$confirm" != "y"
then
	exit 1
fi

if ! test -d "${persephone}"
then
	if ! test mkdir -p "${persephone}"
	then
		echo  problem creating specified directory
		exit 1
	fi
fi

cd "${persephone}"

echo checking for venv...
${python} -c "import venv"
if ! test $?
then
	echo  venv not found
	echo  please ensure you have venv for python3 installed
	exit 1
fi

echo creating virtual environment...
if ! ${python} -m venv environment
then
	echo  problem creating virtual environment
	exit 1
fi

echo activating virtual environment...
source "${persephone}/environment/bin/activate"

echo installing required python packages...
${python} -m pip install flask==1.1.4
${python} -m pip install sqlalchemy==1.3.5
${python} -m pip install python-dateutil==2.8.1
${python} -m pip install werkzeug==1.0.1
${python} -m pip install Pillow==7.2.0
${python} -m pip install python3-openid==3.2.0
${python} -m pip install passlib==1.7.4
${python} -m pip install python-magic==0.4.24
if test "$(uname)" == "Darwin"
then
	${python} -m pip install python-libmagic
fi

echo deactivating virtual environment...
deactivate

echo creating directories...
mkdir -p "${persephone}/config"
mkdir -p "${persephone}/db"
mkdir -p "${persephone}/files"
mkdir -p "${persephone}/files/accounts"
mkdir -p "${persephone}/files/accounts/avatars"
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

echo cloning persephone projects to repos directory...
cd "${persephone}/repos"
git clone https://github.com/secretisdead/accesslog.git
git clone https://github.com/secretisdead/accounts.git
git clone https://github.com/secretisdead/bans.git
git clone https://github.com/secretisdead/bansfrontend.git
git clone https://github.com/secretisdead/comments.git
git clone https://github.com/secretisdead/commentsfrontend.git
git clone https://github.com/secretisdead/legal.git
git clone https://github.com/secretisdead/media.git
git clone https://github.com/secretisdead/mediafrontend.git
git clone https://github.com/secretisdead/patreon.git
git clone https://github.com/secretisdead/patreonfrontend.git
git clone https://github.com/secretisdead/persephone.git
git clone https://github.com/secretisdead/stickers.git
git clone https://github.com/secretisdead/stickersfrontend.git
git clone https://github.com/secretisdead/thirdpartyauth.git
git clone https://github.com/secretisdead/users.git
git clone https://github.com/secretisdead/base64_url.git
git clone https://github.com/secretisdead/idcollection.git
git clone https://github.com/secretisdead/pagination_from_request.git
git clone https://github.com/secretisdead/parse_id.git
git clone https://github.com/secretisdead/shortener.git
git clone https://github.com/secretisdead/statement_helper.git
cd "${persephone}"

echo symlinking persephone project components to the working directory...
ln -s "${persephone}/repos/accesslog/accesslog" "${persephone}/accesslog"
ln -s "${persephone}/repos/accounts/accounts" "${persephone}/accounts"
ln -s "${persephone}/repos/bans/bans" "${persephone}/bans"
ln -s "${persephone}/repos/bansfrontend/bansfrontend" "${persephone}/bansfrontend"
ln -s "${persephone}/repos/comments/comments" "${persephone}/comments"
ln -s "${persephone}/repos/commentsfrontend/commentsfrontend" "${persephone}/commentsfrontend"
ln -s "${persephone}/repos/legal/legal" "${persephone}/legal"
ln -s "${persephone}/repos/media/media" "${persephone}/media"
ln -s "${persephone}/repos/mediafrontend/mediafrontend" "${persephone}/mediafrontend"
ln -s "${persephone}/repos/patreon/patreon" "${persephone}/patreon"
ln -s "${persephone}/repos/patreonfrontend/patreonfrontend" "${persephone}/patreonfrontend"
ln -s "${persephone}/repos/persephone/persephone" "${persephone}/persephone"
ln -s "${persephone}/repos/persephone/persephone_wsgi.py" "${persephone}/persephone_wsgi.py"
ln -s "${persephone}/repos/persephone/start_dev_persephone.sh" "${persephone}/start_dev_persephone.sh"
ln -s "${persephone}/repos/persephone/persephone_update.sh" "${persephone}/persephone_update.sh"
shopt -s nullglob
cd "${persephone}/repos/persephone/templates"
for filepath in ./*
do
	filename=$(basename "${filepath}")
	ln -s "${persephone}/repos/persephone/templates/${filename}" "${persephone}/templates/${filename}"
done
cd "${persephone}"
shopt -u nullglob
ln -s "${persephone}/repos/stickers/stickers" "${persephone}/stickers"
ln -s "${persephone}/repos/stickersfrontend/stickersfrontend" "${persephone}/stickersfrontend"
ln -s "${persephone}/repos/thirdpartyauth/thirdpartyauth" "${persephone}/thirdpartyauth"
ln -s "${persephone}/repos/users/users" "${persephone}/users"
ln -s "${persephone}/repos/base64_url/base64_url.py" "${persephone}/base64_url.py"
ln -s "${persephone}/repos/idcollection/idcollection.py" "${persephone}/idcollection.py"
ln -s "${persephone}/repos/pagination_from_request/pagination_from_request.py" "${persephone}/pagination_from_request.py"
ln -s "${persephone}/repos/parse_id/parse_id.py" "${persephone}/parse_id.py"
ln -s "${persephone}/repos/shortener/shortener.py" "${persephone}/shortener.py"
ln -s "${persephone}/repos/statement_helper/statement_helper.py" "${persephone}/statement_helper.py"

echo copying favicons...
cp "${persephone}/repos/persephone/persephone/views/static/persephone_tear_128.png" "${persephone}/static/favicon.png"
cp "${persephone}/repos/persephone/persephone/views/static/favicon.ico" "${persephone}/static/favicon.ico"

echo copying example configuration files...
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

echo creating other supplemental files...
echo  config/shortener_config.json
echo {}> "${persephone}/config/shortener_config.json"
echo  temporary tegaki config until tegaki is finished
echo {\"temp_path\": \"\",\"tegaki_path\": \"\",\"tegaki_file_uri\": \"\"}> "${persephone}/config/tegaki_config.json"
echo  static/links/custom.css
touch "${persephone}/static/links/custom.css"

echo setting configuration files default paths...
${python} "${persephone}/repos/persephone/set_config_default_paths.py" "${persephone}"

echo ...
echo installation finished
echo edit configuration files to customize your installation
echo "make a copy of any templates you wish to customize to the main project templates folder (${persephone}/templates) and edit them"
echo "usually ${persephone}/persephone/views/templates/about.html, ${persephone}/legal/views/templates/legal_terms.html, and ${persephone}/legal/views/templates/legal_rules.html"
echo "custom style rules can go in ${persephone}/static/links/custom.css"
echo "you can run the debug server in development mode by running ${persephone}/start_dev_persephone.sh"
echo "point your production webserver at ${persephone}/persephone_wsgi.py to go live"

@echo off

setlocal

echo checking administrator permissions...
net session >nul 2>&1
if %errorLevel% == 0 (
	rem
) else (
	echo  administrator permissions are required to be able to create symlinks
	echo  please run the installer as administrator
	goto end
)

echo checking for git...
git --version || (
	echo  git not found
	echo  git is required to clone necessary persephone component repos
	echo  please ensure you have git installed
	goto end
)

echo checking for python3 alias...
set python=python3
%python% --version || (
	echo  python3 alias not found
	echo  using python
	set python=python
)

echo checking for python...
%python% --version && (
	echo  checking python version
	for /f "usebackq tokens=2 delims= " %%i in ('%python% --version') do (
		if /i "%%i" leq "3.4.9" (
			echo   python version %%i
			echo   please ensure you have python3 3.5+ installed
			goto end
		)
	)
) || (
	echo  required python not found
	echo  please ensure you have python 3.5+ installed
	goto end
)

echo checking for pip...
%python% -m pip --version || (
	echo  pip not found
	echo  please ensure you have pip for python3 installed
	goto end
)

set /p persephone=enter the directory to install persephone to: 
if exist "%persephone%" (
	rem
) else (
	rem set /p createdir=specified directory does not exist, do you want to create it (y/[n])? 
	rem if /i "%createdir%" neq "y" goto end
	mkdir "%persephone%" || (
		echo  problem creating specified directory
		goto end
	)
)

set /p confirm="install persephone to %persephone% (y/[n])? "
if /i "%confirm%" neq "y" goto end

cd "%persephone%"

echo checking for venv and creating virtual environment...
%python% -m venv environment
if not exist "%persephone%\environment" (
	echo  venv not found or problem creating virtual environment
	echo  please ensure you have venv for python3 installed
	goto end
)

echo activating virtual environment...
call "%persephone%\environment\Scripts\activate.bat"

rem latest versions should be fine, if there end up being problems later i'll make it more specific
echo installing required python packages...
%python% -m pip install flask
%python% -m pip install sqlalchemy
%python% -m pip install python-dateutil
%python% -m pip install werkzeug
%python% -m pip install Pillow
%python% -m pip install python3-openid
%python% -m pip install passlib
%python% -m pip install python-magic
%python% -m pip install python-libmagic
%python% -m pip install python-magic-bin==0.4.14

echo deactivating virtual environment...
call "%persephone%\environment\Scripts\deactivate.bat"

echo creating directories...
mkdir "%persephone%\config"
mkdir "%persephone%\db"
mkdir "%persephone%\files"
mkdir "%persephone%\files\accounts"
mkdir "%persephone%\files\accounts\avatars"
mkdir "%persephone%\files\media"
mkdir "%persephone%\files\media\originals"
mkdir "%persephone%\files\media\originals\nonprotected"
mkdir "%persephone%\files\media\originals\protected"
mkdir "%persephone%\files\media\summaries"
mkdir "%persephone%\files\media\summaries\nonprotected"
mkdir "%persephone%\files\media\summaries\protected"
mkdir "%persephone%\files\media\tags"
mkdir "%persephone%\files\stickers"
mkdir "%persephone%\files\stickers\images"
mkdir "%persephone%\files\stickers\placements"
mkdir "%persephone%\repos"
mkdir "%persephone%\repos\accesslog"
mkdir "%persephone%\repos\accounts"
mkdir "%persephone%\repos\bans"
mkdir "%persephone%\repos\bansfrontend"
mkdir "%persephone%\repos\comments"
mkdir "%persephone%\repos\commentsfrontend"
mkdir "%persephone%\repos\legal"
mkdir "%persephone%\repos\media"
mkdir "%persephone%\repos\mediafrontend"
mkdir "%persephone%\repos\patreon"
mkdir "%persephone%\repos\patreonfrontend"
mkdir "%persephone%\repos\persephone"
mkdir "%persephone%\repos\stickers"
mkdir "%persephone%\repos\stickersfrontend"
mkdir "%persephone%\repos\thirdpartyauth"
mkdir "%persephone%\repos\users"
mkdir "%persephone%\repos\base64_url"
mkdir "%persephone%\repos\idcollection"
mkdir "%persephone%\repos\pagination_from_request"
mkdir "%persephone%\repos\parse_id"
mkdir "%persephone%\repos\shortener"
mkdir "%persephone%\repos\statement_helper"
mkdir "%persephone%\static"
mkdir "%persephone%\static\links"
mkdir "%persephone%\static\scripts"
mkdir "%persephone%\temp"
mkdir "%persephone%\temp\accounts"
mkdir "%persephone%\temp\media"
mkdir "%persephone%\temp\stickers"
mkdir "%persephone%\templates"

echo cloning persephone projects to repos directory...
cd "%persephone%\repos"
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
cd "%persephone%"

echo symlinking persephone project components to the working directory...
mklink /D "%persephone%\accesslog" "%persephone%\repos\accesslog\accesslog"
mklink /D "%persephone%\accounts" "%persephone%\repos\accounts\accounts"
mklink /D "%persephone%\bans" "%persephone%\repos\bans\bans"
mklink /D "%persephone%\bansfrontend" "%persephone%\repos\bansfrontend\bansfrontend"
mklink /D "%persephone%\comments" "%persephone%\repos\comments\comments"
mklink /D "%persephone%\commentsfrontend" "%persephone%\repos\commentsfrontend\commentsfrontend"
mklink /D "%persephone%\legal" "%persephone%\repos\legal\legal"
mklink /D "%persephone%\media" "%persephone%\repos\media\media"
mklink /D "%persephone%\mediafrontend" "%persephone%\repos\mediafrontend\mediafrontend"
mklink /D "%persephone%\patreon" "%persephone%\repos\patreon\patreon"
mklink /D "%persephone%\patreonfrontend" "%persephone%\repos\patreonfrontend\patreonfrontend"
mklink /D "%persephone%\persephone" "%persephone%\repos\persephone\persephone"
mklink "%persephone%\persephone_wsgi.py" "%persephone%\repos\persephone\persephone_wsgi.py"
mklink "%persephone%\start_dev_persephone.cmd" "%persephone%\repos\persephone\start_dev_persephone.cmd"
mklink "%persephone%\persephone_update.cmd" "%persephone%\repos\persephone\persephone_update.cmd"
rem link all persephone top level template files
for %%i in ("%persephone%\repos\persephone\templates\*") do (
	mklink "%persephone%\templates\%%~nxi" "%persephone%\repos\persephone\templates\%%~nxi"
)
mklink /D "%persephone%\stickers" "%persephone%\repos\stickers\stickers"
mklink /D "%persephone%\stickersfrontend" "%persephone%\repos\stickersfrontend\stickersfrontend"
mklink /D "%persephone%\thirdpartyauth" "%persephone%\repos\thirdpartyauth\thirdpartyauth"
mklink /D "%persephone%\users" "%persephone%\repos\users\users"
mklink "%persephone%\base64_url.py" "%persephone%\repos\base64_url\base64_url.py"
mklink "%persephone%\idcollection.py" "%persephone%\repos\idcollection\idcollection.py"
mklink "%persephone%\pagination_from_request.py" "%persephone%\repos\pagination_from_request\pagination_from_request.py"
mklink "%persephone%\parse_id.py" "%persephone%\repos\parse_id\parse_id.py"
mklink "%persephone%\shortener.py" "%persephone%\repos\shortener\shortener.py"
mklink "%persephone%\statement_helper.py" "%persephone%\repos\statement_helper\statement_helper.py"

echo copying favicons...
copy "%persephone%\repos\persephone\persephone\views\static\persephone_tear_128.png" "%persephone%\static\favicon.png"
copy "%persephone%\repos\persephone\persephone\views\static\favicon.ico" "%persephone%\static\favicon.ico"

echo copying example configuration files...
copy "%persephone%\repos\accesslog\access_log_config-example.json" "%persephone%\config\access_log_config.json"
copy "%persephone%\repos\accounts\users_config-example.json" "%persephone%\config\users_config.json"
copy "%persephone%\repos\bansfrontend\bans_config-example.json" "%persephone%\config\bans_config.json"
copy "%persephone%\repos\commentsfrontend\comments_config-example.json" "%persephone%\config\comments_config.json"
copy "%persephone%\repos\accounts\credentials-example.json" "%persephone%\config\credentials.json"
copy "%persephone%\repos\legal\legal_config-example.json" "%persephone%\config\legal_config.json"
copy "%persephone%\repos\mediafrontend\media_config-example.json" "%persephone%\config\media_config.json"
copy "%persephone%\repos\patreonfrontend\patreon_config-example.json" "%persephone%\config\patreon_config.json"
copy "%persephone%\repos\persephone\persephone_config-example.json" "%persephone%\config\persephone_config.json"
copy "%persephone%\repos\stickersfrontend\stickers_config-example.json" "%persephone%\config\stickers_config.json"

echo creating other supplemental files...
echo  config/shortener_config.json
echo {}> "%persephone%\config\shortener_config.json"
echo  temporary tegaki config until tegaki is finished
echo {"temp_path": "","tegaki_path": "","tegaki_file_uri": ""}> "%persephone%\config\tegaki_config.json"
echo  static/links/custom.css
echo > "%persephone%\static\links\custom.css"

echo setting configuration files default paths...
%python% "%persephone%\repos\persephone\set_config_default_paths.py" "%persephone%"

echo ...
echo installation finished
echo edit configuration files to customize your installation
echo make a copy of any templates you wish to customize to the main project templates folder (%persephone%\templates) and edit them
echo usually %persephone%\persephone\views\templates\about.html, %persephone%\legal\views\templates\legal_terms.html, and %persephone%\legal\views\templates\legal_rules.html
echo custom style rules can go in %persephone%\static\links\custom.css
echo you can run the debug server in development mode by running %persephone%\start_dev_persephone.cmd
echo point your production webserver at %persephone%\persephone_wsgi.py to go live

:end

@echo off

setlocal

echo checking administrator permissions
net session >nul 2>&1
if %errorLevel% == 0 (
	echo  success
) else (
	echo  failure
	echo   administrator permissions are required to be able to create symlinks
	echo   please run the installer as administrator
	goto end
)

echo checking for git
git --version && (
	echo  success
) || (
	echo  failure
	echo   git not found
	echo   git is required to clone necessary persephone component repos
	echo   please ensure you have git installed
	goto end
)

set python=python3
%python% --version >nul 2>&1 || (
	set python=python
)

echo checking for python
%python% --version && (
	echo  success
	echo  checking python version
	for /f "usebackq tokens=2 delims= " %%i in ('%python% --version') do (
		if /i "%%i" leq "3.4.9" (
			echo   failure
			echo    python version %%i
			echo    please ensure you have python3 3.5+ installed
			goto end
		)
		echo   success
	)
) || (
	echo  failure
	echo   required python not found
	echo   please ensure you have python 3.5+ installed
	goto end
)

echo checking for pip
%python% -m pip --version && (
	echo  success
) || (
	echo  failure
	echo   pip not found
	echo   please ensure you have pip for python installed
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

echo checking for venv and creating virtual environment
%python% -m venv environment && (
	echo  success
) || (
	echo  failure
	echo   venv not found
	echo   please ensure you have venv for python installed
	goto end
)

echo activating virtual environment
call "%persephone%\environment\Scripts\activate.bat"

rem latest versions should be fine, if there end up being problems later i'll make it more specific
echo installing required python packages
echo  flask...
%python% -m pip install flask && (
	echo   success
) || (
	echo   failure
	echo    problem installing flask
	goto end
)
echo  sqlalchemy...
%python% -m pip install sqlalchemy && (
	echo   success
) || (
	echo   failure
	echo    problem installing sqlalchemy
	goto end
)
echo  python-dateutil...
%python% -m pip install python-dateutil && (
	echo   success
) || (
	echo   failure
	echo    problem installing python-dateutil
	goto end
)
echo  werkzeug...
%python% -m pip install werkzeug && (
	echo   success
) || (
	echo   failure
	echo    problem installing werkzeug
	goto end
)
echo  Pillow...
%python% -m pip install Pillow && (
	echo   success
) || (
	echo   failure
	echo    problem installing Pillow
	goto end
)
echo  python3-openid...
%python% -m pip install python3-openid && (
	echo   success
) || (
	echo   failure
	echo    problem installing python3-openid
	goto end
)
echo  passlib...
%python% -m pip install passlib && (
	echo   success
) || (
	echo   failure
	echo    problem installing passlib
	goto end
)
echo  python-magic...
%python% -m pip install python-magic && (
	echo   success
) || (
	echo   failure
	echo    problem installing python-magic
	goto end
)
echo  python-libmagic...
%python% -m pip install python-libmagic && (
	echo   success
) || (
	echo   failure
	echo    problem installing python-libmagic
	goto end
)
echo  python-magic-bin 0.4.14...
%python% -m pip install python-magic-bin==0.4.14 && (
	echo   success
) || (
	echo   failure
	echo    problem installing python-magic-bin 0.4.14
	goto end
)

echo deactivating virtual environment
call "%persephone%\environment\Scripts\deactivate.bat"

echo creating directories
mkdir "%persephone%\config"
mkdir "%persephone%\db"
mkdir "%persephone%\files"
mkdir "%persephone%\files\accounts"
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

echo cloning persephone projects to repos directory and symlinking their components to the working directory
cd "%persephone%\repos"
echo  accesslog...
git clone https://github.com/secretisdead/accesslog.git
mklink /D "%persephone%\accesslog" "%persephone%\repos\accesslog\accesslog"
echo  accounts...
git clone https://github.com/secretisdead/accounts.git
mklink /D "%persephone%\accounts" "%persephone%\repos\accounts\accounts"
echo  bans...
git clone https://github.com/secretisdead/bans.git
mklink /D "%persephone%\bans" "%persephone%\repos\bans\bans"
echo  bansfrontend...
git clone https://github.com/secretisdead/bansfrontend.git
mklink /D "%persephone%\bansfrontend" "%persephone%\repos\bansfrontend\bansfrontend"
echo  comments...
git clone https://github.com/secretisdead/comments.git
mklink /D "%persephone%\comments" "%persephone%\repos\comments\comments"
echo  commentsfrontend...
git clone https://github.com/secretisdead/commentsfrontend.git
mklink /D "%persephone%\commentsfrontend" "%persephone%\repos\commentsfrontend\commentsfrontend"
echo  legal...
git clone https://github.com/secretisdead/legal.git
mklink /D "%persephone%\legal" "%persephone%\repos\legal\legal"
echo  media...
git clone https://github.com/secretisdead/media.git
mklink /D "%persephone%\media" "%persephone%\repos\media\media"
echo  mediafrontend...
git clone https://github.com/secretisdead/mediafrontend.git
mklink /D "%persephone%\mediafrontend" "%persephone%\repos\mediafrontend\mediafrontend"
echo  patreon...
git clone https://github.com/secretisdead/patreon.git
mklink /D "%persephone%\patreon" "%persephone%\repos\patreon\patreon"
echo  patreonfrontend...
git clone https://github.com/secretisdead/patreonfrontend.git
mklink /D "%persephone%\patreonfrontend" "%persephone%\repos\patreonfrontend\patreonfrontend"
echo  persephone...
git clone https://github.com/secretisdead/persephone.git
mklink /D "%persephone%\persephone" "%persephone%\repos\persephone\persephone"
mklink "%persephone%\persephone_wsgi.py" "%persephone%\repos\persephone\persephone_wsgi.py"
mklink "%persephone%\start_dev_persephone.cmd" "%persephone%\repos\persephone\start_dev_persephone.cmd"
rem link all persephone top level template files
for %%i in ("%persephone%\repos\persephone\templates\*") do (
	mklink "%persephone%\templates\%%~nxi" "%persephone%\repos\persephone\templates\%%~nxi"
)
echo  stickers...
git clone https://github.com/secretisdead/stickers.git
mklink /D "%persephone%\stickers" "%persephone%\repos\stickers\stickers"
echo  stickersfrontend...
git clone https://github.com/secretisdead/stickersfrontend.git
mklink /D "%persephone%\stickersfrontend" "%persephone%\repos\stickersfrontend\stickersfrontend"
echo  thirdpartyauth...
git clone https://github.com/secretisdead/thirdpartyauth.git
mklink /D "%persephone%\thirdpartyauth" "%persephone%\repos\thirdpartyauth\thirdpartyauth"
echo  users...
git clone https://github.com/secretisdead/users.git
mklink /D "%persephone%\users" "%persephone%\repos\users\users"
echo  base64_url...
git clone https://github.com/secretisdead/base64_url.git
mklink "%persephone%\base64_url.py" "%persephone%\repos\base64_url\base64_url.py"
echo  idcollection...
git clone https://github.com/secretisdead/idcollection.git
mklink "%persephone%\idcollection.py" "%persephone%\repos\idcollection\idcollection.py"
echo  pagination_from_request...
git clone https://github.com/secretisdead/pagination_from_request.git
mklink "%persephone%\pagination_from_request.py" "%persephone%\repos\pagination_from_request\pagination_from_request.py"
echo  parse_id...
git clone https://github.com/secretisdead/parse_id.git
mklink "%persephone%\parse_id.py" "%persephone%\repos\parse_id\parse_id.py"
echo  shortener...
git clone https://github.com/secretisdead/shortener.git
mklink "%persephone%\shortener.py" "%persephone%\repos\shortener\shortener.py"
echo  statement_helper...
git clone https://github.com/secretisdead/statement_helper.git
mklink "%persephone%\statement_helper.py" "%persephone%\repos\statement_helper\statement_helper.py"

echo copying example configuration files
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

echo creating other supplemental files
echo  config/shortener_config.json...
echo {}> "%persephone%\config\shortener_config.json"
echo  static/links/custom.css...
echo > "%persephone%\static\links\custom.css"

echo ...
echo installation finished
echo edit configuration files to customize your installation
echo make a copy of any templates you wish to customize to the main project templates folder (%persephone%\templates) and edit them
echo usually %persephone%\persephone\views\templates\about.html, %persephone%\legal\views\templates\legal_terms.html, and %persephone%\legal\views\templates\legal_rules.html
echo custom style rules can go in %persephone%\static\links\custom.css
echo you can run the debug server in development mode by running %persephone%\start_dev_persephone.cmd
echo point your production webserver at %persephone%\persephone_wsgi.py to go live

:end

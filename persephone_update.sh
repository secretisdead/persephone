#!/bin/bash

persephone=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "${persephone}"

echo "updating persephone instance in ${persephone}"

echo  accesslog...
cd "${persephone}/repos/accesslog"
git checkout master
git pull
echo  accounts...
cd "${persephone}/repos/accounts"
git checkout master
git pull
echo  bans...
cd "${persephone}/repos/bans"
git checkout master
git pull
echo  bansfrontend...
cd "${persephone}/repos/bansfrontend"
git checkout master
git pull
echo  comments...
cd "${persephone}/repos/comments"
git checkout master
git pull
echo  commentsfrontend...
cd "${persephone}/repos/commentsfrontend"
git checkout master
git pull
echo  legal...
cd "${persephone}/repos/legal"
git checkout master
git pull
echo  media...
cd "${persephone}/repos/media"
git checkout master
git pull
echo  mediafrontend...
cd "${persephone}/repos/mediafrontend"
git checkout master
git pull
echo  patreon...
cd "${persephone}/repos/patreon"
git checkout master
git pull
echo  patreonfrontend...
cd "${persephone}/repos/patreonfrontend"
git checkout master
git pull
echo  persephone...
cd "${persephone}/repos/persephone"
git checkout master
git pull
echo  stickers...
cd "${persephone}/repos/stickers"
git checkout master
git pull
echo  stickersfrontend...
cd "${persephone}/repos/stickersfrontend"
git checkout master
git pull
echo  thirdpartyauth...
cd "${persephone}/repos/thirdpartyauth"
git checkout master
git pull
echo  users...
cd "${persephone}/repos/users"
git checkout master
git pull
echo  base64_url...
cd "${persephone}/repos/base64_url"
git checkout master
git pull
echo  idcollection...
cd "${persephone}/repos/idcollection"
git checkout master
git pull
echo  pagination_from_request...
cd "${persephone}/repos/pagination_from_request"
git checkout master
git pull
echo  parse_id...
cd "${persephone}/repos/parse_id"
git checkout master
git pull
echo  shortener...
cd "${persephone}/repos/shortener"
git checkout master
git pull
echo  statement_helper...
cd "${persephone}/repos/statement_helper"
git checkout master
git pull

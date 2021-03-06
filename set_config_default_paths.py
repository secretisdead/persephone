import sys
import os
import json

def usage():
	print('usage: set_default_config_paths.py [persephone_install_directory]')
	quit()

if __name__ != '__main__':
	usage()

if 2 > len(sys.argv):
	usage()
persephone_install_directory = sys.argv[1]
print('persephone install directory: ' + persephone_install_directory)
configs = {
	'persephone': {
		'path': '',
		'data': {},
	},
	'users': {
		'path': '',
		'data': {},
	},
	'stickers': {
		'path': '',
		'data': {},
	},
	'media': {
		'path': '',
		'data': {},
	},
	'tegaki': {
		'path': '',
		'data': {},
	},
}
for config in configs:
	configs[config]['path'] = os.path.join(
		persephone_install_directory,
		'config',
		config + '_config.json',
	)
	with open(configs[config]['path'], 'r') as handle:
		configs[config]['data'] = json.load(handle)

print('persephone')
print(' /db/persephone.db')
configs['persephone']['data']['db']['common']['host'] = os.path.join(
	persephone_install_directory,
	'db',
	'persephone.db',
)

print('users')
print(' /temp/accounts')
configs['users']['data']['temp_path'] = os.path.join(
	persephone_install_directory,
	'temp',
	'accounts',
)
print(' /files/accounts/avatars')
configs['users']['data']['avatars_path'] = os.path.join(
	persephone_install_directory,
	'files',
	'accounts',
	'avatars',
)

print('stickers')
print(' /temp/stickers')
configs['stickers']['data']['temp_path'] = os.path.join(
	persephone_install_directory,
	'temp',
	'stickers',
)
print(' /files/stickers/images')
configs['stickers']['data']['sticker_images_path'] = os.path.join(
	persephone_install_directory,
	'files',
	'stickers',
	'images',
)
print(' /files/stickers/placements')
configs['stickers']['data']['sticker_placements_path'] = os.path.join(
	persephone_install_directory,
	'files',
	'stickers',
	'placements',
)

print('media')
print(' /temp/media')
configs['media']['data']['temp_path'] = os.path.join(
	persephone_install_directory,
	'temp',
	'media',
)
print(' /files/media/originals')
configs['media']['data']['media_path'] = os.path.join(
	persephone_install_directory,
	'files',
	'media',
	'originals',
)
print(' /files/media/summaries')
configs['media']['data']['summaries_path'] = os.path.join(
	persephone_install_directory,
	'files',
	'media',
	'summaries',
)
print(' /files/media/tags')
configs['media']['data']['tags_path'] = os.path.join(
	persephone_install_directory,
	'files',
	'media',
	'tags',
)

print('tegaki')
print(' /temp/tegaki')
configs['tegaki']['data']['temp_path'] = os.path.join(
	persephone_install_directory,
	'temp',
	'tegaki',
)
print(' /files/tegaki')
configs['tegaki']['data']['tegaki_path'] = os.path.join(
	persephone_install_directory,
	'files',
	'tegaki',
)

for config in configs:
	print('save ' + config)
	with open(configs[config]['path'], 'w') as handle:
		handle.write(json.dumps(configs[config]['data'], indent=4))

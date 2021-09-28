import sys
import os
import json

if 'PERSEPHONE_DIR' in os.environ:
	persephone_dir = os.environ['PERSEPHONE_DIR']
else:
	persephone_dir = os.path.dirname(__file__)

sys.path.append(persephone_dir)

from flask import Flask, url_for, g, request, abort, redirect, escape, Markup
from flask import render_template, make_response, after_this_request
from werkzeug.exceptions import Forbidden
from sqlalchemy import create_engine
from email.utils import formatdate

from persephone.views import persephone
from shortener import shortener
from legal import legal, terms_agreed, terms
from legal import initialize as initialize_legal
from accesslog import AccessLog
from accounts.views import initialize as initialize_accounts
from accounts.views.signed_out import accounts_signed_out
from accounts.views.signed_in import accounts_signed_in
from accounts.views.manager import accounts_manager
from bansfrontend.views import initialize as initialize_bans, require_not_banned
from bansfrontend.views.manager import bans_manager
from commentsfrontend.views import initialize as initialize_comments
from commentsfrontend.views.signed_out import comments_signed_out
from commentsfrontend.views.signed_in import comments_signed_in
from commentsfrontend.views.manager import comments_manager
from stickersfrontend.views import initialize as initialize_stickers
from stickersfrontend.views.static import stickers_static
from stickersfrontend.views.signed_out import stickers_signed_out
from stickersfrontend.views.signed_in import stickers_signed_in, stickers_api
from stickersfrontend.views.admin import stickers_admin
from patreonfrontend.views import initialize as initialize_patreon
from patreonfrontend.views.admin import patreon_admin
from mediafrontend.views import initialize as initialize_media
from mediafrontend.views import tags_list
from mediafrontend.views import media_static, media_supplemental
from mediafrontend.views import media_api
from parse_id import parse_id
from idcollection import IDCollection
from users import UserStatus

app = Flask(
	__name__,
	static_folder='static',
	static_url_path='/static/custom',
)

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 300000

# blueprints
app.register_blueprint(shortener, url_prefix='/to')
app.register_blueprint(legal, url_prefix='/legal')
app.register_blueprint(accounts_signed_out, url_prefix='/accounts')
app.register_blueprint(accounts_signed_in, url_prefix='/accounts')
app.register_blueprint(accounts_manager, url_prefix='/manager')
app.register_blueprint(bans_manager, url_prefix='/manager')
app.register_blueprint(comments_signed_out, url_prefix='/comments')
app.register_blueprint(comments_signed_in, url_prefix='/comments')
app.register_blueprint(comments_manager, url_prefix='/manager')
app.register_blueprint(stickers_static, url_prefix='/stickers')
app.register_blueprint(stickers_signed_out, url_prefix='/stickers')
app.register_blueprint(stickers_signed_in, url_prefix='/stickers')
app.register_blueprint(stickers_api, url_prefix='/api/stickers')
app.register_blueprint(stickers_admin, url_prefix='/admin/stickers')
app.register_blueprint(patreon_admin, url_prefix='/admin/patreon')
app.register_blueprint(media_static, url_prefix='/media')
app.register_blueprint(media_supplemental, url_prefix='/media')
app.register_blueprint(media_api, url_prefix='/api/media')

def get_config(config_file, config_name):
	config_path = os.path.join(g.persephone_directory, config_file)
	try:
		f = open(config_path, 'r')
	except FileNotFoundError:
		abort(500, 'Missing ' + config_name + ' config file')

	try:
		config = json.load(f)
	except json.decoder.JSONDecodeError:
		abort(500, 'Malformed ' + config_name + ' config')

	return config

def get_engine(db_config):
	if 'sqlite' == db_config['type']:
		return create_engine(
			'sqlite:///' + db_config['host'],
			connect_args={'check_same_thread': False},
		)
	elif db_config['type']:
		try:
			return create_engine(
				'mysql://'
					+ db_config['user']
					+ ':'
					+ db_config['pass']
					+ '@' + db_config['host']
			)
		except:
			abort(500, 'Problem connecting to db')
	else:
		abort(500, 'Problem with db configuration')

@app.before_request
def initialize():
	g.initialized = False

	# this should be the root wsgi directory, not the persephone repository directory
	g.persephone_directory = persephone_dir

	# persephone and database config
	g.persephone_config = get_config('config/persephone_config.json', 'persephone')

	# automatically disable patreon package except on selective endpoints
	if (
			'patreon_admin.' != request.endpoint[:14]
			and request.endpoint not in [
				'persephone.admin',
				'persephone.logs_list',
				'persephone.user_badges',
				'persephone.user_profile',
			]
		):
		g.persephone_config['optional_packages']['patreon'] = False

	if not g.persephone_config['static_persephone_uri']:
		g.persephone_config['static_persephone_uri'] = url_for(
			'persephone.static',
			filename='FILENAME',
		).replace('FILENAME', '{}')

	if not g.persephone_config['static_custom_uri']:
		g.persephone_config['static_custom_uri'] = url_for(
			'static',
			filename='FILENAME',
		).replace('FILENAME', '{}')

	# shortener
	g.shortener_config = get_config('config/shortener_config.json', 'shortener')

	# legal
	initialize_legal(get_config('config/legal_config.json', 'legal'))

	packages = {
		'access_log': None,
		'users': None,
		'bans': None,
		'comments': None,
		'stickers': None,
		'patreon': None,
		'media': None,
	}
	common_engine = None
	common_connection = None
	if g.persephone_config['db']['common']['type']:
		common_engine = get_engine(g.persephone_config['db']['common'])
		common_connection = common_engine.connect()

	install = True
	if os.path.exists(os.path.join(g.persephone_directory, '.installed')):
		install = False

	engines = {}
	connections = {}
	configs = {}
	for package in packages:
		if (
				not install
				and package in g.persephone_config['optional_packages']
				and not g.persephone_config['optional_packages'][package]
			):
			continue
		configs[package] = get_config(
			'config/' + package + '_config.json', package
		)
		if 'common' == g.persephone_config['db'][package]['type']:
			if not common_engine:
				abort(500, 'Common db specified without being configured')
			engines[package] = common_engine
			connections[package] = common_connection
		else:
			engines[package] = get_engine(g.persephone_config['db'][package])
			connections[package] = None
	third_party_authentication_enabled = False
	for service, enabled in configs['users']['authentication_services'].items():
		if service in ['local', 'cert', 'mail', 'steam']:
			continue
		if enabled:
			third_party_authentication_enabled = True
			break
	if third_party_authentication_enabled:
		configs['users']['credentials'] = get_config(
			'config/credentials.json',
			'credentials',
		)

	# access log
	try:
		g.access_log = AccessLog(
			engines['access_log'],
			db_prefix=configs['access_log']['db_prefix'],
			install=install,
			remote_origin=request.remote_addr,
			connection=connections['access_log'],
		)
	except:
		abort(500, 'Problem initializing AccessLog')

	# accounts
	try:
		initialize_accounts(
			configs['users'],
			g.access_log,
			engines['users'],
			install=install,
			connection=connections['users'],
		)
	except:
		abort(500, 'Problem initializing Accounts')

	# bans
	try:
		initialize_bans(
			configs['bans'],
			g.accounts,
			g.access_log,
			engines['bans'],
			install=install,
			connection=connections['bans'],
		)
	except:
		abort(500, 'Problem initializing Bans')

	if install or g.persephone_config['optional_packages']['comments']:
		# comments
		try:
			initialize_comments(
				configs['comments'],
				g.accounts,
				g.access_log,
				engines['comments'],
				install=install,
				connection=connections['comments'],
			)
		except:
			abort(500, 'Problem initializing Comments')

	if install or g.persephone_config['optional_packages']['stickers']:
		# stickers
		try:
			initialize_stickers(
				configs['stickers'],
				g.accounts,
				g.access_log,
				engines['stickers'],
				install=install,
				connection=connections['stickers'],
			)
		except:
			abort(500, 'Problem initializing Stickers')

	if install or g.persephone_config['optional_packages']['patreon']:
		# patreon
		try:
			initialize_patreon(
				configs['patreon'],
				g.accounts,
				g.access_log,
				engines['patreon'],
				install=install,
				connection=connections['patreon'],
			)
		except:
			abort(500, 'Problem initializing Patreon')

	# media
	try:
		initialize_media(
			configs['media'],
			g.accounts,
			g.access_log,
			engines['media'],
			install=install,
			connection=connections['media'],
		)
	except:
		abort(500, 'Problem initializing Media')

	if install:
		with open(
				os.path.join(g.persephone_directory, '.installed'),
				'w',
			) as handle:
			handle.write('')

	repopulate_groups = False
	if 'contributor' not in g.accounts.available_groups:
		repopulate_groups = True
		g.accounts.create_group('contributor')
	for custom_group in g.persephone_config['custom_groups']:
		if custom_group not in g.accounts.available_groups:
			repopulate_groups = True
			g.accounts.create_group(custom_group)
	for custom_scopes in g.persephone_config['custom_scopes']:
		if custom_scope not in g.accounts.available_scopes:
			g.accounts.create_scope(custom_scope)
	if repopulate_groups:
		g.accounts.populate_groups()

	#TODO remove stickers and comments from removed media
	#g.media.add_callback('remove_medium', media_remove_medium)

	# add some helper functions to be accessed through g.persephone
	def get_file_modified_time(path_components):
		return os.path.getmtime(
			os.path.join(g.persephone_directory, *path_components)
		)

	g.persephone = {
		'get_file_modified_time': get_file_modified_time,
	}

	if g.persephone_config['optional_packages']['comments']:
		if not g.persephone_config['optional_packages']['stickers']:
			def filter_comments(comments):
				#TODO alternate filter comments if stickers are disabled
				pass
		else:
			def filter_comments(comments):
				commenter_user_ids = []
				for comment in comments.values():
					comment.body = escape(comment.body)
					if comment.user and comment.user_id not in commenter_user_ids:
						commenter_user_ids.append(comment.user.id)
				collected_stickers = g.stickers.search_collected_stickers(
					filter={'user_ids': commenter_user_ids},
				)
				user_ids_to_collected_stickers = {}
				for collected_sticker in collected_stickers.values():
					if collected_sticker.user_id not in user_ids_to_collected_stickers:
						user_ids_to_collected_stickers[collected_sticker.user_id] = []
					user_ids_to_collected_stickers[collected_sticker.user_id].append(
						collected_sticker
					)
				for comment in comments.values():
					if comment.user and comment.user_id in user_ids_to_collected_stickers:
						for collected_sticker in user_ids_to_collected_stickers[comment.user.id]:
							if not collected_sticker.sticker.name:
								continue
							comment.body = comment.body.replace(
								':' + collected_sticker.sticker.name + ':',
								Markup(
									render_template(
										'sticker.html',
										sticker=collected_sticker.sticker,
									)
								),
							)

		def populate_media_comment_counts(media):
			comment_counts = g.comments.get_subject_comment_counts(media.keys())
			for medium in media.values():
				if medium.id in comment_counts:
					medium.comment_count = comment_counts[medium.id]

		g.persephone['filter_comments'] = filter_comments
		g.persephone['populate_media_comment_counts'] = populate_media_comment_counts

	if g.persephone_config['optional_packages']['stickers']:
		def populate_media_sticker_counts(media):
			sticker_counts = g.stickers.get_subject_sticker_placement_counts(
				media.keys()
			)
			for medium in media.values():
				if medium.id in sticker_counts:
					medium.sticker_count = sticker_counts[medium.id]

		def populate_current_user_stickerbook():
			if g.accounts.current_user:
				collected_stickers = g.stickers.search_collected_stickers(
					filter={'user_ids': g.accounts.current_user.id_bytes},
				)
				stickers = IDCollection()
				for collected_sticker in collected_stickers.values():
					stickers.add(collected_sticker.sticker)
				g.accounts.current_user.stickerbook = g.stickers.stickers_by_category(
					stickers
				)
				empty_categories = []
				for category, stickers in g.accounts.current_user.stickerbook.items():
					if not stickers:
						empty_categories.append(category)
				for category in empty_categories:
					del g.accounts.current_user.stickerbook[category]

		g.persephone['populate_media_sticker_counts'] = populate_media_sticker_counts
		g.persephone['populate_current_user_stickerbook'] = populate_current_user_stickerbook

	if (
			g.persephone_config['signed_in_only']
			and not g.accounts.current_user
			and request.endpoint not in [
				'accounts_signed_out.sign_in_services',
				'accounts_signed_out.sign_in',
				'accounts_signed_out.authentication_landing',
				'accounts_signed_out.redeem_invite',
				'accounts_signed_out.register',
				'legal.terms',
				'legal.accept_terms',
				'legal.post_accept_terms',
				'legal.rules',
				'legal.privacy',
				'legal.revoke_cookie_consent',
				'legal.takedown',
				'static',
				'persephone.static',
			]
		):
		abort(401)

	if (
			g.accounts.current_user
			and g.accounts.current_user.status in [
				UserStatus.DEACTIVATED_BY_STAFF,
				UserStatus.DEACTIVATED_BY_SELF
			]
		):
		abort(403, 'Your account is deactivated')

	if not terms_agreed() and 'accounts_signed_out.sign_in_services' == request.endpoint:
		@after_this_request
		def require_terms(response):
			return make_response(
				terms(agreement_form=True)
			)

	g.initialized = True

# sign in services handle 401
@app.errorhandler(401)
def not_authorized(e):
	#TODO for api requests return 401 header only maybe?
	#TODO otherwise redirect to sign in services list
	return redirect(url_for('accounts_signed_out.sign_in_services'), code=303)

# banned page returns for banned 403 specifically
@app.errorhandler(403)
def banned(e):
	#TODO maybe have ban 403 be a custom exception that inherits from 403
	#TODO and check against that instead of the exception description
	# re-raise for non-banned 403s
	if 'You are banned' != e.description:
		raise
	return render_template('view_ban.html', ban=g.bans.last_checked_ban)

# custom templates for other status errors
def error_page(code, message):
	if not g.initialized:
		return message, code
	return render_template('status_error.html', code=code, message=message), code

@app.errorhandler(400)
def e400(e):
	return error_page(400, e.description)

#TODO werkzeug doesn't like 402
#@app.errorhandler(402)
#def e402(e):
#	return error_page(402, e.description)

@app.errorhandler(403)
def e403(e):
	return error_page(403, e.description)

@app.route('/accounts/user-not-found')
def user_not_found():
	return error_page(404, 'User not found')

@app.errorhandler(404)
def e404(e):
	if 'persephone.user_profile' == request.endpoint:
		return redirect(url_for('user_not_found'), 303)
	return error_page(404, e.description)

@app.errorhandler(405)
def e405(e):
	return error_page(405, e.description)

@app.errorhandler(409)
def e409(e):
	return error_page(409, e.description)

@app.errorhandler(413)
def e413(e):
	return error_page(413, e.description)

@app.errorhandler(415)
def e415(e):
	return error_page(415, e.description)

@app.errorhandler(429)
def e429(e):
	return error_page(429, e.description)

@app.errorhandler(451)
def e451(e):
	return error_page(451, e.description)

@app.errorhandler(500)
def e500(e):
	return error_page(500, e.description)

def response_minify_html(response):
	if (
			response.content_type == u'text/html; charset=utf-8'
			and not response.direct_passthrough
		):
		response.set_data(
			response.get_data(as_text=True).replace(
				'\n',
				'',
			).replace(
				'\r',
				'',
			).replace(
				'\t',
				'',
			)
		)
	return response

def check_global_ban(response):
	if not hasattr(g, 'bans'):
		return response
	if response.direct_passthrough:
		return response
	if not request.endpoint:
		return response
	# prevent specific endpoints from being caught in bans
	if request.endpoint in [
			'accounts_signed_out.sign_in_services',
			'accounts_signed_out.sign_in',
			'accounts_signed_out.authentication_landing',
			'accounts_signed_out.profile',
			'accounts_signed_out.avatar_file',
			'static',
			'persephone.static',
		]:
		return response
	# prevent entire ranges of endpoints from being caught in bans
	for bypass_endpoint_prefix in ['accounts_signed_in.']:
		l = len(bypass_endpoint_prefix)
		if bypass_endpoint_prefix == request.endpoint[:l]:
			return response
	try:
		require_not_banned()
	except Forbidden:
		if not hasattr(g, 'bans'):
			return response
		return make_response(
			render_template('view_ban.html', ban=g.bans.last_checked_ban),
			403,
		)
	else:
		return response

def response_add_cache_headers(response):
	if (
			hasattr(g, 'no_store')
			or (
				'no_store_all' in g.persephone_config 
				and g.persephone_config['no_store_all']
				# allow caching of static endpoints
				#TODO this is a little hacky
				and 'media_static.' != request.endpoint[:13]
				and '/static/' not in request.path
			)
		):
		response.cache_control.max_age = 0
		response.cache_control.no_store = True
		if 'Expires' in response.headers:
			del response.headers['Expires']
		response.headers['Expires'] = formatdate(timeval=None, localtime=False, usegmt=True);
	return response

def response_add_meta_graph(response):
	if (
			response.content_type == u'text/html; charset=utf-8'
			and not response.direct_passthrough
		):
		data = response.get_data(as_text=True)
		# search only in head
		head_end = data.find('</head>')
		if -1 == head_end:
			return response
		graph_tags = ''
		# response doesn't contain meta graph title
		if -1 == data.find('property="og:title"', 0, head_end):
			# add general site meta graph title
			site_title = g.persephone_config['site_title']
			graph_tags += (
				'<meta name="twitter:title" content="' + site_title + '">'
					+ '<meta property="og:title" content="' + site_title + '">'
			)
		# response doesn't contain meta graph image
		if -1 == data.find('property="og:image"', 0, head_end):
			# add general site meta graph image
			if g.persephone_config['site_image_uri']:
				site_image = g.persephone_config['site_image_uri']
			else:
				site_image = g.persephone_config['static_persephone_uri'].format(
					'persephone_128.png',
				)
			graph_tags += (
				'<meta name="twitter:image" content="' + site_image + '">'
					+ '<meta property="og:image" content="' + site_image + '">'
					+ '<meta name="twitter:card" content="summary_large_image">'
			)
		if graph_tags:
			# add graph tags before title element
			data = data.replace(
				'<title>',
				graph_tags + '<title>',
			)
			response.set_data(data)
	return response

def close_connections():
	connections = []
	for component in [
			'access_log',
			'accounts',
			'bans',
			'comments',
			'stickers',
			'patreon',
			'media',
		]:
		if hasattr(g, component):
			connections.append(getattr(g, component).connection)
	for connection in connections:
		try:
			connection.close()
		except:
			pass

@app.after_request
def after_request(response):
	response = response_minify_html(response)
	response = check_global_ban(response)
	response = response_add_cache_headers(response)
	response = response_add_meta_graph(response)
	close_connections()
	return response

# persephone has to be registered after other endpoints for wildcard profiles
app.register_blueprint(persephone)

# override generic profile endpoint with redirect to custom user profiles
def profile_redirect(**kwargs):
	return redirect(url_for('persephone.user_profile', **kwargs), code=303)

app.view_functions['accounts_signed_out.profile'] = profile_redirect

if __name__ == '__main__':
	#TODO ensure that we're running from the root wsgi directory, not the persephone repository directory
	# start the flask dev server when not being provided by a production server
	app.run(debug=True, host='0.0.0.0', port=5000)

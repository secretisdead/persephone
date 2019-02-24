import time
import math
import os
import json

from flask import Blueprint, render_template, request, g, url_for, abort
from flask import redirect, make_response
import dateutil.parser

from legal import terms_agreed, terms
from accounts.views import require_sign_in, require_permissions, require_user
from media import MediumStatus, MediumSearchability, MediumProtection
from mediafrontend import mime_to_extension
from mediafrontend.views import search_media, view_medium, upload_media
from mediafrontend.views import tags_list
from pagination_from_request import pagination_from_request

persephone = Blueprint(
	'persephone',
	__name__,
	static_folder='static',
	static_url_path='/static/persephone',
	template_folder='templates',
)

# staff
@persephone.route('/admin')
@require_permissions(group_names='admin')
def admin():
	return render_template('admin.html')

@persephone.route('/admin/logs')
@require_permissions(group_names='admin')
def logs_list():
	search = {
		'id': '',
		'created_before': '',
		'created_after': '',
		'scope': '',
		'remote_origin': '',
		'subject_id': '',
		'object_id': '',
	}
	for field in search:
		if field in request.args:
			search[field] = request.args[field]

	filter = {}
	# for parsing datetime and timestamp from submitted form
	# filter fields are named the same as search fields
	time_fields = [
		'created_before',
		'created_after',
	]
	for field, value in search.items():
		if value:
			if 'id' == field:
				filter['ids'] = value
			elif field in time_fields:
				try:
					parsed = dateutil.parser.parse(value)
				except ValueError:
					filter[field] = 'bad_query'
				else:
					search[field] = parsed.strftime('%Y-%m-%dT%H:%M:%S.%f%z')
					filter[field] = parsed.timestamp()
			elif 'scope' == field:
				filter['scopes'] = value
			elif 'remote_origin' == field:
				filter['with_remote_origins'] = value
			elif 'subject_id' == field:
				if 'system' == value:
					value = ''
				filter['subject_ids'] = value
			elif 'object_id' == field:
				filter['object_ids'] = value

	pagination = pagination_from_request('creation_time', 'desc', 0, 32)

	total_results = g.access_log.count_logs(filter=filter)
	results = g.access_log.search_logs(filter=filter, **pagination)

	# enhanced search for other modules
	ids = []
	int_ids = []
	for log in results.values():
		if log.subject_id:
			ids.append(log.subject_id)
		if log.object_id:
			ids.append(log.object_id)
	collections = {
		'user': g.accounts.search_users(filter={'ids': ids}),
		'authentication': g.accounts.search_authentications(
			filter={'ids': ids},
		),
		'session': g.accounts.search_sessions(filter={'ids': ids}),
		'invite': g.accounts.search_invites(filter={'ids': ids}),
		'auto_permission': g.accounts.search_auto_permissions(
			filter={'ids': ids},
		),
		'ban': g.bans.search_bans(filter={'ids': ids}),
		'medium': g.media.search_media(filter={'ids': ids}),
		'medium_like': g.media.search_likes(filter={'ids': ids}),
	}
	if g.persephone_config['optional_packages']['comments']:
		collections['comment'] = g.comments.search_comments(filter={'ids': ids})
	if g.persephone_config['optional_packages']['stickers']:
		collections['sticker'] = g.stickers.search_stickers(filter={'ids': ids})
		collections['collected_sticker'] = g.stickers.search_collected_stickers(
			filter={'ids': ids},
		)
		collections['sticker_placement'] = g.stickers.search_sticker_placements(
			filter={'ids': ids},
		)
	if g.persephone_config['optional_packages']['patreon']:
		collections['patreon_client'] = g.patreon.search_clients(filter={'ids': ids})

	for log in results.values():
		for category, collection in collections.items():
			if log.subject_id in collection:
				log.subject = collection.get(log.subject_id)
				log.subject_category = category
			if log.object_id in collection:
				log.object = collection.get(log.object_id)
				log.object_category = category

	return render_template(
		'logs_list.html',
		results=results,
		search=search,
		pagination=pagination,
		total_results=total_results,
		total_pages=math.ceil(total_results / pagination['perpage']),
		unique_scopes=g.access_log.get_unique_scopes(),
	)

@persephone.route('/manager')
@require_permissions(group_names='manager')
def manager():
	return render_template('manager.html')

@persephone.route('/contributor')
@require_permissions(group_names='contributor')
def contributor():
	return render_template('contributor.html')

# general site endpoints
@persephone.route('/')
def home():
	announcement_medium = get_announcement_medium()
	if not g.accounts.current_user:
		return render_template(
			'home.html',
			announcement_medium=announcement_medium,
		)
	return render_template(
		'dashboard.html',
		announcement_medium=announcement_medium,
	)

@persephone.route('/about')
def about():
	return render_template('about.html')

@persephone.route('/pages/<page_name>')
def pages(page_name):
	try:
		return render_template('page_' + page_name + '.html')
	except:
		abort(404, 'Page not found')

# legal
@persephone.route('/legal')
def legal():
	return render_template('legal.html')

@persephone.route('/legal/takeout', methods=['GET', 'POST'])
@require_sign_in
def takeout():
	if 'POST' == request.method:
		data = {}
		if 'account' in request.form:
			data['account'] = {
				'id': g.accounts.current_user.id,
				'creation_time': g.accounts.current_user.creation_time,
				'status': str(g.accounts.current_user.status),
				'name': g.accounts.current_user.name,
				'display': g.accounts.current_user.display,
				'protected': g.accounts.current_user.protected,
				'permissions': {},
				'authentications': {},
			}
			redeemed_invites = g.accounts.search_invites(
				filter={'redeemed_by_ids': g.accounts.current_user.id_bytes},
			)
			if redeemed_invites:
				data['account']['invite_id'] = redeemed_invites.values()[0].id
			for scope, permission in g.accounts.current_user.permissions.items():
				if '' == scope:
					scope = 'global'
				data['account']['permissions'][scope] = permission.group_names
			g.accounts.populate_user_authentications(g.accounts.current_user)
			for service, authentication in g.accounts.current_user.authentications.items():
				data['account']['authentications'][service] = authentication.value
		if 'invites' in request.form:
			invites = g.accounts.search_invites(
				filter={'created_by_user_ids': g.accounts.current_user.id_bytes},
			)
			data['invites'] = []
			for invite in invites.values():
				current_invite = {
					'id': invite.id,
					'creation_time': invite.creation_time,
					'redeem_time': invite.redeem_time,
				}
				if '' != invite.redeemed_by_user_id:
					current_invite['redeemed_by'] = invite.redeemed_by_user_id
				data['invites'].append(current_invite)
		if 'sessions' in request.form:
			sessions = g.accounts.search_sessions(
				filter={'user_ids': g.accounts.current_user.id},
			)
			data['sessions'] = []
			for session in sessions.values():
				data['sessions'].append({
					'id': session.id,
					'creation_time': session.creation_time,
					'remote_origin': session.remote_origin.exploded,
					'useragent': session.useragent,
					'touch_time': session.touch_time,
					'close_time': session.close_time,
				})
		if g.persephone_config['optional_packages']['stickers']:
			if 'collected_stickers' in request.form:
				data['collected_stickers'] = []
				collected_stickers = g.stickers.search_collected_stickers(
					filter={'user_ids': g.accounts.current_user.id_bytes},
				)
				for collected_sticker in collected_stickers.values():
					if not collected_sticker.sticker:
						continue
					data['collected_stickers'].append({
						'id': collected_sticker.sticker.id,
						'receive_time': collected_sticker.receive_time,
						'name': collected_sticker.sticker.name,
						'display': collected_sticker.sticker.display,
					})
			if 'sticker_placements' in request.form:
				placements = g.stickers.search_sticker_placements(
					filter={'user_ids': g.accounts.current_user.id_bytes},
				)
				data['sticker_placements'] = []
				for placement in placements.values():
					if not collected_sticker.sticker:
						continue
					data['sticker_placements'].append({
						'id': placement.id,
						'placement_time': placement.placement_time,
						'sticker_id': placement.sticker.id,
						'subject_id': placement.subject_id,
						'position_x': placement.position_x,
						'position_y': placement.position_y,
						#'rotation': placement.rotation,
						#'scale': placement.scale,
					})
		if (
				g.persephone_config['optional_packages']['comments']
				and 'comments' in request.form
			):
			data['comments'] = []
			comments = g.comments.search_comments(
				filter={'user_ids': g.accounts.current_user.id_bytes},
			)
			for comment in comments.values():
				data['comments'].append({
					'id': comment.id,
					'creation_time': comment.creation_time,
					'remote_origin': comment.remote_origin.exploded,
					'subject_id': comment.subject_id,
					'body': comment.body,
				})
		if 'likes' in request.form:
			data['likes'] = []
			likes = g.media.search_likes(
				filter={'user_ids': g.accounts.current_user.id_bytes},
			)
			for like in likes.values():
				data['likes'].append({
					'id': like.id,
					'creation_time': like.creation_time,
					'medium_id': like.medium_id,
				})
		#TODO media and tegaki packages
		r = make_response(json.dumps({g.accounts.current_user.id: data}))
		r.mimetype = 'application/json'
		r.headers.set(
			'Content-Disposition',
			'attachment',
			filename=(
				'persephone.takeout.'
					+ g.accounts.current_user.id
					+ '.'
					+ str(int(time.time()))
					+ '.json'
			),
		)
		return r
	return render_template('takeout.html')

# announcements
def get_announcement_medium(page=0):
	filter = {
			'created_before': int(time.time()),
			'with_tags': 'announcement',
	}
	if g.persephone_config['public_contributors']:
		filter['owner_ids'] = g.persephone_config['public_contributors']
	media = g.media.search_media(
		filter=filter,
		page=int(page),
		perpage=1,
	)
	if not media.values():
		return None
	medium = media.values()[0]
	if not medium or 'text' != medium.category:
		return None
	medium.owner = g.accounts.get_user(medium.owner_id)
	g.media.populate_medium_contents(medium)
	if not medium.contents:
		return None
	return medium

@persephone.route('/announcements')
@persephone.route('/announcements/<page>')
def announcements(page=0):
	announcement_medium = get_announcement_medium(page)
	if not announcement_medium:
		abort(404)
	filter = {
		'created_before': int(time.time()),
		'with_tags': 'announcement',
	}
	if g.persephone_config['public_contributors']:
		filter['owner_ids'] = g.persephone_config['public_contributors']
	total_results = g.media.count_media(filter=filter)
	return render_template(
		'announcements.html',
		announcement_medium=announcement_medium,
		total_pages=total_results,
		page=page,
	)

# tegaki
@persephone.route('/tegaki')
def tegaki():
	return 'tegaki is being updated'

# media archive
@persephone.route('/premium/<campaign>')
def premium_info(campaign):
	return render_template('premium_info.html', campaign=campaign)

@persephone.route('/media/upload', methods=['GET', 'POST'])
@require_permissions(group_names='contributor', methods=['GET', 'POST'])
def upload():
	return upload_media(view_endpoint='persephone.search_public_media')

# a function to set some override filters depending on the current user's
# signed in state and permissions
def build_search_override(user=None):
	if not g.accounts.current_user:
		# signed out never sees hidden, group-searchable, private, or non-allowed
		filter = {
			'without_searchabilities': [
				MediumSearchability.HIDDEN,
				MediumSearchability.GROUPS,
			],
			'without_protections': [MediumProtection.PRIVATE],
			'with_statuses': [MediumStatus.ALLOWED],
		}
		if g.persephone_config['public_contributors']:
			filter['owner_ids'] = g.persephone_config['public_contributors']
		return filter, False, True
	# manager, or owner browsing their own media
	if (
			g.accounts.current_user.has_permission(group_names='manager')
			or (user and user.id == g.accounts.current_user.id)
		):
		# no filters, management mode on, and future shown
		return {}, True, False
	# regular user never sees hidden, private, or non-allowed
	filter = {
		'without_searchabilities': [MediumSearchability.HIDDEN],
		'without_protections': [MediumProtection.PRIVATE],
		'with_statuses': [MediumStatus.ALLOWED],
	}
	if g.persephone_config['public_contributors']:
		filter['owner_ids'] = g.persephone_config['public_contributors']
	# set without_group_bits to inverse of user permissions for media | global scopes
	user_group_bits = []
	for scope in ['', 'media']:
		if scope in g.accounts.current_user.permissions:
			user_group_bits.append(g.accounts.current_user.permissions[scope].group_bits)
	user_inverse_permissions = ~int.from_bytes(
		g.accounts.combine_groups(bits=user_group_bits),
		'big'
	)
	filter['without_group_bits'] = user_inverse_permissions
	return filter, False, True

@persephone.route('/media/random')
def random_public_media():
	if not terms_agreed():
		return terms(agreement_form=True)
	return redirect(url_for('persephone.search_public_media', random='1'), code=303)

# limited main media search
# copy and rename search_public_media and search_public_media_rss with 
# different endpoints and custom filters to create other limited searches
@persephone.route('/media/search')
@persephone.route('/media/search/<medium_id>', methods=['GET', 'POST'])
def search_public_media(medium_id=None, rss=False):
	if not rss and not terms_agreed():
		return terms(agreement_form=True, medium_id=medium_id)
	override_filters, management_mode, omit_future = build_search_override()
	return search_media(
		# put overrides here to create a limited main search
		override_filters=override_filters,
		override_tags={
			#'add_tags': ['-some tag to never return],
			#'remove_tags': ['some tag to never return'],
		},
		management_mode=management_mode,
		omit_future=omit_future,
		medium_id=medium_id,
		rss=rss,
		rss_endpoint='persephone.search_public_media_rss',
		rss_media_endpoint='persephone.search_public_media',
	)

@persephone.route('/media/search/rss')
def search_public_media_rss():
	return search_public_media(rss=True)

# management media search
@persephone.route('/manager/media')
@persephone.route('/manager/media/<medium_id>', methods=['GET', 'POST'])
@require_permissions(group_names='manager')
def manage_media(medium_id=None, rss=False):
	if not rss and not terms_agreed():
			return terms(agreement_form=True, medium_id=medium_id)
	return search_media(
		management_mode=True,
		omit_future=False,
		medium_id=medium_id,
		rss=rss,
		rss_endpoint='persephone.manage_media_rss',
		rss_media_endpoint='persephone.manage_media',
	)

@persephone.route('/manager/rss')
def manage_media_rss():
	return manage_media(rss=True)

@persephone.route('/manager/tags', methods=['GET', 'POST'])
@require_permissions(group_names='manager')
def manage_tags():
	return tags_list('persephone.search_public_media')

@persephone.route('/manager/likes')
@require_permissions(group_names='manager')
def manage_likes():
	search = {
		'id': '',
		'created_before': '',
		'created_after': '',
		'user_id': '',
		'medium_id': '',
	}
	for field in search:
		if field in request.args:
			search[field] = request.args[field]

	filter = {}
	# for parsing datetime and timestamp from submitted form
	# filter fields are named the same as search fields
	time_fields = [
		'created_before',
		'created_after',
	]
	for field, value in search.items():
		if not value:
			continue
		if 'id' == field:
			filter['ids'] = value
		elif field in time_fields:
			try:
				parsed = dateutil.parser.parse(value)
			except ValueError:
				filter[field] = 'bad_query'
			else:
				search[field] = parsed.strftime('%Y-%m-%dT%H:%M:%S.%f%z')
				filter[field] = parsed.timestamp()
		elif 'user_id' == field:
			filter['user_ids'] = value
		elif 'medium_id' == field:
			filter['medium_ids'] = value

	pagination = pagination_from_request('creation_time', 'desc', 0, 32)

	total_results = g.media.count_likes(filter=filter)
	results = g.media.search_likes(filter=filter, **pagination)

	user_ids = []
	medium_ids = []
	for result in results.values():
		user_ids.append(result.user_id)
		medium_ids.append(result.medium_id)

	users = g.accounts.search_users(filter={'ids': user_ids})
	media = g.media.search_media(filter={'ids': medium_ids})

	for result in results.values():
		if result.user_id in users:
			result.user = users.get(result.user_id)
		if result.medium_id in media:
			result.medium = media.get(result.medium_id)

	return render_template(
		'likes_list.html',
		results=results,
		search=search,
		pagination=pagination,
		total_results=total_results,
		total_pages=math.ceil(total_results / pagination['perpage']),
	)

# profiles
def require_profile_user(identifier):
	user = require_user(identifier=identifier)
	# hide non-active users from non-managers
	if (
			not user.is_active()
			and (
				not g.accounts.current_user
				or not g.accounts.current_user.has_permission(
					group_names='manager',
				)
			)
		):
		abort(404, 'User not found')
	return user

#TODO move get badges to supplemental script?
#TODO some way to do custom badges without having to come in here and edit things directly?
#TODO maybe later i guess
def get_badges(user):
	current_time = time.time()

	badges = []

	# account age badges
	user_account_age = current_time - user.creation_time
	if user_account_age >= 31536000:
		flavor = 'Egg'
		description = 'Account older than a year'
		badges.append({
			'name': 'old_timer_1',
			'display': 'Old timer 1',
			'title': flavor + ' (' + description + ')',
		})
	if user_account_age >= 63072000:
		flavor = 'Hatchling'
		description = 'Account older than 2 years'
		badges.append({
			'name': 'old_timer_2',
			'display': 'Old timer 2',
			'title': flavor + ' (' + description + ')',
		})
	if user_account_age >= 94608000:
		flavor = 'Fully grown'
		description = 'Account older than 3 years'
		badges.append({
			'name': 'old_timer_3',
			'display': 'Old timer 3',
			'title': flavor + ' (' + description + ')',
		})
	if user_account_age >= 126144000:
		flavor = 'Still growing'
		description = 'Account older than 4 years'
		badges.append({
			'name': 'old_timer_4',
			'display': 'Old timer 4',
			'title': flavor + ' (' + description + ')',
		})

	# authentication badges
	if (
			'local' in user.authentications
			or 'cert' in user.authentications
			or 'mail' in user.authentications
		):
		flavor = 'Self-sufficient'
		description = 'Authenticating with local account, client certificate, or mail'
		badges.append({
			'name': 'around_here',
			'display': 'Around here',
			'title': flavor + ' (' + description + ')',
		})
	if 'cert' in user.authentications:
		flavor = 'Using SSL on IRC too, probably'
		description = 'Authenticating with client certificate'
		badges.append({
			'name': 'hacker',
			'display': 'Hacker',
			'title': flavor + ' (' + description + ')',
		})
	if 'mail' in user.authentications:
		flavor = 'Your fortune: Good things will come to you by mail'
		description = 'Authenticating with one-time use tokens through mail'
		badges.append({
			'name': 'courier',
			'display': 'Courier',
			'title': flavor + ' (' + description + ')',
		})
	third_party_services = g.accounts.config['authentication_services'].copy()
	for local_authentication in ['local', 'cert', 'mail']:
		if local_authentication in third_party_services:
			del third_party_services[local_authentication]
	connected_third_party_service_total = 0
	extremely_online = True
	for service in third_party_services.keys():
		if service in user.authentications:
			connected_third_party_service_total += 1
			continue
		if service not in g.accounts.enabled_services:
			continue
		extremely_online = False

	if connected_third_party_service_total > 0:
		flavor = 'Convenient one-click sign-in'
		description = 'One third-party authentication connected'
		badges.append({
			'name': 'connected_1',
			'display': 'Connected 1',
			'title': flavor + ' (' + description + ')',
		})
	if connected_third_party_service_total > 1:
		flavor = 'Backup connection, in case you lose one'
		description = 'Two third-party authentications connected'
		badges.append({
			'name': 'connected_2',
			'display': 'Connected 2',
			'title': flavor + ' (' + description + ')',
		})
	if extremely_online:
		flavor = 'Radiating a powerful online presence'
		description = 'All third-party authentications connected'
		badges.append({
			'name': 'extremely_online',
			'display': 'Extremely online',
			'title': flavor + ' (' + description + ')',
		})

	# invites badges
	created_invites_total = g.accounts.count_invites(
		filter={'created_by_user_ids': user.id_bytes}
	)
	if created_invites_total:
		flavor = 'Hope for friends'
		description = 'Created an invite'
		badges.append({
			'name': 'rsvp_1',
			'display': 'RSVP 1',
			'title': flavor + ' (' + description + ')',
		})
	created_redeemed_invites_total = g.accounts.count_invites(
		filter={'created_by_user_ids': user.id_bytes, 'redeemed_after': 0}
	)
	if created_redeemed_invites_total:
		flavor = 'Friends are here'
		description = 'Had someone redeem an invite you created'
		badges.append({
			'name': 'rsvp_2',
			'display': 'RSVP 2',
			'title': flavor + ' (' + description + ')',
		})

	if g.persephone_config['optional_packages']['comments']:
		# comments badges
		created_comments_total = g.comments.count_comments(
			filter={'user_ids': user.id_bytes}
		)
		if created_comments_total:
			flavor = 'Chatty'
			description = 'Made a comment'
			badges.append({
				'name': 'conversationalist_1',
				'display': 'Conversationalist 1',
				'title': flavor + ' (' + description + ')',
			})
		if 10 <= created_comments_total:
			flavor = 'Really chatty'
			description = 'Made 10 comments'
			badges.append({
				'name': 'conversationalist_2',
				'display': 'Conversationalist 2',
				'title': flavor + ' (' + description + ')',
			})

	if g.persephone_config['optional_packages']['stickers']:
		# stickers badges
		collected_stickers_total = g.stickers.count_collected_stickers(
			filter={'user_ids': user.id_bytes}
		)
		if collected_stickers_total:
			flavor = 'Something to collect'
			description = 'Collected a sticker'
			badges.append({
				'name': 'sticker_collector_1',
				'display': 'Sticker collector 1',
				'title': flavor + ' (' + description + ')',
			})
		if 28 <= collected_stickers_total:
			flavor = 'A real collector'
			description = 'Collected 28 stickers'
			badges.append({
				'name': 'sticker_collector_2',
				'display': 'Sticker collector 2',
				'title': flavor + ' (' + description + ')',
			})
		sticker_placements_total = g.stickers.count_sticker_placements(
			filter={'user_ids': user.id_bytes}
		)
		if sticker_placements_total:
			flavor = 'Put a sticker up'
			description = 'Placed a sticker'
			badges.append({
				'name': 'sticker_maniac_1',
				'display': 'Sticker maniac 1',
				'title': flavor + ' (' + description + ')',
			})
		if 10 <= sticker_placements_total:
			flavor = 'Put a few stickers up'
			description = 'Placed 10 sticker'
			badges.append({
				'name': 'sticker_maniac_2',
				'display': 'Sticker maniac 2',
				'title': flavor + ' (' + description + ')',
			})

	# media badges
	media_likes_total = g.media.count_likes(
		filter={'user_ids': user.id_bytes}
	)
	if media_likes_total:
		flavor = 'Full of love'
		description = 'Liked a medium'
		badges.append({
			'name': 'likes_1',
			'display': 'Likes 1',
			'title': flavor + ' (' + description + ')',
		})
	if 10 <= media_likes_total:
		flavor = 'Full of lots of love'
		description = 'Liked 10 media'
		badges.append({
			'name': 'likes_2',
			'display': 'Likes 2',
			'title': flavor + ' (' + description + ')',
		})

	# subscription badges
	current_time = time.time()
	support_start = current_time
	support_total = 0
	# patreon
	if g.persephone_config['optional_packages']['patreon']:
		if 'patreon' in user.authentications:
			members = g.patreon.search_members(
				filter={'user_ids': int(user.authentications['patreon'].value)},
			)
			if members:
				# get oldest support start and largest support total
				# in case of multiple pledges
				for member in members.values():
					if not support_start:
						support_start = member.pledge_relationship_start_time
					elif member.pledge_relationship_start_time:
						support_start = min(
							support_start,
							member.pledge_relationship_start_time,
						)
					support_total = max(support_total, member.lifetime_support_cents)

	if 31536000 < current_time - support_start:
		flavor = 'Helping to keep the pantry stocked'
		description = 'Supported for 1 consecutive year'
		badges.append({
			'name': 'supporter_1',
			'display': 'Supporter 1',
			'title': flavor + ' (' + description + ')',
		})
	if 63072000 < current_time - support_start:
		flavor = 'Helping to keep the cold out'
		description = 'Supported for 2 consecutive years'
		badges.append({
			'name': 'supporter_2',
			'display': 'Supporter 2',
			'title': flavor + ' (' + description + ')',
		})
	if 94608000 < current_time - support_start:
		flavor = 'Helping keep the lights on'
		description = 'Supported for 3 consecutive years'
		badges.append({
			'name': 'supporter_3',
			'display': 'Supporter 3',
			'title': flavor + ' (' + description + ')',
		})
	if 126144000 < current_time - support_start:
		flavor = 'Helping keep things a little more comfortable'
		description = 'Supported for 4 consecutive years'
		badges.append({
			'name': 'supporter_4',
			'display': 'Supporter 4',
			'title': flavor + ' (' + description + ')',
		})
	if 5000 < support_total:
		flavor = 'In a position to give'
		description = 'Lifetime support total more than $50'
		badges.append({
			'name': 'big_support_1',
			'display': 'Big support 1',
			'title': flavor + ' (' + description + ')',
		})
	if 10000 < support_total:
		flavor = 'In a position to give more'
		description = 'Lifetime support total more than $100'
		badges.append({
			'name': 'big_support_2',
			'display': 'Big support 2',
			'title': flavor + ' (' + description + ')',
		})

	#TODO tegaki badges
	#created_tegaki_total = g.tegaki.count_tegaki(
	#	filter={'created_by_user_ids': user.id_bytes}
	#)
	#if created_tegaki_total:
	#	flavor = 'Art'
	#	description = 'Drew a tegaki'
	#	badges.append({
	#		'name': 'artist_1',
	#		'display': 'Artist 1',
	#		'title': flavor + ' (' + description + ')',
	#	})
	#if 10 <= created_tegaki_total:
	#	flavor = 'ART'
	#	description = 'Drew 10 tegaki'
	#	badges.append({
	#		'name': 'artist_2',
	#		'display': 'Artist 2',
	#		'title': flavor + ' (' + description + ')',
	#	})
	#created_pruned_tegaki_total = g.tegaki.count_tegaki(
	#	filter={'created_by_user_ids': user.id_bytes, 'pruned': True}
	#)
	#if created_tegaki_total:
	#	flavor = 'Impermanence'
	#	description = 'Had a tegaki prune'
	#	badges.append({
	#		'name': 'sand_manadala',
	#		'display': 'Sand mandala',
	#		'title': flavor + ' (' + description + ')',
	#	})
	return badges

@persephone.route('/<user_identifier>/badges')
def user_badges(user_identifier):
	user = require_profile_user(user_identifier)
	g.accounts.populate_user_authentications(user)
	return render_template(
		'user_badges.html',
		user=user,
		badges=get_badges(user),
	)

# self or manager check for likes and sticker placements
def require_self_or_manager(user):
	if (
			user.id != g.accounts.current_user.id
			and not g.accounts.current_user.has_permission(group_names='manager')
		):
		abort(403)

@persephone.route('/<user_identifier>/likes/manage')
@persephone.route('/<user_identifier>/likes/remove/<like_id>')
@require_sign_in
def user_liked_media_list(user_identifier, like_id=None):
	user = require_profile_user(user_identifier)
	require_self_or_manager(user)

	if like_id:
		like = g.media.get_like(like_id)
		if like:
			if like.user_id != g.accounts.current_user.id:
				require_permissions(group_names='manager')
			g.media.delete_like(like.id)
		if 'redirect_uri' in request.args:
			return redirect(request.args['redirect_uri'], code=303)
		return redirect(
			url_for(
				'user_liked_media_list',
				user_identifier=user.identifier,
			),
			code=303,
		)

	filter = {'user_ids': user.id_bytes}
	pagination = {
		'sort': 'creation_time',
		'order': 'desc',
		'page': 0,
		'perpage': 32,
	}
	if 'page' in request.args:
		pagination['page'] = int(request.args['page'])

	total_results = g.media.count_likes(filter=filter)
	results = g.media.search_likes(filter=filter, **pagination)

	medium_ids = []
	for result in results.values():
		if result.medium_id not in medium_ids:
			medium_ids.append(result.medium_id)

	media = g.media.search_media(filter={'ids': medium_ids})

	for result in results.values():
		result.medium = media.get(result.medium_id)

	return render_template(
		'user_likes_list.html',
		results=results,
		pagination=pagination,
		total_results=total_results,
		total_pages=math.ceil(total_results / pagination['perpage']),
		user=user,
	)

@persephone.route('/<user_identifier>/likes')
@persephone.route('/<user_identifier>/likes/<medium_id>')
@require_sign_in
def user_liked_media(user_identifier, medium_id=None):
	user = require_profile_user(user_identifier)
	require_self_or_manager(user)

	override_filters, management_mode, omit_future = build_search_override(user)
	override_filters['liked_by_user'] = user.id_bytes
	override_filters['default_sort'] = 'likes'
	override_tags={}

	return search_media(
		override_filters=override_filters,
		override_tags=override_tags,
		management_mode=management_mode,
		omit_future=omit_future,
		medium_id=medium_id,
		header=render_template(
			'user_liked_media_header.html',
			user_identifier=user_identifier,
		),
		user_identifier=user_identifier,
	)

@persephone.route('/<user_identifier>/stickers')
def user_collected_stickers(user_identifier):
	user = require_profile_user(user_identifier)
	g.accounts.populate_user_permissions(user)
	if '' in user.permissions:
		group_bits = user.permissions[''].group_bits
	else:
		group_bits = group_bits = 0
	potential_stickers = g.stickers.get_potential_stickers(group_bits)
	stickers = g.stickers.search_stickers()
	collected_stickers = g.stickers.search_collected_stickers(
		filter={'user_ids': user.id_bytes},
	)
	collected_sticker_ids = []
	for collected_sticker in collected_stickers.values():
		collected_sticker_ids.append(collected_sticker.sticker.id)
	for sticker in stickers.values():
		if sticker.id in collected_sticker_ids:
			sticker.collected = True
		elif sticker.id not in potential_stickers:
			stickers.remove(sticker)
	stickers_by_category = g.stickers.stickers_by_category(stickers)
	unique_sticker_placement_counts = g.stickers.get_user_unique_sticker_placement_counts(
		user.id_bytes
	)
	for category, stickers in stickers_by_category.items():
		for sticker in stickers:
			if sticker.id in unique_sticker_placement_counts:
				sticker.unique_placements_count = unique_sticker_placement_counts[sticker.id]
	return render_template(
		'user_stickerbook.html',
		user=user,
		total_potential_stickers=len(potential_stickers),
		total_collected_stickers=len(collected_stickers),
		stickers_by_category=stickers_by_category,
	)

@persephone.route('/<user_identifier>/stickers/<sticker_id>')
@persephone.route('/<user_identifier>/stickers/<sticker_id>/<medium_id>')
@require_sign_in
def user_sticker_placements(user_identifier, sticker_id, medium_id=None):
	user = require_profile_user(user_identifier)
	require_self_or_manager(user)
	if (
			user.id != g.accounts.current_user.id
			and not g.accounts.current_user.has_permission(group_names='manager')
		):
		abort(403)

	sticker = g.stickers.get_sticker(sticker_id)
	if not sticker:
		abort(404)

	# get media ids this sticker was placed on
	# this isn't going to be particularly efficient
	# for users that have placed a lot of stickers
	# since it's sending a large list of medium ids
	# to the search_media filter
	# maybe at least check to see if both media and stickers are
	# configured to use the same db, and then write some special
	# cross-db methods just for this?
	sticker_placements = g.stickers.search_sticker_placements(
		filter={
			'user_ids': user.id_bytes,
			'sticker_ids': sticker.id,
		},
	)
	medium_ids = []
	for sticker_placement in sticker_placements.values():
		if sticker_placement.subject_id_bytes not in medium_ids:
			medium_ids.append(sticker_placement.subject_id_bytes)

	override_filters, management_mode, omit_future = build_search_override(user)
	override_filters['ids'] = medium_ids

	return search_media(
		override_filters=override_filters,
		management_mode=management_mode,
		omit_future=omit_future,
		medium_id=medium_id,
		header=render_template(
			'user_sticker_placements_header.html',
			sticker=sticker,
		),
		user_identifier=user_identifier,
		sticker_id=sticker.id,
	)

@persephone.route('/<user_identifier>/media/rss')
def search_user_media_rss(user_identifier):
	return search_user_media(user_identifier=user_identifier, rss=True)

@persephone.route('/<user_identifier>/media')
@persephone.route('/<user_identifier>/media/<medium_id>', methods=['GET', 'POST'])
def search_user_media(user_identifier, medium_id=None, rss=False):
	if not rss and not terms_agreed():
		return terms(agreement_form=True, user_identifier=user_identifier, medium_id=medium_id)
	user = require_profile_user(user_identifier)
	override_filters, management_mode, omit_future = build_search_override(user)
	if (
			not g.persephone_config['public_contributors']
			or user.id in g.persephone_config['public_contributors']
		):
		override_filters['owner_ids'] = user.id_bytes
	else:
		# force no results
		override_filters['smaller_than'] = 0
	return search_media(
		override_filters=override_filters,
		management_mode=management_mode,
		omit_future=omit_future,
		medium_id=medium_id,
		rss=rss,
		rss_endpoint='persephone.search_user_media_rss',
		rss_media_endpoint='persephone.search_user_media',
		user_identifier=user_identifier,
	)

@persephone.route('/profile')
@persephone.route('/<user_identifier>')
def user_profile(user_identifier=None):
	if not user_identifier:
		if not g.accounts.current_user:
			return redirect(url_for('home'), code=307)
		user = g.accounts.current_user
	else:
		user = require_profile_user(user_identifier)

	g.accounts.populate_user_permissions(user)
	g.accounts.populate_user_authentications(user)

	cards = []

	badges = get_badges(user)
	if badges:
		cards.append({
			'name': 'badges',
			'display': len(badges),
			'title': '{} badges'.format(len(badges)),
			'uri': url_for('persephone.user_badges', user_identifier=user.identifier),
		})

	# media card
	if user.has_permission(group_names='contributor'):
		override_filters, management_mode, omit_future = build_search_override(user)
		if (
				not g.persephone_config['public_contributors']
				or user.id in g.persephone_config['public_contributors']
			):
			override_filters['owner_ids'] = user.id_bytes
		else:
			# force no results
			override_filters['smaller_than'] = 0
		if omit_future:
			override_filters['created_before'] = int(time.time())
		total_media = g.media.count_media(filter=override_filters)
		if total_media:
			cards.append({
				'name': 'media',
				'display': total_media,
				'title': '{} media'.format(total_media),
				'uri': url_for('persephone.search_user_media', user_identifier=user.identifier),
			})

	# liked media card (unique user likes only)
	total_likes = g.media.engine_session.query(
			g.media.likes.c.medium_id
		).filter(
			g.media.likes.c.user_id == user.id_bytes
		).group_by(g.media.likes.c.medium_id).count()
	if total_likes:
		likes_card = {
			'name': 'likes',
			'display': total_likes,
			'title': '{} liked media'.format(total_likes),
		}
		if (
				g.accounts.current_user
				and g.accounts.current_user.has_permission(group_names='manager')
			):
			likes_card['uri'] = url_for(
				'persephone.user_liked_media',
				user_identifier=user.identifier,
			)
		cards.append(likes_card)

	#TODO tegaki card

	# comment card
	if g.persephone_config['optional_packages']['comments']:
		total_comments = g.comments.count_comments(filter={'user_ids': user.id_bytes})
		if total_comments:
			comment_card = {
				'name': 'comments',
				'display': total_comments,
				'title': '{} comments'.format(total_comments),
			}
			if (
					g.accounts.current_user
					and g.accounts.current_user.has_permission(group_names='manager')
				):
				comment_card['uri'] = url_for(
					'comments_manager.comments_list',
					user_id=user.id,
				)
			cards.append(comment_card)

	# stickers card
	if g.persephone_config['optional_packages']['stickers']:
		total_collected_stickers = g.stickers.count_collected_stickers(
			filter={'user_ids': user.id_bytes},
		)
		if total_collected_stickers:
			stickers_card = {
				'name': 'stickers',
				'display': total_collected_stickers,
				'title': '{} stickers'.format(total_collected_stickers),
			}
			stickers_card['uri'] = url_for(
				'persephone.user_collected_stickers',
				user_identifier=user.identifier,
			)
			cards.append(stickers_card)

	groups = []
	inactive_groups = []
	for group in g.accounts.available_groups:
		if user.has_permission(group_names=group):
			groups.append(group)
		elif group in g.accounts.config['always_visible_profile_groups']:
			groups.append(group)
			inactive_groups.append(group)

	return render_template(
		'user_profile.html',
		user=user,
		cards=cards,
		groups=groups,
		inactive_groups=inactive_groups,
	)





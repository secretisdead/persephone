'use strict';

import { TagsField } from './tagsfield.js';
import { disallowed_edit_tag_prefixes } from './disallowed_edit_tag_prefixes.js';
import { autocopy } from './autocopy.js';
import { add_thumbnail_preview } from './thumbnail_preview.js';

class Manage {
	constructor() {
		this.drawer = document.querySelector('#manage_media_drawer');
		this.panels = document.querySelector('#manage_media_panels');
		this.form = document.querySelector('#manage_media_form');
		this.generate_tag_suggestions = false;
		//TODO use modifiers for keys so that select all/none can be ctrl+a and ctrl+d
		this.keys = {
			exit_management: 'Escape',
			toggle_management: 'e',
			add_tags: 't',
			searchability: 'v',
			generate_set: 'g',
			select_all: '=',
			select_none: '-',
			remove: 'Delete',
			select_add: 'Shift',
			select_negate: 'Control',
		};
		this.select_add = false;
		this.select_negate = false;

		// listener for shortcut keys
		window.addEventListener('keydown', e => {
			if (this.keys.exit_management == e.key) {
				if (document.documentElement.classList.contains('active_panel')) {
					this.hide_panels();
					return;
				}
				this.exit_management();
				return;
			}
			if (this.keys.select_add == e.key) {
				this.select_add = true;
			}
			if (this.keys.select_negate == e.key) {
				this.select_negate = true;
			}
			// ignore other management keys if in an input
			if (
				'INPUT' == document.activeElement.tagName
				|| 'TEXTAREA' == document.activeElement.tagName
			) {
				return;
			}
			if (this.keys.toggle_management == e.key) {
				this.toggle_management();
				return;
			}
			// ignore following shortcut keys if not in management mode
			if (!document.documentElement.classList.contains('managing_media')) {
				return;
			}
			if (this.keys.select_all == e.key) {
				this.select_all();
				return;
			}
			if (this.keys.select_none == e.key) {
				this.select_none();
				return;
			}
			// ignore following shortcut keys if no media are selected
			if (0 == document.documentElement.dataset.selection_total) {
				return;
			}
			if (this.keys.add_tags == e.key) {
				this.add_tags();
			}
			else if (this.keys.searchability == e.key) {
				this.searchability();
			}
			else if (this.keys.generate_set == e.key) {
				this.generate_set();
			}
			else if (this.keys.remove == e.key) {
				this.remove();
			}
		});
		window.addEventListener('keyup', e => {
			if (this.keys.select_add == e.key) {
				this.select_add = false;
			}
			if (this.keys.select_negate == e.key) {
				this.select_negate = false;
			}
		});
		this.selection_total = this.drawer.querySelector('#selected_media_total');
		this.selection_total.dataset.count = 0;

		// highlight selected media when hovering over drawer
		this.drawer.addEventListener('mouseover', e => {
			document.documentElement.classList.add('highlight_selected');
		});
		this.drawer.addEventListener('mouseout', e => {
			document.documentElement.classList.remove('highlight_selected');
		});

		// select/deselect listeners to thumbnails
		let thumbnails = document.querySelectorAll('.thumbnail');
		this.iterate_thumbnails(thumbnails, (thumbnail) => {
			this.add_thumbnail_listener(thumbnail);
		});


		// add management link to navigation
		let manage_link = document.createElement('a');
		manage_link.id = 'manage_media_toggle';
		manage_link.innerText = 'Manage';
		//TODO get manage link text from data attribute somewhere in management panel
		manage_link.innerText = 'Manage';
		let topmenu = document.querySelector('#topmenu');
		if (topmenu) {
			manage_link.style.opacity = '0';
			manage_link.style.transition = 'opacity 250ms';
			topmenu.appendChild(manage_link);
			setTimeout(() => {
				manage_link.style.opacity = '';
			}, 10);
		}
		else {
			document.querySelector('.media_navigation').appendChild(manage_link);
		}

		// manage topmenu link listener
		manage_link.addEventListener('click', () => {
			this.toggle_management();
		});

		// create tags field
		this.tags_field = new TagsField(
			disallowed_edit_tag_prefixes,
			this.form.dataset.placeholder,
			this.form.dataset.removeTag
		);
		// add classes to tags field components
		this.tags_field.preview.classList.add('tags_preview');
		// wrap tags field preview
		this.tags_field.preview_wrapper = document.createElement('div');
		this.tags_field.preview_wrapper.classList.add('tags_preview_wrapper');
		this.tags_field.preview_wrapper.append(this.tags_field.preview);
		// store reference to management in tags field
		this.tags_field.manage = this;
		// save handler
		this.tags_field.save = function() {
			if (this.input.value) {
				// commit any tag still in input
				this.add_tags(this.to_list(this.input.value));
				this.clear_input();
			}
			// current tags in current form tags input
			this.input.parentNode.querySelector('[name="tags"]').value = this.to_string(this.tags_list);
		}.bind(this.tags_field);
		// only fetch tag suggestions on first search input focus
		tags_field.input.addEventListener('focus', e => {
			if (e.currentTarget.hasOwnProperty('fetched')) {
				return;
			}
			e.currentTarget.fetched = true;
			// fetch suggestions
			this.tags_field.fetch_suggestions();
			// create suggestions list (excluding search suggestions)
			let tag_suggestion_lists = document.querySelectorAll('meta[name="tag_suggestion_list"]');
			let excluded_lists = [];
			for (let i = 0; i < tag_suggestion_lists.length; i++) {
				let list_uri = tag_suggestion_lists[i].getAttribute('content');
				let list_uri_pieces = list_uri.replace('\\', '/').split('/');
				if ('search' == list_uri_pieces[list_uri_pieces.length - 1].substr(0, 6)) {
					excluded_lists.push(list_uri);
				}
			}
			this.tags_field.create_suggestions_list(excluded_lists);
		});

		// manage action buttons
		let actions = [
			'generate_summaries',
			'remove',
			'generate_set',
			'copy_tags',
			'add_tags',
			'remove_tags',
			'select_all',
			'select_none',
		];
		for (let i = 0; i < actions.length; i++) {
			let action = actions[i];
			let action_button = this.drawer.querySelector('#manage_media_' + action);
			if (!action_button) {
				continue;
			}
			action_button.addEventListener('click', () => {
				this[action]();
			});
		}
		// manage panel buttons
		let panels = [
			'owner',
			'creation',
			'groups',
			'searchability',
			'protection',
		];
		for (let i = 0; i < panels.length; i++) {
			let panel = panels[i];
			let panel_button = this.drawer.querySelector('#manage_media_' + panel);
			if (!panel_button) {
				continue;
			}
			panel_button.addEventListener('click', e => {
				this.form.action = this.form.dataset.actionEdit;
				this.toggle_panel(e.currentTarget.id.substring(13));
			});
		}

		// dim background for active panel
		this.dim = document.createElement('div');
		this.dim.classList.add('media_management_dim');
		document.body.appendChild(this.dim);
		this.dim.addEventListener('click', (e) => {
			this.hide_panels();
		});

		// drag to select
		this.drag_origin = {
			x: 0,
			y: 0,
		};
		this.blank = document.createElement('img');
		// transparent pixel to hide generated ghost while dragging
		this.blank.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
		this.blank.id = 'blank';
		this.selection_box = document.createElement('span');
		this.selection_box.id = 'selection_box';
		this.hide_selection_box();
		document.body.appendChild(this.blank);
		document.body.appendChild(this.selection_box);
		document.body.addEventListener('dragstart', (e) => {
			if (
				!document.documentElement.classList.contains('managing_media')
				|| document.documentElement.classList.contains('active_panel')
			) {
				return;
			}
			this.show_selection_box();
			e.dataTransfer.setDragImage(this.blank, 0, 0);
			this.drag_origin.x = e.pageX;
			this.drag_origin.y = e.pageY;
		});
		document.body.addEventListener('drag', (e) => {
			if (document.documentElement.classList.contains('active_panel')) {
				return;
			}
			this.update_selection_box(e.pageX, e.pageY);
		});
		document.body.addEventListener('dragend', (e) => {
			e.preventDefault();
			if (document.documentElement.classList.contains('active_panel')) {
				return;
			}
			if (document.documentElement.classList.contains('managing_media')) {
				this.update_selection_box(e.pageX, e.pageY);
				this.selection_from_drag();
			}
			this.hide_selection_box();
		});

		this.form.addEventListener('submit', (e) => {
			e.preventDefault();
			let tags_input = this.form.querySelector('input[name="tags"]');
			if (tags_input) {
				this.tags_field.save();
				this.generate_tag_suggestions = true;
			}
			let selected = document.querySelectorAll('.selected');
			this.iterate_thumbnails(selected, (thumbnail) => {
				this.api_request(
					'POST',
					this.form.action,
					new FormData(this.form),
					thumbnail
				);
			});
			this.hide_panels();
		});

		// add listener for leaving page to check if any requests are still processing
		window.addEventListener('beforeunload', e => {
			if (document.querySelector('.processing')) {
				(e || window.event).returnValue = true;
				return true;
			}
		});
	}
	add_thumbnail_listener(thumbnail) {
		thumbnail.addEventListener('click', (e) => {
			if (!document.documentElement.classList.contains('managing_media')) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			if (document.documentElement.classList.contains('active_panel')) {
				this.hide_panels();
				return;
			}
			this.toggle_select(e.currentTarget)
			this.update_selection_total();
		});
	}
	clear_result(thumbnail) {
		thumbnail.classList.remove('success');
		thumbnail.classList.remove('failure');
	}
	toggle_select(thumbnail) {
		this.clear_result(thumbnail);
		thumbnail.classList.toggle('selected');
	}
	select(thumbnail) {
		this.clear_result(thumbnail);
		thumbnail.classList.add('selected');
	}
	deselect(thumbnail) {
		this.clear_result(thumbnail);
		thumbnail.classList.remove('selected');
	}
	hide_selection_box() {
		let items = [
			'blank',
			'selection_box',
		];
		for (let i = 0; i < items.length; i++) {
			let item = items[i];
			this[item].style.display = 'none';
			this[item].style.left = '0';
			this[item].style.top = '0';
			this[item].style.width = '0';
			this[item].style.height = '0';
		}
	}
	show_selection_box() {
		this.blank.style.display = 'inline-block';
		this.blank.style.width = '2px';
		this.blank.style.height = '2px';
		this.selection_box.style.display = 'inline-block';
	}
	update_selection_box(page_x, page_y) {
		if (page_x < this.drag_origin.x) {
			this.selection_box.style.left = page_x + 'px';
			this.selection_box.style.width = this.drag_origin.x - page_x + 'px';
		}
		else {
			this.selection_box.style.left = this.drag_origin.x + 'px';
			this.selection_box.style.width = page_x - this.drag_origin.x + 'px';
		}
		if (page_y < this.drag_origin.y) {
			this.selection_box.style.top = page_y + 'px';
			this.selection_box.style.height = this.drag_origin.y - page_y + 'px';
		}
		else {
			this.selection_box.style.top = this.drag_origin.y + 'px';
			this.selection_box.style.height = page_y - this.drag_origin.y + 'px';
		}
	}
	selection_from_drag() {
		// replace
		if (
			!this.select_add
			&& !this.select_negate
		) {
			this.select_none();
		}
		let r1 = this.selection_box.getBoundingClientRect();
		let thumbnails = document.querySelectorAll('.thumbnail');
		this.iterate_thumbnails(thumbnails, (thumbnail) => {
			let r2 = thumbnail.getBoundingClientRect()
			if (
				!(
					r2.left > r1.right
					|| r2.right < r1.left
					|| r2.top > r1.bottom
					|| r2.bottom < r1.top
				)
			) {
				if (this.select_negate) {
					this.deselect(thumbnail);
				}
				else {
					this.select(thumbnail);
				}
			}
		})
		this.update_selection_total();
	}
	enter_management() {
		this.select_none();
		this.hide_panels();
		document.documentElement.classList.add('managing_media');
		let blacklisted = document.querySelectorAll('.thumbnail.blacklist');
		if (blacklisted) {
			this.iterate_thumbnails(blacklisted, thumbnail => {
				thumbnail.classList.add('not_blacklist');
				thumbnail.classList.remove('blacklist');
			});
		}
	}
	exit_management() {
		document.documentElement.classList.remove('managing_media');
		this.select_none();
		this.hide_panels();
		let blacklisted = document.querySelectorAll('.thumbnail.not_blacklist');
		if (blacklisted) {
			this.iterate_thumbnails(blacklisted, thumbnail => {
				thumbnail.classList.add('blacklist');
				thumbnail.classList.remove('not_blacklist');
			});
		}
	}
	toggle_management() {
		document.documentElement.classList.toggle('managing_media');
		if (document.documentElement.classList.contains('managing_media')) {
			this.enter_management();
		}
		else {
			this.exit_management();
		}
	}
	show_panel(panel) {
		this.hide_panels();
		let panel_el = this.panels.querySelector('#manage_media_panel_' + panel);
		if (!panel_el) {
			return;
		}
		this.form.insertBefore(panel_el, this.form.firstChild);
		document.documentElement.classList.add('active_panel');
	}
	hide_panels() {
		document.documentElement.classList.remove('active_panel');
		let panels = this.form.querySelectorAll('.manage_media_panel');
		for (let i = panels.length - 1; 0 <= i; i--) {
			this.panels.appendChild(panels[i]);
		}
	}
	toggle_panel(panel) {
		if (this.form.querySelector('#manage_media_panel_' + panel)) {
			this.hide_panels();
		}
		else {
			this.show_panel(panel);
		}
	}
	iterate_thumbnails(thumbnails, cb) {
		let reversed_array = [];
		for (let i = thumbnails.length - 1; 0 <= i; i--) {
			reversed_array.push(thumbnails[i]);
		}
		reversed_array = reversed_array.reverse();
		for (let i = 0; i < reversed_array.length; i++) {
			cb(reversed_array[i]);
		}
	}
	api_request(method, action, fd, thumbnails, cb) {
		let xhr = new XMLHttpRequest();
		if (NodeList !== thumbnails.constructor) {
			thumbnails = [thumbnails];
		}
		else {
			thumbnails = Array.prototype.slice.call(thumbnails);
		}
		let medium_ids = [];
		this.iterate_thumbnails(thumbnails, (thumbnail) => {
			medium_ids.push(thumbnail.dataset.id);
		});
		fd.append('medium_ids', medium_ids);
		xhr.thumbnails = thumbnails;
		xhr.cb = cb;
		fd.append('response_type', 'json');
		xhr.responseType = 'json';
		xhr.onreadystatechange = () => {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				this.iterate_thumbnails(xhr.thumbnails, (thumbnail) => {
					thumbnail.classList.remove('processing');
				});
				if (this.generate_tag_suggestions) {
					let processing = document.querySelectorAll('.thumbnail.processing');
					if (!processing.length) {
						// send build tag suggestions api request
						let tags_action = this.form.dataset.actionBuildTagSuggestions;
						let tags_xhr = new XMLHttpRequest();
						tags_xhr.open(
							'POST',
							tags_action + (-1 != tags_action.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(),
							true
						);
						tags_xhr.withCredentials = true;
						let tags_fd = new FormData();
						tags_xhr.send(tags_fd);
						this.generate_tag_suggestions = false;
					}
				}
				if (xhr.cb) {
					xhr.cb(xhr);
				}
				if (200 == xhr.status) {
					if (!xhr.response) {
						return;
					}
					if (xhr.response.hasOwnProperty('media')) {
						for (let medium_id in xhr.response.media) {
							let thumbnail = document.querySelector('[data-id="' + medium_id + '"]');
							if (!thumbnail) {
								continue;
							}
							let response_medium = xhr.response.media[medium_id];
							if (response_medium.hasOwnProperty('failure')) {
								thumbnail.classList.add('failure');
							}
							else if (response_medium.hasOwnProperty('remove')) {
								thumbnail.parentNode.removeChild(thumbnail);
							}
							else if (response_medium.hasOwnProperty('thumbnail')) {
								let temp = document.createElement('div');
								temp.innerHTML = response_medium.thumbnail;
								let new_thumbnail = temp.querySelector('.thumbnail');
								new_thumbnail.classList.add('selected');
								// add management listener
								this.add_thumbnail_listener(new_thumbnail);
								// preserve view url
								new_thumbnail.querySelector('a').href = thumbnail.querySelector('a').href;
								// preserve comment and sticker counts
								// since the media package doesn't know about them or how to get them
								// maybe monkeypatch populate_media_properties from persephone proper later?
								let new_summary = new_thumbnail.querySelector('.summary');
								let counters = ['sticker', 'comment'];
								for (let i = 0; i < counters.length; i++) {
									let counter = thumbnail.querySelector('.' + counters[i] + '_count');
									if (counter) {
										new_summary.parentNode.insertBefore(counter, new_summary.nextSibling);
									}
								}
								// preserve blacklist
								if (thumbnail.classList.contains('not_blacklist')) {
									new_thumbnail.classList.add('not_blacklist');
								}
								// replace entire thumbnail
								thumbnail.parentNode.insertBefore(new_thumbnail, thumbnail);
								thumbnail.parentNode.removeChild(thumbnail);
								// if thumbnail has preview then add hover preview listener
								if (new_thumbnail.dataset.hasOwnProperty('preview')) {
									add_thumbnail_preview(new_thumbnail);
								}
								xhr.thumbnails.push(new_thumbnail);
							}
						}
					}
					this.iterate_thumbnails(xhr.thumbnails, (thumbnail) => {
						thumbnail.classList.add('success');
						setTimeout(() => {
								thumbnail.classList.remove('success');
						}, 2000);
					});
				}
				else {
					this.iterate_thumbnails(xhr.thumbnails, (thumbnail) => {
						thumbnail.classList.add('failure');
					});
				}
			}
		};
		this.iterate_thumbnails(xhr.thumbnails, (thumbnail) => {
			this.clear_result(thumbnail);
			thumbnail.classList.add('processing');
		});
		xhr.open(
			method,
			action + (-1 != action.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(),
			true
		);
		xhr.withCredentials = true;
		xhr.send(fd);
	}
	generate_summaries() {
		this.hide_panels();
		let selected = document.querySelectorAll('.selected');
		this.iterate_thumbnails(selected, (thumbnail) => {
			this.api_request(
				'POST',
				this.form.dataset.actionGenerateSummaries,
				new FormData(),
				thumbnail
			);
		});
	}
	remove() {
		if (!confirm(this.form.dataset.confirmRemove)) {
			return;
		}
		this.hide_panels();
		let selected = document.querySelectorAll('.selected');
		this.iterate_thumbnails(selected, (thumbnail) => {
			this.api_request(
				'POST',
				this.form.dataset.actionRemove,
				new FormData(),
				thumbnail
			);
		});
	}
	generate_set() {
		let fd = new FormData();
		let sync = false;
		let selected = document.querySelectorAll('.selected');
		for (let i = 0; i < selected.length; i++) {
			if (-1 != selected[i].title.indexOf('#set:')) {
				sync = true;
				break;
			}
		}
		if (!sync) {
			if (!confirm(this.form.dataset.confirmGenerateSet)) {
				return;
			}
		}
		else if (confirm(this.form.dataset.confirmSyncSets)) {
			fd.append('sync', '1');
		}
		else if (!confirm(this.form.dataset.confirmGenerateSet)) {
			return;
		}
		this.hide_panels();
		this.api_request(
			'POST',
			this.form.dataset.actionGenerateSet,
			fd,
			selected
		);
	}
	copy_tags() {
		this.hide_panels();
		let selected = document.querySelectorAll('.selected');
		let tags = [];
		this.iterate_thumbnails(selected, (thumbnail) => {
			if (!thumbnail.title) {
				return;
			}
			let current_tags = thumbnail.title.split('#');
			for (let i = 0; i < current_tags.length; i++) {
				let current_tag = current_tags[i];
				if (!current_tag || -1 != tags.indexOf(current_tag)) {
					continue;
				}
				tags.push(current_tag);
			}
		});
		if (0 == tags.length) {
			alert(this.form.dataset.noTags);
			return;
		}
		tags.sort();
		let tags_string = '#' + tags.join('#');
		autocopy(
			tags_string,
			this.form.dataset.autocopyAlert,
			this.form.dataset.copyAlert
		);
	}
	add_tags() {
		this.form.action = this.form.dataset.actionAddTags;
		this.move_tags_field('add');
		this.toggle_panel('add_tags');
	}
	remove_tags() {
		this.form.action = this.form.dataset.actionRemoveTags;
		this.move_tags_field('remove');
		this.toggle_panel('remove_tags');
	}
	move_tags_field(mode) {
		this.tags_field.clear();
		let tags_panel = this.panels.querySelector('#manage_media_panel_' + mode + '_tags');
		tags_panel.insertBefore(this.tags_field.input, tags_panel.firstChild);
		tags_panel.insertBefore(this.tags_field.preview_wrapper, tags_panel.firstChild);
		setTimeout(() => {
			this.tags_field.input.focus();
		}, 1);
	}
	select_all() {
		let thumbnails = document.querySelectorAll('.thumbnail');
		this.iterate_thumbnails(thumbnails, (thumbnail) => {
			this.select(thumbnail);
		});
		this.update_selection_total();
	}
	select_none() {
		let selected = document.querySelectorAll('.selected');
		this.iterate_thumbnails(selected, (thumbnail) => {
			this.deselect(thumbnail);
		});
		this.update_selection_total();
	}
	update_selection_total() {
		let selected = document.querySelectorAll('.selected');
		let thumbnails = document.querySelectorAll('.thumbnail');
		if (selected.length == thumbnails.length) {
			document.documentElement.dataset.selection_total = 'all';
			this.selection_total.innerText = this.selection_total.dataset.all;
		}
		else {
			document.documentElement.dataset.selection_total = selected.length;
			this.selection_total.innerText = document.documentElement.dataset.selection_total;
		}
	}
};

let manage = new Manage();

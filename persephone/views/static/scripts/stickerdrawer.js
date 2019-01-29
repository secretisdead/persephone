'use strict';

import { add_sticker_category_selector_listeners, align_category_selection_indicator } from './sticker_category_selection_indicator.js';
import { place_sticker } from './sticker_targets.js';

export class StickerDrawer {
	constructor() {
		this.sticker_drawer = document.querySelector('#sticker_drawer');
		if (!this.sticker_drawer) {
			return;
		}

		add_sticker_category_selector_listeners();

		// dim overlay
		this.dim = document.createElement('div');
		this.dim.classList.add('stickers_dim');
		document.body.appendChild(this.dim);
		//TODO add drop off of target (on dim) listener
		this.dim.addEventListener('mouseup', e => {
			this.drop();
		});
		this.sticker_drawer.addEventListener('mouseup', e => {
			this.drop();
		});
		let topmenu = document.querySelector('#topmenu');
		if (topmenu) {
			topmenu.addEventListener('mouseup', e => {
				this.drop();
			});
		}

		// add listeners to drawer stickers
		let drawer_stickers = this.sticker_drawer.querySelectorAll('.sticker');
		for (let i = 0; i < drawer_stickers.length; i++) {
			let drawer_sticker = drawer_stickers[i];
			drawer_sticker.dataset.userId = this.sticker_drawer.dataset.userId;
			drawer_sticker.classList.add('pickable');
			drawer_sticker.addEventListener('mousedown', e => {
				if (3 === e.which) {
					return;
				}
				e.preventDefault();
				if ('comment_body' == document.activeElement.id) {
					this.insert_comment_sticker(document.activeElement, e.currentTarget);
				}
				else if (0 < document.querySelectorAll('.sticker_target').length) {
					this.pick(e.currentTarget);
				}
			});
		}

		// add listeners to comments
		let comment_body = document.querySelector('#comment_body');
		if (comment_body) {
			comment_body.addEventListener('focus', e => {
				document.documentElement.classList.add('comment_active');
			});
			comment_body.addEventListener('blur', e => {
				document.documentElement.classList.remove('comment_active');
			});
		}

		// populate categories
		this.categories = Array.prototype.slice.call(this.sticker_drawer.querySelectorAll('.sticker_category'));
		for (let i = 0; i < this.categories.length; i++) {
			this.categories[i].style.display = 'none';
		}
		this.current_category = this.categories[0];
		this.current_page = 0;

		// add listeners to category selectors
		let category_selectors = this.sticker_drawer.querySelectorAll('#sticker_categories a');
		for (let i = 0; i < category_selectors.length; i++) {
			category_selectors[i].addEventListener('click', e => {
				this.show_category(
					this.sticker_drawer.querySelector(
						'.sticker_category[data-category="' + e.currentTarget.dataset.category + '"]'
					)
				);
				this.show_page(0);
			});
		}

		// add listeners to drawer next/prev
		this.prev_page_button = this.sticker_drawer.querySelector('.stickers_prev');
		this.prev_page_button.addEventListener('click', (e) => {
			this.show_page(this.current_page - 1);
		});
		this.next_page_button = this.sticker_drawer.querySelector('.stickers_next');
		this.next_page_button.addEventListener('click', (e) => {
			this.show_page(this.current_page + 1);
		});

		// sticker dimensions
		this.sticker_full_edge = document.querySelector('meta[name="sticker_edge"]').content;
		this.drawer_sticker_edge = this.prev_page_button.clientWidth;
		this.drawer_sticker_margin = this.prev_page_button.getBoundingClientRect().left;

		// paginate drawer and add listener to resize
		this.perpage = -1;
		this.drawer_pagination();
		window.addEventListener('resize', e => {
			this.drawer_pagination();
		});

		this.held_sticker = null;
		this.dim.addEventListener('mouseup', e => {
			this.drop();
		});

		// add sticker drop listener to targets
		let sticker_targets = document.querySelectorAll('.sticker_target');
		for (let i = 0; i < sticker_targets.length; i++) {
			let sticker_target = sticker_targets[i];
			this.add_target_listener(sticker_target);
			// add pick listener to existing stickers that belong to current drawer owner
			let stickers = sticker_target.querySelectorAll('.sticker[data-user_id="' + this.sticker_drawer.dataset.userId + '"]');
			for (let j = 0; j < stickers.length; j++) {
				this.add_pick_from_target_listener(stickers[j]);
			}
		}

		// add pick from target listeners
		let stickers = document.querySelectorAll('.sticker_target .sticker');
		for (let i = 0; i < stickers.length; i++) {
			let sticker = stickers[i];
			if (sticker.dataset.userId != this.sticker_drawer.dataset.userId) {
				continue;
			}
			this.add_pick_from_target_listener(sticker);
			sticker.classList.add('pickable');
		}

		this.sticker_drawer.classList.add('loaded');
	}
	drawer_pagination() {
		// get category width
		let sticker_category = this.sticker_drawer.querySelector('.sticker_category');
		let current_display = sticker_category.style.display;
		let current_visibility = sticker_category.style.visibility;
		sticker_category.style.display = 'block';
		sticker_category.style.visibility = 'hidden';
		let available_width = sticker_category.clientWidth;
		sticker_category.style.display = current_display;
		sticker_category.style.visibility = current_visibility;
		// get perpage
		let sticker_width = this.drawer_sticker_edge + (this.drawer_sticker_margin * 2);
		let new_perpage = Math.floor(available_width / sticker_width);
		if (new_perpage == this.perpage) {
			align_category_selection_indicator(
				this.sticker_drawer.querySelector(
					'#sticker_categories a[data-category="' + this.current_category.dataset.category + '"]'
				)
			);
			return;
		}
		this.perpage = new_perpage;
		for (let i = 0; i < this.categories.length; i++) {
			let category = this.categories[i];
			category.pages = [];
			let stickers = category.querySelectorAll('.sticker');
			let page = [];
			for (let j = 0; j < stickers.length; j++) {
				page.push(stickers[j]);
				if (page.length == this.perpage) {
					category.pages.push(page);
					page = [];
				}
			}
			if (0 < page.length) {
				category.pages.push(page);
			}
		}
		this.show_category(this.current_category);
		this.show_page(0);
	}
	next_category() {
		let next_category_index = this.categories.indexOf(this.current_category) + 1;
		if (next_category_index >= this.categories.length) {
			next_category_index = 0;
		}
		this.show_category(this.categories[next_category_index]);
		this.show_page(0);
	}
	prev_category() {
		let prev_category_index = this.categories.indexOf(this.current_category) - 1;
		if (0 > prev_category_index) {
			prev_category_index = this.categories.length - 1;
		}
		this.show_category(this.categories[prev_category_index]);
		this.show_page('last');
	}
	show_page(page) {
		if ('last' == page) {
			page = this.current_category.pages.length - 1;
		}
		if (0 > page) {
			this.prev_category();
			return;
		}
		if (page >= this.current_category.pages.length) {
			this.next_category();
			return;
		}
		this.current_page = page;
		let page_stickers = null;
		page_stickers = this.current_category.pages[this.current_page];
		let stickers = this.current_category.querySelectorAll('.sticker');
		for (let i = 0; i < stickers.length; i++) {
			let sticker = stickers[i];
			if (-1 === page_stickers.indexOf(sticker)) {
				sticker.style.display = 'none';
			}
			else {
				sticker.style.display = 'inline-block';
			}
		}
	}
	show_category(category) {
		for (let i = 0; i < this.categories.length; i++) {
			if (category != this.categories[i]) {
				this.categories[i].style.display = 'none';
			}
		}
		category.style.display = 'block';
		let category_selector = this.sticker_drawer.querySelector(
			'#sticker_categories [data-category="' + category.dataset.category + '"]'
		);
		align_category_selection_indicator(category_selector);
		this.current_category = category;
	}
	set_cursor() {
		let cursor = '';
		if (this.held_sticker) {
			let half_edge = Math.floor(this.sticker_full_edge / 2);
			cursor = 'url("' + this.held_sticker.querySelector('img').src + '") ' + half_edge + ' ' + half_edge + ', auto';
		}
		document.body.style.setProperty('--held_sticker_cursor', cursor);
	}
	pick(sticker) {
		this.held_sticker = sticker.cloneNode(true);
		this.held_sticker.classList.add('pickable');
		document.documentElement.classList.add('holding_sticker');
		this.set_cursor();
	}
	insert_comment_sticker(comment_field, sticker) {
		if (
				comment_field.selectionStart
				|| comment_field.selectionStart == '0'
			) {
			let start_pos = parseInt(comment_field.selectionStart);
			let end_pos = parseInt(comment_field.selectionEnd);
			let selection_before = comment_field.value.substring(0, start_pos);
			let selection_after = comment_field.value.substring(end_pos, comment_field.value.length);
			let sticker_emote = '';
			if (
					0 < start_pos
					&& ' ' != selection_before[selection_before.length - 1]
					&& ':' != selection_before[selection_before.length - 1]
				) {
				sticker_emote += ' ';
			}
			sticker_emote += ':' + sticker.dataset.name + ':';
			if (
					end_pos < comment_field.value.length
					&& ' ' != selection_after[0]
					&& ':' != selection_after[0]
				) {
				sticker_emote += ' ';
			}
			comment_field.value = selection_before + sticker_emote + selection_after;
			// ensure text caret stays at end of inserted sticker emote
			let caret_position = selection_before.length + sticker_emote.length;
			if (comment_field.createTextRange) {
				let range = comment_field.createTextRange();
				range.move('character', caret_position);
				range.select();
			}
			else {
				comment_field.focus();
				if (comment_field.selectionStart !== undefined) {
					comment_field.setSelectionRange(caret_position, caret_position);
				}
			}
		}
		else {
			comment_field.value += ' :' + sticker.dataset.name + ': ';
		}
	}
	drop() {
		document.documentElement.classList.remove('holding_sticker');
		this.held_sticker = null;
		this.set_cursor();
	}
	loop_targets(f) {
		let targets = document.querySelectorAll('.sticker_target');
		for (let i = 0; i < targets.length; i++) {
			f(targets[i]);
		}
	}
	add_pick_from_target_listener(sticker) {
		if (sticker.has_pick_from_target_listener) {
			return;
		}
		sticker.has_pick_from_target_listener = true;
		sticker.addEventListener('mousedown', e => {
			if (3 === e.which) {
				return;
			}
			let sticker = e.currentTarget;
			this.pick(sticker);
			sticker.parentNode.removeChild(sticker);
			if (!sticker.dataset.placementId) {
				return;
			}
			let xhr = new XMLHttpRequest();
			xhr.open('POST', this.sticker_drawer.dataset.actionUnplaceSticker + (-1 != this.sticker_drawer.dataset.actionUnplaceSticker.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(), true);
			xhr.withCredentials = true;
			xhr.responseType = 'json';
			let fd = new FormData();
			fd.append('placement_id', sticker.dataset.placementId);
			xhr.send(fd);
		});
	}
	add_target_listener(target) {
		target.addEventListener('mouseup', e => {
			if (!this.held_sticker || 3 === e.which) {
				return;
			}
			e.stopPropagation();
			let target = e.currentTarget;
			let target_rect = target.getBoundingClientRect();
			this.held_sticker.dataset.positionX = (e.pageX - target_rect.left - pageXOffset) / target_rect.width;
			this.held_sticker.dataset.positionY = (e.pageY - target_rect.top - pageYOffset) / target_rect.height;
			place_sticker(this.held_sticker, target);
			let maximum_stickers_per_target = parseInt(this.sticker_drawer.dataset.maximumStickersPerTarget);
			if (-1 != maximum_stickers_per_target) {
				let stickers = Array.prototype.slice.call(
					target.querySelectorAll('.sticker[data-user-id="' + this.sticker_drawer.dataset.userId + '"]')
				);
				while (stickers.length > maximum_stickers_per_target) {
					let pruned_sticker = stickers.shift();
					pruned_sticker.parentNode.removeChild(pruned_sticker);
				}
			}
			this.held_sticker.style.cursor = 'wait';
			let xhr = new XMLHttpRequest();
			xhr.sticker = this.held_sticker;
			xhr.onreadystatechange = () => {
				if (xhr.readyState == XMLHttpRequest.DONE) {
					xhr.sticker.style.cursor = '';
					this.add_pick_from_target_listener(xhr.sticker);
					if (xhr.status == 200) {
						// add placement id and placement time to sticker
						xhr.sticker.dataset.placementId = xhr.response.placement_id;
						xhr.sticker.dataset.placementTime = xhr.response.placement_time;
						this.add_pick_from_target_listener(xhr.sticker);
					}
					else {
						//TODO add error description to sticker title
						xhr.sticker.classList.add('error');
					}
				}
			};
			xhr.open('POST', this.sticker_drawer.dataset.actionPlaceSticker + (-1 != this.sticker_drawer.dataset.actionPlaceSticker.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(), true);
			xhr.withCredentials = true;
			xhr.responseType = 'json';
			let fd = new FormData();
			fd.append('subject_id', target.dataset.id);
			fd.append('sticker_id', xhr.sticker.dataset.id);
			fd.append('position_x', xhr.sticker.dataset.positionX);
			fd.append('position_y', xhr.sticker.dataset.positionY);
			xhr.send(fd);
			this.drop();
		});
		target.addEventListener('sticker_placement', e => {
			let sticker = e.detail;
			if (sticker.dataset.userId == this.sticker_drawer.dataset.userId) {
				sticker.classList.add('pickable');
				this.add_pick_from_target_listener(sticker);
			}
		});
	}
};

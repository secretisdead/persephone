'use strict';

import { TagsField } from './tagsfield.js';

// search tags field
let search_input = document.querySelector('[name="tags"]');
if (search_input) {
	let target_form = search_input.parentNode;
	let disallowed_search_tag_prefixes = [];
	// create tags field
	let tags_field = new TagsField(
		disallowed_search_tag_prefixes,
		search_input.placeholder,
		search_input.dataset.removeTag,
		search_input.value
	);
	tags_field.search_input = search_input;
	// add classes to tags field components
	tags_field.preview.classList.add('tags_preview');
	// wrap tags field preview
	let preview_wrapper = document.createElement('div');
	preview_wrapper.classList.add('tags_preview_wrapper');
	preview_wrapper.append(tags_field.preview);
	// add tags field components to target form
	target_form.insertBefore(preview_wrapper, tags_field.search_input);
	target_form.insertBefore(tags_field.input, tags_field.search_input);

	// add submit listener to target form
	target_form.addEventListener('submit', e => {
		if (tags_field.input.value) {
			// commit any tag still in input
			tags_field.add_tags(tags_field.to_list(tags_field.input.value));
			tags_field.clear_input();
		}
		search_input.value = tags_field.to_string(tags_field.tags_list);
	});
	// add listener to swap negation and regular tags
	tags_field.input.addEventListener('added', e => {
		if ('-' == e.detail.tag[0]) {
			tags_field.remove_tag(e.detail.tag.substring(1));
		}
		else {
			tags_field.remove_tag('-' + e.detail.tag);
		}
	});
	// listener for search hotkey
	window.addEventListener('keydown', e => {
		if (
			'INPUT' == document.activeElement.tagName
			|| 'TEXTAREA' == document.activeElement.tagName
		) {
			return;
		}
		if ('`' == e.key) {
			setTimeout(() => {
				tags_field.input.focus();
			}, 1);
		}
	});
	// listeners for add and negate tags on tags this page actions
	let actions = document.querySelectorAll('#tags_this_page .action');
	for (let i = 0; i < actions.length; i++) {
		let action = actions[i];
		actions[i].addEventListener('click', e => {
			e.preventDefault();
			if (actions[i].classList.contains('add')) {
				tags_field.add_tag(e.currentTarget.parentNode.dataset.tag);
			}
			else if (actions[i].classList.contains('remove')) {
				tags_field.add_tag('-' + e.currentTarget.parentNode.dataset.tag);
			}
		});
	}

	// only fetch tag suggestions on first search input focus
	tags_field.input.addEventListener('focus', e => {
		if (e.currentTarget.hasOwnProperty('fetched')) {
			return;
		}
		e.currentTarget.fetched = true;
		// fetch suggestions
		tags_field.fetch_suggestions();
		// create suggestions list (excluding semantic suggestions)
		let tag_suggestion_lists = document.querySelectorAll('meta[name="tag_suggestion_list"]');
		let excluded_lists = [];
		for (let i = 0; i < tag_suggestion_lists.length; i++) {
			let list_uri = tag_suggestion_lists[i].getAttribute('content');
			let list_uri_pieces = list_uri.replace('\\', '/').split('/');
			if ('clutter' == list_uri_pieces[list_uri_pieces.length - 1].substr(0, 8)) {
				excluded_lists.push(list_uri);
			}
		}
		tags_field.create_suggestions_list(excluded_lists);
	});

	// max search tags limit
	let max_tags = parseInt(search_input.dataset.maxTags);
	tags_field.input.addEventListener('added', e => {
		if (max_tags < e.currentTarget.tag_editor.tags_list.length) {
			alert(search_input.dataset.tooManyTags);
			e.currentTarget.tag_editor.remove_tag(e.detail.tag);
		}
	});

}

// preferences
let media_navigation = document.querySelector('.media_navigation');
let media_preferences_button = document.createElement('a');
media_preferences_button.classList.add('media_preferences_button');
media_preferences_button.innerText = media_navigation.dataset.preferences;
media_navigation.appendChild(media_preferences_button);
let media_preferences = document.querySelector('#media_preferences');
let load_preferences = function() {
	let preferences_inputs = media_preferences.querySelectorAll('input:not([type="submit"])');
	for (let i = 0; i < preferences_inputs.length; i++) {
		let input = preferences_inputs[i];
		let value = localStorage.getItem(input.id);
		if ('checkbox' == input.type) {
			if (value) {
				input.checked = true;
			}
		}
		else {
			input.value = value;
		}
	}
	let preferences_textareas = media_preferences.querySelectorAll('textarea');
	for (let i = 0; i < preferences_textareas.length; i++) {
		let input = preferences_textareas[i];
		let value = localStorage.getItem(input.id);
		if (value) {
			input.value = value;
		}
	}
};
load_preferences();
let media_preferences_dim = document.createElement('div');
media_preferences_dim.classList.add('media_preferences_dim');
let apply_blacklisted_tags = function() {
	let blacklisted_tags = localStorage.getItem('media_preference_blacklisted_tags');
	if (blacklisted_tags) {
		blacklisted_tags = blacklisted_tags.split('#');
	}
	else {
		blacklisted_tags = [];
	}
	let thumbnails = document.querySelectorAll('.thumbnail');
	for (let i = 0; i < thumbnails.length; i++) {
		let thumbnail = thumbnails[i];
		thumbnail.classList.remove('blacklist');
		for (let j = 0; j < blacklisted_tags.length; j++) {
			let blacklisted_tag = blacklisted_tags[j];
			if (
				thumbnail.title.includes('#' + blacklisted_tag + ' #')
				|| '#' + blacklisted_tag == thumbnail.title.substring(
					thumbnail.title.length - (blacklisted_tag.length + 1)
				)
			) {
				thumbnail.classList.add('blacklist');
			}
		}
	}
};
document.addEventListener('DOMContentLoaded', e => {
	apply_blacklisted_tags();
});
media_preferences_button.addEventListener('click', e => {
	document.body.appendChild(media_preferences_dim);
	document.body.appendChild(media_preferences);
	media_preferences.style.top = 'calc(50% - ' + (media_preferences.clientHeight / 2) + 'px)';
});
let save_and_close_media_preferences = function() {
	let preferences_inputs = media_preferences.querySelectorAll('input:not([type="submit"])');
	for (let i = 0; i < preferences_inputs.length; i++) {
		let input = preferences_inputs[i];
		let value = input.value;
		if ('checkbox' == input.type) {
			if (input.checked) {
				localStorage.setItem(input.id, 1);
			}
			else {
				localStorage.removeItem(input.id);
			}
		}
		else {
			localStorage.setItem(input.id, value);
		}
	}
	let preferences_textareas = media_preferences.querySelectorAll('textarea');
	for (let i = 0; i < preferences_textareas.length; i++) {
		let input = preferences_textareas[i];
		localStorage.setItem(input.id, input.value);
	}
	apply_blacklisted_tags();
	if (media_preferences.querySelector('#media_preference_jumbo_thumbnails').checked) {
		document.documentElement.classList.add('jumbo_thumbnails');
	}
	else {
		document.documentElement.classList.remove('jumbo_thumbnails');
	}
	document.body.removeChild(media_preferences);
	document.body.removeChild(media_preferences_dim);
};
media_preferences_dim.addEventListener('click', e => {
	save_and_close_media_preferences();
});
media_preferences.addEventListener('submit', e => {
	e.preventDefault();
	save_and_close_media_preferences();
});

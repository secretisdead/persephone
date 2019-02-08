'use strict';

export class TagsField {
	constructor(disallowed_tag_prefixes, placeholder, remove_tag_title, initial_tags) {
		this.tags_list = [];
		this.disallowed_tag_prefixes = disallowed_tag_prefixes;
		if ('undefined' == typeof placeholder) {
			placeholder = 'Enter a tag to add, click a tag to remove';
		}
		if ('undefined' == typeof remove_tag_title) {
			remove_tag_title = 'Remove this tag';
		}
		this.placeholder = placeholder;
		this.remove_tag_title = remove_tag_title;
		// create field input
		this.input = document.createElement('input');
		this.input.type = 'text';
		this.input.placeholder = this.placeholder;
		// listener for input finish
		this.debounce = null;
		this.input.addEventListener('keydown', e => {
			// not finishing input
			if ('Enter' != e.key) {
				if (this.debounce) {
					clearTimeout(this.debounce);
				}
				this.hide_suggestions();
				this.debounce = setTimeout(() => {
					this.show_suggestions();
				}, 500);
				return;
			}
			if ('' == this.input.value) {
				// dispatch submit
				this.input.dispatchEvent(
					new CustomEvent('submit')
				);
				return;
			}
			// prevent form submit in case we're inside of a form
			e.preventDefault();
			e.stopPropagation();
			this.add_tags(this.to_list(this.input.value));
			setTimeout(() => {
				this.clear_input();
				this.hide_suggestions();
			}, 1);
		});
		this.preview = document.createElement('div');
		// suggestions lists
		this.tag_suggestions_limit = 16;
		this.tag_suggestions_limited = document.createElement('datalist');
		this.tag_suggestions_limited.id = 'tag_suggestions_limited' + new Date().getTime();
		document.body.appendChild(this.tag_suggestions_limited);
		this.tag_suggestions_full = document.createElement('datalist');
		this.tag_suggestions_full.id = 'tag_suggestions_full' + new Date().getTime();
		// add reference to this tag editor on its preview and input
		this.input.tag_editor = this;
		this.preview.tag_editor = this;
		// add initial tags
		if ('undefined' != typeof initial_tags) {
			this.clear();
			if ('string' == typeof initial_tags) {
				initial_tags = this.to_list(initial_tags);
			}
			this.add_tags(initial_tags);
		}
	}
	show_suggestions() {
		if (
			'' == this.input.value
			|| 0 >= this.tag_suggestions_limit
		) {
			return;
		}
		let needle = this.input.value.trim();
		let negation = false;
		if ('-' == needle[0]) {
			negation = true;
			needle = needle.substring(1);
		}
		//TODO loop through full suggestions list checking for matches
		this.tag_suggestions_limited.innerHTML = '';
		let r = new RegExp(needle, 'i');
		let dupe_check = [];
		let options = this.tag_suggestions_full.children;
		for (let i = 0; i < options.length; i++) {
			let option = options[i];
			if (
				r.test(option.value)
				&& -1 == dupe_check.indexOf(option.value)
			) {
				dupe_check.push(option.value);
				let cloned = option.cloneNode(true);
				if (negation) {
					cloned.value = '-' + cloned.value;
				}
				this.tag_suggestions_limited.appendChild(cloned);
				if (this.tag_suggestions_limited.children.length == this.tag_suggestions_limit) {
					break;
				}
			}
		}
		this.input.setAttribute('list', this.tag_suggestions_limited.id);
		//TODO firefox doesn't show the dropdown automatically for some reason?
	}
	hide_suggestions() {
		this.input.setAttribute('list', '');
	}
	clear() {
		this.clear_tags();
		this.clear_preview();
		this.clear_input();
	}
	clear_tags() {
		this.tags_list = [];
	}
	clear_preview() {
		this.preview.innerHTML = '';
	}
	clear_input() {
		this.input.value = '';
	}
	discard() {
		this.clear();
	}
	to_list(tags_string) {
		if ('' == tags_string) {
			return [];
		}
		// single tag
		if (-1 == tags_string.indexOf('#')) {
			return [tags_string];
		}
		// strip leading and trailing hashes and split on hashes
		return tags_string.replace(/^#+|#+$/g, '').split('#');
	}
	create_tag_element(tag, title, link_uri) {
		let el = document.createElement('span');
		el.classList.add('tag');
		el.dataset.tag = tag.replace('"', '&quot;');
		if ('undefined' != typeof title) {
			el.title = title;
		}
		let inner_el = null;
		if ('undefined' == typeof link_uri) {
			inner_el = document.createElement('span');
		}
		else {
			inner_el = document.createElement('a');
			inner_el.href = link_uri.replace('{}', encodeURIComponent(tag));
		}
		// for negation tag text shouldn't include the hyphen
		inner_el.innerText = '#' + ('-' == tag[0] ? tag.substring(1) : tag);
		el.appendChild(inner_el);
		return el;
	}
	is_disallowed(tag) {
		for (let i = 0; i < this.disallowed_tag_prefixes.length; i++) {
			let tag_prefix = this.disallowed_tag_prefixes[i];
			if (tag_prefix == tag.substring(0, tag_prefix.length)) {
				return true;
			}
		}
		return false;
	}
	add_tag(tag) {
		this.add_tags([tag]);
	}
	add_tags(tags_list) {
		for (let i = 0; i < tags_list.length; i++) {
			let tag = tags_list[i];
			if (
				-1 != this.tags_list.indexOf(tag)
				|| this.is_disallowed(tag)
			) {
				continue;
			}
			this.tags_list.push(tag);
			let el = this.create_tag_element(tag)
			el.title = this.remove_tag_title;
			el.addEventListener('click', e => {
				this.remove_tag(e.currentTarget.dataset.tag);
			});
			this.preview.appendChild(el);
			this.hide_suggestions();
			// dispatch add event
			this.input.dispatchEvent(
				new CustomEvent(
					'added',
					{
						detail:
						{
							tag: tag,
							el: el,
						}
					}
				)
			);
		}
	}
	remove_tag(tag) {
		this.remove_tags([tag]);
	}
	remove_tags(tags_list) {
		for (let i = 0; i < tags_list.length; i++) {
			let tag = tags_list[i].replace('&quot;', '"');
			let tag_index = this.tags_list.indexOf(tag)
			if (-1 == tag_index) {
				continue;
			}
			this.tags_list.splice(tag_index, 1)
			let tag_el = this.preview.querySelector('.tag[data-tag="' + tag.replace('"', '&quot;').replace('\\', '\\\\') + '"]');
			tag_el.parentNode.removeChild(tag_el);
			// dispatch remove event
			this.input.dispatchEvent(
				new CustomEvent(
					'removed',
					{
						detail:
						{
							tag: tag,
						}
					}
				)
			);
		}
		this.input.focus();
	}
	to_string(tags_list) {
		tags_list.sort();
		return tags_list.join('#');
	}
	fetch_suggestions() {
		fetch_tag_suggestions();
	}
	create_suggestions_list(excluded_lists) {
		this.tag_suggestions_full.innerHTML = '';
		let tag_suggestion_lists = document.querySelectorAll('meta[name="tag_suggestion_list"]');
		for (let i = 0; i < tag_suggestion_lists.length; i++) {
			let meta_tag = tag_suggestion_lists[i];
			if (!meta_tag.hasOwnProperty('fetched')) {
				continue;
			}
			if ('undefined' != typeof(excluded_lists)) {
				let skip_list = false;
				for (let j = 0; j < excluded_lists.length; j++) {
					if (-1 != excluded_lists.indexOf(meta_tag.getAttribute('content'))) {
						skip_list = true;
						break;
					}
				}
				if (skip_list) {
					continue;
				}
			}
			if (!meta_tag.fetched) {
				meta_tag.addEventListener('fetched', e => {
					for (let j = 0; j < e.currentTarget.suggestions.length; j++) {
						let suggestion = e.currentTarget.suggestions[j];
						let option = document.createElement('option');
						option.value = suggestion;
						this.tag_suggestions_full.appendChild(option);
					}
				});
			}
			else {
				for (let j = 0; j < meta_tag.suggestions.length; j++) {
					let suggestion = meta_tag.suggestions[j];
					let option = document.createElement('option');
					option.value = suggestion;
					this.tag_suggestions_full.appendChild(option);
				}
			}
		}
	}
}

export function fetch_tag_suggestions() {
	let tag_suggestion_lists = document.querySelectorAll('meta[name="tag_suggestion_list"]');
	for (let i = 0; i < tag_suggestion_lists.length; i++) {
		let meta_tag = tag_suggestion_lists[i];
		if (meta_tag.hasOwnProperty('suggestions')) {
			continue;
		}
		meta_tag.suggestions = [];
		meta_tag.fetched = false;
		let xhr = new XMLHttpRequest();
		xhr.meta_tag = meta_tag;
		xhr.onreadystatechange = () => {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if (200 == xhr.status) {
					if (xhr.response) {
						for (let i = 0; i < xhr.response.length; i++) {
							xhr.meta_tag.suggestions.push(xhr.response[i])
						}
					}
				}
				xhr.meta_tag.fetched = true;
				xhr.meta_tag.dispatchEvent(
					new CustomEvent('fetched')
				);
			}
		};
		let action = tag_suggestion_lists[i].getAttribute('content');
		xhr.open('GET', action + (-1 != action.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(), true);
		xhr.responseType = 'json';
		if ('1' == meta_tag.dataset.credentials) {
			xhr.withCredentials = true;
		}
		xhr.send();
	}
}

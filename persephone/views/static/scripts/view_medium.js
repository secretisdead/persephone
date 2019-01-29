'use strict';

import { add_thumbnail_preview } from './thumbnail_preview.js';

// thumbnail previews
let thumbnails = document.querySelectorAll('.thumbnail');
for (let i = 0; i < thumbnails.length; i++) {
	add_thumbnail_preview(thumbnails[i]);
}

// show unlike button
let unlike_button = document.querySelector('.unlike_medium');
if (unlike_button && localStorage.getItem('media_preference_show_unlike_button')) {
	unlike_button.classList.add('shown');
}

// fit media vertically
if (localStorage.getItem('media_preference_fit_media_vertically')) {
	let fit_vertically = function(medium_element) {
		let medium = document.querySelector('.medium');
		let available_height = window.innerHeight;
		// relying on #content having padding of 1rem on top and bottom which this script shouldn't really have to know about oops
		let rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
		available_height -= (2 * rem);
		// subtracting topmenu height which this script also shouldn't have to know about
		let topmenu = document.querySelector('#topmenu');
		if (topmenu) {
			available_height -= topmenu.clientHeight;
		}
		if (medium.clientHeight > available_height) {
			medium_element.style.maxHeight = 'calc(' + available_height + 'px - 2rem)';
			medium_element.style.width = 'auto';
		}
	};
	let medium_element = document.querySelector('.medium img');
	if (!medium_element) {
		medium_element = document.querySelector('.medium video');
	}
	if (medium_element) {
		if ('IMG' == medium_element.tagName) {
			if (medium_element.complete) {
				fit_vertically(medium_element);
			}
			else {
				medium_element.addEventListener('load', e => {
					fit_vertically(medium_element);
				});
			}
		}
		else {
			document.addEventListener('DOMContentLoaded', e => {
				fit_vertically(medium_element);
			});
		}
	}
}

// hotkey for playable media
let playable_medium = document.querySelector('.medium video');
if (!playable_medium) {
	playable_medium = document.querySelector('.medium audio');
}
if (playable_medium) {
	window.addEventListener('keydown', e => {
		if (
			'INPUT' == document.activeElement.tagName
			|| e.ctrlKey
			|| e.altKey
		) {
			return;
		}
		if (' ' == e.key || 'Spacebar' == e.key) {
			e.preventDefault();
			if (playable_medium.paused) 
				playable_medium.play(); 
			else {
				playable_medium.pause();
			}
		}
	});
}

// limit tags container and tags editor max-widths to medium width
let container = document.querySelector('.medium').parentNode;
// non-fuzzy timestamp will usually widen the container so hide it first
let info = document.querySelector('.medium_info');
if (info) {
	info.style.display = 'none';
}
let medium_tags = document.querySelector('.medium_tags');
// tags will also sometimes widen the container so hide them first too
if (medium_tags) {
	medium_tags.style.display = 'none';
}
setTimeout(() => {
	let container_width = container.clientWidth;
	if (info) {
		info.style.display = '';
	}
	if (medium_tags) {
		medium_tags.style.display = '';
		medium_tags.style.maxWidth = (container_width) + 'px';
	}
	let preview_wrapper = document.querySelector('.tags_preview_wrapper');
	if (preview_wrapper) {
		//TODO this script shouldn't have to know about tag preview wrapper padding
		preview_wrapper.style.maxWidth = (container_width - 1) + 'px';
	}
}, 10);

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

let video_ready_interval = null;

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
// constrain some view page elements to the width of the medium
let selectors_to_constrain = [
	'.medium_management',
	'.medium_info',
	'.medium_blurb',
	'.medium_tags',
	'.tags_editor',
	'#adjacent_media',
	'.medium_set',
	'.comments_form',
	'.comments',
];
let constrain_elements = function() {
	for (let i = 0; i < selectors_to_constrain.length; i++) {
		let elements = document.querySelectorAll(selectors_to_constrain[i]);
		for (let j = 0; j < elements.length; j++) {
			let element = elements[j];
			element.style.maxWidth = medium.parentNode.clientWidth + 'px';
			element.style.opacity = '0';
			element.style.display = '';
			element.style.transition = 'opacity 100ms';
			setTimeout(() => {
				element.style.opacity = '1';
			}, 10);
		}
	}
}
for (let i = 0; i < selectors_to_constrain.length; i++) {
	let elements = document.querySelectorAll(selectors_to_constrain[i]);
	for (let j = 0; j < elements.length; j++) {
		elements[j].style.display = 'none';
	}
}
let medium = document.querySelector('.medium');
switch (medium.dataset.category) {
	case 'image':
		let image = medium.querySelector('.summary a img');
		if (!image || image.complete) {
			constrain_elements();
		}
		image.onload = constrain_elements;
		break;
	case 'video':
		let video = medium.querySelector('.summary video');
		if (!video || video.readyState >= 1) {
			constrain_elements();
			break;
		}
		video_ready_interval = setInterval(() => {
			if (video.readyState >= 1) {
				constrain_elements();
				clearInterval(video_ready_interval);
			}
		}, 1000);
		break;
	//TODO audio with image cover
	default:
		constrain_elements();
		break;
}

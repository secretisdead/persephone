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

// functions to run when media is done loading
function medium_loaded(element) {
	constrain_elements();
	if (element) {
		if (localStorage.getItem('media_preference_fit_media_vertically')) {
			fit_vertically(element);
		}
	}
	medium.dispatchEvent(new CustomEvent('create_sticker_target'));
	medium.delay_creating_sticker_target = false;
}
function image_medium_loaded(medium) {
	let image = medium.querySelector('.summary a img');
	if (!image) {
		medium_loaded();
		return;
	}
	if (image.complete) {
		medium_loaded(image);
		return;
	}
	image.onload = () => {
		medium_loaded(image)
	};
}
let medium = document.querySelector('.medium');
medium.delay_creating_sticker_target = true;
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
function constrain_elements() {
	for (let i = 0; i < selectors_to_constrain.length; i++) {
		let elements = document.querySelectorAll(selectors_to_constrain[i]);
		for (let j = 0; j < elements.length; j++) {
			let element = elements[j];
			element.style.maxWidth = medium.parentNode.clientWidth + 'px';
			element.style.display = '';
		}
	}
}
for (let i = 0; i < selectors_to_constrain.length; i++) {
	let elements = document.querySelectorAll(selectors_to_constrain[i]);
	for (let j = 0; j < elements.length; j++) {
		elements[j].style.display = 'none';
	}
}
// fit media vertically
function fit_vertically(element) {
	let available_height = window.innerHeight;
	// relying on #content having padding of 1rem on top and bottom which this script shouldn't really have to know about oops
	let rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
	available_height -= (2 * rem);
	// subtracting topmenu height which this script also shouldn't have to know about
	let topmenu = document.querySelector('#topmenu');
	if (topmenu) {
		available_height -= topmenu.clientHeight;
	}
	// subtracting sticker drawer height which this script also shouldn't have to know about
	let sticker_drawer = document.querySelector('#sticker_drawer');
	if (sticker_drawer) {
		available_height -= (32 + (2.5 * rem));
	}
	if (medium.parentNode.clientHeight > available_height) {
		let container_height = medium.parentNode.clientHeight;
		let non_medium_elements_height = container_height - element.clientHeight;
		element.style.maxHeight = 'calc(' + available_height + 'px - ' + non_medium_elements_height + 'px)';
		element.style.width = 'auto';
	}
};
let video_ready_interval = null;
switch (medium.dataset.category) {
	case 'image':
		image_medium_loaded(medium);
		break;
	case 'video':
		let video = medium.querySelector('.summary video');
		if (!video) {
			medium_loaded();
		}
		if (video.readyState >= 2) {
			medium_loaded(video);
			break;
		}
		video_ready_interval = setInterval(() => {
			if (video.readyState >= 2) {
				medium_loaded(video);
				clearInterval(video_ready_interval);
			}
		}, 1000);
		break;
	default:
		image_medium_loaded(medium);
		break;
}

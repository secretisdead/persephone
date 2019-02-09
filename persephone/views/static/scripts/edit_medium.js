'use strict';

import { add_thumbnail_preview } from './thumbnail_preview.js';

// thumbnail previews
let thumbnail = document.querySelector('.thumbnail');
if (thumbnail) {
	add_thumbnail_preview(thumbnail);
}

let thumbnail = document.querySelector('.thumbnail');
let summary = thumbnail.querySelector('.summary');
let medium_element = summary.querySelector('picture');
if (!medium_element) {
	medium_element = summary.querySelector('video');
}
if (medium_element) {
	let medium_width = parseInt(thumbnail.dataset.data1);
	let medium_height = parseInt(thumbnail.dataset.data2);
	let thumbnail_outline_edge = 0;
	let portrait = false;
	if (medium_width > medium_height) {
		thumbnail_outline_edge = (medium_height / medium_width) * summary.clientWidth;
	}
	else if (medium_width < medium_height) {
		portrait = true;
		thumbnail_outline_edge = (medium_width / medium_height) * summary.clientHeight;
	}
	if (thumbnail_outline_edge) {
		let half_thumbnail_outline_edge = thumbnail_outline_edge / 2;
		let focus_input = document.querySelector('#focus');
		let thumbnail_outline = document.createElement('span');
		thumbnail_outline.classList.add('thumbnail_outline');
		thumbnail_outline.style.width = thumbnail_outline_edge + 'px';
		thumbnail_outline.style.height = thumbnail_outline_edge + 'px';
		let calculate_offset = function(value) {
			let offset = 'calc(' + (value * 100) + '% - ' + (value * thumbnail_outline_edge) + 'px)';
			if (portrait) {
				thumbnail_outline.style.top = offset;
			}
			else {
				thumbnail_outline.style.left = offset;
			}
		};
		thumbnail_outline.style.top = 'calc(50% - ' + half_thumbnail_outline_edge + 'px)';
		thumbnail_outline.style.left = 'calc(50% - ' + half_thumbnail_outline_edge + 'px)';
		calculate_offset(focus_input.value);
		focus_input.addEventListener('focus', e => {
			summary.classList.add('changing_focus');
			summary.appendChild(thumbnail_outline);
		});
		focus_input.addEventListener('blur', e => {
			summary.classList.remove('changing_focus');
			summary.removeChild(thumbnail_outline);
		});
		focus_input.addEventListener('input', e => {
			calculate_offset(e.currentTarget.value);
		});
	}
}

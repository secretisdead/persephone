'use strict';

import { add_thumbnail_preview } from './thumbnail_preview.js';

// tags this page toggle
let tags_this_page = document.querySelector('#tags_this_page');
if (tags_this_page) {
	document.querySelector('#tags_this_page h2').addEventListener('click', e => {
		tags_this_page.classList.toggle('shown');
	});
}

// thumbnail previews
let thumbnails = document.querySelectorAll('.thumbnail');
for (let i = 0; i < thumbnails.length; i++) {
	add_thumbnail_preview(thumbnails[i]);
}

// jumbo thumbnails
if (localStorage.getItem('media_preference_jumbo_thumbnails')) {
	document.documentElement.classList.add('jumbo_thumbnails');
}

// uncropped thumbnails
if (localStorage.getItem('media_preference_uncropped_thumbnails')) {
	document.documentElement.classList.add('uncropped_thumbnails');
}

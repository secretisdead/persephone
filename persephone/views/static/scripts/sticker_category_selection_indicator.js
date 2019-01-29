'use strict';

export function align_category_selection_indicator(category_selector) {
	let categories_left_offset = document.querySelector('#sticker_categories').getBoundingClientRect().left;
	let category_selector_left_offset = category_selector.getBoundingClientRect().left - categories_left_offset;
	let sticker_category_indicator = document.querySelector('#sticker_category_indicator');
	sticker_category_indicator.style.left = category_selector_left_offset + 'px';
};

export function add_sticker_category_selector_listeners() {
	let category_selectors = document.querySelectorAll('#sticker_categories a');
	if (0 < category_selectors.length) {
		align_category_selection_indicator(category_selectors[0]);
		for (let i = 0; i < category_selectors.length; i++) {
			category_selectors[i].addEventListener(
				'click',
				e => {
					align_category_selection_indicator(e.currentTarget);
				}
			);
		}
	}
};

'use strict';

import { StickerDrawer } from './stickerdrawer.js';
import { create_sticker_targets, place_target_stickers } from './sticker_targets.js';

let load_sticker_drawer = function() {
	setTimeout(() => {
		let sticker_drawer = new StickerDrawer()
	}, 1000);
};
let media_preference_hide_stickers = localStorage.getItem('media_preference_hide_stickers');
if (!media_preference_hide_stickers) {
	create_sticker_targets();

	let sticker_targets = document.querySelectorAll('.sticker_target');
	// no sticker targets, initialize drawer
	if (0 == sticker_targets.length) {
		load_sticker_drawer();
	}
	// some sticker targets, fetch and place stickers before initializing drawer
	else {
		let sticker_placements_uri = document.querySelector('[name="sticker_placements_uri"]').content;
		let stickers_placement_duration_ms = 1000;
		let targets_remaining = sticker_targets.length;
		let stickers_remaining = 0;
		for (let i = 0; i < sticker_targets.length; i++) {
			let target = sticker_targets[i];
			target.addEventListener('stickers_fetched', e => {
				targets_remaining--;
				if (0 == targets_remaining && 0 == e.detail) {
					load_sticker_drawer();
				}
				stickers_remaining += e.detail;
			});
			target.addEventListener('sticker_placed', e => {
				stickers_remaining--;
				if (0 == targets_remaining && 0 == stickers_remaining) {
					load_sticker_drawer();
				}
			});
			place_target_stickers(target, sticker_placements_uri, stickers_placement_duration_ms);
		}
	}
}

'use strict';

let sticker_full_edge = document.querySelector('meta[name="sticker_edge"]').content;
let sticker_half_edge = sticker_full_edge / 2;
let sticker_drop_duration = 100;
let min_sticker_scale = 0.66;
let max_target_width = document.querySelector('meta[name="max_sticker_target_width"]').content;

export function place_sticker(sticker, target) {
	let scale = target.dataset.scale;
	if (min_sticker_scale > scale) {
		scale = min_sticker_scale;
	}
	sticker.dataset.target = target.dataset.id;
	let percent_x = (sticker.dataset.positionX * 100).toFixed(2);
	let percent_y = (sticker.dataset.positionY * 100).toFixed(2);
	sticker.style.left = 'calc(' + percent_x + '% - ' + (sticker_half_edge * scale) + 'px)';
	sticker.style.top = 'calc(' + percent_y + '% - ' + (sticker_half_edge * scale) + 'px)';
	sticker.style.maxWidth = 'calc(var(--sticker_edge) * ' + scale + ')';
	sticker.style.maxHeight = 'calc(var(--sticker_edge) * ' + scale + ')';
	sticker.classList.add('dropping');
	target.sticker_container.appendChild(sticker);
	setTimeout(() => {
		sticker.classList.remove('dropping');
	}, sticker_drop_duration);
	target.dispatchEvent(
		new CustomEvent(
			'sticker_placement',
			{
				detail: sticker,
			}
		)
	);
}

function create_sticker_target(element, target_id, original_width, original_height) {
	element.classList.add('sticker_target');
	element.dataset.id = target_id;
	element.dataset.width = original_width;
	element.dataset.height = original_height;
	if (original_width > max_target_width) {
		original_width = max_target_width;
	}
	element.dataset.scale = element.clientWidth / original_width;
	element.sticker_container = document.createElement('div');
	element.sticker_container.classList.add('sticker_container');
	element.appendChild(element.sticker_container);
}

export function create_sticker_targets() {
	// media to sticker targets
	let media_summaries = document.querySelectorAll('.medium .summary');
	for (let i = 0; i < media_summaries.length; i++) {
		let summary = media_summaries[i];
		let width = parseInt(summary.parentNode.dataset.data1);
		if (!width) {
			width = summary.clientWidth;
		}
		let height = parseInt(summary.parentNode.dataset.data2);
		if (!height) {
			height = summary.clientHeight;
		}
		create_sticker_target(summary, summary.parentNode.dataset.id, width, height);
	}

	//TODO tegaki to sticker targets

	// recalculate scale on window resize
	window.addEventListener('resize', e => {
		let sticker_targets = document.querySelectorAll('.sticker_target');
		for (let i = 0; i < sticker_targets.length; i++) {
			let sticker_target = sticker_targets[i];
			let original_width = sticker_target.dataset.width;
			if (original_width > max_target_width) {
				original_width = max_target_width;
			}
			let scale = sticker_target.clientWidth / original_width;
			if (min_sticker_scale > scale) {
				scale = min_sticker_scale;
			}
			sticker_target.dataset.scale = scale;
			let stickers = sticker_target.querySelectorAll('.sticker');
			for (let j = 0; j < stickers.length; j++) {
				let sticker = stickers[j];
				let percent_x = (sticker.dataset.positionX * 100).toFixed(2);
				let percent_y = (sticker.dataset.positionY * 100).toFixed(2);
				sticker.style.left = 'calc(' + percent_x + '% - ' + (sticker_half_edge * scale) + 'px)';
				sticker.style.top = 'calc(' + percent_y + '% - ' + (sticker_half_edge * scale) + 'px)';
				sticker.style.maxWidth = 'calc(var(--sticker_edge) * ' + scale + ')';
				sticker.style.maxHeight = 'calc(var(--sticker_edge) * ' + scale + ')';
			}
		}
	});
}

export function place_target_stickers(target, sticker_placements_uri, stickers_placement_duration_ms) {
	let xhr = new XMLHttpRequest();
	xhr.target = target;
	xhr.onreadystatechange = () => {
		if (xhr.readyState == XMLHttpRequest.DONE) {
			xhr.total_stickers_fetched = 0;
			if (xhr.status == 200 && xhr.response.placements) {
				xhr.total_stickers_fetched = xhr.response.placements.length;
			}
			xhr.target.dispatchEvent(
				new CustomEvent(
					'stickers_fetched',
					{
						detail: xhr.total_stickers_fetched,
					}
				)
			);
			if (xhr.status == 200 && 0 < xhr.response.placements.length) {
				let placement_delay = 0;
				let increment = stickers_placement_duration_ms / xhr.total_stickers_fetched;
				xhr.stickers_placed = 0;
				for (let j = 0; j < xhr.response.placements.length; j++) {
					let placement = xhr.response.placements[j];
					let temp = document.createElement('div');
					temp.innerHTML = xhr.response.stickers[placement['sticker_id']];
					let sticker = temp.querySelector('.sticker');
					sticker.dataset.placementId = placement['id'];
					sticker.dataset.placementTime = placement['placement_time'];
					sticker.dataset.userId = placement['user_id'];
					sticker.dataset.positionX = placement['position_x'];
					sticker.dataset.positionY = placement['position_y'];
					sticker.dataset.rotation = placement['rotation'];
					sticker.dataset.scale = placement['scale'];
					setTimeout(() => {
						place_sticker(sticker, xhr.target)
						xhr.stickers_placed++;
						xhr.target.dispatchEvent(
							new CustomEvent('sticker_placed')
						);
						if (xhr.stickers_placed == xhr.total_stickers_fetched) {
							xhr.target.dispatchEvent(
								new CustomEvent('stickers_placed')
							);
						}
					}, placement_delay);
					placement_delay += increment;
				}
			}
		}
	};
	let target_sticker_placements_uri = sticker_placements_uri.replace('{}', xhr.target.dataset.id);
	xhr.open('GET', target_sticker_placements_uri + (-1 != target_sticker_placements_uri.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(), true);
	xhr.responseType = 'json';
	xhr.send();
}

'use strict';

import { Shaker } from './shaker.js';
import { fuzzy_time_localization_en, fuzzy_local_dates } from './time.js';

let gachapon = document.querySelector('#use_gachapon');
new Shaker(gachapon);
gachapon.shaker.set_intensity(15);
gachapon.addEventListener('click', e => {
	e.preventDefault();
	if (e.currentTarget.shaker.shaking) {
		return;
	}
	let xhr = new XMLHttpRequest();
	xhr.gachapon = e.currentTarget;
	// remove errors if present
	let errors = xhr.gachapon.parentNode.querySelectorAll('.form_error');
	for (let i = 0; i < errors.length; i++) {
		errors[i].parentNode.removeChild(errors[i]);
	}
	// remove success message if present
	let success = xhr.gachapon.parentNode.querySelector('.gachapon_success');
	if (success) {
		success.parentNode.removeChild(success);
	}
	// remove sticker if present
	let sticker = xhr.gachapon.querySelector('.sticker');
	if (sticker) {
		sticker.parentNode.removeChild(sticker);
	}
	xhr.onreadystatechange = () => {
		if (xhr.readyState == XMLHttpRequest.DONE) {
			xhr.gachapon.shaker.stop(500);
			let temp = document.createElement('div');
			if (xhr.status == 200) {
				temp.innerHTML = xhr.response.sticker;
				let sticker = temp.querySelector('.sticker');
				xhr.gachapon.appendChild(sticker);
				temp.innerHTML = xhr.response.message;
			}
			else {
				temp.innerHTML = xhr.response.message;
			}
			// hide and insert children
			let children = Array.prototype.slice.call(temp.childNodes);
			for (let i = 0; i < children.length; i++) {
				children[i].style.display = 'none';
				xhr.gachapon.parentNode.insertBefore(children[i], xhr.gachapon);
			}
			fuzzy_local_dates(fuzzy_time_localization_en);
			// show inserted children
			for (let i = 0; i < children.length; i++) {
				children[i].style.display = '';
			}
		}
	};
	let action = xhr.gachapon.dataset.action;
	xhr.open('POST', action + (-1 != action.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(), true);
	xhr.withCredentials = true;
	xhr.responseType = 'json';
	xhr.gachapon.shaker.start();
	xhr.send();
});

'use strict'
export function date_to_atom_local(date) {
	let tzo = -date.getTimezoneOffset();
	let dif = tzo >= 0 ? '+' : '-';
	let pad = function(num) {
		var norm = Math.abs(Math.floor(num))
		return (norm < 10 ? '0' : '') + norm
	};
	return date.getFullYear()
		+ '-' + pad(date.getMonth() + 1)
		+ '-' + pad(date.getDate())
		+ 'T' + pad(date.getHours())
		+ ':' + pad(date.getMinutes())
		+ ':' + pad(date.getSeconds())
		+ dif + pad(tzo / 60)
		+ ':' + pad(tzo % 60);
}
export let fuzzy_time_localization_en = {
	decade: {
		singular: '{0} decade',
		plural: '{0} decades',
	},
	year: {
		singular: '{0} year',
		plural: '{0} years',
	},
	month: {
		singular: '{0} month',
		plural: '{0} months',
	},
	week: {
		singular: '{0} week',
		plural: '{0} weeks',
	},
	day: {
		singular: '{0} day',
		plural: '{0} days',
	},
	hour: {
		singular: '{0} hour',
		plural: '{0} hours',
	},
	minute: {
		singular: '{0} minute',
		plural: '{0} minutes',
	},
	second: {
		singular: '{0} second',
		plural: '{0} seconds',
	},
	now: 'Just now',
	past: '{0} ago',
	future: '{0} from now',
}
export function fuzzy_time(timestamp, localization) {
	let dif = (timestamp - Date.now()) / 1000;

	let tense;
	if (0 < dif) tense = 'future';
	else tense = 'past';

	dif = Math.abs(dif);

	let units = {
		year: 31536000,
		month: 2419200,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
		second: 1,
	}
	let amount;
	let unit = 'now';
	for (let u in units) {
		if (dif >= units[u]) {
			amount = Math.floor(dif / units[u]);
			unit = u;
			break;
		}
	}

	if ('now' == unit) return localization['now'];

	return String.format(
		localization[tense],
		String.format(
			1 == amount ? localization[unit]['singular'] : localization[unit]['plural'],
			amount
		)
	);
}
export function fuzzy_local_dates(localization) {
	let timestamp_els = document.querySelectorAll('[data-timestamp]');
	for (let i = 0; i < timestamp_els.length; i++) {
		let el = timestamp_els[i];
		let timestamp = el.dataset.timestamp;
		let date = new Date(parseInt(el.dataset.timestamp) * 1000);
		el.setAttribute('title', date_to_atom_local(date));
		el.textContent = fuzzy_time(date.getTime() , localization);
	}
	let timestamp_inputs = document.querySelectorAll('input[data-timestamp]');
	for (let i = 0; i < timestamp_inputs.length; i++) {
		let el = timestamp_inputs[i];
		if (!el.dataset.timestamp) {
			continue;
		}
		el.value = date_to_atom_local(new Date(parseInt(el.dataset.timestamp) * 1000));
	}
}

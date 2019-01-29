'use strict';
function change_theme(theme) {
	for (let i = document.documentElement.classList.length - 1; i > -1; i--) {
		let value = document.documentElement.classList[i];
		if ('theme_' == value.substr(0, 6)) {
			document.documentElement.classList.remove(value);
		}
	}
	document.documentElement.classList.add(theme);
}
let theme_select = document.querySelector('#theme_select');
if ('undefined' == theme_preference) {
	let theme_preference = localStorage.getItem('theme');
}
if (theme_preference) {
	theme_select.value = theme_preference;
}
theme_select.addEventListener('change', e => {
	let select_value = e.currentTarget.options[e.currentTarget.selectedIndex].value;
	localStorage.setItem('theme', select_value);
	change_theme(select_value);
});

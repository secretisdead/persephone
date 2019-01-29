'use strict';
export function autocopy(value, autocopy_alert, copy_alert) {
	// autocopy to clipboard
	try {
		// create temp input
		let temp_input = document.createElement('input');
		temp_input.type = 'text';
		temp_input.value = value;
		document.body.appendChild(temp_input);
		temp_input.select();
		if (document.execCommand('copy')) {
			alert(autocopy_alert);
		}
		else {
			// fallback to prompt
			prompt(copy_alert, value);
		}
		// destroy temp input
		document.body.removeChild(temp_input);
	}
	catch (err) {
		// fallback to prompt
		prompt(copy_alert, value);
	}
}

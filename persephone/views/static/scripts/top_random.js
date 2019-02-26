// listener for topmenu random hotkey
let top_random = document.querySelector('#top_random');
if (top_random) {
	window.addEventListener('keydown', e => {
		if (
			'INPUT' == document.activeElement.tagName
			|| 'TEXTAREA' == document.activeElement.tagName
			|| e.ctrlKey
			|| e.altKey
		) {
			return;
		}
		if ('r' == e.key) {
			window.location = top_random.href;
		}
	});
}

'use strict';
export class SequenceNavigation {
	constructor(prev_link, next_link, prev_keys, next_keys) {
		this.prev_link = prev_link;
		this.next_link = next_link;

		if ('undefined' == typeof prev_keys) {
			prev_keys = ['ArrowLeft', 'Backspace'];
		}
		if ('undefined' == typeof next_keys) {
			next_keys = ['ArrowRight'];
		}
		this.prev_keys = prev_keys;
		this.next_keys = next_keys;

		window.addEventListener('keydown', e => {
			// ignore page navigation if in an input or if alt or control is pressed
			if (
				'INPUT' == document.activeElement.tagName
				|| e.ctrlKey
				|| e.altKey
			) {
				return;
			}
			// prev existed and had href
			if (this.prev_link && this.prev_link.href) {
				for (let i = 0; i < this.prev_keys.length; i++) {
					if (e.key == this.prev_keys[i]) {
						e.currentTarget.dispatchEvent(new CustomEvent('navigate'));
						window.location = this.prev_link.href;
						return;
					}
				}
			}
			// next existed and had href
			if (this.next_link && this.next_link.href) {
				for (let i = 0; i < this.next_keys.length; i++) {
					if (e.key == this.next_keys[i]) {
						e.currentTarget.dispatchEvent(new CustomEvent('navigate'));
						window.location = this.next_link.href;
						return;
					}
				}
			}
		});
	}
}

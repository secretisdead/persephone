'use strict';
export class Shaker {
	constructor(element) {
		this.element = element;
		this.element.shaker = this;
		this.intensity = 1;
		this.pre_decay_intensity = 1;
		this.intensity_decay_step = 0;
		this.style = {
			position: this.element.style.position,
			top: this.element.style.top,
			right: this.element.style.right,
			bottom: this.element.style.bottom,
			left: this.element.style.left,
		};
		let style = getComputedStyle(this.element);
		this.computed = {
			position: style.position,
			top: style.top,
			right: style.right,
			bottom: style.bottom,
			left: style.left,
		};
		this.decay_duration = 0;
		this.decay_interval = null;
		this.shake_interval = null;
		this.interval_ms = 1000 / 60;
		this.shaking = false;
	}
	set_intensity(intensity) {
		this.intensity = intensity;
	}
	start(shake_duration_ms, decay_duration_ms) {
		this.shaking = true;
		if ('relative' != this.computed.position && 'absolute' != this.computed.position) {
			this.element.style.position = 'relative';
		}
		this.shake_interval = setInterval(() => {
			let x = Math.random() * this.intensity;
			if (0 == Math.round(Math.random())) {
				x *= -1;
			}
			let y = Math.random() * this.intensity;
			if (0 == Math.round(Math.random())) {
				y *= -1;
			}
			if (this.computed.bottom) {
				this.element.style.bottom = 'calc(' + this.computed.bottom + ' + ' + y + 'px)';
			}
			else {
				this.element.style.top = 'calc(' + this.computed.top + ' + ' + y + 'px)';
			}
			if (this.computed.right) {
				this.element.style.right = 'calc(' + this.computed.right + ' + ' + x + 'px)';
			}
			else {
				this.element.style.left = 'calc(' + this.computed.left + ' + ' + x + 'px)';
			}
		}, this.interval_ms);
		if (!decay_duration_ms) {
			decay_duration_ms = 0;
		}
		if (shake_duration_ms) {
			setTimeout(() => {
				this.stop(decay_duration_ms);
			}, shake_duration_ms);
		}
	}
	stop(decay_duration_ms) {
		if (!this.shake_interval) {
			return;
		}
		if (decay_duration_ms) {
			this.intensity_decay_step = this.intensity / (decay_duration_ms / this.interval_ms);
			this.pre_decay_intensity = this.intensity;
			this.decay_interval = setInterval(() => {
				this.intensity -= this.intensity_decay_step;
				if (0 >= this.intensity) {
					clearInterval(this.decay_interval);
					this.decay_interval = null;
					this.stop();
					this.intensity = this.pre_decay_intensity;
				}
			}, this.interval_ms);
		}
		else {
			clearInterval(this.shake_interval);
			this.shake_interval = null;
			this.element.style.position = this.style.position;
			this.element.style.top = this.style.top;
			this.element.style.right = this.style.right;
			this.element.style.bottom = this.style.bottom;
			this.element.style.left = this.style.left;
			this.shaking = false;
		}
	}
};

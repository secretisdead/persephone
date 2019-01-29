'use static';

export function add_thumbnail_preview(thumbnail) {
	let picture = thumbnail.querySelector('picture');
	if (!picture) {
		return;
	}
	if ('image/gif' == thumbnail.dataset.mime) {
		let preview_picture = document.createElement('picture');
		preview_picture.classList.add('preview');
		let preview_image = document.createElement('img');
		preview_image.src = thumbnail.dataset.preview;
		preview_picture.appendChild(preview_image);

		picture.parentNode.insertBefore(preview_picture, picture);

		if (!thumbnail.classList.contains('previewable')) {
			thumbnail.classList.add('previewable');
			thumbnail.preview_over = thumbnail.addEventListener('mouseover', e => {
				e.currentTarget.classList.add('preview_hover');
			});
			thumbnail.preview_out = thumbnail.addEventListener('mouseout', e => {
				e.currentTarget.classList.remove('preview_hover');
			});
		}
	}
	else if ('video' == thumbnail.dataset.category) {
		let preview_video = document.createElement('video');
		preview_video.classList.add('preview');
		preview_video.loop = true;
		preview_video.preload = 'auto';
		//TODO add original thumb image as poster?
		let preview_source = document.createElement('source');
		preview_source.src = thumbnail.dataset.preview;
		preview_source.type = 'video/webm';
		preview_video.appendChild(preview_source);

		picture.parentNode.insertBefore(preview_video, picture);

		if (!thumbnail.classList.contains('previewable')) {
			thumbnail.classList.add('previewable');
			thumbnail.preview_over = thumbnail.addEventListener('mouseover', e => {
				e.currentTarget.classList.add('preview_hover');
				e.currentTarget.querySelector('.preview').play();
			});
			thumbnail.preview_out = thumbnail.addEventListener('mouseout', e => {
				e.currentTarget.classList.remove('preview_hover');
				e.currentTarget.querySelector('.preview').pause();
			});
		}
	}
};

export function remove_thumbnail_preview(thumbnail) {
	let preview = thumbnail.querySelector('.preview');
	if (preview) {
		preview.parentNode.removeChild(preview);
	}
	thumbnail.classList.remove('previewable');
	if (thumbnail.hasOwnProperty('preview_over')) {
		thumbnail.removeEventListener(thumbnail.preview_over);
	}
	if (thumbnail.hasOwnProperty('preview_out')) {
		thumbnail.removeEventListener(thumbnail.preview_out);
	}
};

'use strict';
let upload_form = document.querySelector('form');
// advanced toggle
let upload_groups = upload_form.querySelector('#groups');
let upload_properties = upload_form.querySelector('#properties');
let upload_tagging = upload_form.querySelector('#tagging');
let advanced_nav = document.createElement('nav');
let advanced_button = document.createElement('a');
advanced_button.innerText = upload_form.dataset.advanced;
advanced_button.addEventListener('click', e => {
	upload_groups.classList.toggle('hidden');
	upload_properties.classList.toggle('hidden');
	upload_tagging.classList.toggle('hidden');
});
advanced_button.click();
advanced_nav.appendChild(advanced_button);
upload_form.parentNode.insertBefore(advanced_nav, upload_form);

let form = document.querySelector('form');
form.addEventListener('submit', e => {
	e.preventDefault();
});
// load last used and remember changed upload options
let storable_upload_inputs = [
	'generate_summaries',
	'searchability',
	'protection',
	'author_tag',
	'filename_tag',
];
let stored_media_upload_preferences = localStorage.getItem('media_upload_preferences');
// checkbox preferences
let checkboxes = form.querySelectorAll('input[type=checkbox]');
for (let i = 0; i < checkboxes.length; i++) {
	let checkbox = checkboxes[i];
	if (-1 == storable_upload_inputs.indexOf(checkbox.id)) {
		continue;
	}
	if (stored_media_upload_preferences) {
		checkbox.checked = false;
		let checkbox_preference = localStorage.getItem('media_upload_' + checkbox.id);
		if (checkbox_preference) {
			checkbox.checked = true;
		}
	}
	else if (checkbox.checked) {
		localStorage.setItem('media_upload_' + checkbox.id, 1);
	}
	checkbox.addEventListener('change', e => {
		if (e.currentTarget.checked) {
			localStorage.setItem('media_upload_' + e.currentTarget.id, 1);
		}
		else {
			localStorage.removeItem('media_upload_' + e.currentTarget.id);
		}
	});
}
// select preferences
let selects = form.querySelectorAll('select');
for (let i = 0; i < selects.length; i++) {
	let select = selects[i];
	if (-1 == storable_upload_inputs.indexOf(select.id)) {
		continue;
	}
	if (!stored_media_upload_preferences) {
		let select_value = select.options[select.selectedIndex].value;
		localStorage.setItem('media_upload_' + select.id, select_value);
	}
	let select_preference = localStorage.getItem('media_upload_' + select.id);
	if (select_preference) {
		select.value = select_preference;
	}
	select.addEventListener('change', e => {
		let select_value = e.currentTarget.options[e.currentTarget.selectedIndex].value;
		localStorage.setItem('media_upload_' + e.currentTarget.id, select_value);
	});
}
if (!stored_media_upload_preferences) {
	localStorage.setItem('media_upload_preferences', 1);
}
//TODO tag editor for additional tags field



// upload
let file_upload = form.querySelector('#file_upload');
let file_uri = form.querySelector('#file_uri');

let previews = document.createElement('div');
previews.id = 'previews';
form.parentNode.insertBefore(previews, form.nextSibling);

let uploads_in_transit = 0;

function add_preview(filename, fd) {
	let preview = document.createElement('div');
	preview.classList.add('preview');
	preview.filename = document.createElement('div');
	preview.filename.classList.add('filename');
	preview.filename.innerText = filename;
	preview.placeholder = document.createElement('div');
	preview.placeholder.classList.add('placeholder');
	preview.appendChild(preview.filename);
	preview.appendChild(preview.placeholder);
	previews.appendChild(preview);

	if ('undefined' == typeof fd) {
		//TODO create dead preview card with payload too large error
		preview.classList.add('failure');
		preview.placeholder.innerText = file_upload.dataset.fileTooLarge;
		return;
	}

	preview.classList.add('uploading');
	let xhr = new XMLHttpRequest();
	xhr.preview = preview;
	xhr.uploaded_timeout = null;
	xhr.onreadystatechange = () => {
		if (xhr.readyState == XMLHttpRequest.DONE) {
			if (xhr.uploaded_timeout) {
				clearTimeout(xhr.uploaded_timeout);
				if (xhr.preview.progress && xhr.preview.progress.parentNode == xhr.preview) {
					xhr.preview.removeChild(xhr.preview.progress);
				}
				xhr.preview.classList.remove('uploading');
			}

			uploads_in_transit -= 1;
			if (0 == uploads_in_transit) {
				let tags_xhr = new XMLHttpRequest();
				let tags_action = form.dataset.actionBuildTagSuggestions;
				tags_xhr.open('POST', tags_action + (-1 != tags_action.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(), true);
				tags_xhr.withCredentials = true;
				tags_xhr.send();
			}

			console.log('processing finished');

			let result_class = '';
			if (200 == xhr.status) {
				// add thumbnail in placeholder
				xhr.preview.placeholder.innerHTML = xhr.response.thumbnail;
				// wait for complete animation
				//TODO better timing to detect what stage of the animation the css is currently in?
				result_class = 'success';
			}
			// duplicate
			else if (409 == xhr.status) {
				// create view link around placeholder
				let link = document.createElement('a');
				link.href = xhr.response.view_uri;
				xhr.preview.appendChild(link);
				link.appendChild(xhr.preview.placeholder);
				result_class = 'failure';
				for (let i = 0; i < xhr.response.errors.length; i++) {
					let error = document.createElement('div');
					error.classList.add('error');
					error.innerText = xhr.response.errors[i];
					xhr.preview.placeholder.appendChild(error);
				}
			}
			//TODO have server error create retry listener tied to this xhr around placeholder maybe?
			//else if (500 == xhr.status) {
				//result_class = 'failure';
			//}
			else {
				// errors returned
				if (
					xhr.response
					&& xhr.response.errors
				) {
					for (let i = 0; i < xhr.response.errors.length; i++) {
						let error = document.createElement('div');
						error.classList.add('error');
						error.innerText = xhr.response.errors[i];
						xhr.preview.placeholder.appendChild(error);
					}
				}
				result_class = 'failure';
			}
			// wait for complete animation
			if (!xhr.preview.processing_start_time) {
				console.log('processing animation didn\'t even start, jump straight to result class');
				xhr.preview.classList.add(result_class);
			}
			else {
				//TODO this script shouldn't have to know about the animation duration in the stylesheet
				let processing_animation_duration = 1500;
				let current_time = new Date().getTime();
				let processing_time = current_time - xhr.preview.processing_start_time;
				while (processing_time > processing_animation_duration) {
					processing_time -= processing_animation_duration;
				}
				let processing_percentage = processing_time / processing_animation_duration;
				let remaining_processing_time = processing_animation_duration * (1.5 - processing_percentage);
				setTimeout(() => {
					xhr.preview.classList.add('complete');
					xhr.preview.classList.remove('processing');
					setTimeout(() => {
						//console.log('dip animation finished');
						xhr.preview.classList.remove('complete');
						xhr.preview.classList.add(result_class);
					}, 250);
				}, remaining_processing_time);
			}
		}
	};
	if (xhr.upload) {
		xhr.preview.progress = document.createElement('div');
		xhr.preview.progress.classList.add('progress');
		xhr.preview.progress.style.width = '0px';
		xhr.preview.appendChild(xhr.preview.progress);
		xhr.upload.addEventListener('progress', e => {
			if (e.lengthComputable) {
				let progress = Math.floor((e.loaded / e.total) * 100);
				if (100 > progress) {
					xhr.preview.progress.style.width = progress + '%';
					return;
				}
				xhr.preview.progress.style.width = '100%';
				xhr.uploaded_timeout = setTimeout(() => {
					xhr.uploaded_timeout = null;
					xhr.preview.removeChild(xhr.preview.progress);
					xhr.preview.classList.remove('uploading');
					xhr.preview.classList.add('processing');
					xhr.preview.processing_start_time = new Date().getTime();
				}, 250);
			}
		});
	}
	uploads_in_transit += 1;
	let action = form.dataset.actionUpload;
	xhr.open('POST', action + (-1 != action.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(), true);
	xhr.withCredentials = true;
	xhr.responseType = 'json';
	xhr.send(fd);
}

// remove file upload name so that it isn't submitted
let file_upload_name = file_upload.name;
file_upload.name = '';
file_upload.multiple = true;
file_upload.addEventListener('change', e => {
	// parse files
	for (let i = 0; i < file_upload.files.length; i++) {
		if (parseInt(file_upload.dataset.maximumUploadFilesize) > file_upload.files[i].size) {
			let fd = new FormData(form);
			fd.append(file_upload_name, file_upload.files[i]);
			add_preview(file_upload.files[i].name, fd);
			continue;
		}
		add_preview(file_upload.files[i]);
	}
	//TODO clear file upload input
});

// uri
file_uri.addEventListener('keydown', e => {
	if (
		'Enter' != e.key
		|| 0 == file_uri.value.length
		|| -1 == file_uri.value.indexOf('/')
		|| -1 == file_uri.value.indexOf('http')
	) {
		return;
	}
	let filename = file_uri.value.split('/');
	add_preview(filename[filename.length - 1], new FormData(form));
	file_uri.value = '';
});

//TODO ajax response failure update card with response reason and class
//TODO ajax response success update card with rendered thumbnail and class

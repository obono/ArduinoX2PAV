/*----------------------------------------------------------------------------*/

function $(id) {
	return document.getElementById(id);
}

const imgCaution = new Image(8, 8);
imgCaution.src = "data:image/gif;base64,R0lGODlhCAAIALMDAAAAAKtSNv/gAP93qAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAAMALAAAAAAIAAgAAAIUnBOmIZILwBssuiNsYq2jZl3ImBQAOw==";

/*----------------------------------------------------------------------------*/

const bitmapMaxSize = 16;
const bitmapScaleList = 4;
const bitmapScaleScene = 2;
const bitmapScaleScenePreview = 4;
const bitmapScalePreview = 12;
const maxColorsInPalette = 256;
const alphaThreshold = 64;
const formatVersion = 1;


var pickr;
var elmBitmapFocused;
var elmPaletteFocused;
var elmSceneFocused;
var previewSceneIdx = 0;

function setupBitmapList() {
	elmBitmapList.addEventListener('dragover', function(event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
		showBitmapListDropping();
	});
	elmBitmapList.addEventListener('dragleave', function(event) {
		hideBitmapListDropping();
	});
	elmBitmapList.addEventListener('drop', function(event) {
		event.preventDefault();
		hideBitmapListDropping();
		if (elmPaletteFocused) {
			var files = event.dataTransfer.files;
			appendBitmaps(files);
		}
	});
}

function showBitmapListDropping() {
	elmBitmapList.classList.add('dropover');
}

function hideBitmapListDropping() {
	elmBitmapList.classList.remove('dropover');
}

function setupColorPicker(elmPicker) {
	pickr = new Pickr({
		el: elmPicker,
		useAsButton: true,
		components: {
			preview: true,
			hue: true,
			interaction: {
				hex: true,
				rgba: true,
				hsva: true,
				input: true,
				save: true
			}
		},
		strings: {
		   save: 'OK'
		}
	});
}

function showHelp() {
	elmHelp.style.display = 'block';
}

function hideHelp() {
	elmHelp.style.display = 'none';
}

/*----------------------------------------------------------------------------*/

function appendBitmaps(files) {
	for (let i = 0, c = files.length; i < c; i++) {
		let file = files[i];
		if (file.type.indexOf('image/') === 0) {
			let reader = new FileReader();
			reader.onload = function() {
				let image = new Image();
				image.src = reader.result;
				image.onload = function() {
					let elmBitmap = generateBitmapElement(image, elmPaletteFocused);
					elmBitmapList.appendChild(elmBitmap);
					//refreshBitmapElementImage(elmBitmap, elmPaletteFocused);
					refreshAllBitmapElementImages(elmPaletteFocused);
				}
			};
			reader.readAsDataURL(file);
		}
	}
}

function generateBitmapElement(image, elmPalette) {
	let width = Math.min(image.width, bitmapMaxSize);
	let height = Math.min(image.height, bitmapMaxSize);

	let elmBitmap = document.createElement('canvas');
	elmBitmap.width = width * bitmapScaleList;
	elmBitmap.height = height * bitmapScaleList;
	let ctx = elmBitmap.getContext('2d');
	ctx.drawImage(image, 0, 0);
	let pixels = ctx.getImageData(0, 0, width, height).data;

	let data = [];
	let isTrans = false;
	let minIdx = maxColorsInPalette;
	let maxIdx = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let offs = (y * width + x) * 4;
			let idx;
			if (pixels[offs + 3] < alphaThreshold) {
				idx = -1; // transparent
				isTrans = true;
			} else {
				let rgb = pixels.slice(offs, offs + 3);
				idx = findColorIndexInPalette(elmPalette, rgb);
				if (idx < 0) {
					idx = addColorToPalette(elmPalette, rgb);
				}
				minIdx = Math.min(idx, minIdx);
				maxIdx = Math.max(idx, maxIdx);
			}
			data.push(idx)
		}
	}

	elmBitmap.customWidth = width;
	elmBitmap.customHeight = height;
	elmBitmap.customMinIdx = minIdx;
	elmBitmap.customMaxIdx = maxIdx;
	elmBitmap.customIsTrans = isTrans;
	elmBitmap.customData = data;
	elmBitmap.addEventListener('click', function(event) {
		let key_event = event || window.event;
		if (key_event.shiftKey) {
			elmBitmapList.removeChild(elmBitmap);
			if (elmBitmap == elmBitmapFocused) {
				elmBitmapFocused = null;
			}
			for (let i = 0, c = elmSceneList.children.length; i < c; i++) {
				let elmScene = elmSceneList.children[i];
				if (elmScene.customBitmap == elmBitmap) {
					elmScene.customBitmap = undefined;
					refreshSceneElementImage(elmScene);
				}
			}
		} else {
			focusBitmap(elmBitmap);
		}
	});
	return elmBitmap;
}

function focusBitmap(elmBitmap) {
	if (elmBitmap == elmBitmapFocused) {
		return;
	}
	for (let i = 0, c = elmBitmapList.children.length; i < c; i++) {
		elmBitmapList.children[i].classList.remove('focused');
	}
	elmBitmapFocused = elmBitmap;
	if (!elmBitmapFocused) {
		return;
	}
	elmBitmapFocused.classList.add('focused');
	if (elmSceneFocused && elmSceneFocused.customBitmap != elmBitmapFocused) {
		elmSceneFocused.customBitmap = elmBitmapFocused;
		refreshSceneElementImage(elmSceneFocused);
	}
}

function refreshAllBitmapElementImages(elmPalette) {
	for (let i = 0, c = elmBitmapList.children.length; i < c; i++) {
		refreshBitmapElementImage(elmBitmapList.children[i], elmPalette);
	}
}

function refreshBitmapElementImage(elmBitmap, elmPalette) {
	drawBitmapToCanvas(elmBitmap, elmPalette, elmBitmap.customData,
			elmBitmap.customWidth, elmBitmap.customHeight, bitmapScaleList);
}

/*----------------------------------------------------------------------------*/

function normalizeRGB(rgb) {
	rgb.length = 3;
	rgb[0] &= 0xf8;
	rgb[1] &= 0xfc;
	rgb[2] &= 0xf8;
}

function RGB2String(rgb) {
	return 'rgb(' + rgb.join(',') + ')';
}

function getColorsElement(elmPalette) {
	return elmPalette.getElementsByClassName('palette_colors')[0];
}

function getColorOfPalette(elmPalette, idx) {
	let elmColors = getColorsElement(elmPalette);
	if (!elmColors.children || idx < 0 || idx >= elmColors.children.length) {
		return null;
	}
	return elmColors.children[idx].style.color;
}

function findColorIndexInPalette(elmPalette, rgb) {
	normalizeRGB(rgb);
	let elmColors = getColorsElement(elmPalette);
	for (let i = 0, c = elmColors.children.length; i < c; i++) {
		let prgb = elmColors.children[i].style.color.match(/\d+/g);
		if (rgb[0] == prgb[0] && rgb[1] == prgb[1] && rgb[2] == prgb[2]) {
			return i;
		}
	}
	return -1;
}

function addColorToPalette(elmPalette, rgb) {
	normalizeRGB(rgb);
	let elmColors = getColorsElement(elmPalette);
	if (elmColors.children.length >= maxColorsInPalette) {
		return maxColorsInPalette - 1;
	}
	let elmColor = document.createElement('span');
	elmColor.style.color = RGB2String(rgb);
	elmColor.innerHTML = '&#x2588;';
	setupColorClickListener(elmColor, elmPalette);
	elmColors.appendChild(elmColor);
	return elmColors.children.length - 1;
}

function setupColorClickListener(elmColor, elmPalette) {
	elmColor.addEventListener('click', function(event) {
		let key_event = event || window.event;
		if (key_event.shiftKey) {
			getColorsElement(elmPalette).removeChild(elmColor);
			if (elmPalette == elmPaletteFocused) {
				refreshAllBitmapElementImages(elmPalette);
			}
		} else {
			pickr.setColor(elmColor.style.color, true);
			pickr.applyColor(true);
			pickr.setColorRepresentation('HEX');
			pickr._eventListener['save'] = []; // trick!!
			pickr.on('save', function(color) {
				let prgb = color.toRGBA();
				normalizeRGB(prgb);
				elmColor.style.color = RGB2String(prgb);
				if (elmPalette == elmPaletteFocused) {
					refreshAllBitmapElementImages(elmPaletteFocused);
				}
				refreshAllSceneElementImages(elmPalette);
			});
			pickr.show();
		}
	});
}

function newPalette() {
	dupulicatePalette(null);
}

function focusPalette(elmPalette) {
	if (elmPalette == elmPaletteFocused) {
		return;
	}
	for (let i = 0, c = elmPaletteList.children.length; i < c; i++) {
		elmPaletteList.children[i].classList.remove('focused');
	}
	elmPaletteFocused = elmPalette;
	if (!elmPaletteFocused) {
		return;
	}
	elmPaletteFocused.classList.add('focused');
	refreshAllBitmapElementImages(elmPaletteFocused);
	if (elmSceneFocused && elmSceneFocused.customPalette != elmPaletteFocused) {
		elmSceneFocused.customPalette = elmPaletteFocused;
		refreshSceneElementImage(elmSceneFocused);
	}
}

function extendPalette(elmPalette) {
	let rgb = [ 64, 64, 64 ];
	addColorToPalette(elmPalette, rgb);
	if (elmPalette == elmPaletteFocused) {
		refreshAllBitmapElementImages(elmPaletteFocused);
	}
	refreshAllSceneElementImages(elmPalette);
}

function dupulicatePalette(elmPalette) {
	let elmPaletteClone;
	if (elmPalette) {
		elmPaletteClone = elmPalette.cloneNode(true);
		elmPaletteClone.classList.remove('focused');
		let elmColors = getColorsElement(elmPaletteClone);
		for (let i = 0, c = elmColors.children.length; i < c; i++) {
			setupColorClickListener(elmColors.children[i], elmPaletteClone);
		}
	} else {
		elmPaletteClone = elmPaletteOriginal.cloneNode(true);
		elmPaletteClone.style.display = 'block';
		elmPaletteClone.removeAttribute('id');
	}
	Sortable.create(getColorsElement(elmPaletteClone), { onEnd: function() {
		if (elmPaletteClone == elmPaletteFocused) {
			refreshAllBitmapElementImages(elmPaletteFocused);
		}
		refreshAllSceneElementImages(elmPaletteClone);
	}});
	if (elmPalette) {
		elmPaletteList.insertBefore(elmPaletteClone, elmPalette.nextSibling);
	} else {
		elmPaletteList.appendChild(elmPaletteClone);
		focusPalette(elmPaletteClone);
	}
}

function removePalette(elmPalette) {
	elmPaletteList.removeChild(elmPalette);
	if (elmPaletteList.children.length == 0) {
		newPalette();
	} else if (elmPalette == elmPaletteFocused) {
		focusPalette(elmPaletteList.children[0]);
	}
	for (let i = 0, c = elmSceneList.children.length; i < c; i++) {
		let elmScene = elmSceneList.children[i];
		if (elmScene.customPalette == elmPalette) {
			elmScene.customPalette = undefined;
			refreshSceneElementImage(elmScene);
		}
	}
}

/*----------------------------------------------------------------------------*/

function getSceneProperties(elmScene) {
	let elmSceneInfo = elmScene.getElementsByClassName('scene_info')[0];
	return {
		duration: Number(elmSceneInfo.children[0].value),
		isClear: elmSceneInfo.children[1].checked,
		isFlipV: elmSceneInfo.children[2].checked,
		isFlipH: elmSceneInfo.children[3].checked,
		isRot90: elmSceneInfo.children[4].checked,
		drawX: Number(elmSceneInfo.children[5].value),
		drawY: Number(elmSceneInfo.children[6].value),
		elmBitmap: elmScene.customBitmap,
		elmPalette: elmScene.customPalette
	};
}

function refreshScenePreview() {
	let ctx = elmScenePreview.getContext('2d');
	let actualSize = bitmapMaxSize * bitmapScaleScenePreview;
	ctx.fillStyle = elmBackgroundColor.style.color;
	ctx.fillRect(0, 0, actualSize * 3, actualSize * 3);

	let info = getSceneProperties(elmSceneFocused);
	if (info.elmBitmap && info.elmPalette) {
		drawBitmapToCanvas(elmScenePreview, info.elmPalette, info.elmBitmap.customData,
				info.elmBitmap.customWidth, info.elmBitmap.customHeight, bitmapScaleScenePreview,
				info.drawX + bitmapMaxSize, info.drawY + bitmapMaxSize,
				info.isFlipV, info.isFlipH, info.isRot90, false);
	}

	ctx.fillStyle = '#fffc'; // TODO
	ctx.fillRect(0,				0,				actualSize * 3,	actualSize);
	ctx.fillRect(0,				actualSize * 2,	actualSize * 3,	actualSize);
	ctx.fillRect(0,				actualSize,		actualSize,		actualSize);
	ctx.fillRect(actualSize * 2,actualSize,		actualSize,		actualSize);
}

function refreshAllSceneElementImages(elmPalette) {
	for (let i = 0, c = elmSceneList.children.length; i < c; i++) {
		if (!elmPalette || elmSceneList.children[i].customPalette == elmPalette) {
			refreshSceneElementImage(elmSceneList.children[i]);
		}
	}
}

function refreshSceneElementImage(elmScene) {
	let elmBitmap = elmScene.customBitmap;
	let elmPalette = elmScene.customPalette;
	let elmCanvas = elmScene.getElementsByTagName('canvas')[0];
	if (!elmBitmap || !elmPalette) {
		elmCanvas.width = 16;
		elmCanvas.height = 16; // TODO
	} else {
		elmCanvas.width = elmBitmap.customWidth * bitmapScaleScene;
		elmCanvas.height = elmBitmap.customWidth * bitmapScaleScene;
		drawBitmapToCanvas(elmCanvas, elmPalette, elmBitmap.customData,
				elmBitmap.customWidth, elmBitmap.customHeight, bitmapScaleScene);
	}
	if (elmScene == elmSceneFocused) {
		refreshScenePreview();
	}
}

function newScene() {
	let elmSceneClone = elmSceneOriginal.cloneNode(true);
	elmSceneClone.style.display = 'block';
	elmSceneClone.removeAttribute('id');
	if (elmBitmapFocused) {
		elmSceneClone.customBitmap = elmBitmapFocused;
	}
	if (elmPaletteFocused) {
		elmSceneClone.customPalette = elmPaletteFocused;
	}
	elmSceneList.appendChild(elmSceneClone);
	refreshSceneElementImage(elmSceneClone);
	focusScene(elmSceneClone);
}

function focusScene(elmScene) {
	if (elmScene == elmSceneFocused) {
		return;
	}
	for (let i = 0, c = elmSceneList.children.length; i < c; i++) {
		elmSceneList.children[i].classList.remove('focused');
	}
	elmSceneFocused = elmScene;
	if (!elmSceneFocused) {
		return;
	}
	elmSceneFocused.classList.add('focused');
	focusBitmap(elmSceneFocused.customBitmap);
	focusPalette(elmSceneFocused.customPalette);
	refreshScenePreview();
}

function dupulicateScene(elmScene) {
	let elmSceneClone = elmScene.cloneNode(true);
	elmSceneClone.classList.remove('focused');
	elmSceneClone.customBitmap = elmScene.customBitmap;
	elmSceneClone.customPalette = elmScene.customPalette;
	elmSceneList.insertBefore(elmSceneClone, elmScene.nextSibling);
	refreshSceneElementImage(elmSceneClone);
}

function removeScene(elmScene) {
	elmSceneList.removeChild(elmScene);
	if (elmSceneList.children.length == 0) {
		newScene();
	} else if (elmScene == elmSceneFocused) {
		focusScene(elmSceneList.children[0]);
	}
}

function changeBackgroundColor() {
	pickr.setColor(elmBackgroundColor.style.color, true);
	pickr.applyColor(true);
	pickr.setColorRepresentation('HEX');
	pickr._eventListener['save'] = []; // trick!!
	pickr.on('save', function(color) {
		let prgb = color.toRGBA();
		normalizeRGB(prgb);
		elmBackgroundColor.style.color = RGB2String(prgb);
		refreshScenePreview();
	});
	pickr.show();
}

/*----------------------------------------------------------------------------*/

function updatePreview() {
	if (previewSceneIdx >= elmSceneList.children.length) {
		previewSceneIdx = 0;
	}
	let ctx = elmPreview.getContext('2d');
	let actualSize = bitmapMaxSize * bitmapScalePreview;
	let duration;
	do {
		let info = getSceneProperties(elmSceneList.children[previewSceneIdx]);
		if (info.isClear) {
			ctx.fillStyle = elmBackgroundColor.style.color;
			ctx.fillRect(0, 0, actualSize, actualSize);
		}
		if (info.elmBitmap && info.elmPalette) {
			drawBitmapToCanvas(elmPreview, info.elmPalette, info.elmBitmap.customData,
					info.elmBitmap.customWidth, info.elmBitmap.customHeight, bitmapScalePreview,
					info.drawX, info.drawY, info.isFlipV, info.isFlipH, info.isRot90, false);
		}
		duration = Math.floor(info.duration * 1000 / 60);
		previewSceneIdx++;
	} while (duration == 0 && previewSceneIdx < elmSceneList.children.length);
	setTimeout(updatePreview, duration);
}

/*----------------------------------------------------------------------------*/

function drawBitmapToCanvas(elmCanvas, elmPalette, data, width, height, scale,
		drawX = 0, drawY = 0, isFlipV = false, isFlipH = false, isRot90 = false, isClear = true) {
	let ctx = elmCanvas.getContext('2d');
	let isLack = false;
	for (let i = 0; i < height; i++) {
		for (let j = 0; j < width; j++) {
			let idx = data[i * width + j];
			let x = isFlipH ? width - j - 1 : j;
			let y = isFlipV ? height - i - 1 : i;
			if (isRot90) {
				let tmp = x;
				x = height - y - 1;
				y = tmp;
			}
			x += drawX;
			y += drawY;
			if (idx < 0) {
				if (isClear) {
					ctx.clearRect(x * scale, y * scale, scale, scale);
				}
			} else {
				let color;
				if (elmPalette) {
					color = getColorOfPalette(elmPalette, idx);
				}
				if (!color) {
					isLack = true;
					color = 'gray';
				}
				ctx.fillStyle = color;
				ctx.fillRect(x * scale, y * scale, scale, scale);
			}
		}
	}
	if (isLack) {
		ctx.drawImage(imgCaution, 0, 0);
	}
}

/*----------------------------------------------------------------------------*/

function handleDownload() {
	var baseName = elmTextBaseName.value;
	var content = generateDownloadContent(baseName);
	var blob = new Blob([ content ], { "type" : "text/plain" });
	document.getElementById("download").download = baseName + '.h';
	document.getElementById("download").href = window.URL.createObjectURL(blob);
}

function generateDownloadContent(baseName) {
	let bitmapData = [];
	let bitmapTable = [];
	let paletteData = [];
	let scenarioData = [];
	let paletteMap = new Map();

	for (let i = 0, c = elmBitmapList.children.length, offset = 0; i < c; i++) {
		elmBitmapList.children[i].customIdx = i;
		bitmapTable.push(offset);
		let data = encodeBitmap(elmBitmapList.children[i]);
		bitmapData = bitmapData.concat(data);
		offset += data.length;
	}

	for (let i = 0, c = elmPaletteList.children.length, offset = 0; i < c; i++) {
		let data = encodePalette(elmPaletteList.children[i]);
		paletteData = paletteData.concat(data);
		paletteMap.set(elmPaletteList.children[i], offset);
		offset += data.length;
	}

	scenarioData.push(0xfff0); // BgColor
	scenarioData.push(get16bitColorValue(elmBackgroundColor));
	for (let i = 0, c = elmSceneList.children.length; i < c; i++) {
		scenarioData = scenarioData.concat(encodeScene(elmSceneList.children[i], paletteMap));
	}
	scenarioData.push(0xffff); // Terminate

	return	'#pragma once\n\n#if DATA_FORMAT_VERSION != ' + formatVersion + '\n' +
			'#warning Invalid format version\n#endif\n\n' +
			'PROGMEM const uint8_t ' + baseName + 'BitmapData[] = {' + dumpArray(bitmapData, 2, 16) + '\n};\n\n' +
			'PROGMEM const uint16_t ' + baseName + 'BitmapTable[] = {' + dumpArray(bitmapTable, 4, 12) + '\n};\n\n' +
			'PROGMEM const uint16_t ' + baseName + 'Palette[] = {' + dumpArray(paletteData, 4, 12) + '\n};\n\n' +
			'PROGMEM const uint16_t ' + baseName + 'Scenario[] = {' + dumpArray(scenarioData, 4, 12) + '\n};\n\n';
}

function dumpArray(data, keta, columns) {
	let ret = '';
	let count = 0;
	data.forEach(function(value) {
		if (count++ % columns == 0) {
			ret += '\n   ';
		}
		ret += ' 0x' + ('000' + (value).toString(16)).slice(-keta) + ',';
	});
	return ret;
}

function encodeBitmap(elmBitmap) {
	let width = elmBitmap.customWidth;
	let height = elmBitmap.customHeight;
	let colors = elmBitmap.customMaxIdx + 1;
	let bitmapInfo = 0;
	if (elmBitmap.customIsTrans) {
		colors++;
		bitmapInfo = 8;
	}
	let bitsParColor = Math.max(Math.ceil(Math.LOG2E * Math.log(colors)), 1);

	let data = [];
	data.push(bitmapInfo | (bitsParColor - 1));
	data.push((height - 1) << 4 | (width - 1));

	let value = 0;
	let bits = 0;
	elmBitmap.customData.forEach(function (idx) {
		if (idx < 0) {
			idx = (1 << bitsParColor) - 1;
		}
		value = value << bitsParColor | idx;
		bits += bitsParColor;
		if (bits >= 8) {
			data.push(value >> (bits - 8) & 0xff);
			bits -= 8;
			value &= (1 << bits) - 1;
		}
	});
	if (bits > 0) {
		data.push(value << (8 - bits) & 0xff);
	}
	return data;
}

function encodePalette(elmPalette) {
	let elmColors = getColorsElement(elmPalette);
	let data = [];
	for (let i = 0, c = elmColors.children.length; i < c; i++) {
		data.push(get16bitColorValue(elmColors.children[i]));
	}
	return data;
}

function get16bitColorValue(elmColor) {
	let rgb = elmColor.style.color.match(/\d+/g);
	return (rgb[0] & 0xf8) << 8 | (rgb[1] & 0xfc) << 3 | (rgb[2] & 0xf8) >> 3;

}

function encodeScene(elmScene, paletteMap) {
	let info = getSceneProperties(elmScene);
	let cmd = 0x4000;
	if (info.isClear) { cmd |= 0x2000; }
	if (info.isFlipV) { cmd |= 0x1000; }
	if (info.isFlipH) { cmd |= 0x0800; }
	if (info.isRot90) { cmd |= 0x0400; }
	cmd |= (info.drawY & 0x1f) << 5 | (info.drawX & 0x1f);
	let bitmapIdx = elmScene.customBitmap.customIdx;
	let paletteOffset = paletteMap.get(elmScene.customPalette);
	let data = [ cmd, bitmapIdx << 10 | paletteOffset ];
	if (info.duration) {
		data.push(Math.floor(info.duration * 1000 / 60));
	}
	return data;
}

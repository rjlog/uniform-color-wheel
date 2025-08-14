import { updateCursor } from './cursor.js';
import { initSliders, updateSliderThumbs } from './slider.js';
import { initColorWheel } from './color-wheel.js';

export function handleSliderChange(rgb) {
  updateCursor(rgb)
}

export function handleCursorChange(rgb) {
  updateSliderThumbs(rgb)
}

initSliders()
initColorWheel()
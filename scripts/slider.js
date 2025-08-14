import { handleSliderChange } from './app.js';

const sliders = {
    red: document.querySelector("#slider-red"),
    green: document.querySelector("#slider-green"),
    blue: document.querySelector("#slider-blue")
};

function updateSliderGradients(rgb) {
    sliders.red.style.background = `linear-gradient(to right, rgb(0, ${rgb[1]}, ${rgb[2]}), rgb(255, ${rgb[1]}, ${rgb[2]}))`;
    sliders.green.style.background = `linear-gradient(to right, rgb(${rgb[0]}, 0, ${rgb[2]}), rgb(${rgb[0]}, 255, ${rgb[2]}))`;
    sliders.blue.style.background = `linear-gradient(to right, rgb(${rgb[0]}, ${rgb[1]}, 0), rgb(${rgb[0]}, ${rgb[1]}, 255))`;
}

export function updateSliderThumbs(rgb) {
    sliders.red.value = rgb[0];
    sliders.green.value = rgb[1];
    sliders.blue.value = rgb[2];
    updateSliderGradients(rgb);
}

export function initSliders() {
    Object.values(sliders).forEach(slider => slider.addEventListener("input", function() {
        const rgb = Object.values(sliders).map(s => s.value);
        updateSliderGradients(rgb);
        handleSliderChange(rgb.map(val => val / 255));
    }));
}
// TODO: cursor updates slider
import {updateCursor} from './cursor.js';

const sliders = {
    red: document.querySelector("#slider-red"),
    green: document.querySelector("#slider-green"),
    blue: document.querySelector("#slider-blue")
};

function updateSliders() {
    // hsv to rgb f
    
}

Object.values(sliders).forEach(slider => slider.addEventListener("input", function() {
    updateCursor(...Object.values(sliders).map(slider => slider.value / 255))}));
import { initCursor, updateCursor } from "./cursor.js";
import { initSliders, updateRgbInput, updateValueInput } from './sliders.js';
import { initColorWheel } from './color-wheel.js';
import { rgbToTsv, tsvToRgb, rgbToHex, hexToRgb, rgbToLab } from "./color.js";

const hexDisplay = document.querySelector("#hex-display");
const hexContainer = document.querySelector("#hex-container")

let turn = 0.0
let saturation = 0.0
let value = 1.0
let color
let hashUpdateTimeout

export function handleCursorChange(x, y, distance_center) {
    saturation = -0.553 * Math.cos(0.8 * Math.PI * distance_center) + 0.553;
    turn = 0.5 - 0.5 * Math.atan2(-y, x) / Math.PI;
    color = tsvToRgb(turn, saturation, value)
    updateHex()
    updateRgbInput(color.map(value => Math.round(value * 255)))
    updateValueInput(turn, saturation, Math.round(value * 255))
}


export function handleRgbInputChange(rgb) {
    [turn, saturation, value] = rgbToTsv(rgb)
    updateCursor(turn, saturation)
    updateValueInput(turn, saturation, Math.round(value * 255))
    color = rgb
    updateHex()
}

export function handleValueInputChange(v) {
    value = v
    color = tsvToRgb(turn, saturation, value)
    updateHex()
    updateRgbInput(color.map(value => Math.round(value * 255)))
}

function updateHex() {
    const hex = rgbToHex(color);
    hexDisplay.textContent = '#' + hex;
    hexDisplay.style.color = '#' + hex;
    if (rgbToLab(color)[0] > 0.85)
        hexContainer.style.background = "#333"
    else
        hexContainer.style.background = "white"
    clearTimeout(hashUpdateTimeout);
    hashUpdateTimeout = setTimeout(() => {
        location.hash = hex;
    }, 600);
}

initSliders(handleRgbInputChange, handleValueInputChange)
initColorWheel()
initCursor(handleCursorChange)

color = hexToRgb(location.hash)
if (color) {
    updateRgbInput(color.map(value => Math.round(value * 255)));
    [turn, saturation, value] = rgbToTsv(color)
    updateValueInput(turn, saturation, Math.round(value * 255))
    updateCursor(turn, saturation)
    updateHex()
}
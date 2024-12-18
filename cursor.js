import {colorWheelCanvas, canvasSize, radius} from "./color-wheel.js";

const cursor = document.querySelector("#cursor");
const centerX = canvasSize / 2;
const centerY = canvasSize / 2;

main()
function main() {
    const computedStyle = window.getComputedStyle(cursor);
    const mousedownSize = 20 + 'px'
    
    const keyframes = [
        { width: computedStyle.width, height: computedStyle.height},
        { width: mousedownSize, height: mousedownSize}
    ];
    const optionsForward = {
        duration: 80,    // Animation duration in milliseconds
        iterations: 1,      // Number of times the animation should repeat
        fill: 'forwards'
    };

    const optionsReverse = {
        duration: 80,    // Animation duration in milliseconds
        iterations: 1,      // Number of times the animation should repeat
        fill: 'forwards',
        direction: 'reverse'
    };

    let dragging = false;
    
    onmouseup = () => {
        if (dragging) {
            dragging = false;
            cursor.animate(keyframes, optionsReverse);
        }
    }

    document.body.onblur = (event) => {
        if (dragging) {onmouseup(event)}
    }
    
    colorWheelCanvas.onmousedown = (event) => {
        cursor.animate(keyframes, optionsForward);
        dragging = true;
        move(event);
    }
    
    onmousemove = (event) => {
        if (dragging) {
            move(event);
        }
    }
}

function move(event) {
    let x = event.clientX - colorWheelCanvas.getBoundingClientRect().left;
    let y = event.clientY - colorWheelCanvas.getBoundingClientRect().top;
    const radiusWheel = radius * canvasSize;
    const distance = Math.hypot(centerX - x, centerY - y);
    const dx = centerX - x;
    const dy = centerY - y;
    if (Math.hypot(dx, dy) > radiusWheel) {
        x = centerX - dx / distance * radiusWheel;
        y = centerY - dy / distance * radiusWheel;
    }
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
}
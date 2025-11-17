// TODO: keyboard support for accessibility

import { canvasSize, radius } from './color-wheel.js';

export const cursor = document.querySelector('#cursor');
const container = document.getElementById('color-wheel-container');

const centerX = canvasSize / 2;
const centerY = canvasSize / 2;

export function initCursor(handleCursorChange) {
    const computedStyle = window.getComputedStyle(cursor);
    const mousedownSize = 15 + 'px';

    const keyframes = [
        { width: computedStyle.width, height: computedStyle.height },
        { width: mousedownSize, height: mousedownSize }
    ];

    const optionsForward = { duration: 80, iterations: 1, fill: 'forwards' };
    const optionsReverse = { duration: 80, iterations: 1, fill: 'forwards', direction: 'reverse' };

    let dragging = false;

    const startDrag = (event) => {
        event.preventDefault();
        dragging = true;

        cursor.animate(keyframes, optionsForward);
        container.setPointerCapture(event.pointerId);

        handleMouseEvent(event, handleCursorChange);
    };

    const moveDrag = (event) => {
        if (!dragging) return;
        event.preventDefault();
        handleMouseEvent(event, handleCursorChange);
    };

    const endDrag = (event) => {
        if (!dragging) return;
        dragging = false;
        cursor.animate(keyframes, optionsReverse);
        container.releasePointerCapture(event.pointerId);
    };


    container.onpointerdown = startDrag;
    container.onpointermove = moveDrag;
    container.onpointerup = endDrag;
    container.onpointercancel = endDrag;
}

function handleMouseEvent(event, handleCursorChange) {
    const rect = container.getBoundingClientRect();

    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    const radiusWheel = radius * canvasSize;
    const dx = centerX - x;
    const dy = centerY - y;
    const distance = Math.hypot(dx, dy);

    // Constrain to circle
    if (distance > radiusWheel) {
        x = centerX - dx / distance * radiusWheel;
        y = centerY - dy / distance * radiusWheel;
    }

    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';

    handleCursorChange(dx, dy, Math.min(distance / radiusWheel, 1));
}

export function updateCursor(turn, saturation) {
    const distance = Math.acos(1 - saturation / 0.553) / 0.8 / Math.PI;

    const radians = turn * 2 * Math.PI;
    const radiusWheel = radius * canvasSize;

    cursor.style.left = Math.cos(radians) * radiusWheel * distance + canvasSize / 2 + 'px';
    cursor.style.top = Math.sin(radians) * radiusWheel * distance + canvasSize / 2 + 'px';
}
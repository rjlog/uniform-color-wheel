import {radius} from "./color-wheel.js";

function referenceWhiteLuminanceToLuminance(x) {
    const k_1 = 0.206;
    const k_2 = 0.03;
    const k_3 = (1.0 + k_1) / (1.0 + k_2);
    return (x * x + k_1 * x) / (k_3 * (x + k_2));
}

function labToLinearRgb(L, a, b) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = Math.pow(l_, 3.0);
    const m = Math.pow(m_, 3.0);
    const s = Math.pow(s_, 3.0);

    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    ];
}

export function rgbToLab(rgb) {
    const mask = rgb.map((value) => value <= 0.04045);

    const linearRgb = rgb.map((value, i) =>
        mask[i] ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));

    const long = 0.4122214708 * linearRgb[0] + 0.5363325363 * linearRgb[1] + 0.0514459929 * linearRgb[2];
    const medium = 0.2119034982 * linearRgb[0] + 0.6806995451 * linearRgb[1] + 0.1073969566 * linearRgb[2];
    const short = 0.0883024619 * linearRgb[0] + 0.2817188376 * linearRgb[1] + 0.6299787005 * linearRgb[2];

    const lmsCbrt = [long, medium, short].map((value) => Math.cbrt(value));
    return [0.2104542553 * lmsCbrt[0] + 0.793617785 * lmsCbrt[1] - 0.0040720468 * lmsCbrt[2],
            1.9779984951 * lmsCbrt[0] - 2.428592205 * lmsCbrt[1] + 0.4505937099 * lmsCbrt[2],
            0.0259040371 * lmsCbrt[0] + 0.7827717662 * lmsCbrt[1] - 0.808675766 * lmsCbrt[2]];
}


function linearRgbToRgb(r, g, b) {
    let linearRgb = [r, g, b];
    const mask = linearRgb.map(value => value <= 0.0031308);

    return linearRgb.map((value, i) =>
        mask[i] ? value * 12.92 : Math.pow(value, 1.0 / 2.4) * 1.055 - 0.055
    );
}

function rgbModel(turn, a, b, c) {
    const base = Math.max(0.0, (a - turn) / b);
    const powered = Math.pow(base, c);
    return Math.max(0.0, Math.min(powered, 1.0)); // clamp
}

export function turnToRgb(turn) {
    let green;
    if (turn < 0.3) {
        green = rgbModel(turn, 0.0, -0.18915, 0.65071);
    } else {
        green = rgbModel(turn, 0.62215, 0.21030, 0.66797);
    }

    let red;
    let blue;
    if (turn < 0.5) {
        red = rgbModel(turn, 0.28805, 0.09890, 0.58492);
        blue = rgbModel(turn, 0.28805, -0.12380, 0.57563);
    } else {
        red = rgbModel(turn, 0.62215, -0.20310, 0.73273);
        blue = rgbModel(turn, 1.0, 0.17475, 0.65491);
    }

    return [red, green, blue];
}

function getRgb(turn, saturation, value) {
    const rgb = turnToRgb(turn);
    const lab = rgbToLab(rgb);
    const L_cusp = lab[0];
    let ok_a = lab[1];
    let ok_b = lab[2];
    const C_cusp = Math.sqrt(ok_a * ok_a + ok_b * ok_b);
    ok_a = ok_a / C_cusp;
    ok_b = ok_b / C_cusp;

    const S_max = C_cusp / L_cusp;
    const T_max = C_cusp / (1.0 - L_cusp);

    const S_0 = 0.5;
    const k = 1.0 - S_0 / S_max;
    const L_v = 1.0 - saturation * S_0 / (S_0 + T_max - T_max * k * saturation);
    const C_v = saturation * T_max * S_0 / (S_0 + T_max - T_max * k * saturation);

    let L = value * L_v;
    let C = value * C_v;

    const L_vt = referenceWhiteLuminanceToLuminance(L_v);
    const C_vt = C_v * L_vt / L_v;
    const L_new = referenceWhiteLuminanceToLuminance(L);
    C = C * L_new / L;
    L = L_new;

    const scale_rgb = labToLinearRgb(L_vt, ok_a * C_vt, ok_b * C_vt);
    const scale_L = Math.cbrt(1.0 / Math.max(scale_rgb[0], scale_rgb[1], scale_rgb[2]));
    L *= scale_L;
    C *= scale_L;

    const linear_rgb = labToLinearRgb(L, C * ok_a, C * ok_b);
    return linearRgbToRgb(linear_rgb[0], linear_rgb[1], linear_rgb[2]);
}

export function getColor(x, y, distance_center) {
    let saturation = -0.553 * Math.cos(0.8 * Math.PI * distance_center) + 0.553;
    const value = 1.0;
    const turn = 0.5 - 0.5 * Math.atan2(-y, x) / Math.PI;
    return getRgb(turn, saturation, value);
}
#version 300 es
// mediump is a good default
precision mediump float;

out vec4 COLOR;

const float RADIUS = 0.5;
const float TAU = 6.283185307179;
const float PI = 3.141592653589;
uniform sampler2D hues;

uniform vec2 resolution;


// Inverse function for L_r (Luminance)
float reference_white_luminance_to_luminance(float x) {
    const float k_1 = 0.206;
    const float k_2 = 0.03;
    const float k_3 = (1.0 + k_1) / (1.0 + k_2);
    return (x * x + k_1 * x) / (k_3 * (x + k_2));
}

// Convert OKLab to linear RGB
vec3 oklab_to_srgb(float L, float a, float b) {
    float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    float s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    float l = pow(l_, 3.0);
    float m = pow(m_, 3.0);
    float s = pow(s_, 3.0);

    return vec3(
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
}

vec3 srgb_to_oklab(float r, float g, float b) {
    vec3 rgb = vec3(r, g, b);

    // Convert non-linear RGB to linear RGB
    for (int i = 0; i < 3; i++) {
        if (rgb[i] <= 0.04045) {
            rgb[i] = rgb[i] / 12.92;
        } else {
            rgb[i] = pow((rgb[i] + 0.055) / 1.055, 2.4);
        }
    }
    r = rgb.r;
    g = rgb.g;
    b = rgb.b;

    // Apply transformation to linear RGB
    float l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    float m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    float s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    // Compute cube roots of l, m, and s
    float l_ = pow(l, 1.0 / 3.0);
    float m_ = pow(m, 1.0 / 3.0);
    float s_ = pow(s, 1.0 / 3.0);

    // Convert to OKLab space
    float L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    float A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    float B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

    return vec3(L, A, B);
}


// Convert linear RGB to non-linear RGB
vec3 linear_rgb_to_srgb(float r, float g, float b) {
    vec3 rgb = vec3(r, g, b);
    for (int i = 0; i < 3; i++) {
        if (rgb[i] <= 0.0031308) {
            rgb[i] = rgb[i] * 12.92;
        } else {
            rgb[i] = pow(rgb[i], 1.0 / 2.4) * 1.055 - 0.055;
        }
    }
    return rgb;
}

vec3 hsv_to_rgb(float hue, float saturation, float value) {
    float chroma = saturation * value;
    float min_rgb = value - chroma;
    float r = clamp(abs(chroma * 6.0 * hue - 3.0 * chroma) - 1.0 * chroma, 0.0, chroma);
    float g = clamp(-abs(chroma * 6.0 * hue - 2.0 * chroma) + 2.0 * chroma, 0.0, chroma);
    float b = clamp(-abs(chroma * 6.0 * hue - 4.0 * chroma) + 2.0 * chroma, 0.0, chroma);
    return vec3(min_rgb + r, min_rgb + g, min_rgb + b);
}

vec3 get_rgb(float hue, float saturation, float value) {
	vec3 rgb = hsv_to_rgb(hue, 1.0, 1.0);
	vec3 lab = srgb_to_oklab(rgb[0], rgb[1], rgb[2]);
	float L_cusp = lab[0];
    float ok_a = lab[1];
    float ok_b = lab[2];
	float C_cusp = sqrt(ok_a * ok_a + ok_b * ok_b);
	ok_a = ok_a / C_cusp;
	ok_b = ok_b / C_cusp;

    // Maximum saturation and value calculations
    float S_max = C_cusp / L_cusp;
    float T_max = C_cusp / (1.0 - L_cusp);

    float S_0 = 0.5;
    float k = 1.0 - S_0 / S_max;
    float L_v = 1.0 - saturation * S_0 / (S_0 + T_max - T_max * k * saturation);
    float C_v = saturation * T_max * S_0 / (S_0 + T_max - T_max * k * saturation);

    // Compute final L and C values
    float L = value * L_v;
    float C = value * C_v;

    float L_vt = reference_white_luminance_to_luminance(L_v);
    float C_vt = C_v * L_vt / L_v;
    float L_new = reference_white_luminance_to_luminance(L);
    C = C * L_new / L;
    L = L_new;

    vec3 scale_rgb = oklab_to_srgb(L_vt, ok_a * C_vt, ok_b * C_vt);
    float scale_L = pow(1.0 / max(scale_rgb.r, max(scale_rgb.g, scale_rgb.b)), 1.0 / 3.0);
    L *= scale_L;
    C *= scale_L;

    vec3 linear_rgb = oklab_to_srgb(L, C * ok_a, C * ok_b);
    return linear_rgb_to_srgb(linear_rgb.r, linear_rgb.g, linear_rgb.b);
}

vec3 get_color(vec2 pos, float distance_center) {
	// Linear at the edges, more white in the center, gradual change
	float saturation = -0.553 * cos(0.8 * PI * distance_center) + 0.553;
	float value = 1.0;
	float hue = atan(pos.x, pos.y) / TAU + 0.5;
	hue = texture(hues, vec2(hue,0.0));

	return get_rgb(hue, saturation, value);
}

void colorWheel() {
    vec2 uv = vec2(1.0,-1.0) * (0.5 - gl_FragCoord.xy / resolution);
    float distance_center = length(uv);
    if (distance_center <= RADIUS)
    {
        float alpha = clamp((RADIUS - distance_center) * resolution.y * 0.5, 0.0, 1.0);
        COLOR = vec4(get_color(uv, distance_center), alpha);
    }
}
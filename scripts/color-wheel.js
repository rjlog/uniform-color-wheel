export const colorWheelCanvas = document.querySelector('#color-wheel');
export const canvasSize = colorWheelCanvas.clientWidth;
export const radius = 0.5

const glCanvas = document.createElement('canvas');
const gl = glCanvas.getContext('webgl2', { antialias: false });

export function initColorWheel() {
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const alignment = 1;
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
  // language=GLSL
  const vertexShaderSource = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position * 2.0 - 1.0, 0, 1.0);
}
`;
  // language=GLSL
  const fragmentShaderSource = `#version 300 es
precision mediump float;

out vec4 COLOR;

const float RADIUS = ${radius};
const float TAU = ${Math.PI * 2};
const float PI = ${Math.PI};

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

//vec3 hsv_to_rgb(float hue) {
//    float r = clamp(abs(6.0 * hue - 3.0) - 1.0, 0.0, 1.0);
//    float g = clamp(-abs(6.0 * hue - 2.0) + 2.0, 0.0, 1.0);
//    float b = clamp(-abs(6.0 * hue - 4.0) + 2.0, 0.0, 1.0);
//    return vec3(r, g, b);
//}

float rgb_model(float turn, float a, float b, float c) {
  float base = max(0.0, (a - turn) / b);
  return clamp(pow(base, c), 0.0, 1.0);
}



vec3 turn_to_rgb(float turn) {
  float green;
  if (turn < 0.3) {
    green = rgb_model(turn, 0.0, -0.18915, 0.65071);
  } else {
    green = rgb_model(turn, 0.62215, 0.21030, 0.66797);
  }

  float red;
  float blue;
  if (turn < 0.5) {
    red = rgb_model(turn, 0.28805, 0.09890, 0.58492);
    blue = rgb_model(turn, 0.28805, -0.12380, 0.57563);
  } else {
    red = rgb_model(turn, 0.62215, -0.20310, 0.73273);
    blue = rgb_model(turn, 1.0, 0.17475, 0.65491);
  }

  return vec3(red, green, blue);
}

vec3 get_rgb(float turn, float saturation, float value) {
	vec3 rgb = turn_to_rgb(turn);
	vec3 lab = srgb_to_oklab(rgb[0], rgb[1], rgb[2]);
	float L_cusp = lab[0];
    float ok_a = lab[1];
    float ok_b = lab[2];
	float C_cusp = sqrt(ok_a * ok_a + ok_b * ok_b);
	ok_a = ok_a / C_cusp;
	ok_b = ok_b / C_cusp;

    float S_max = C_cusp / L_cusp;
    float T_max = C_cusp / (1.0 - L_cusp);

    float S_0 = 0.5;
    float k = 1.0 - S_0 / S_max;
    float L_v = 1.0 - saturation * S_0 / (S_0 + T_max - T_max * k * saturation);
    float C_v = saturation * T_max * S_0 / (S_0 + T_max - T_max * k * saturation);
    // L_v = saturation * (L_cusp - 1.0) + 1.0;
    // C_v = saturation * C_cusp;

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
	float saturation = -0.553 * cos(0.8 * PI * distance_center / RADIUS) + 0.553;
	float value = 1.0;
	float turn = atan(-pos.y, pos.x) / TAU + 0.5;
	return get_rgb(turn, saturation, value);
}

void main() {
    vec2 uv = vec2(1.0,-1.0) * (0.5 - gl_FragCoord.xy / resolution);
    float distance_center = length(uv);
    if (distance_center <= RADIUS)
    {
        float alpha = clamp((RADIUS - distance_center) * resolution.y * 0.5, 0.0, 1.0);
        COLOR = vec4(get_color(uv, distance_center), alpha);
    }
}
`;
  
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  setPositions(program);
  const resolutionUniformLocation = gl.getUniformLocation(program, 'resolution');
  try {
    setHues(program);
  } catch (e) {
    // Do nothing
  }
  
  const draw = () => drawScene(resolutionUniformLocation);
  window.onresize = draw;
  draw()
}

function drawScene(resolutionUniformLocation) {
  glCanvas.width = 
      glCanvas.height = Math.floor(canvasSize * window.devicePixelRatio);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(resolutionUniformLocation, glCanvas.width, glCanvas.height);
  const primitiveType = gl.TRIANGLES;
  const offset = 0;
  const count = 6;
  gl.drawArrays(primitiveType, offset, count);
  toImage(glCanvas.width, glCanvas.height);
}

function setPositions(program) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0, 
        1.0, 0.0, 
        0.0, 1.0,

        1.0, 0.0, 
        1.0, 1.0, 
        0.0, 1.0,
      ]), gl.STATIC_DRAW);
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  const positionLocation = gl.getAttribLocation(program, 'position');
  const size = 2; // 2 components per iteration
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);
  gl.enableVertexAttribArray(positionLocation);
}

function toImage(width, height) {
  const pixels = new Uint8Array(width * height * 4); // 4 bytes per pixel (RGBA)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  colorWheelCanvas.width = width;
  colorWheelCanvas.height = height;
  const ctx = colorWheelCanvas.getContext('2d');
  const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
  ctx.putImageData(imageData, 0, 0);
  // Here it is not accounted for that the gl origin is in the bottom left. This is done inside the shader.
  // rescale
  colorWheelCanvas.style.width = 
      colorWheelCanvas.style.width = canvasSize + 'px';
  const img = document.createElement('img');
  img.src = colorWheelCanvas.toDataURL();
  img.style.width = canvasSize + 'px';
  img.alt = "color wheel";
  colorWheelCanvas.replaceWith(img);

}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}
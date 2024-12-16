const canvas = document.querySelector('#gl-canvas');
const canvasHeight = canvas.clientHeight;
const canvasWidth = canvas.clientWidth;
const gl = canvas.getContext('webgl2', { antialias: false });
const vertexShaderSource = document.querySelector('#vertex-shader-2d').text;
const fragmentShaderSource = document.querySelector('#fragment-shader-2d').text;

main();

function main() {
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const alignment = 1;
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
  
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);
  
  setPositions(program);
  const resolutionUniformLocation = gl.getUniformLocation(program, 'resolution');
  setTexture(program);
  
  gl.useProgram(program);

  const draw = () => drawScene(resolutionUniformLocation);
  window.onresize = draw;
  draw()
}

function drawScene(resolutionUniformLocation) {
  canvas.width = Math.floor(canvasWidth * window.devicePixelRatio);
  canvas.height = Math.floor(canvasHeight * window.devicePixelRatio);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
  gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
  
  const primitiveType = gl.TRIANGLES;
  const offset = 0;
  const count = 6;
  gl.drawArrays(primitiveType, offset, count);

  // Scale down to original size
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';
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

function setTexture(program) {
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  // fill texture with 3x1 pixels
  const level = 0;
  const internalFormat = gl.R32F;
  const width = 3;
  const height = 1;
  const border = 0;
  const format = gl.RED;
  const type = gl.FLOAT;
  const data = new Float32Array([0.0,  40.0, 80.0,]);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);

  // set the filtering so we don't need mips and it's not filtered
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  const textureLocation = gl.getUniformLocation(program, 'texture');
  // Tell the shader to use texture unit 0 for u_texture
  gl.uniform1i(textureLocation, 0);
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




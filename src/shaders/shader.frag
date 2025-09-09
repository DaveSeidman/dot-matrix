precision mediump float;

varying float vLuma;

uniform float uEase;
uniform vec3  uColorA;
uniform vec3  uColorB;

void main() {
  // round sprite
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  float circle = smoothstep(1.0, 0.9, r2);

  // color from luminance (you can mix in uEase if you want smoothing)
  vec3 col = mix(uColorA, uColorB, vLuma);

  gl_FragColor = vec4(col, circle);
  if (gl_FragColor.a < 0.01) discard;
}

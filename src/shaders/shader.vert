attribute vec2 aUv;

uniform sampler2D uTex;
uniform vec2  uTexSize;
uniform float uSamplePx;
uniform float uGamma;
uniform float uDotMin;     // min point size (slider)
uniform float uDotMax;     // max point size (slider)
uniform float uSizeCap;    // hardware cap injected from JS

varying float vLuma;

// 3x3 box sample, scale in video pixels
float sampleLuma(vec2 baseUv) {
  vec2 duv = vec2(uSamplePx) / uTexSize;
  vec3 acc = vec3(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 uv = clamp(baseUv + vec2(float(i), float(j)) * duv, 0.0, 1.0);
      acc += texture2D(uTex, uv).rgb;
    }
  }
  vec3 avg = acc / 9.0;
  return dot(avg, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  float L = sampleLuma(aUv);
  L = pow(L, 1.0 / max(0.0001, uGamma));
  vLuma = clamp(L, 0.0, 1.0);

  // dot size is a VERTEX concern
  float size = mix(uDotMin, uDotMax, vLuma);
  size = min(size, uSizeCap);  // clamp to hardware max

  gl_PointSize = size;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}

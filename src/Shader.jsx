import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, Color, MathUtils } from "three";
import vertexShader from "./shaders/shader.vert?raw";
import fragmentShader from "./shaders/shader.frag?raw";

export default function Shader({ videoTex, videoSize, controls }) {
  const { gl } = useThree();
  const {
    cols, rows, samplePx, gamma, dotMin, dotMax, easingFactor, colorA, colorB,
  } = controls;

  const geomRef = useRef(null);
  const matRef = useRef(null);

  const [positions, setPositions] = useState(new Float32Array());
  const [uvs, setUvs] = useState(new Float32Array());

  // geometry rebuild on rows/cols
  useEffect(() => {
    const pts = [];
    const uv = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols;
        const v = (r + 0.5) / rows;
        const x = u * 2 - 1;
        const y = -(v * 2 - 1);
        pts.push(x, y, 0);
        uv.push(u, v);
      }
    }
    setPositions(new Float32Array(pts));
    setUvs(new Float32Array(uv));
  }, [rows, cols]);

  useEffect(() => {
    if (!geomRef.current) return;
    geomRef.current.setAttribute("position", new BufferAttribute(positions, 3));
    geomRef.current.setAttribute("aUv", new BufferAttribute(uvs, 2));
  }, [positions, uvs]);

  // push slider-driven uniforms on change (so they don't get stuck in a stale frame closure)
  useEffect(() => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uSamplePx.value = samplePx;
    u.uGamma.value = gamma;
    u.uDotMin.value = dotMin;
    u.uDotMax.value = dotMax;
  }, [samplePx, gamma, dotMin, dotMax]);

  // useEffect(() => {
  //   if (!matRef.current) return;
  //   const u = matRef.current.uniforms;
  //   u.uColorA.value.set(colorA);
  //   u.uColorB.value.set(colorB);
  // }, [colorA, colorB]);

  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTexSize.value.copy(videoSize);
  }, [videoSize]);

  // inject hardware size cap once
  // useEffect(() => {
  // if (!matRef.current) return;
  // const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || [1, 64];
  // matRef.current.uniforms.uSizeCap.value = Math.floor(range[1] || 64);
  // }, [gl]);

  // per-frame: only true frame dynamics
  const easeRef = useRef(easingFactor);
  useEffect(() => { easeRef.current = easingFactor; }, [easingFactor]);

  useFrame((_, dt) => {
    if (!matRef.current) return;
    if (videoTex) videoTex.needsUpdate = true;
    const u = matRef.current.uniforms;
    u.uTex.value = videoTex;
    u.uEase.value = MathUtils.clamp(easeRef.current * (dt * 60.0), 0.0, 1.0);
  });

  const key = [samplePx, gamma, dotMin, dotMax, easingFactor, colorA, colorB].join('-')

  return (
    <points>
      <bufferGeometry ref={geomRef} />
      <shaderMaterial
        key={key}
        ref={matRef}
        // transparent
        // depthWrite={false}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTex: { value: videoTex },
          uTexSize: { value: videoSize.clone() },
          uSamplePx: { value: samplePx },
          uGamma: { value: gamma },
          uDotMin: { value: dotMin },
          uDotMax: { value: dotMax },
          uEase: { value: easingFactor },
          uColorA: { value: new Color(colorA) },
          uColorB: { value: new Color(colorB) },
          uSizeCap: { value: 64 }, // default; overwritten by effect above
        }}
      />
    </points>
  );
}

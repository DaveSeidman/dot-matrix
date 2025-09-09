import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, Color, MathUtils } from "three";
import vertexShader from "./shader.vert?raw";
import fragmentShader from "./shader.frag?raw";

export default function DotShader({ videoTex, videoSize, size, samplePx, gamma, dotMin, dotMax, easingFactor, color }) {
  const geomRef = useRef(null);
  const matRef = useRef(null);

  const [positions, setPositions] = useState(new Float32Array());
  const [uvs, setUvs] = useState(new Float32Array());

  const { size: viewportSize } = useThree();

  useEffect(() => {
    const aspect = viewportSize.width / viewportSize.height; // >1 = wide, <1 = tall
    const pts = [];
    const uv = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const u = (c + 0.5) / size;
        const v = (r + 0.5) / size;

        // map to NDC (-1..1), correct for aspect ratio
        const x = (u * 2 - 1) * aspect;
        const y = -(v * 2 - 1);

        pts.push(x, y, 0);
        uv.push(u, v);
      }
    }

    setPositions(new Float32Array(pts));
    setUvs(new Float32Array(uv));
  }, [size, viewportSize]);


  useEffect(() => {
    if (!geomRef.current) return;
    geomRef.current.setAttribute("position", new BufferAttribute(positions, 3));
    geomRef.current.setAttribute("aUv", new BufferAttribute(uvs, 2));
  }, [positions, uvs]);


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
    if (videoTex) {
      videoTex.needsUpdate = true;
      // console.log(videoSize)
    }
    const u = matRef.current.uniforms;
    u.uTex.value = videoTex;
    u.uEase.value = MathUtils.clamp(easeRef.current * (dt * 60.0), 0.0, 1.0);
  });

  const key = [samplePx, gamma, dotMin, dotMax, easingFactor, color].join('-')

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
          uColorA: { value: new Color('rgb(100, 100, 100)') },
          uColorB: { value: new Color(color) },
          uSizeCap: { value: 64 }, // default; overwritten by effect above
        }}
      />
    </points>
  );
}

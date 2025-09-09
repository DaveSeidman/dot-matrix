import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useControls } from "leva";
import { VideoTexture, LinearFilter, RGBAFormat, Vector2 } from "three";
import DotShader from "./DotShader";
import "./index.scss";

const FULLSCREEN_ERRS_TO_IGNORE = new Set([
  "document is not in a state that allows fullscreen",
  "fullscreen error",
]);

export default function App() {
  const videoRef = useRef(null);
  const [videoTex, setVideoTex] = useState(null);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });

  const {
    view, size, connectors, samplePx, gamma, dotMin, dotMax, easingFactor, color
  } = useControls({
    view: { value: 'dots', options: ['dots', 'camera'] },
    size: { value: 48, min: 4, max: 256, step: 1 },
    connectors: { value: 'none', options: ['none', 'horizontal', 'vertical', 'diagonal1', 'diagonal2'] },
    samplePx: { value: 6, min: 1, max: 20, step: 1 },
    gamma: { value: 1.1, min: 0.5, max: 3, step: 0.05 },
    dotMin: { value: 1, min: 0.5, max: 8, step: 0.5 },
    dotMax: { value: 18, min: 2, max: 64, step: 1 },
    easingFactor: { value: 0.25, min: 0.01, max: 1, step: 0.01 },
    color: "#00d8ff"
  })
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    const v = videoRef.current;
    v.srcObject = stream;
    await v.play().catch(() => { });

    // try {
    //   const el = document.documentElement;
    //   if (el.requestFullscreen) await el.requestFullscreen();
    //   else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    // } catch (err) {
    //   const msg = (err?.message || "").toLowerCase();
    //   if (!FULLSCREEN_ERRS_TO_IGNORE.has(msg)) console.warn("Fullscreen failed:", err);
    // }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      setVideoSize({ w: v.videoWidth, h: v.videoHeight });
      const tex = new VideoTexture(v);
      tex.minFilter = LinearFilter;
      tex.magFilter = LinearFilter;
      tex.format = RGBAFormat;
      setVideoTex(tex);
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("loadeddata", onLoaded);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("loadeddata", onLoaded);
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        const v = videoRef.current;
        const stream = v && v.srcObject;
        if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop());
      } catch { }
    };
  }, []);

  return (
    <div className="app" style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <button
        onClick={start}
        style={{ position: "fixed", zIndex: 10, left: 16, top: 16, padding: "8px 12px", borderRadius: 8 }}
      >
        Start
      </button>

      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className={`webcam ${view === 'camera' ? '' : 'hidden'}`}
      />

      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 300 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        style={{ position: 'fixed', inset: 0, width: "100vw", height: "100vh" }}
      >
        {videoTex && (
          <DotShader
            videoTex={videoTex}
            videoSize={new Vector2(videoSize.w || 1, videoSize.h || 1)}
            size={size}
            connectors={connectors}
            samplePx={samplePx}
            gamma={gamma}
            dotMin={dotMin}
            dotMax={dotMax}
            easingFactor={easingFactor}
            color={color}
          />
        )}
      </Canvas>
    </div>
  );
}

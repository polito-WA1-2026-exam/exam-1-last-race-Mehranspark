// Animated "constellation" background: glowing blue nodes drift around and draw a
// line to any nearby node (fainter as they get further apart).
//
// This is imperative <canvas> drawing, which React does through a *ref* (the
// official escape hatch for imperative browser APIs). It is NOT manipulation of
// the React-managed DOM tree: we never add/remove elements by hand — we only draw
// pixels on one canvas and run an animation loop, fully cleaned up on unmount.

import { useRef, useEffect } from "react";

const MAX_DIST = 165; // px: nodes closer than this get connected
const LINE_RGB = "120, 195, 255"; // base colour for the connecting lines

function ParticleNetwork() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let nodes = [];
    let raf = 0;

    // (Re)size the canvas to the viewport and (re)create the node field. Node
    // count scales with the screen area so density feels consistent.
    function setup() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(180, Math.floor((width * height) / 9500));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45, // slow drift
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 1.6 + 1.1,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);

      // move + bounce off the edges
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x <= 0 || n.x >= width) n.vx *= -1;
        if (n.y <= 0 || n.y >= height) n.vy *= -1;
      }

      // connecting lines (only between nearby nodes)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.6;
            ctx.strokeStyle = `rgba(${LINE_RGB}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // glowing nodes
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(56, 189, 248, 0.9)";
      ctx.fillStyle = "rgba(150, 210, 255, 0.95)";
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(frame);
    }

    setup();
    frame();

    // keep it crisp on resize; pause the loop when the tab is hidden (saves CPU)
    const onResize = () => setup();
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(frame);
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    // cleanup: stop the loop and remove listeners
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="lr-bg-net" aria-hidden="true" />;
}

export default ParticleNetwork;

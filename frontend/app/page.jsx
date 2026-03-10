'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ─── SVG ICONS ────────────────────────────────────────────────
const Icons = {
  Send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Map: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
  Compass: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Mountain: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Coins: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Gem: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="6 3 18 3 22 9 12 22 2 9"/><polyline points="22 9 12 9 6 3"/><line x1="12" y1="22" x2="12" y2="9"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Loader: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
};

// ─── ANIMATED LANDSCAPE BACKGROUND ───────────────────────────
function LandscapeBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Cloud particles
    const clouds = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: 60 + Math.random() * 120,
      w: 80 + Math.random() * 120,
      h: 30 + Math.random() * 40,
      speed: 0.15 + Math.random() * 0.2,
      opacity: 0.4 + Math.random() * 0.3,
    }));

    // Birds
    const birds = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: 80 + Math.random() * 100,
      speed: 0.3 + Math.random() * 0.4,
      size: 4 + Math.random() * 4,
      flapPhase: Math.random() * Math.PI * 2,
    }));

    // Camel on the desert section
    const camel = { x: -80, speed: 0.18 };

    // Desert dunes particles
    const duneParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * window.innerWidth,
      y: 0,
      size: 1 + Math.random() * 2,
      opacity: Math.random() * 0.4,
      speed: 0.05 + Math.random() * 0.1,
    }));

    function drawSky(w, h, t) {
      const grad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      grad.addColorStop(0, '#0f1f3d');
      grad.addColorStop(0.3, '#1a3a5c');
      grad.addColorStop(0.6, '#2d6a7a');
      grad.addColorStop(1, '#e8c07a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h * 0.55);
    }

    function drawStars(w, h, t) {
      const starPositions = [
        [0.05, 0.04], [0.12, 0.08], [0.22, 0.03], [0.35, 0.07],
        [0.48, 0.02], [0.6, 0.09], [0.72, 0.04], [0.85, 0.06],
        [0.93, 0.03], [0.15, 0.15], [0.45, 0.12], [0.78, 0.14],
        [0.28, 0.18], [0.65, 0.17], [0.9, 0.11],
      ];
      starPositions.forEach(([sx, sy], i) => {
        const twinkle = 0.4 + 0.5 * Math.sin(t * 0.8 + i * 1.3);
        ctx.beginPath();
        ctx.arc(sx * w, sy * h * 0.55, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,220,${twinkle})`;
        ctx.fill();
      });
    }

    function drawSun(w, h, t) {
      const sx = w * 0.82;
      const sy = h * 0.18;
      // Glow
      const glow = ctx.createRadialGradient(sx, sy, 5, sx, sy, 80);
      glow.addColorStop(0, 'rgba(255,200,80,0.35)');
      glow.addColorStop(1, 'rgba(255,150,50,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 80, sy - 80, 160, 160);
      // Sun
      ctx.beginPath();
      ctx.arc(sx, sy, 28, 0, Math.PI * 2);
      const sunGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 28);
      sunGrad.addColorStop(0, '#fff8d0');
      sunGrad.addColorStop(0.5, '#ffd060');
      sunGrad.addColorStop(1, '#ff9030');
      ctx.fillStyle = sunGrad;
      ctx.fill();
    }

    function drawCloud(x, y, w, h, opacity) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#ffffff';
      const rx = w / 2, ry = h / 2;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.ellipse(x - rx * 0.5, y + ry * 0.3, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2);
      ctx.ellipse(x + rx * 0.5, y + ry * 0.2, rx * 0.8, ry * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawBird(x, y, size, phase) {
      ctx.save();
      ctx.strokeStyle = 'rgba(30,60,100,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const flap = Math.sin(phase) * size * 0.6;
      ctx.moveTo(x - size, y + flap);
      ctx.quadraticCurveTo(x, y, x + size, y + flap);
      ctx.stroke();
      ctx.restore();
    }

    function drawMountains(w, h) {
      const mh = h * 0.55;
      // Far mountains (blue haze)
      ctx.beginPath();
      ctx.moveTo(0, mh);
      const farPeaks = [
        [0, 0.88], [0.07, 0.65], [0.14, 0.75], [0.22, 0.52],
        [0.30, 0.70], [0.38, 0.45], [0.47, 0.68], [0.55, 0.40],
        [0.63, 0.62], [0.72, 0.48], [0.80, 0.65], [0.88, 0.50],
        [0.95, 0.72], [1.0, 0.58], [1.0, 1.0], [0, 1.0],
      ];
      farPeaks.forEach(([px, py]) => ctx.lineTo(px * w, mh * py));
      ctx.closePath();
      const farGrad = ctx.createLinearGradient(0, mh * 0.4, 0, mh);
      farGrad.addColorStop(0, '#2a5a7a');
      farGrad.addColorStop(0.4, '#3d7a6a');
      farGrad.addColorStop(1, '#2a5a4a');
      ctx.fillStyle = farGrad;
      ctx.fill();

      // Snow caps
      const snowPeaks = [[0.22, 0.52], [0.38, 0.45], [0.55, 0.40], [0.72, 0.48], [0.88, 0.50]];
      snowPeaks.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(px * w, mh * py);
        ctx.lineTo(px * w - 18, mh * (py + 0.08));
        ctx.lineTo(px * w + 18, mh * (py + 0.08));
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fill();
      });

      // Near mountains (dark green)
      ctx.beginPath();
      ctx.moveTo(0, mh);
      const nearPeaks = [
        [0, 0.92], [0.05, 0.72], [0.12, 0.82], [0.20, 0.58],
        [0.28, 0.78], [0.36, 0.62], [0.44, 0.80], [0.52, 0.55],
        [0.60, 0.75], [0.68, 0.60], [0.76, 0.78], [0.84, 0.62],
        [0.92, 0.80], [1.0, 0.68], [1.0, 1.0], [0, 1.0],
      ];
      nearPeaks.forEach(([px, py]) => ctx.lineTo(px * w, mh * py));
      ctx.closePath();
      const nearGrad = ctx.createLinearGradient(0, mh * 0.5, 0, mh);
      nearGrad.addColorStop(0, '#1e4a2e');
      nearGrad.addColorStop(0.6, '#2d6a3a');
      nearGrad.addColorStop(1, '#1a3a20');
      ctx.fillStyle = nearGrad;
      ctx.fill();
    }

    function drawForest(w, h) {
      const base = h * 0.55;
      const treeCount = 22;
      for (let i = 0; i < treeCount; i++) {
        const tx = (i / treeCount) * w * 1.05 - 10;
        const th = 28 + Math.sin(i * 2.1) * 14;
        const tw = 10 + Math.cos(i * 1.7) * 4;
        const ty = base - th * 0.2 + Math.sin(i * 0.9) * 8;

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - tw, ty + th * 0.5);
        ctx.lineTo(tx - tw * 0.6, ty + th * 0.5);
        ctx.lineTo(tx - tw * 0.8, ty + th);
        ctx.lineTo(tx + tw * 0.8, ty + th);
        ctx.lineTo(tx + tw * 0.6, ty + th * 0.5);
        ctx.lineTo(tx + tw, ty + th * 0.5);
        ctx.closePath();
        const treeGrad = ctx.createLinearGradient(tx, ty, tx, ty + th);
        treeGrad.addColorStop(0, '#1a5c2a');
        treeGrad.addColorStop(1, '#0d3018');
        ctx.fillStyle = treeGrad;
        ctx.fill();
      }
    }

    function drawDesert(w, h) {
      const dStart = h * 0.52;
      const dEnd = h;
      // Main desert gradient
      const dGrad = ctx.createLinearGradient(0, dStart, 0, dEnd);
      dGrad.addColorStop(0, '#c8956a');
      dGrad.addColorStop(0.3, '#d4a574');
      dGrad.addColorStop(0.7, '#e8c080');
      dGrad.addColorStop(1, '#c8a060');
      ctx.fillStyle = dGrad;
      ctx.fillRect(0, dStart, w, dEnd - dStart);

      // Dune waves
      ctx.beginPath();
      ctx.moveTo(0, dStart + 20);
      for (let x = 0; x <= w; x += 5) {
        const dy = Math.sin(x * 0.008) * 18 + Math.sin(x * 0.02) * 8;
        ctx.lineTo(x, dStart + 20 + dy);
      }
      ctx.lineTo(w, dEnd);
      ctx.lineTo(0, dEnd);
      ctx.closePath();
      const duneGrad = ctx.createLinearGradient(0, dStart, 0, dEnd);
      duneGrad.addColorStop(0, '#b8845a');
      duneGrad.addColorStop(1, '#d4a060');
      ctx.fillStyle = duneGrad;
      ctx.fill();

      // Second dune layer
      ctx.beginPath();
      ctx.moveTo(0, dStart + 60);
      for (let x = 0; x <= w; x += 5) {
        const dy = Math.sin(x * 0.006 + 1.2) * 22 + Math.cos(x * 0.015) * 10;
        ctx.lineTo(x, dStart + 60 + dy);
      }
      ctx.lineTo(w, dEnd);
      ctx.lineTo(0, dEnd);
      ctx.closePath();
      duneGrad.addColorStop(0, '#a87040');
      ctx.fillStyle = '#c89050';
      ctx.fill();
    }

    function drawCamel(x, h, t) {
      const cy = h * 0.72;
      const scale = 0.8;
      ctx.save();
      ctx.translate(x, cy);
      ctx.scale(scale, scale);
      // Walk animation
      const walkPhase = t * 1.2;
      ctx.strokeStyle = '#5a3010';
      ctx.fillStyle = '#8b5520';
      ctx.lineWidth = 2;

      // Body
      ctx.beginPath();
      ctx.ellipse(0, -12, 28, 14, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Hump
      ctx.beginPath();
      ctx.ellipse(-5, -26, 12, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.beginPath();
      ctx.moveTo(22, -18);
      ctx.bezierCurveTo(28, -30, 30, -35, 28, -45);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#8b5520';
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.ellipse(28, -50, 8, 6, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#8b5520';
      ctx.fill();

      // Legs
      const legs = [[-18, 1], [-8, 1], [6, 1], [16, 1]];
      legs.forEach(([lx, dir], i) => {
        const phase = walkPhase + i * 0.8;
        const swing = Math.sin(phase) * 8 * dir;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + swing * 0.3, 12);
        ctx.lineTo(lx + swing, 24);
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#6b4010';
        ctx.stroke();
      });

      ctx.restore();
    }

    function drawGrass(w, h, t) {
      const gBase = h * 0.55;
      for (let i = 0; i < 40; i++) {
        const gx = (i / 40) * w;
        const gh = 8 + Math.sin(i * 2.3) * 4;
        const sway = Math.sin(t * 1.5 + i * 0.7) * 2;
        ctx.beginPath();
        ctx.moveTo(gx, gBase);
        ctx.quadraticCurveTo(gx + sway, gBase - gh * 0.5, gx + sway * 1.5, gBase - gh);
        ctx.strokeStyle = `rgba(${30 + i % 10},${80 + i % 20},${30},0.6)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    function drawWaterReflection(w, h, t) {
      // Small river/lake at horizon
      const ry = h * 0.535;
      ctx.beginPath();
      ctx.ellipse(w * 0.3, ry, w * 0.12, 6, 0, 0, Math.PI * 2);
      const waterGrad = ctx.createLinearGradient(0, ry - 6, 0, ry + 6);
      waterGrad.addColorStop(0, 'rgba(100,180,220,0.6)');
      waterGrad.addColorStop(1, 'rgba(60,120,180,0.3)');
      ctx.fillStyle = waterGrad;
      ctx.fill();
      // Ripples
      for (let r = 0; r < 3; r++) {
        const rippleR = (8 + r * 12 + (t * 20) % 30);
        ctx.beginPath();
        ctx.ellipse(w * 0.3, ry, rippleR * 0.6, rippleR * 0.1, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150,210,240,${0.3 - r * 0.08})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    function draw(t) {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      drawSky(w, h, t);
      drawStars(w, h, t);
      drawSun(w, h, t);

      // Clouds
      clouds.forEach(c => {
        c.x += c.speed;
        if (c.x - c.w > w) c.x = -c.w;
        drawCloud(c.x, c.y, c.w, c.h, c.opacity);
      });

      drawMountains(w, h);
      drawForest(w, h);
      drawGrass(w, h, t);
      drawWaterReflection(w, h, t);
      drawDesert(w, h);

      // Camel
      camel.x += camel.speed;
      if (camel.x > w + 100) camel.x = -120;
      drawCamel(camel.x, h, t);

      // Birds
      birds.forEach(b => {
        b.x += b.speed;
        if (b.x > w + 20) b.x = -20;
        b.flapPhase += 0.12;
        drawBird(b.x, b.y, b.size, b.flapPhase);
      });

      // Dust particles over desert
      duneParticles.forEach(p => {
        p.x += p.speed;
        if (p.x > w) p.x = 0;
        p.y = h * 0.55 + (Math.sin(p.x * 0.02 + t) * 30) + 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,160,80,${p.opacity})`;
        ctx.fill();
      });
    }

    let last = 0;
    // Draw one frame immediately so canvas is never blank on first paint
    draw(0);

    function loop(ts) {
      const dt = (ts - last) / 1000;
      last = ts;
      timeRef.current += dt;
      draw(timeRef.current);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── FLOATING PARTICLES ───────────────────────────────────────
function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${3 + (i % 4)}px`,
            height: `${3 + (i % 4)}px`,
            left: `${(i * 8.3) % 100}%`,
            top: `${20 + (i * 7) % 60}%`,
            background: i % 3 === 0 ? 'rgba(255,220,120,0.4)' : i % 3 === 1 ? 'rgba(100,200,180,0.3)' : 'rgba(255,180,100,0.35)',
            animation: `floatDust ${6 + i * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes floatDust {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          33% { transform: translateY(-18px) translateX(8px); opacity: 0.7; }
          66% { transform: translateY(-8px) translateX(-6px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ─── STEP INDICATORS ──────────────────────────────────────────
const STEPS = [
  { icon: Icons.Compass, label: 'Reading your vibe' },
  { icon: Icons.Map,     label: 'Scouting destinations' },
  { icon: Icons.Gem,     label: 'Uncovering hidden gems' },
  { icon: Icons.Star,    label: 'Crafting your journey' },
];

function LoadingCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, []);

  const S = STEPS[step];
  return (
    <div className="flex justify-start px-2">
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(18px)',
          borderColor: 'rgba(255,220,120,0.25)',
          minWidth: '220px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
      >
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,200,80,0.25)', color: '#ffd060' }}
            >
              <S.icon />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'rgba(255,240,200,0.9)' }}>Exploring...</div>
              <div className="text-sm font-medium" style={{ color: '#fff8e8' }}>{S.label}</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-700"
                style={{
                  background: i <= step ? 'rgba(255,210,80,0.9)' : 'rgba(255,255,255,0.15)',
                  transform: i === step ? 'scaleY(1.5)' : 'scaleY(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────
function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (bubbleRef.current) {
      bubbleRef.current.style.opacity = '0';
      bubbleRef.current.style.transform = 'translateY(16px)';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (bubbleRef.current) {
            bubbleRef.current.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            bubbleRef.current.style.opacity = '1';
            bubbleRef.current.style.transform = 'translateY(0)';
          }
        });
      });
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div ref={bubbleRef} style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px' }}>
        <div
          style={{
            maxWidth: '72%',
            borderRadius: '18px 18px 4px 18px',
            padding: '12px 18px',
            background: 'linear-gradient(135deg, rgba(255,200,80,0.92), rgba(240,130,60,0.88))',
            boxShadow: '0 4px 20px rgba(255,150,50,0.3)',
            color: '#2a1a05',
            fontSize: 14,
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div ref={bubbleRef} style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 4px' }}>
      <div style={{ width: '100%' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingLeft: 2 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #2d6a4a, #1a3a5c)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              color: '#ffd060',
            }}
          >
            <Icons.Compass />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,240,180,0.8)' }}>Travel Companion</span>
          {message.intent?.destination && (
            <span
              style={{
                fontSize: 11, fontWeight: 600,
                padding: '2px 10px', borderRadius: 999,
                background: 'rgba(255,200,80,0.18)',
                color: '#ffd060',
                border: '1px solid rgba(255,200,80,0.28)',
              }}
            >
              {message.intent.destination}
            </span>
          )}
        </div>

        {/* Card — full width of column */}
        <div
          style={{
            width: '100%',
            borderRadius: '4px 18px 18px 18px',
            overflow: 'hidden',
            background: 'rgba(15,28,50,0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,220,120,0.18)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Trip stats bar */}
          {message.intent && !message.isError && (
            <div
              style={{
                display: 'flex', flexWrap: 'wrap', gap: 10,
                padding: '12px 20px',
                background: 'rgba(255,200,80,0.07)',
                borderBottom: '1px solid rgba(255,220,120,0.12)',
              }}
            >
              {message.intent.duration && (
                <StatBadge icon={<Icons.Calendar />} label={`${message.intent.duration} days`} />
              )}
              {message.intent.groupSize && (
                <StatBadge icon={<Icons.Users />} label={`${message.intent.groupSize} people`} />
              )}
              {message.intent.budget && (
                <StatBadge icon={<Icons.Coins />} label={`₹${message.intent.budget.toLocaleString()}/head`} />
              )}
              {message.meta?.hiddenGems > 0 && (
                <StatBadge icon={<Icons.Gem />} label={`${message.meta.hiddenGems} hidden gems`} />
              )}
            </div>
          )}

          {/* Itinerary content */}
          <div style={{ padding: '24px 28px 16px' }}>
            <MarkdownRenderer content={message.content} />
          </div>

          {/* Copy button */}
          {!message.isError && (
            <div style={{ padding: '8px 20px 16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, padding: '6px 14px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                  background: copied ? 'rgba(74,222,128,0.1)' : 'transparent',
                  color: copied ? '#4ade80' : 'rgba(255,240,180,0.42)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => { if (!copied) e.currentTarget.style.color = 'rgba(255,240,180,0.75)'; }}
                onMouseLeave={e => { if (!copied) e.currentTarget.style.color = 'rgba(255,240,180,0.42)'; }}
              >
                <Icons.Copy />
                {copied ? 'Copied!' : 'Copy itinerary'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon, label }) {
  return (
    <span
      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ color: 'rgba(255,230,150,0.9)', background: 'rgba(255,200,80,0.12)' }}
    >
      <span style={{ color: '#ffc844' }}>{icon}</span>
      {label}
    </span>
  );
}

// ─── MARKDOWN RENDERER ────────────────────────────────────────
function MarkdownRenderer({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#ffd060', marginTop: 28, marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,240,180,0.95)', marginTop: 20, marginBottom: 8, lineHeight: 1.4 }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('**') && line.endsWith('**') && !line.slice(2,-2).includes('**')) {
      elements.push(
        <p key={i} style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,225,130,0.92)', marginTop: 16, marginBottom: 6 }}>
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
          <span style={{ width: 5, height: 5, minWidth: 5, borderRadius: '50%', background: '#ffc844', marginTop: 9, opacity: 0.85 }} />
          <span style={{ fontSize: 14, color: 'rgba(255,245,220,0.84)', lineHeight: 1.7 }}>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} style={{ border: 'none', height: 1, background: 'rgba(255,200,80,0.13)', margin: '20px 0' }} />);
    } else if (line.trim()) {
      elements.push(
        <p key={i} style={{ fontSize: 14, color: 'rgba(255,245,220,0.82)', lineHeight: 1.75, marginBottom: 10 }}>
          {renderInline(line)}
        </p>
      );
    } else {
      // Empty line — add a small gap between paragraphs
      elements.push(<div key={i} style={{ height: 4 }} />);
    }
    i++;
  }
  return <div style={{ paddingBottom: 4 }}>{elements}</div>;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ color: 'rgba(255,230,150,0.95)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
      : p
  );
}

// ─── WELCOME SCREEN ───────────────────────────────────────────
const EXAMPLES = [
  "Group of 6 in Himachal for 4 days — snow, stargazing, wooden homestays, 7-8 hrs from Delhi, ₹5000/head",
  "Solo 5 days in Rajasthan — desert vibes, old forts, local food, ₹3000/day from Jaipur",
  "Couple retreat in a quiet hill station, 3 days, no crowds, good cafes, ₹4000/head from Bangalore",
  "4 people, first Northeast India trip, 7 days, waterfalls, living root bridges, ₹8000/head from Delhi",
];

const FEATURES = ['Hidden Gems', 'Budget Smart', 'Group Trips', 'Solo Journeys', 'Mountain Trails', 'Desert Escapes'];

function WelcomeScreen({ onExample }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        padding: '40px 0 32px',
      }}
    >
      {/* Spinning compass */}
      <div
        style={{
          width: 64, height: 64, borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(255,200,80,0.22), rgba(100,200,160,0.18))',
          border: '1px solid rgba(255,200,80,0.3)',
          boxShadow: '0 8px 32px rgba(255,150,50,0.18)',
          marginBottom: 24,
          animation: 'spinSlow 8s linear infinite',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 32, height: 32, color: '#ffd060' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor"/>
        </svg>
      </div>

      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          fontWeight: 900,
          color: '#fff8e8',
          lineHeight: 1.15,
          marginBottom: 14,
          textShadow: '0 2px 24px rgba(0,0,0,0.55)',
          letterSpacing: '-0.02em',
        }}
      >
        Where to next?
      </h1>
      <p
        style={{
          fontSize: 15,
          color: 'rgba(255,235,180,0.68)',
          lineHeight: 1.7,
          maxWidth: 380,
          marginBottom: 28,
        }}
      >
        Tell me your vibe, budget, and crew. I'll build you a trip that actually slaps — hidden gems included.
      </p>

      {/* Feature pills */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          justifyContent: 'center', marginBottom: 32,
        }}
      >
        {FEATURES.map((f, i) => (
          <span
            key={f}
            style={{
              fontSize: 11, fontWeight: 500,
              padding: '5px 13px', borderRadius: 999,
              background: 'rgba(255,200,80,0.1)',
              color: 'rgba(255,225,140,0.88)',
              border: '1px solid rgba(255,200,80,0.18)',
              animation: 'fadeUp 0.45s ease forwards',
              animationDelay: `${0.3 + i * 0.07}s`,
              opacity: 0,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* TRY ONE OF THESE label */}
      <p
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(255,200,80,0.45)',
          marginBottom: 12,
        }}
      >
        Try one of these
      </p>

      {/* Example prompt cards */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => onExample(ex)}
            style={{
              width: '100%', textAlign: 'left',
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
              background: 'rgba(255,255,255,0.065)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,215,100,0.13)',
              color: 'rgba(255,240,200,0.78)',
              fontSize: 13, lineHeight: 1.55,
              transition: 'all 0.22s ease',
              animation: 'fadeUp 0.45s ease forwards',
              animationDelay: `${0.5 + i * 0.09}s`,
              opacity: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,200,80,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,200,80,0.32)';
              e.currentTarget.style.color = '#fff8e8';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.065)';
              e.currentTarget.style.borderColor = 'rgba(255,215,100,0.13)';
              e.currentTarget.style.color = 'rgba(255,240,200,0.78)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ color: 'rgba(255,200,80,0.55)', flexShrink: 0, marginTop: 1 }}>
              <Icons.Map />
            </span>
            <span>{ex}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── CHAT INPUT ───────────────────────────────────────────────
function ChatInput({ onSend, isLoading }) {
  const [value, setValue] = useState('');
  const taRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = `${Math.min(taRef.current.scrollHeight, 140)}px`;
    }
  }, [value]);

  const submit = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <div
      style={{
        borderRadius: 16, overflow: 'hidden',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
        background: focused ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: focused
          ? '1px solid rgba(255,200,80,0.5)'
          : '1px solid rgba(255,215,100,0.18)',
        boxShadow: focused
          ? '0 0 0 3px rgba(255,200,80,0.1), 0 8px 30px rgba(0,0,0,0.28)'
          : '0 4px 20px rgba(0,0,0,0.22)',
      }}
    >
      <textarea
        ref={taRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Tell me your vibe, budget, and where you want to wander..."
        disabled={isLoading}
        rows={1}
        style={{
          width: '100%', display: 'block',
          resize: 'none', border: 'none', outline: 'none',
          background: 'transparent',
          padding: '14px 16px 8px',
          fontSize: 14, lineHeight: 1.55,
          color: '#fff8e8', caretColor: '#ffd060',
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
      <div
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px 10px',
        }}
      >
        <span style={{ fontSize: 11, color: 'rgba(255,200,80,0.32)' }}>
          {value.length > 0 ? `${value.length} chars` : 'Enter to send · Shift+Enter for new line'}
        </span>
        <button
          onClick={submit}
          disabled={!value.trim() || isLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 11,
            fontSize: 13, fontWeight: 600, border: 'none',
            cursor: value.trim() && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            background: value.trim() && !isLoading
              ? 'linear-gradient(135deg, #ffc844, #ff8c30)'
              : 'rgba(255,255,255,0.08)',
            color: value.trim() && !isLoading ? '#2a1a05' : 'rgba(255,255,255,0.28)',
            boxShadow: value.trim() && !isLoading
              ? '0 4px 14px rgba(255,140,48,0.38)'
              : 'none',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isLoading ? <Icons.Loader /> : <Icons.Send />}
          {isLoading ? 'Planning...' : 'Explore'}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function HomePage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Initialise sessionId synchronously so there's no re-render flash
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return uuidv4();
    const stored = localStorage.getItem('travel_session') || uuidv4();
    localStorage.setItem('travel_session', stored);
    return stored;
  });
  const bottomRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: uuidv4(), role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setMessages(prev => [...prev, {
        id: uuidv4(), role: 'assistant',
        content: data.itinerary, intent: data.intent,
        destinations: data.destinations, meta: data.meta,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: uuidv4(), role: 'assistant',
        content: `Something went sideways — ${err.message}. Try again?`,
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId]);

  const clearChat = () => {
    setMessages([]);
    // Session stays the same across clears — just wipe the messages
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        overflow: 'hidden',
        /* Immediate fallback — matches the dark sky tone so there's zero flash */
        background: 'linear-gradient(180deg, #0a1423 0%, #1a3040 40%, #c8956a 100%)',
      }}
    >
      {/* ── Animated canvas background ── */}
      <LandscapeBackground />
      <FloatingParticles />

      {/* ── Dark readability overlay ── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(10,20,35,0.52) 0%, rgba(15,25,40,0.6) 50%, rgba(20,10,5,0.68) 100%)',
        }}
      />

      {/* ══════════════════════════════════════
          HEADER — full width, pinned top
      ══════════════════════════════════════ */}
      <header
        style={{
          position: 'relative', zIndex: 30,
          width: '100%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 28px',
          background: 'rgba(10,20,35,0.75)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,200,80,0.13)',
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(255,200,80,0.28), rgba(100,200,160,0.18))',
              border: '1px solid rgba(255,200,80,0.3)',
              color: '#ffd060',
            }}
          >
            <Icons.Compass />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: '#fff8e8', lineHeight: 1.2 }}>
              Travel Companion
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,200,80,0.58)', marginTop: 1 }}>
              AI-powered hidden gem finder
            </div>
          </div>
        </div>

        {/* New trip button — only shown when chat is active */}
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 500,
              padding: '7px 15px', borderRadius: 10,
              color: 'rgba(255,220,150,0.62)',
              border: '1px solid rgba(255,200,80,0.2)',
              background: 'transparent', cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffd060';
              e.currentTarget.style.borderColor = 'rgba(255,200,80,0.42)';
              e.currentTarget.style.background = 'rgba(255,200,80,0.07)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,220,150,0.62)';
              e.currentTarget.style.borderColor = 'rgba(255,200,80,0.2)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Icons.Plus />
            New Trip
          </button>
        )}
      </header>

      {/* ══════════════════════════════════════
          MAIN — scrollable, fills remaining height
          Content constrained + centered inside
      ══════════════════════════════════════ */}
      <main
        ref={mainRef}
        style={{
          position: 'relative', zIndex: 10,
          flex: 1, minHeight: 0,          /* crucial: flex child must not overflow */
          overflowY: 'auto', overflowX: 'hidden',
          width: '100%',
        }}
      >
        {/* Centering + max-width container */}
        <div
          style={{
            width: '100%',
            maxWidth: 860,
            margin: '0 auto',
            padding: messages.length === 0 ? '0 24px' : '28px 24px 20px',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: messages.length === 0 ? 'center' : 'flex-start',
          }}
        >
          {messages.length === 0 ? (
            <WelcomeScreen onExample={sendMessage} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {messages.map(m => <MessageBubble key={m.id} message={m} />)}
              {isLoading && <LoadingCard />}
              <div ref={bottomRef} style={{ height: 1 }} />
            </div>
          )}
        </div>
      </main>

      {/* ══════════════════════════════════════
          INPUT BAR — full width, pinned bottom
          Content constrained + centered inside
      ══════════════════════════════════════ */}
      <div
        style={{
          position: 'relative', zIndex: 30,
          width: '100%', flexShrink: 0,
          background: 'rgba(10,20,35,0.82)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,200,80,0.11)',
          padding: '14px 28px 18px',
        }}
      >
        {/* Matches main content max-width */}
        <div style={{ width: '100%', maxWidth: 860, margin: '0 auto' }}>
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
          <p
            style={{
              fontSize: 11, textAlign: 'center', marginTop: 8,
              color: 'rgba(255,200,80,0.3)', letterSpacing: '0.01em',
            }}
          >
            Mention group size, budget, duration &amp; vibe for the best itinerary
          </p>
        </div>
      </div>

      {/* Global overrides */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,200,80,0.28); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,200,80,0.5); }
        ::selection { background: rgba(255,200,80,0.25); color: #fff8e8; }
        textarea::placeholder { color: rgba(255,230,180,0.3) !important; }
      `}</style>
    </div>
  );
}
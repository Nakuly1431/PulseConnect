import React, { memo } from 'react';
import { Activity, Radio, Shield, Heart, Zap } from 'lucide-react';

// 26 biological vitality particles spread across 0% to 100% of the screen
const PARTICLES = [
  { id: 1, left: '2%', size: 14, duration: 20, delay: 1.5, opacity: 0.3, pulse: true },
  { id: 2, left: '6%', size: 8, duration: 16, delay: 6.2, opacity: 0.22, pulse: false },
  { id: 3, left: '10%', size: 20, duration: 23, delay: 0.4, opacity: 0.35, pulse: true },
  { id: 4, left: '15%', size: 12, duration: 18, delay: 8.7, opacity: 0.25, pulse: false },
  { id: 5, left: '19%', size: 16, duration: 21, delay: 3.1, opacity: 0.32, pulse: true },
  { id: 6, left: '24%', size: 10, duration: 15, delay: 9.4, opacity: 0.22, pulse: false },
  { id: 7, left: '29%', size: 22, duration: 25, delay: 2.1, opacity: 0.35, pulse: true },
  { id: 8, left: '34%', size: 8, duration: 17, delay: 7.3, opacity: 0.2, pulse: false },
  { id: 9, left: '39%', size: 18, duration: 22, delay: 4.8, opacity: 0.3, pulse: true },
  { id: 10, left: '44%', size: 12, duration: 19, delay: 11.2, opacity: 0.26, pulse: false },
  { id: 11, left: '49%', size: 24, duration: 26, delay: 1.0, opacity: 0.34, pulse: true },
  { id: 12, left: '54%', size: 10, duration: 16, delay: 5.5, opacity: 0.24, pulse: false },
  { id: 13, left: '59%', size: 16, duration: 20, delay: 12.6, opacity: 0.3, pulse: false },
  { id: 14, left: '64%', size: 22, duration: 24, delay: 3.8, opacity: 0.33, pulse: true },
  { id: 15, left: '69%', size: 8, duration: 14, delay: 8.1, opacity: 0.22, pulse: false },
  { id: 16, left: '74%', size: 14, duration: 18, delay: 2.9, opacity: 0.28, pulse: true },
  { id: 17, left: '79%', size: 20, duration: 23, delay: 10.5, opacity: 0.32, pulse: false },
  { id: 18, left: '84%', size: 10, duration: 15, delay: 4.2, opacity: 0.25, pulse: false },
  { id: 19, left: '88%', size: 18, duration: 21, delay: 7.7, opacity: 0.35, pulse: true },
  { id: 20, left: '92%', size: 12, duration: 19, delay: 0.8, opacity: 0.28, pulse: false },
  { id: 21, left: '95%', size: 16, duration: 22, delay: 13.0, opacity: 0.3, pulse: true },
  { id: 22, left: '98%', size: 8, duration: 16, delay: 5.9, opacity: 0.22, pulse: false },
  { id: 23, left: '12%', size: 14, duration: 19, delay: 14.2, opacity: 0.25, pulse: false },
  { id: 24, left: '31%', size: 16, duration: 22, delay: 15.0, opacity: 0.3, pulse: true },
  { id: 25, left: '67%', size: 12, duration: 17, delay: 16.1, opacity: 0.26, pulse: false },
  { id: 26, left: '86%', size: 14, duration: 20, delay: 17.4, opacity: 0.28, pulse: true },
];

function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* 1. Medical Telemetry Dot Matrix Grid - Across Full Screen */}
      <div className="absolute inset-0 bg-dot-matrix opacity-45 dark:opacity-35 pointer-events-none" />

      {/* 2. Light Telemetry Scanning Beam */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent via-red-500/8 dark:via-red-500/12 to-transparent telemetry-scan-beam pointer-events-none" />

      {/* 3. Expansive Ambient Plasma Mesh Glow (Fills Wide Screens) */}
      {/* Top-Left Arterial Crimson Core */}
      <div className="ambient-plasma-1 absolute -top-44 -left-44 w-[650px] h-[650px] sm:w-[850px] sm:h-[850px] rounded-full bg-gradient-to-br from-red-600/18 via-rose-600/12 to-transparent dark:from-red-600/25 dark:via-rose-700/20" />

      {/* Top-Right Venous Ruby & Coral Orb */}
      <div className="ambient-plasma-2 absolute top-1/6 -right-44 w-[700px] h-[700px] sm:w-[900px] sm:h-[900px] rounded-full bg-gradient-to-bl from-rose-500/15 via-red-700/12 to-transparent dark:from-rose-600/22 dark:via-red-800/18" />

      {/* Bottom-Left Warm Arterial Amber Glow */}
      <div className="ambient-plasma-1 absolute -bottom-44 left-1/5 w-[600px] h-[600px] sm:w-[750px] sm:h-[750px] rounded-full bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-transparent dark:from-amber-600/15 dark:via-red-600/12" />

      {/* Bottom-Right Deep Venous Pulse Orb */}
      <div className="ambient-plasma-2 absolute -bottom-36 -right-36 w-[550px] h-[550px] sm:w-[700px] sm:h-[700px] rounded-full bg-gradient-to-tl from-red-600/14 via-rose-600/10 to-transparent dark:from-red-700/20 dark:via-rose-800/15" />

      {/* Central Rotating Plasma Halo */}
      <div className="plasma-orb-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full bg-gradient-to-r from-red-500/6 via-rose-500/6 to-red-600/6 dark:from-red-500/12 dark:via-rose-500/12 dark:to-red-600/12" />

      {/* 4. Floating Cellular Vitality Particles (Living Blood Cells across entire viewport) */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="cellular-particle absolute pointer-events-none"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        >
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br from-rose-400/80 via-red-500/90 to-red-700 dark:from-rose-500/90 dark:via-red-600 dark:to-red-800 shadow-[0_0_12px_rgba(239,68,68,0.5)] ${
              p.pulse ? 'cell-pulse-glow' : ''
            }`}
          />
        </div>
      ))}

      {/* 5. Desktop-Only Medical Telemetry Side HUD Rails (Fills Wide Screen Gutters) */}
      {/* Left Side Telemetry Gutter HUD */}
      <div className="hidden 2xl:flex flex-col items-center justify-between fixed top-24 bottom-16 left-5 w-12 z-0 opacity-40 hover:opacity-75 transition-opacity">
        <div className="flex flex-col items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 [writing-mode:vertical-lr] rotate-180">
            PULSECONNECT • TELEMETRY
          </span>
        </div>
        
        {/* Decorative Tick Axis */}
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-red-400 to-transparent" />
          <Activity className="w-4 h-4 text-red-500/60 hud-ticker" />
          <div className="flex flex-col gap-1.5 opacity-60 text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500">
            <span>01</span>
            <span>02</span>
            <span>03</span>
            <span>04</span>
          </div>
          <div className="w-px h-24 bg-gradient-to-b from-red-400/60 via-red-500/30 to-transparent" />
        </div>

        <div className="flex flex-col items-center gap-1 text-[8px] font-mono font-black text-red-500/70">
          <span>72</span>
          <span>BPM</span>
        </div>
      </div>

      {/* Right Side Medical Protocol Gutter HUD */}
      <div className="hidden 2xl:flex flex-col items-center justify-between fixed top-24 bottom-16 right-5 w-12 z-0 opacity-40 hover:opacity-75 transition-opacity">
        <div className="flex flex-col items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-red-500 hud-ticker" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 [writing-mode:vertical-lr]">
            GOLDEN HOUR • PROTOCOL
          </span>
        </div>

        {/* Decorative Grid Markers */}
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-rose-400 to-transparent" />
          <div className="w-2.5 h-2.5 rounded-full border border-red-500/60 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-red-500" />
          </div>
          <div className="flex flex-col gap-1 opacity-60 text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500 text-center">
            <span>O-</span>
            <span>A+</span>
            <span>B+</span>
            <span>AB</span>
          </div>
          <div className="w-px h-20 bg-gradient-to-b from-rose-400/60 via-red-500/30 to-transparent" />
        </div>

        <div className="flex flex-col items-center gap-1 text-[8px] font-mono font-black text-emerald-500/80">
          <span>100%</span>
          <span>LIVE</span>
        </div>
      </div>

      {/* 6. Subtle Horizon Sine Wave Ribbon */}
      <div className="absolute bottom-6 left-0 right-0 h-32 overflow-hidden pointer-events-none opacity-25 dark:opacity-30">
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 120"
        >
          <path
            d="M0,60 C180,20 360,100 540,60 C720,20 900,100 1080,60 C1260,20 1440,60 1440,60"
            fill="none"
            stroke="url(#sin-gradient)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="sin-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
              <stop offset="30%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#fb7185" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export default memo(AnimatedBackground);

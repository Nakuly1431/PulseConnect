import React, { memo } from 'react';
import { Activity, Radio } from 'lucide-react';

const PARTICLES = [
  [1, '2%', 14, 20, 1.5, 0.3, true], [2, '6%', 8, 16, 6.2, 0.22], [3, '10%', 20, 23, 0.4, 0.35, true],
  [4, '15%', 12, 18, 8.7, 0.25], [5, '19%', 16, 21, 3.1, 0.32, true], [6, '24%', 10, 15, 9.4, 0.22],
  [7, '29%', 22, 25, 2.1, 0.35, true], [8, '34%', 8, 17, 7.3, 0.2], [9, '39%', 18, 22, 4.8, 0.3, true],
  [10, '44%', 12, 19, 11.2, 0.26], [11, '49%', 24, 26, 1.0, 0.34, true], [12, '54%', 10, 16, 5.5, 0.24],
  [13, '59%', 16, 20, 12.6, 0.3], [14, '64%', 22, 24, 3.8, 0.33, true], [15, '69%', 8, 14, 8.1, 0.22],
  [16, '74%', 14, 18, 2.9, 0.28, true], [17, '79%', 20, 23, 10.5, 0.32], [18, '84%', 10, 15, 4.2, 0.25],
  [19, '88%', 18, 21, 7.7, 0.35, true], [20, '92%', 12, 19, 0.8, 0.28], [21, '95%', 16, 22, 13.0, 0.3, true],
  [22, '98%', 8, 16, 5.9, 0.22], [23, '12%', 14, 19, 14.2, 0.25], [24, '31%', 16, 22, 15.0, 0.3, true],
  [25, '67%', 12, 17, 16.1, 0.26], [26, '86%', 14, 20, 17.4, 0.28, true]
].map(([id, left, size, duration, delay, opacity, pulse = false]) => ({ id, left, size, duration, delay, opacity, pulse }));

const PLASMAS = [
  'ambient-plasma-1 -top-44 -left-44 w-[650px] h-[650px] sm:w-[850px] sm:h-[850px] bg-gradient-to-br from-red-600/18 via-rose-600/12 to-transparent dark:from-red-600/25 dark:via-rose-700/20',
  'ambient-plasma-2 top-1/6 -right-44 w-[700px] h-[700px] sm:w-[900px] sm:h-[900px] bg-gradient-to-bl from-rose-500/15 via-red-700/12 to-transparent dark:from-rose-600/22 dark:via-red-800/18',
  'ambient-plasma-1 -bottom-44 left-1/5 w-[600px] h-[600px] sm:w-[750px] sm:h-[750px] bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-transparent dark:from-amber-600/15 dark:via-red-600/12',
  'ambient-plasma-2 -bottom-36 -right-36 w-[550px] h-[550px] sm:w-[700px] sm:h-[700px] bg-gradient-to-tl from-red-600/14 via-rose-600/10 to-transparent dark:from-red-700/20 dark:via-rose-800/15'
];

function AnimatedBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      <div className="absolute inset-0 bg-dot-matrix opacity-45 dark:opacity-35 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent via-red-500/8 dark:via-red-500/12 to-transparent telemetry-scan-beam pointer-events-none" />
      
      {PLASMAS.map((cls, i) => <div key={i} className={`absolute rounded-full ${cls}`} />)}
      <div className="plasma-orb-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full bg-gradient-to-r from-red-500/6 via-rose-500/6 to-red-600/6 dark:from-red-500/12 dark:via-rose-500/12 dark:to-red-600/12" />

      {PARTICLES.map(p => (
        <div key={p.id} className="cellular-particle absolute pointer-events-none" style={{ left: p.left, width: `${p.size}px`, height: `${p.size}px`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, opacity: p.opacity }}>
          <div className={`w-full h-full rounded-full bg-gradient-to-br from-rose-400/80 via-red-500/90 to-red-700 dark:from-rose-500/90 dark:via-red-600 dark:to-red-800 shadow-[0_0_12px_rgba(239,68,68,0.5)] ${p.pulse ? 'cell-pulse-glow' : ''}`} />
        </div>
      ))}

      <div className="hidden 2xl:flex flex-col items-center justify-between fixed top-24 bottom-16 left-5 w-12 z-0 opacity-40 hover:opacity-75 transition-opacity">
        <div className="flex flex-col items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 [writing-mode:vertical-lr] rotate-180">PULSECONNECT • TELEMETRY</span>
        </div>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-red-400 to-transparent" />
          <Activity className="w-4 h-4 text-red-500/60 hud-ticker" />
          <div className="flex flex-col gap-1.5 opacity-60 text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500">
            {['01', '02', '03', '04'].map(n => <span key={n}>{n}</span>)}
          </div>
          <div className="w-px h-24 bg-gradient-to-b from-red-400/60 via-red-500/30 to-transparent" />
        </div>
        <div className="flex flex-col items-center gap-1 text-[8px] font-mono font-black text-red-500/70">
          <span>72</span><span>BPM</span>
        </div>
      </div>

      <div className="hidden 2xl:flex flex-col items-center justify-between fixed top-24 bottom-16 right-5 w-12 z-0 opacity-40 hover:opacity-75 transition-opacity">
        <div className="flex flex-col items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-red-500 hud-ticker" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 [writing-mode:vertical-lr]">GOLDEN HOUR • PROTOCOL</span>
        </div>
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-rose-400 to-transparent" />
          <div className="w-2.5 h-2.5 rounded-full border border-red-500/60 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-red-500" />
          </div>
          <div className="flex flex-col gap-1 opacity-60 text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500 text-center">
            {['O-', 'A+', 'B+', 'AB'].map(b => <span key={b}>{b}</span>)}
          </div>
          <div className="w-px h-20 bg-gradient-to-b from-rose-400/60 via-red-500/30 to-transparent" />
        </div>
        <div className="flex flex-col items-center gap-1 text-[8px] font-mono font-black text-emerald-500/80">
          <span>100%</span><span>LIVE</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 h-32 overflow-hidden pointer-events-none opacity-25 dark:opacity-30">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 120">
          <path d="M0,60 C180,20 360,100 540,60 C720,20 900,100 1080,60 C1260,20 1440,60 1440,60" fill="none" stroke="url(#sin-gradient)" strokeWidth="2" />
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

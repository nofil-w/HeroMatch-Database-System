import React from 'react';
import { Hero } from '../types';
import { cn } from '../lib/utils';

interface CompanionProps {
  heroA: Hero;
  heroB: Hero;
}

export function ComparisonDashboard({ heroA, heroB }: CompanionProps) {
  const StatBar = ({ label, valA, valB }: any) => {
    const total = Math.max(valA + valB, 1);
    const pctA = (valA / total) * 100;
    const pctB = (valB / total) * 100;
    const aWins = valA > valB;
    const bWins = valB > valA;

    return (
      <div className="py-2">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-white/40 mb-1">
          <span className={cn("font-mono text-sm", aWins ? "text-white" : "text-white/40")}>{valA}</span>
          <span>{label}</span>
          <span className={cn("font-mono text-sm", bWins ? "text-white" : "text-white/40")}>{valB}</span>
        </div>
        <div className="flex w-full h-1 rounded-full overflow-hidden bg-white/5 gap-0.5">
          <div className={cn("h-full transition-all duration-500", aWins ? "bg-white/60" : "bg-white/20")} style={{ width: `${pctA}%` }} />
          <div className={cn("h-full transition-all duration-500", bWins ? "bg-white/60" : "bg-white/20")} style={{ width: `${pctB}%` }} />
        </div>
      </div>
    );
  };

  const getWinRate = (h: Hero) => Math.round((h.wins / (h.wins + h.losses)) * 100);

  const getComparisonText = (label: string, valA: number, valB: number) => {
    if (valA > valB) return <><span className="text-white font-serif">{heroA.name}</span> has higher {label}.</>;
    if (valB > valA) return <><span className="text-white font-serif">{heroB.name}</span> has higher {label}.</>;
    return <>Both possess equal {label}.</>;
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-lg flex flex-col font-sans overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
        <h2 className="font-serif italic text-lg text-white">Versus Mode Analysis</h2>
        <span className="text-[10px] bg-white/5 text-white/40 px-2 py-1 rounded font-mono uppercase tracking-widest">
          {heroA.id} : {heroB.id}
        </span>
      </div>

      <div className="p-6 text-[#E0E0E0]">
        
        {/* Large Prominent Images Section */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="relative aspect-square md:aspect-[16/9] rounded border border-white/10 overflow-hidden bg-white/5">
            <img src={heroA.image_url || undefined} className="w-full h-full object-contain object-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-4 left-4">
              <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono block">{heroA.universe}</span>
              <h3 className="text-2xl md:text-4xl font-serif italic text-white drop-shadow-md leading-none">{heroA.name}</h3>
            </div>
          </div>
          <div className="relative aspect-square md:aspect-[16/9] rounded border border-white/10 overflow-hidden bg-white/5">
            <img src={heroB.image_url || undefined} className="w-full h-full object-contain object-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-4 right-4 text-right">
              <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono block">{heroB.universe}</span>
              <h3 className="text-2xl md:text-4xl font-serif italic text-white drop-shadow-md leading-none">{heroB.name}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-white/[0.01] border border-white/5 p-6 rounded-lg">
          {/* Stats Breakdown */}
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-6 font-mono border-b border-white/10 pb-2">Statistical Breakdown</h4>
            <StatBar label="Health" valA={heroA.health} valB={heroB.health} />
            <StatBar label="Strength" valA={heroA.strength} valB={heroB.strength} />
            <StatBar label="Speed" valA={heroA.speed} valB={heroB.speed} />
            <StatBar label="Win Rate (%)" valA={getWinRate(heroA)} valB={getWinRate(heroB)} />
          </div>

          {/* Text Summary */}
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-6 font-mono border-b border-white/10 pb-2">Executive Summary</h4>
            <ul className="space-y-4 text-sm font-sans text-white/60">
              <li className="flex items-start gap-3">
                <span className="text-white/20 mt-1 text-[10px]">■</span>
                <span>{getComparisonText('health pool', heroA.health, heroB.health)}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/20 mt-1 text-[10px]">■</span>
                <span>{getComparisonText('strength', heroA.strength, heroB.strength)}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/20 mt-1 text-[10px]">■</span>
                <span>{getComparisonText('speed', heroA.speed, heroB.speed)}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/20 mt-1 text-[10px]">■</span>
                <span>{getComparisonText('win rate probability', getWinRate(heroA), getWinRate(heroB))}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

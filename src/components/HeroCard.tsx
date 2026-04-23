import React, { useState } from 'react';
import { Hero } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Heart, Wind, Dumbbell, Edit2, Trash2 } from 'lucide-react';

interface HeroCardProps {
  hero: Hero;
  universeColor?: string;
  onCompareSelect?: (id: string) => void;
  isSelected?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function HeroCard({ hero, universeColor, onCompareSelect, isSelected, canEdit, onEdit, onDelete }: HeroCardProps) {
  const [expanded, setExpanded] = useState(false);
  const uc = universeColor || '#3b82f6';

  return (
    <motion.div
      layout
      transition={{ duration: 0.3 }}
      whileHover={!isSelected ? {
        y: -4,
        borderColor: `${uc}80`,
        backgroundColor: `${uc}1A`,
        boxShadow: `0 0 40px ${uc}4D`
      } : {}}
      className={cn(
        "relative rounded-lg overflow-hidden cursor-pointer transition-colors duration-500 bg-[#0A0F1A]/60 backdrop-blur-xl border border-white/5 font-sans text-white group",
        isSelected && `border-[${uc}] shadow-[0_0_30px_${uc}80]`
      )}
      style={isSelected ? { borderColor: uc, boxShadow: `0 0 30px ${uc}80` } : {}}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="absolute top-2 right-2 flex gap-2 z-30">
        <span className="px-2 py-0.5 bg-black/60 rounded-sm text-[10px] font-mono text-white/70 backdrop-blur-md border border-white/10 shadow-lg">
          {hero.hero_type}
        </span>
        <span 
          className="px-2 py-0.5 rounded-sm text-[10px] font-mono backdrop-blur-md border shadow-lg tracking-widest uppercase font-bold"
          style={{
             backgroundColor: `${uc}40`,
             color: uc,
             borderColor: `${uc}4D`,
             textShadow: `0 0 10px ${uc}80`,
             boxShadow: `0 0 10px ${uc}4D`
          }}
        >
          {hero.universe}
        </span>
        {onCompareSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompareSelect(hero.id);
            }}
            className={cn(
              "px-4 py-0.5 border rounded-sm text-[10px] font-mono font-bold backdrop-blur-md z-30 transition-all uppercase tracking-widest"
            )}
            style={isSelected ? {
              backgroundColor: uc,
              color: '#ffffff',
              borderColor: 'transparent',
              boxShadow: `0 0 15px ${uc}99`
            } : {
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: uc,
              borderColor: `${uc}66`
            }}
            onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.backgroundColor = `${uc}99`; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'; e.currentTarget.style.color = uc; } }}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
        )}
      </div>

      <div className="h-48 md:h-64 overflow-hidden relative border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent z-10" />
        <img
          src={hero.image_url || undefined}
          alt={hero.name}
          className="w-full h-full object-contain object-center transition-all duration-700 filter brightness-90 group-hover:brightness-110 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-0 left-0 p-4 z-20 w-full">
          <h3 className="text-3xl font-serif italic font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-wide">{hero.name}</h3>
          <p className="text-[10px] uppercase tracking-widest text-blue-200/60 mb-2 font-mono">{hero.secret_identity}</p>
          
          {hero.powers && hero.powers.length > 0 && (() => {
            const displayPowers = hero.powers.join(',').split(',').map(p => p.trim()).filter(Boolean);
            return (
              <div className="flex flex-wrap gap-1.5">
                {displayPowers.slice(0, 2).map((power, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-sm text-[8.5px] uppercase tracking-widest font-mono bg-blue-900/40 border border-blue-400/30 text-blue-200 backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.2)] font-black">
                    {power}
                  </span>
                ))}
                {displayPowers.length > 2 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[8.5px] uppercase tracking-widest font-mono bg-white/5 border border-white/10 text-white/70 backdrop-blur-md font-bold">
                    +{displayPowers.length - 2}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 bg-white/[0.01]"
          >
            <div className="pt-4 space-y-4">
              <p className="text-sm font-mono text-blue-100/70 leading-relaxed font-light">{hero.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {hero.teams?.map((team) => (
                  <span key={team} className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] uppercase tracking-widest font-mono bg-blue-950/40 border border-blue-900/50 text-blue-300">
                    {team}
                  </span>
                ))}
              </div>

              {hero.powers && hero.powers.length > 0 && (() => {
                const displayPowers = hero.powers.join(',').split(',').map(p => p.trim()).filter(Boolean);
                return (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-blue-500/50 mr-1 self-center font-bold">Powers:</span>
                    {displayPowers.map((power, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-sm text-[10px] uppercase tracking-widest font-mono bg-blue-900/40 border border-blue-400/30 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)] font-bold">
                        {power}
                      </span>
                    ))}
                  </div>
                );
              })()}

              <div className="flex justify-between items-center px-3 py-3 bg-[#050508]/60 border border-white/5 rounded-md mt-4 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                 <div className="flex flex-col items-center gap-1">
                   <Heart className="w-4 h-4 text-emerald-500/50" />
                   <span className="text-[11px] font-mono font-bold text-emerald-400">{hero.health}</span>
                 </div>
                 <div className="flex flex-col items-center gap-1 border-l border-r border-white/10 px-8">
                   <Wind className="w-4 h-4 text-amber-500/50" />
                   <span className="text-[11px] font-mono font-bold text-amber-400">{hero.speed}</span>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                   <Dumbbell className="w-4 h-4 text-rose-500/50" />
                   <span className="text-[11px] font-mono font-bold text-rose-400">{hero.strength}</span>
                 </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-widest text-blue-300/40">
                  <span className="flex items-center">Win Rate</span>
                  <span className="font-mono text-blue-300/70">
                    {Math.round((hero.wins / (hero.wins + hero.losses)) * 100) || 0}%
                  </span>
                </div>
                <div className="w-full bg-blue-950/30 h-1.5 rounded-full overflow-hidden border border-blue-900/30">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                    style={{ width: `${(hero.wins / (hero.wins + hero.losses)) * 100 || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-blue-500/50 mt-2">
                  <span>W {hero.wins}</span>
                  <span>L {hero.losses}</span>
                </div>
              </div>
              
              {canEdit && (
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10 mt-4">
                  <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white flex items-center gap-1 border border-white/10 px-2 py-1 rounded">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-[10px] uppercase tracking-widest text-red-400/50 hover:text-red-400 flex items-center gap-1 border border-red-500/10 hover:border-red-500/30 px-2 py-1 rounded bg-red-500/5">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

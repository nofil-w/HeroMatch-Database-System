import React, { useEffect, useState } from 'react';
import { Match, LeaderboardEntry } from '../types';
import { fetchMatches, fetchLeaderboard } from '../api';
import { motion } from 'motion/react';
import { Trophy, Swords, Calendar } from 'lucide-react';

export function HistoryDashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchMatches().then(setMatches);
    fetchLeaderboard().then(setLeaderboard);
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-8 mt-4 items-stretch">
      
      {/* Leaderboard Section */}
      <section className="flex-1 bg-white/[0.02] border border-white/10 rounded-lg flex flex-col overflow-hidden shadow-2xl h-[70vh]">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <Trophy className="w-5 h-5 text-yellow-500/80" />
            <h2 className="font-serif italic text-lg text-white">
              Global Leaderboard (View)
            </h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="w-full text-left border-collapse">
            <div className="grid grid-cols-12 text-[10px] uppercase tracking-widest text-white/50 border-b border-white/10 pb-2 mb-2 font-medium">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Hero</div>
              <div className="col-span-2 text-right">W</div>
              <div className="col-span-2 text-right">L</div>
              <div className="col-span-2 text-right">Win %</div>
            </div>
            
            {leaderboard.map((entry, index) => (
              <motion.div 
                key={entry.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`grid grid-cols-12 items-center py-2 border-b border-white/5 ${index < 3 ? 'text-white' : 'text-white/70'}`}
              >
                <div className="col-span-1 text-[12px] font-mono text-white/40">#{index + 1}</div>
                <div className="col-span-5 flex flex-col">
                  <span className="font-serif italic text-base">{entry.name}</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/40">{entry.universe}</span>
                </div>
                <div className="col-span-2 text-right text-emerald-400 font-mono text-sm">{entry.wins}</div>
                <div className="col-span-2 text-right text-red-400/80 font-mono text-sm">{entry.losses}</div>
                <div className="col-span-2 text-right font-mono text-sm text-yellow-500/80">{entry.win_rate.toFixed(1)}%</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Match History Section */}
      <section className="flex-1 bg-white/[0.02] border border-white/10 rounded-lg flex flex-col overflow-hidden shadow-2xl h-[70vh]">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <Swords className="w-5 h-5 text-blue-500/80" />
            <h2 className="font-serif italic text-lg text-white">
              Tactical Records (Matches)
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {matches.map((match, i) => (
            <motion.div 
              key={match.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded p-4 flex flex-col gap-3"
            >
              <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3"/> {new Date(match.match_date).toLocaleString()}</span>
                <span>{match.arena_name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className={`flex-1 text-center font-serif italic text-lg ${match.winner_name === match.hero1_name ? 'text-emerald-400' : 'text-white/60'}`}>
                  {match.hero1_name}
                </div>
                
                <div className="px-4 text-[10px] text-white/30 italic uppercase flex items-center justify-center font-serif">
                  vs
                </div>
                
                <div className={`flex-1 text-center font-serif italic text-lg ${match.winner_name === match.hero2_name ? 'text-emerald-400' : 'text-white/60'}`}>
                  {match.hero2_name}
                </div>
              </div>

              <div className="text-center mt-1 text-[10px] uppercase tracking-widest text-emerald-400/80 bg-emerald-400/10 py-1 rounded">
                Winner: {match.winner_name}
              </div>
            </motion.div>
          ))}
          {matches.length === 0 && (
            <div className="text-center py-10 text-[10px] uppercase tracking-widest text-white/30">
              No tactical records found in databanks.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

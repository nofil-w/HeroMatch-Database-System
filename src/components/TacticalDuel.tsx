import React, { useState, useEffect } from 'react';
import { Hero, Arena } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Wind, Dumbbell, Zap } from 'lucide-react';
import { saveMatch, fetchArenas } from '../api';

export type GameCard = Hero & {
  isUsed: boolean;
  chemistryBonus: number;
};

interface TacticalDuelProps {
  allHeroes: Hero[];
}

type TurnState = 'DRAFT' | 'CHOOSE_LEAD' | 'CHOOSE_STAT' | 'CHOOSE_RESPOND' | 'RESOLVING' | 'GAME_OVER';
type StatType = 'strength' | 'health' | 'speed';
type Difficulty = 'BALANCED' | 'AGGRESSIVE' | 'DEFENSIVE' | 'PVP_LOCAL';

export function TacticalDuel({ allHeroes }: TacticalDuelProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('BALANCED');

  const [draftPool, setDraftPool] = useState<Hero[]>([]);
  const [playerHand, setPlayerHand] = useState<GameCard[]>([]);
  const [cpuHand, setCpuHand] = useState<GameCard[]>([]);
  const [currentArena, setCurrentArena] = useState<Arena | null>(null);
  
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [roundsLeft, setRoundsLeft] = useState(5);
  
  const [turnOwner, setTurnOwner] = useState<'PLAYER' | 'CPU'>('PLAYER');
  const [phase, setPhase] = useState<TurnState>('DRAFT');
  
  const [leadCard, setLeadCard] = useState<GameCard | null>(null);
  const [activeStat, setActiveStat] = useState<StatType | null>(null);
  const [respondCard, setRespondCard] = useState<GameCard | null>(null);

  const [draftTurn, setDraftTurn] = useState<'P1' | 'P2'>('P1');

  const [message, setMessage] = useState('DRAFT PHASE: Select 5 heroes for your squad.');

  useEffect(() => {
    if (allHeroes.length < 20) return;
    const shuffled = [...allHeroes].map(a => ({sort: Math.random(), value: a})).sort((a, b) => a.sort - b.sort).map(a => a.value);
    setDraftPool(shuffled.slice(0, 20)); // Keep enough around for 2 players
    
    // Auto-draft CPU
    const cpuDraft = shuffled.slice(20, 25);
    const cpuSelected = applyChemistry(cpuDraft);
    setCpuHand(cpuSelected);
    
    // Pick an arena
    fetchArenas().then(arenas => {
       if (arenas.length > 0) {
          const randomArena = arenas[Math.floor(Math.random() * arenas.length)];
          setCurrentArena(randomArena);
       }
    });

  }, [allHeroes]);

  const applyChemistry = (squad: Hero[]): GameCard[] => {
    // 3 of a kind gives +1 to all attributes for those cards
    const counts = { strength: 0, speed: 0, flight: 0 };
    squad.forEach(h => counts[h.hero_type]++);
    
    return squad.map(h => {
      const getsBonus = counts[h.hero_type] >= 3;
      return {
        ...h,
        isUsed: false,
        chemistryBonus: getsBonus ? 1 : 0,
        strength: h.strength + (getsBonus ? 1 : 0),
        health: h.health + (getsBonus ? 1 : 0),
        speed: h.speed + (getsBonus ? 1 : 0)
      }
    });
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    setDifficulty(diff);
    if (diff === 'PVP_LOCAL') {
      setCpuHand([]);
      setDraftTurn('P1');
      setMessage('PLAYER 1 DRAFT PHASE: Select 5 heroes for your squad.');
    } else {
       if (draftPool.length > 0) {
         setCpuHand(applyChemistry(draftPool.slice(15, 20)));
       }
       setMessage('DRAFT PHASE: Select 5 heroes for your squad.');
    }
  };

  const handleDraftSelect = (hero: Hero) => {
    if (draftTurn === 'P1') {
      if (playerHand.length >= 5) return;
      if (playerHand.find(h => h.id === hero.id)) return; // prevent dupes
      
      const nextHand = [...playerHand, { ...hero, isUsed: false, chemistryBonus: 0 }];
      if (nextHand.length === 5) {
        setPlayerHand(applyChemistry(nextHand));
        if (difficulty === 'PVP_LOCAL') {
          setDraftTurn('P2');
          setMessage('PLAYER 2 DRAFT: Select 5 heroes for your squad.');
        } else {
          setPhase('CHOOSE_LEAD');
          setTurnOwner('PLAYER');
          setMessage('YOUR TURN: Select a hero to lead the attack.');
        }
      } else {
        setPlayerHand(nextHand);
        setMessage(difficulty === 'PVP_LOCAL' ? `PLAYER 1 DRAFT: Select ${5 - nextHand.length} more heroes.` : `DRAFT PHASE: Select ${5 - nextHand.length} more heroes.`);
      }
    } else {
      if (cpuHand.length >= 5) return;
      if (cpuHand.find(h => h.id === hero.id) || playerHand.find(h => h.id === hero.id)) return;
      
      const nextHand = [...cpuHand, { ...hero, isUsed: false, chemistryBonus: 0 }];
      if (nextHand.length === 5) {
        setCpuHand(applyChemistry(nextHand));
        setPhase('CHOOSE_LEAD');
        setTurnOwner('PLAYER');
        setMessage('PLAYER 1 TURN: Select a hero to lead the attack.');
      } else {
        setCpuHand(nextHand);
        setMessage(`PLAYER 2 DRAFT: Select ${5 - nextHand.length} more heroes.`);
      }
    }
  };

  const handleStatSelection = (stat: StatType) => {
    setActiveStat(stat);
    const nextTurn = turnOwner === 'PLAYER' ? 'CPU' : 'PLAYER';
    setTurnOwner(nextTurn);
    setPhase('CHOOSE_RESPOND');
    if (difficulty === 'PVP_LOCAL') {
       setMessage(turnOwner === 'PLAYER' 
         ? `Player 1 led with ${stat.toUpperCase()}. Player 2 is countering...` 
         : `Player 2 led with ${stat.toUpperCase()}. Player 1 is countering...`);
    } else {
       setMessage(`You led with ${stat.toUpperCase()}. Opponent is countering...`);
    }
  };

  // Combat Rules: Compare identical stats
  const getReqStat = (s: StatType): StatType => s;

  useEffect(() => {
    if (difficulty === 'PVP_LOCAL') return;

    if (phase === 'CHOOSE_RESPOND' && turnOwner === 'CPU') {
      setTimeout(() => {
        const reqStat = getReqStat(activeStat!);
        const targetVal = leadCard![activeStat!];
        
        const available = cpuHand.filter(c => !c.isUsed);
        let chosen: GameCard;
        
        const wins = available.filter(c => c[reqStat] > targetVal);
        const ties = available.filter(c => c[reqStat] === targetVal);
        
        if (difficulty === 'AGGRESSIVE') {
          // Play highest possible stat to win massively. If losing, sacrifice the lowest possible card.
          if (wins.length > 0) chosen = wins.sort((a,b) => b[reqStat] - a[reqStat])[0];
          else if (ties.length > 0) chosen = ties.sort((a,b) => b[reqStat] - a[reqStat])[0];
          else chosen = available.sort((a,b) => a[reqStat] - b[reqStat])[0];
        } else if (difficulty === 'DEFENSIVE') {
          // Play the lowest stat that still wins (efficiency). If losing, sacrifice the absolute worst card on this stat.
          if (wins.length > 0) chosen = wins.sort((a,b) => a[reqStat] - b[reqStat])[0];
          else if (ties.length > 0) chosen = ties.sort((a,b) => a[reqStat] - b[reqStat])[0];
          else chosen = available.sort((a,b) => a[reqStat] - b[reqStat])[0];
        } else {
          // Balanced logic
          if (wins.length > 0) chosen = wins.sort((a,b) => a[reqStat] - b[reqStat])[0];
          else if (ties.length > 0) chosen = ties.sort((a,b) => a[reqStat] - b[reqStat])[0];
          else chosen = available.sort((a,b) => a[reqStat] - b[reqStat])[0];
        }
        
        setRespondCard(chosen);
        setPhase('RESOLVING');
      }, 1000);
    }
    
    if (phase === 'CHOOSE_LEAD' && turnOwner === 'CPU') {
      setTimeout(() => {
        const available = cpuHand.filter(c => !c.isUsed);
        if (available.length === 0) return;
        
        let bestCard = available[0];
        let bestStat: StatType = 'strength';

        if (difficulty === 'AGGRESSIVE') {
          let maxVal = -1;
          available.forEach(c => {
            if (c.strength > maxVal) { maxVal = c.strength; bestStat = 'strength'; bestCard = c; }
            if (c.health > maxVal) { maxVal = c.health; bestStat = 'health'; bestCard = c; }
            if (c.speed > maxVal) { maxVal = c.speed; bestStat = 'speed'; bestCard = c; }
          });
        } else if (difficulty === 'DEFENSIVE') {
          let minMaxVal = 999;
          available.forEach(c => {
            const cMax = Math.max(c.strength, c.health, c.speed);
            if (cMax < minMaxVal) {
              minMaxVal = cMax;
              bestCard = c;
              if (c.speed === cMax) bestStat = 'speed';
              else if (c.health === cMax) bestStat = 'health';
              else bestStat = 'strength';
            }
          });
        } else {
          const statPool: {c: GameCard, s: StatType, v: number}[] = [];
          available.forEach(c => {
            statPool.push({c, s: 'strength', v: c.strength});
            statPool.push({c, s: 'health', v: c.health});
            statPool.push({c, s: 'speed', v: c.speed});
          });
          statPool.sort((a,b) => b.v - a.v);
          const pick = statPool[Math.floor(Math.random() * Math.min(3, statPool.length))];
          bestCard = pick.c;
          bestStat = pick.s;
        }
        
        setLeadCard(bestCard);
        setActiveStat(bestStat);
        setTurnOwner('PLAYER');
        setPhase('CHOOSE_RESPOND');
        setMessage(difficulty === 'PVP_LOCAL' ? `Player 1 led with ${bestStat.toUpperCase()}. Select a counter with ${getReqStat(bestStat).toUpperCase()}.` : `Opponent led with ${bestStat.toUpperCase()}. Select a counter with ${getReqStat(bestStat).toUpperCase()}.`);
      }, 1500);
    }
  }, [phase, turnOwner, difficulty]);

  useEffect(() => {
    if (phase === 'RESOLVING' && leadCard && respondCard && activeStat) {
      setTimeout(() => {
        const reqStat = getReqStat(activeStat);
        const isPlayerLead = turnOwner === 'CPU';
        const leadVal = leadCard[activeStat];
        const resVal = respondCard[reqStat];
        
        let pScore = playerScore;
        let cScore = cpuScore;
        let nextTurn = turnOwner;
        let resultMessage = '';
        
        if (leadVal > resVal) {
          if (isPlayerLead) { pScore++; nextTurn = 'PLAYER'; resultMessage = difficulty === 'PVP_LOCAL' ? 'Player 1 won the round!' : 'You won the round!'; }
          else { cScore++; nextTurn = 'CPU'; resultMessage = difficulty === 'PVP_LOCAL' ? 'Player 2 won the round!' : 'Opponent won the round!'; }
        } else if (resVal > leadVal) {
          if (isPlayerLead) { cScore++; nextTurn = 'CPU'; resultMessage = difficulty === 'PVP_LOCAL' ? 'Player 2 countered successfully!' : 'Opponent countered successfully!'; }
          else { pScore++; nextTurn = 'PLAYER'; resultMessage = difficulty === 'PVP_LOCAL' ? 'Player 1 countered successfully!' : 'You countered successfully!'; }
        } else {
          resultMessage = 'Round tied.';
        }
        
        // Save the round result to the database asynchronously
        if (leadVal !== resVal && currentArena) {
           const winnerNode = (leadVal > resVal) === isPlayerLead ? (isPlayerLead ? leadCard : respondCard) : (isPlayerLead ? respondCard : leadCard);
           saveMatch({
              hero1_id: leadCard.id,
              hero2_id: respondCard.id,
              winner_id: winnerNode.id,
              arena_id: currentArena.id
           }).catch(err => console.error("Failed to save match history:", err));
        }

        setPlayerScore(pScore);
        setCpuScore(cScore);
        setMessage(resultMessage);
        
        setTimeout(() => {
           setPlayerHand(prev => prev.map(c => c.id === (isPlayerLead ? leadCard.id : respondCard.id) ? {...c, isUsed: true} : c));
           setCpuHand(prev => prev.map(c => c.id === (!isPlayerLead ? leadCard.id : respondCard.id) ? {...c, isUsed: true} : c));
           
           setLeadCard(null);
           setRespondCard(null);
           setActiveStat(null);
           setRoundsLeft(roundsLeft - 1);
           
           if (pScore >= 3 || cScore >= 3 || roundsLeft - 1 === 0) {
             setPhase('GAME_OVER');
             if (pScore > cScore) setMessage(difficulty === 'PVP_LOCAL' ? 'Match Over: PLAYER 1 VICTORY' : 'Match Over: VICTORY');
             else if (cScore > pScore) setMessage(difficulty === 'PVP_LOCAL' ? 'Match Over: PLAYER 2 VICTORY' : 'Match Over: DEFEAT');
             else setMessage('Match Over: DRAW');
           } else {
             setTurnOwner(nextTurn);
             setPhase('CHOOSE_LEAD');
             setMessage(nextTurn === 'PLAYER' ? (difficulty === 'PVP_LOCAL' ? 'Player 1 Turn: Select a hero to lead.' : 'Your Turn: Select a hero to lead.') : (difficulty === 'PVP_LOCAL' ? 'Player 2 Turn: Select a hero to lead.' : 'Opponent is thinking...'));
           }
        }, 2000);
      }, 1000);
    }
  }, [phase]);

  const onPlayerCardClick = (card: GameCard, isCpuCard: boolean) => {
    if (card.isUsed) return;
    
    if (!isCpuCard) {
      if (phase === 'CHOOSE_LEAD' && turnOwner === 'PLAYER') {
        setLeadCard(card);
        setPhase('CHOOSE_STAT');
        setMessage(difficulty === 'PVP_LOCAL' ? 'PLAYER 1: Select an attribute to strike with.' : 'Select an attribute to strike with.');
      } else if (phase === 'CHOOSE_RESPOND' && turnOwner === 'PLAYER') {
        setRespondCard(card);
        setPhase('RESOLVING');
      }
    } else if (difficulty === 'PVP_LOCAL' && isCpuCard) {
      if (phase === 'CHOOSE_LEAD' && turnOwner === 'CPU') {
        setLeadCard(card);
        setPhase('CHOOSE_STAT');
        setMessage('PLAYER 2: Select an attribute to strike with.');
      } else if (phase === 'CHOOSE_RESPOND' && turnOwner === 'CPU') {
        setRespondCard(card);
        setPhase('RESOLVING');
      }
    }
  };

  const renderCard = (c: GameCard, hidden?: boolean, isSelectable?: boolean, active?: boolean, isCpuCard?: boolean) => (
    <div 
      onClick={isSelectable ? () => onPlayerCardClick(c, !!isCpuCard) : undefined}
      key={c.id}
      className={cn(
        "relative w-[15%] max-w-[120px] aspect-[2/3] border rounded overflow-hidden flex flex-col bg-black transition-all",
        hidden ? "border-white/5 opacity-50" : (active ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110 z-10" : "border-white/10"),
        c.isUsed && !active ? "opacity-20 grayscale cursor-not-allowed" : "",
        isSelectable && !c.isUsed ? "cursor-pointer hover:border-white/40 hover:-translate-y-2" : ""
      )}
    >
      <div className="h-1/2 w-full relative">
        <img src={hidden ? 'https://picsum.photos/seed/hidden/200/300' : (c.image_url || undefined)} className={cn("w-full h-full object-contain object-center filter transition-all", hidden ? "blur-md" : "brightness-90")} />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        {c.chemistryBonus > 0 && !hidden && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
            title="Synergy Active: +1 All Stats" 
          />
        )}
        {!hidden && (
          <span className="absolute top-1 left-1 text-[8px] bg-white/10 px-1 py-0.5 rounded font-mono uppercase tracking-tighter text-white/70">
            {c.hero_type}
          </span>
        )}
      </div>
      <div className="flex-1 p-1 flex flex-col justify-between">
        {!hidden ? (
          <>
            <div className="text-[7px] md:text-[9px] uppercase tracking-tighter text-white font-serif italic truncate w-full text-center mb-1">{c.name}</div>
            <div className="flex justify-between px-1 text-[8px] md:text-[10px] font-mono">
              <span className={cn("flex flex-col items-center", c.chemistryBonus && "text-emerald-400")}><Dumbbell className="w-2.5 h-2.5 mb-0.5 opacity-50"/>{c.strength}</span>
              <span className={cn("flex flex-col items-center", c.chemistryBonus && "text-emerald-400")}><Wind className="w-2.5 h-2.5 mb-0.5 opacity-50"/>{c.speed}</span>
              <span className={cn("flex flex-col items-center", c.chemistryBonus && "text-emerald-400")}><Heart className="w-2.5 h-2.5 mb-0.5 opacity-50"/>{c.health}</span>
            </div>
          </>
        ) : <div className="flex-1 flex items-center justify-center text-[10px] text-white/20 font-serif">?</div>}
      </div>
      {active && phase === 'CHOOSE_STAT' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center gap-1 p-1 z-20">
          <button onClick={() => handleStatSelection('strength')} className="bg-white/10 hover:bg-white text-white hover:text-black py-1 rounded text-[8px] font-bold">STR: {c.strength}</button>
          <button onClick={() => handleStatSelection('speed')} className="bg-white/10 hover:bg-white text-white hover:text-black py-1 rounded text-[8px] font-bold">SPD: {c.speed}</button>
          <button onClick={() => handleStatSelection('health')} className="bg-white/10 hover:bg-white text-white hover:text-black py-1 rounded text-[8px] font-bold">HP: {c.health}</button>
        </div>
      )}
    </div>
  );

  const renderArenaCard = (c: GameCard | null, requiredStat: StatType | null, isCpu: boolean) => {
    const isHidden = difficulty !== 'PVP_LOCAL' && isCpu && phase !== 'RESOLVING' && phase !== 'GAME_OVER';

    return !c ? <div className="w-32 h-48 border border-white/5 rounded bg-white/[0.01] flex items-center justify-center text-[10px] text-white/20 uppercase tracking-widest">Waiting</div> : (
      <motion.div 
        key={c.id + (isHidden ? 'hid' : 'vis')}
        initial={{ scale: 0.8, opacity: 0, x: isCpu ? -30 : 30, rotateY: 90 }} 
        animate={{ scale: 1, opacity: 1, x: 0, rotateY: 0 }} 
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={cn(
          "w-32 h-48 border rounded overflow-hidden flex flex-col relative shadow-2xl",
          c.chemistryBonus > 0 && !isHidden ? "border-emerald-500/50 bg-[#0A1A10]" : "border-white/20 bg-[#0A0A0A]"
        )}
      >
        <div className="h-24 relative">
          <img src={isHidden ? 'https://picsum.photos/seed/hidden/200/300' : (c.image_url || undefined)} className={cn("w-full h-full object-contain object-center transition-all filter", isHidden ? "blur-md" : "brightness-90")} />
          <div className={cn("absolute inset-0 bg-gradient-to-t to-transparent", c.chemistryBonus > 0 && !isHidden ? "from-[#0A1A10]" : "from-[#0A0A0A]")} />
        </div>
        <div className="p-3 text-center flex-1 flex flex-col items-center justify-between">
          <h4 className="font-serif italic text-white text-sm">{isHidden ? '???' : c.name}</h4>
          {requiredStat ? (
            <div className="text-2xl font-mono text-white mt-2 border-b border-white/20 pb-1 w-full relative">
              <motion.span 
                 className="inline-block"
                 key={isHidden ? 'hidden' : c[requiredStat]} 
                 initial={{ scale: 2, color: '#facc15' }} 
                 animate={{ scale: 1, color: c.chemistryBonus > 0 && !isHidden ? '#10b981' : '#ffffff' }}
                 transition={{ duration: 0.4 }}
              >
                {isHidden ? '?' : c[requiredStat]}
              </motion.span>
              {c.chemistryBonus > 0 && !isHidden && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                  className="absolute -top-4 -right-1 text-[8px] bg-emerald-500 text-black px-1 rounded-sm font-bold tracking-tight shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                >
                  +SYNERGY
                </motion.div>
              )}
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-widest text-white/40">{requiredStat}</span>
            </div>
          ) : <div className="text-xs font-mono text-white/50 mt-2">Selecting stat...</div>}
        </div>
      </motion.div>
    );
  };

  if (allHeroes.length < 20) return <div className="text-center text-white/50 font-mono text-xs uppercase p-8">Initializing databanks...</div>;

  if (phase === 'DRAFT') {
    return (
      <div className="flex flex-col flex-1 min-h-[700px] bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden font-sans p-6 mb-12">
        <h2 className="text-2xl font-serif italic text-white mb-2 text-center">Tactical Protocol: Draft phase</h2>
        
        {draftTurn === 'P1' && (
          <div className="flex justify-center gap-4 mb-4">
            <button onClick={() => handleDifficultySelect('AGGRESSIVE')} className={cn("px-4 py-1.5 border rounded text-[10px] uppercase font-mono tracking-widest transition-colors", difficulty === 'AGGRESSIVE' ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/40')}>Aggressive AI</button>
            <button onClick={() => handleDifficultySelect('BALANCED')} className={cn("px-4 py-1.5 border rounded text-[10px] uppercase font-mono tracking-widest transition-colors", difficulty === 'BALANCED' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/40')}>Balanced AI</button>
            <button onClick={() => handleDifficultySelect('DEFENSIVE')} className={cn("px-4 py-1.5 border rounded text-[10px] uppercase font-mono tracking-widest transition-colors", difficulty === 'DEFENSIVE' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/40')}>Defensive AI</button>
            <button onClick={() => handleDifficultySelect('PVP_LOCAL')} className={cn("px-4 py-1.5 border rounded text-[10px] uppercase font-mono tracking-widest transition-colors", difficulty === 'PVP_LOCAL' ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/40')}>PVP (HOTSEAT)</button>
          </div>
        )}

        <p className="text-center text-white/50 font-mono text-[10px] uppercase tracking-widest mb-8">
          Form a squad of 5 operators. <br /> Note: 3 or more of same Type (Speed, Strength, Flight) grants +1 to all attributes!
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
          {draftPool.map(hero => {
            const isPicked = !!playerHand.find(h => h.id === hero.id) || !!cpuHand.find(h => h.id === hero.id);
            return (
              <div 
                key={hero.id}
                onClick={() => !isPicked && handleDraftSelect(hero)}
                className={cn(
                  "relative w-[18%] md:w-[12%] max-w-[90px] aspect-[2/3] border border-white/10 rounded overflow-hidden flex flex-col bg-black transition-all",
                  isPicked ? "opacity-20 grayscale border-emerald-500 scale-95" : "cursor-pointer hover:border-white/40 hover:-translate-y-2"
                )}
              >
                <div className="h-1/2 w-full relative">
                  <img src={hero.image_url || undefined} className="w-full h-full object-contain object-center" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  <span className="absolute top-1 left-1 text-[8px] bg-white/10 px-1 py-0.5 rounded font-mono uppercase tracking-tighter text-white/70">
                    {hero.hero_type}
                  </span>
                </div>
                <div className="flex-1 p-1 flex flex-col justify-between">
                  <div className="text-[7px] md:text-[9px] uppercase tracking-tighter text-white font-serif italic truncate w-full text-center mb-1">{hero.name}</div>
                  <div className="flex justify-between px-1 text-[8px] md:text-[10px] font-mono">
                    <span className="flex flex-col items-center"><Dumbbell className="w-2.5 h-2.5 mb-0.5 opacity-50"/>{hero.strength}</span>
                    <span className="flex flex-col items-center"><Wind className="w-2.5 h-2.5 mb-0.5 opacity-50"/>{hero.speed}</span>
                    <span className="flex flex-col items-center"><Heart className="w-2.5 h-2.5 mb-0.5 opacity-50"/>{hero.health}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-auto">
          {[...Array(5)].map((_, i) => {
             const activeHand = draftTurn === 'P2' ? cpuHand : playerHand;
             return (
               <div key={i} className="w-12 h-16 border rounded bg-white/5 border-white/20 overflow-hidden relative">
                 {activeHand[i] && <img src={activeHand[i].image_url || undefined} className="w-full h-full object-contain object-center opacity-50" />}
               </div>
             );
          })}
        </div>
      </div>
    );
  }

  const isPlayerLeadRound = turnOwner === 'CPU' || (turnOwner === 'PLAYER' && phase !== 'CHOOSE_RESPOND');

  return (
    <div className="flex flex-col flex-1 h-[700px] bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden font-sans">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#070707]">
        <div className="flex items-center gap-4">
          <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]", difficulty === 'AGGRESSIVE' ? 'bg-rose-500 shadow-rose-500/50' : difficulty === 'BALANCED' ? 'bg-amber-500 shadow-amber-500/50' : difficulty === 'PVP_LOCAL' ? 'bg-purple-500 shadow-purple-500/50' : 'bg-blue-500 shadow-blue-500/50')}></div>
          <span className={cn("text-[10px] uppercase tracking-widest font-bold", difficulty === 'AGGRESSIVE' ? 'text-rose-500/80' : difficulty === 'BALANCED' ? 'text-amber-500/80' : difficulty === 'PVP_LOCAL' ? 'text-purple-500/80' : 'text-blue-500/80')}>
            {difficulty === 'PVP_LOCAL' ? 'PLAYER 2 STATUS' : `OPPONENT LOGIC: ${difficulty}`}
          </span>
        </div>
        <div className="text-lg font-serif italic text-white">
          <motion.span key={cpuScore} initial={{ scale: 2, color: '#f43f5e' }} animate={{ scale: 1, color: '#ffffff' }} className="inline-block">{cpuScore}</motion.span> <span className="text-white/20">WINS</span>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 p-4 pt-6">
        {cpuHand.map(c => renderCard(c, difficulty !== 'PVP_LOCAL' && !c.isUsed && phase !== 'GAME_OVER', difficulty === 'PVP_LOCAL' && turnOwner === 'CPU' && phase !== 'GAME_OVER' && phase !== 'RESOLVING', respondCard?.id === c.id || (!isPlayerLeadRound && leadCard?.id === c.id), true))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative my-4 border-y border-white/5 bg-black/50 overflow-hidden">
         {phase === 'RESOLVING' && (
           <div className="absolute inset-0 bg-red-900/20 z-0 flex items-center justify-center">
             <div className="absolute w-full h-[2px] bg-yellow-400 rotate-45 opacity-50 shadow-[0_0_20px_rgba(250,204,21,1)]" />
             <div className="absolute w-full h-[2px] bg-yellow-400 -rotate-45 opacity-50 shadow-[0_0_20px_rgba(250,204,21,1)]" />
           </div>
         )}
         <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/90 font-mono bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 z-20 whitespace-nowrap shadow-xl">
           {message}
         </div>
         
         {currentArena && phase !== 'GAME_OVER' && (
           <div className="absolute top-4 right-4 text-[10px] text-white/40 uppercase tracking-widest text-right z-10">
             Location: <span className="text-amber-400/80">{currentArena.name}</span>
             <br/><span className="text-[8px] opacity-60">[{currentArena.location_type}]</span>
           </div>
         )}

         {phase === 'GAME_OVER' ? (
           <motion.div 
             initial={{ scale: 0, rotate: -10 }}
             animate={{ scale: 1, rotate: 0 }}
             transition={{ type: "spring", bounce: 0.5 }}
             className={cn("text-6xl font-serif italic text-white my-8 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] z-10", playerScore > cpuScore ? "text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]" : playerScore < cpuScore ? "text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "text-amber-400")}
           >
             {playerScore > cpuScore ? 'VICTORY!' : playerScore < cpuScore ? 'DEFEAT' : 'DRAW'}
           </motion.div>
         ) : (
           <div className="flex items-center gap-12 mt-6 z-10">
             <motion.div animate={phase === 'RESOLVING' ? { x: [0, 40, -10, 0], rotate: [0, 5, -5, 0] } : {}} transition={{ duration: 0.5 }}>
               {renderArenaCard(isPlayerLeadRound ? respondCard : leadCard, activeStat ? (isPlayerLeadRound ? getReqStat(activeStat) : activeStat) : null, true)}
             </motion.div>
             
             <div className="flex flex-col items-center justify-center relative">
               {phase === 'RESOLVING' && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0 }} 
                   animate={{ opacity: 1, scale: [1, 1.5, 1], rotate: [0, -10, 10, 0] }} 
                   transition={{ duration: 0.5, repeat: Infinity }}
                   className="absolute z-[-1] w-32 h-32 bg-yellow-500/20 rounded-full blur-xl"
                 />
               )}
               <motion.span 
                  key={phase}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn("font-serif italic text-3xl mb-2 z-10", phase === 'RESOLVING' ? "text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,1)] text-5xl font-bold" : "text-amber-400/50")}
               >
                 {phase === 'RESOLVING' ? 'CLASH!' : 'VS'}
               </motion.span>
               {activeStat && <span className={cn("text-[10px] uppercase tracking-widest font-mono border px-3 py-1 rounded shadow-lg z-10", phase === 'RESOLVING' ? "border-red-400/50 bg-red-500/20 text-white font-bold animate-pulse" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400")}>{activeStat} CONTEST</span>}
             </div>
             
             <motion.div animate={phase === 'RESOLVING' ? { x: [0, -40, 10, 0], rotate: [0, -5, 5, 0] } : {}} transition={{ duration: 0.5 }}>
               {renderArenaCard(isPlayerLeadRound ? leadCard : respondCard, activeStat ? (isPlayerLeadRound ? activeStat : getReqStat(activeStat)) : null, false)}
             </motion.div>
           </div>
         )}
         
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] font-mono text-white/50 uppercase tracking-widest z-10">
           Rounds Remaining: <span className="text-white bg-white/20 px-3 py-0.5 rounded font-bold shadow-inner">{roundsLeft}</span>
         </div>
      </div>

      <div className="flex justify-center gap-4 p-4 pb-6">
        {playerHand.map(c => renderCard(c, false, turnOwner === 'PLAYER' && phase !== 'GAME_OVER' && phase !== 'RESOLVING', leadCard?.id === c.id || respondCard?.id === c.id))}
      </div>

      <div className="p-4 border-t border-white/10 flex justify-between items-center bg-[#070707]">
        <div className="text-lg font-serif italic text-white">
          <motion.span key={playerScore} initial={{ scale: 2, color: '#10b981' }} animate={{ scale: 1, color: '#ffffff' }} className="inline-block">{playerScore}</motion.span> <span className="text-white/20">WINS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-bold">
            {difficulty === 'PVP_LOCAL' ? 'PLAYER 1 STATUS' : 'OPERATOR PROFILE'}
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </div>
      </div>
    </div>
  );
}

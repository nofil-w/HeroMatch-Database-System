import React, { useEffect, useState, useMemo } from 'react';
import { Hero, Universe } from './types';
import { fetchHeroes, fetchTeams, fetchUniverses, fetchMe, deleteHero, fetchRoles, fetchPowers } from './api';
import { HeroCard } from './components/HeroCard';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { TacticalDuel } from './components/TacticalDuel';
import { HistoryDashboard } from './components/HistoryDashboard';
import { Search, Filter, X, Globe, Plus, LogIn, LogOut, User, Lock, HelpCircle, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthModal } from './components/AuthModal';
import { HeroModal } from './components/HeroModal';
import { BadgeInput } from './components/BadgeInput';
import { ManageTagsModal } from './components/ManageTagsModal';

import { UsersDashboard } from './components/UsersDashboard';

export default function App() {
  const [allDataHeroes, setAllDataHeroes] = useState<Hero[]>([]);
  const [teams, setTeams] = useState<{id: string; name: string}[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [powers, setPowers] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showCustomTagModal, setShowCustomTagModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<'registry' | 'arena' | 'records'>('registry');
  
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [editingHero, setEditingHero] = useState<Hero | undefined>();

  const [heroToDelete, setHeroToDelete] = useState<string | null>(null);

  const loadData = () => {
    fetchTeams().then(setTeams);
    fetchUniverses().then(setUniverses);
    fetchRoles().then(setRoles);
    fetchPowers().then(setPowers);
    fetchHeroes('', 'all', 'all').then(setAllDataHeroes);
  };

  useEffect(() => {
    loadData();
    fetchMe()
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsAuthChecking(false));
  }, []);

  const heroes = useMemo(() => {
    return allDataHeroes.filter(h => {
      // Basic text search in the capsule
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q) || h.secret_identity.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      // Tag-based filtering
      if (searchTags.length === 0) return true;
      return searchTags.every(tag => {
        const lowerTag = tag.toLowerCase();
        if (h.universe.toLowerCase() === lowerTag) return true;
        if (h.hero_type.toLowerCase() === lowerTag) return true;
        if (h.powers?.some(p => p.toLowerCase() === lowerTag)) return true;
        // Also support partial power matches if needed, but per request it's universe, role, power
        return false;
      });
    });
  }, [allDataHeroes, searchTags, searchQuery]);

  const categorizedSuggestions = useMemo(() => {
    return {
      'Universe': Array.isArray(universes) ? universes.map(u => u.name) : [],
      'Primary Role': roles,
      'Power': powers
    };
  }, [universes, roles, powers]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const confirmDelete = async () => {
    if (!heroToDelete) return;
    try {
      await deleteHero(heroToDelete);
      setHeroToDelete(null);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getCompareHeroes = () => {
    return compareIds.map(id => heroes.find(h => h.id === id)).filter(Boolean) as Hero[];
  };

  const compareHeroes = getCompareHeroes();

  return (
    <div className="min-h-screen font-sans flex flex-col items-center selection:bg-red-500/30 relative text-slate-50 overscroll-none">
      {/* ELITE HEAVY DARK BACKGROUND */}
      <div className="fixed inset-0 z-[-1] bg-[#050508] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f141e] via-[#050508] to-black overflow-hidden">
        {/* Subtle glowing accents */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-red-600/5 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="w-full max-w-[1024px] flex flex-col p-4 md:p-8 gap-8 relative z-10 bg-black/20 min-h-screen border-x border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm">
        <header className="flex flex-col items-center gap-4 border-b border-white/20 pb-6 pt-4 relative w-full">
          <div className="w-full flex justify-center pb-2 px-12">
            <h1 
              className="font-serif text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#e2e8f0] via-[#94a3b8] to-[#475569] drop-shadow-[0_0_20px_rgba(148,163,184,0.4)] uppercase italic transform -skew-x-12 hover:scale-105 transition-all duration-300 cursor-pointer whitespace-nowrap px-8 py-2" 
            >
              HEROMATCH
            </h1>
          </div>
          
          <div className="flex w-full items-center justify-between">
            <nav className="hidden md:flex gap-6 text-[12px] md:text-sm uppercase tracking-widest text-[#94a3b8] font-black">
              <span onClick={() => setCurrentTab('registry')} className={currentTab === 'registry' ? "text-blue-400 border-b-2 border-blue-400 pb-1 cursor-pointer drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] transition-all" : "hover:text-blue-300 transition-colors cursor-pointer text-slate-500"}>Encyclopedia</span>
              <span onClick={() => setCurrentTab('arena')} className={currentTab === 'arena' ? "text-blue-400 border-b-2 border-blue-400 pb-1 cursor-pointer drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] transition-all" : "hover:text-blue-300 transition-colors cursor-pointer text-slate-500"}>Tactical Arena</span>
              <span onClick={() => setCurrentTab('records')} className={currentTab === 'records' ? "text-blue-400 border-b-2 border-blue-400 pb-1 cursor-pointer drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] transition-all" : "hover:text-blue-300 transition-colors cursor-pointer text-slate-500"}>Hall of Records</span>
              {user?.role === 'admin' && (
                <span onClick={() => setCurrentTab('users')} className={currentTab === 'users' ? "text-red-400 border-b-2 border-red-400 pb-1 cursor-pointer drop-shadow-[0_0_10px_rgba(248,113,113,0.8)] transition-all" : "hover:text-red-300 transition-colors cursor-pointer text-slate-500"}>Users</span>
              )}
            </nav>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowGuide(true)} 
                className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-blue-300 flex items-center gap-1 transition-colors drop-shadow-[0_0_5px_rgba(96,165,250,0)] hover:drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]"
                title="View Guide"
              >
                <HelpCircle className="w-4 h-4" /> <span className="hidden sm:inline">Guide</span>
              </button>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-[10px] uppercase tracking-widest text-blue-200/70 flex items-center gap-1 font-mono">
                    <User className="w-3 h-3" /> {user.username}
                  </div>
                  <button onClick={() => { localStorage.removeItem('token'); setUser(null); }} className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                    <LogOut className="w-3 h-3" /> Log Out
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="text-[10px] uppercase tracking-widest text-blue-300 border border-blue-500/30 px-4 py-1.5 rounded-sm hover:bg-blue-900/40 hover:border-blue-400 flex items-center gap-2 transition-all shadow-[inset_0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <LogIn className="w-3 h-3" /> Agent Login
                </button>
              )}
            </div>
          </div>
          
          {currentTab === 'registry' && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                {/* Search Capsule */}
                <div className="relative flex items-center">
                  <motion.div
                    animate={{ width: isSearchExpanded ? '280px' : '44px' }}
                    className="h-11 bg-blue-950/20 border border-blue-500/30 rounded-full flex items-center overflow-hidden transition-colors hover:border-blue-500/50 group"
                  >
                    <button 
                      onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                      className="w-11 h-11 flex items-center justify-center shrink-0 text-blue-400 group-hover:text-blue-300 transition-colors"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                    <input 
                      autoFocus={isSearchExpanded}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="SEARCH ID..."
                      className="bg-transparent border-none outline-none text-sm text-blue-100 placeholder:text-blue-500/30 font-mono tracking-widest w-full pr-4"
                    />
                  </motion.div>
                </div>

                {/* Tags Dropdown/Input */}
                <div className="flex-1 max-w-xl">
                  <BadgeInput 
                    placeholder="INITIATE PARAMETER FILTER..."
                    value={searchTags}
                    onChange={setSearchTags}
                    categorizedSuggestions={categorizedSuggestions}
                    allowCustom={false}
                    onOpenCustomTag={() => setShowCustomTagModal(true)}
                    isAdmin={user?.role === 'admin'}
                  />
                </div>
              </div>

              {user?.role === 'admin' && (
                <button 
                  onClick={() => { setEditingHero(undefined); setShowHeroModal(true); }}
                  className="relative overflow-hidden group bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-5 py-2.5 rounded-sm text-[11px] font-bold font-mono tracking-widest transition-all hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] border border-blue-400/50 flex items-center gap-2 uppercase shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Hero
                </button>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 flex flex-col gap-8">
          {currentTab === 'arena' ? (
            <TacticalDuel allHeroes={allDataHeroes} />
          ) : currentTab === 'records' ? (
            <HistoryDashboard />
          ) : currentTab === 'users' && user?.role === 'admin' ? (
            <UsersDashboard />
          ) : (
            <>
              {/* Comparison Section */}
              <AnimatePresence>
                {compareHeroes.length === 2 && (
              <motion.section
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="relative z-10 overflow-hidden"
              >
                 <button 
                  onClick={() => setCompareIds([])} 
                  className="absolute top-4 right-4 px-4 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded hover:bg-stone-200 z-50 flex items-center gap-2"
                  title="Clear comparison"
                >
                  <X className="w-3 h-3" /> CLEAR
                </button>
                <ComparisonDashboard heroA={compareHeroes[0]} heroB={compareHeroes[1]} />
              </motion.section>
            )}
          </AnimatePresence>

          {/* Info Box if waiting for comparison */}
          {compareIds.length === 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.02] border border-white/10 p-4 rounded text-center text-[10px] uppercase tracking-widest text-white/50"
            >
              <strong className="text-white font-serif italic text-sm normal-case mr-2">{getCompareHeroes()[0]?.name}</strong>
              selected. Select one more hero to execute analysis.
            </motion.div>
          )}

          {/* Grid View */}
          <section className="flex-1 bg-[#0A0F1A]/80 border border-white/5 rounded-lg flex flex-col overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#050508]/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                <h2 className="font-mono text-sm uppercase tracking-widest text-blue-100 font-bold">
                  REGISTRY
                </h2>
                <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-sm uppercase tracking-widest font-mono border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                  {heroes.length} CHARACTERS
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {heroes.length > 0 ? (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {heroes.map(hero => (
                      <motion.div 
                        key={hero.id}
                        layoutId={hero.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <HeroCard 
                          hero={hero} 
                          universeColor={Array.isArray(universes) ? universes.find(u => u.name === hero.universe)?.color : undefined}
                          onCompareSelect={toggleCompare} 
                          isSelected={compareIds.includes(hero.id)} 
                          canEdit={user?.role === 'admin'}
                          onEdit={() => { setEditingHero(hero); setShowHeroModal(true); }}
                          onDelete={() => setHeroToDelete(hero.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="text-center py-20 text-[10px] uppercase tracking-widest text-blue-500/50 font-mono flex flex-col items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <span>No Entities Match Current Parameters</span>
                </div>
              )}
            </div>
          </section>
          </>
          )}
        </main>
      </div>
      <AnimatePresence>
        {showAuthModal && <AuthModal key="auth-modal" onClose={() => setShowAuthModal(false)} onSuccess={(u) => { setUser(u); setShowAuthModal(false); }} />}
        {showHeroModal && (
          <HeroModal 
            key="hero-modal"
            hero={editingHero} 
            onClose={() => { setShowHeroModal(false); setEditingHero(undefined); }} 
            onSuccess={() => { setShowHeroModal(false); setEditingHero(undefined); loadData(); }}
            universes={universes}
            roles={roles}
            powers={powers}
            onOpenCustomTag={() => setShowCustomTagModal(true)}
          />
        )}
        {showCustomTagModal && (
          <ManageTagsModal 
            key="manage-tags-modal"
            onClose={() => setShowCustomTagModal(false)}
            onSuccess={() => { setShowCustomTagModal(false); loadData(); }}
            universes={universes}
            roles={roles}
            powers={powers}
          />
        )}
      </AnimatePresence>

      {heroToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-800" />
            <h3 className="text-xl font-serif font-bold text-white mb-2">Delete Record?</h3>
            <p className="text-sm text-slate-400 mb-6 font-sans">
              This action cannot be undone. All combat logs and history tied to this hero will be permanently erased.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setHeroToDelete(null)}
                className="px-4 py-2 rounded text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 rounded text-sm font-bold bg-red-500 hover:bg-red-400 text-white transition-colors"
              >
                Delete Hero
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0F1A] border border-blue-500/20 p-8 rounded-xl max-w-2xl w-full shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden text-blue-100/70 font-mono"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400" />
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-blue-500/50 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-serif font-black text-white mb-6 uppercase italic tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">FIELD OPERATIVE GUIDE</h2>
            <div className="space-y-6 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <section className="bg-[#050508]/80 p-4 rounded-lg border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <h3 className="text-red-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2 font-mono text-sm">
                  <span className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span> ENCYCLOPEDIA
                </h3>
                <p>Welcome to the ultimate operative database. Use the registry tab to search characters by identifier, filter by their native universe, or filter by squad affiliations.</p>
                <p className="mt-3 font-bold text-red-300/80 bg-red-500/10 p-2 rounded border border-red-500/20">TIP: Select any two heroes using the "Select" button on their intel cards to enter the Versus Analysis panel for side-by-side statistical breakdown.</p>
              </section>
              <section className="bg-[#050508]/80 p-4 rounded-lg border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <h3 className="text-amber-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2 font-mono text-sm">
                  <span className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></span> TACTICAL ARENA
                </h3>
                <p>Draft a team of 5 elite units. Keep an eye on "Chemistry": drafting 3 or more units of the same combat archetype grants a <span className="text-emerald-400 font-black px-1 bg-emerald-500/10 border border-emerald-500/30 rounded">+1 BONUS</span> to all stats!</p>
                <p className="mt-4 text-amber-300/80 font-bold tracking-widest uppercase">Gamemode Protocols:</p>
                <ul className="mt-2 space-y-2 text-amber-100/60 pl-2">
                  <li className="flex items-start gap-2"><div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 shrink-0"/> <strong className="text-amber-300">AGGRESSIVE CPU:</strong> Prioritizes attacking with highest offensive stats. High risk.</li>
                  <li className="flex items-start gap-2"><div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 shrink-0"/> <strong className="text-amber-300">DEFENSIVE CPU:</strong> Prioritizes using high Health to absorb attacks and tire you out.</li>
                  <li className="flex items-start gap-2"><div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 shrink-0"/> <strong className="text-amber-300">BALANCED CPU:</strong> Varied strategy evaluating the optimal stat based on remaining cards.</li>
                  <li className="flex items-start gap-2"><div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 shrink-0"/> <strong className="text-amber-300">LOCAL VERSUS:</strong> Hotseat mode - play locally against another director.</li>
                </ul>
              </section>
              <section className="bg-[#050508]/80 p-4 rounded-lg border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <h3 className="text-blue-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2 font-mono text-sm">
                  <span className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span> HALL OF RECORDS
                </h3>
                <p>Every match played in the Tactical Arena is permanently etched into the databanks. View the Global Leaderboard to see win rates globally, and scroll the Tactical Records to see your past tactical bouts and results in detail.</p>
              </section>
            </div>
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowGuide(false)} 
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all hover:scale-[1.02]"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {!isAuthChecking && !user && !showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111] border border-white/10 p-8 rounded-lg text-center flex flex-col items-center gap-5 max-w-sm shadow-2xl"
          >
            <Lock className="w-10 h-10 text-white/30" />
            <div>
              <h2 className="text-2xl font-serif italic text-white mb-2">Access Restricted</h2>
              <p className="text-white/50 text-[10px] uppercase tracking-widest leading-relaxed">
                Please log in to access the HeroMatch database and tactical arena.
              </p>
            </div>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5" /> Authenticate
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

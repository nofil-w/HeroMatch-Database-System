import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Lock, Eye, EyeOff, Plus, Key } from 'lucide-react';
import { fetchUsers, revealPassword, registerAdmin } from '../api';
import { cn } from '../lib/utils';

export function UsersDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeRevealedUser, setActiveRevealedUser] = useState<string | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [revealError, setRevealError] = useState('');

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addAdminError, setAddAdminError] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRevealSubmit = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    setRevealError('');
    try {
      const res = await revealPassword(userId, adminPasswordInput);
      setRevealedPasswords(prev => ({ ...prev, [userId]: res.password }));
      setActiveRevealedUser(null);
      setAdminPasswordInput('');
    } catch (err: any) {
      setRevealError(err.message || 'Invalid Admin Password');
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminError('');
    setAddAdminLoading(true);
    try {
      await registerAdmin(newAdminUsername, newAdminPassword);
      setShowAddAdmin(false);
      setNewAdminUsername('');
      setNewAdminPassword('');
      loadUsers();
    } catch (err: any) {
      setAddAdminError(err.message || 'Failed to add admin');
    } finally {
      setAddAdminLoading(false);
    }
  };

  const normalUsers = users.filter(u => u.role !== 'admin');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Normal Users List */}
      <div className="flex-1 bg-[#0A0F1A]/80 border border-white/5 rounded-lg flex flex-col overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#050508]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            <h2 className="font-mono text-sm uppercase tracking-widest text-blue-100 font-bold">
              OPERATIVES
            </h2>
          </div>
          <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-sm uppercase tracking-widest font-mono border border-blue-500/30">
            {normalUsers.length} USERS
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {normalUsers.map(u => (
             <UserItem key={u.id} user={u} />
          ))}
          {normalUsers.length === 0 && !loading && (
             <div className="text-center text-white/30 text-xs font-mono py-10 uppercase tracking-widest">No regular operatives found.</div>
          )}
        </div>
      </div>

      {/* Admins List */}
      <div className="flex-1 bg-[#1A0A0A]/80 border border-red-500/10 rounded-lg flex flex-col overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-red-500/10 flex justify-between items-center bg-[#080505]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <h2 className="font-mono text-sm uppercase tracking-widest text-red-100 font-bold">
              DIRECTORS (ADMINS)
            </h2>
          </div>
          <button 
            onClick={() => setShowAddAdmin(true)}
            className="text-[10px] bg-red-900/60 text-white px-3 py-1 rounded-sm uppercase tracking-widest font-mono border border-red-500/50 hover:bg-red-800 transition-colors flex items-center gap-1 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            <Plus className="w-3 h-3" /> ADD ADMIN
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {admins.map(u => (
             <UserItem key={u.id} user={u} isAdmin />
          ))}
        </div>
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddAdmin(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#110505] border border-red-500/30 p-6 rounded-xl w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.3)] relative z-10"
            >
              <h3 className="text-xl font-serif text-red-100 mb-6 flex items-center gap-3 italic">
                <Shield className="w-6 h-6 text-red-500" /> Grant Director Access
              </h3>
              {addAdminError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest font-mono rounded">
                  {addAdminError}
                </div>
              )}
              <form onSubmit={handleAddAdminSubmit} className="flex flex-col gap-4">
                <input required type="text" placeholder="USERNAME" value={newAdminUsername} onChange={e => setNewAdminUsername(e.target.value)} className="w-full bg-black/50 border border-red-500/20 rounded p-3 text-red-100 placeholder:text-red-900 outline-none focus:border-red-500/60 font-mono text-sm tracking-widest" />
                <input required type="password" placeholder="SECURE PASSWORD" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className="w-full bg-black/50 border border-red-500/20 rounded p-3 text-red-100 placeholder:text-red-900 outline-none focus:border-red-500/60 font-mono text-sm tracking-widest" />
                <div className="flex gap-3 justify-end mt-4">
                  <button type="button" onClick={() => setShowAddAdmin(false)} className="px-4 py-2 text-[10px] uppercase tracking-widest font-mono text-red-400/50 hover:text-red-400 transition-colors">Cancel</button>
                  <button type="submit" disabled={addAdminLoading} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest font-mono rounded transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    {addAdminLoading ? 'REGISTERING...' : 'AUTHORIZE'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  function UserItem({ user, isAdmin = false }: { user: any, isAdmin?: boolean }) {
    const isRevealing = activeRevealedUser === user.id;
    const revealedPwd = revealedPasswords[user.id];

    return (
      <div className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${isAdmin ? 'bg-red-950/20 border-red-500/10 hover:border-red-500/30' : 'bg-[#0F1626] border-blue-500/10 hover:border-blue-500/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <span className={`font-mono uppercase tracking-widest text-sm font-bold ${isAdmin ? 'text-red-100' : 'text-blue-100'}`}>{user.username}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <Key className={`w-3 h-3 ${isAdmin ? 'text-red-500/50' : 'text-blue-500/50'}`} />
          <div className="flex-1 relative">
            {revealedPwd ? (
               <span className={`font-mono tracking-wider font-bold ${isAdmin ? 'text-red-400' : 'text-emerald-400'}`}>{revealedPwd}</span>
            ) : (
               <span className="font-mono text-slate-500 tracking-[0.3em] cursor-pointer" onClick={() => setActiveRevealedUser(isRevealing ? null : user.id)}>
                 ••••••••
               </span>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isRevealing && !revealedPwd && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              onSubmit={(e) => handleRevealSubmit(e, user.id)}
              className="mt-2 flex gap-2 overflow-hidden"
            >
              <input 
                type="password" autoFocus required placeholder="ENTER ADMIN SECRETS"
                value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)}
                className={`flex-1 bg-black/40 border p-2 text-[10px] font-mono tracking-widest outline-none rounded-sm ${isAdmin ? 'border-red-500/30 text-red-200 focus:border-red-500' : 'border-blue-500/30 text-blue-200 focus:border-blue-500'}`}
              />
              <button disabled={!adminPasswordInput} type="submit" className={`px-3 py-2 text-[10px] font-bold font-mono tracking-widest rounded-sm transition-colors ${isAdmin ? 'bg-red-600 hover:bg-red-500 text-white disabled:bg-red-900/50' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-900/50'}`}>
                VERIFY
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        {isRevealing && revealError && (
          <span className="text-[10px] text-red-400 font-mono tracking-widest uppercase">{revealError}</span>
        )}
      </div>
    );
  }
}

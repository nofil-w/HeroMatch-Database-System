import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Edit2, Trash2, Plus } from 'lucide-react';
import { createTag, updateTag, deleteTag } from '../api';

interface ManageTagsModalProps {
  onClose: () => void;
  onSuccess: () => void;
  universes: any[];
  roles: string[];
  powers: string[];
}

const PRESET_COLORS = [
  '#dc2626', // Red (Marvel)
  '#3b82f6', // Blue (DC)
  '#16a34a', // Green
  '#ca8a04', // Yellow
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#475569', // Slate
];

export function ManageTagsModal({ onClose, onSuccess, universes, roles, powers }: ManageTagsModalProps) {
  const [type, setType] = useState<'universes' | 'roles' | 'powers'>('universes');
  
  // mode: 'new' or 'edit'
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [oldName, setOldName] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const safeUniverses = Array.isArray(universes) ? universes : [];
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safePowers = Array.isArray(powers) ? powers : [];

  const currentOpts = type === 'universes' ? safeUniverses.map(u => ({ name: u.name, color: u.color })) :
                      type === 'roles' ? safeRoles.map(r => ({ name: r })) :
                      safePowers.map(p => ({ name: p }));

  const handleSelectTag = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'NEW') {
      setMode('new');
      setName('');
      setColor('#3b82f6');
      setOldName('');
    } else {
      setMode('edit');
      setOldName(val);
      setName(val);
      if (type === 'universes') {
        const u = safeUniverses.find(u => u.name === val);
        setColor(u?.color || '#3b82f6');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    const apiType = type === 'universes' ? 'universe' : type === 'roles' ? 'role' : 'power';
    try {
      if (mode === 'new') {
        await createTag(name.trim(), apiType, type === 'universes' ? color : undefined);
      } else {
        await updateTag(oldName, name.trim(), type, type === 'universes' ? color : undefined);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await deleteTag(oldName, type);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const accentColor = type === 'universes' && mode === 'edit' && color ? color : '#3b82f6';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background overlay */}
      <motion.div 
        key="tags-modal-overlay"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal content */}
      <motion.div 
        key="tags-modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#0A0F1A] border border-blue-500/20 rounded-xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden z-10 p-6 md:p-8"
        style={{ borderColor: `${accentColor}40`, boxShadow: `0 0 50px ${accentColor}20` }}
      >
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="flex flex-col">
            <h2 className="text-2xl font-mono uppercase tracking-[0.2em] text-white font-black italic">
              PARAMETERS
            </h2>
            <motion.div animate={{ backgroundColor: accentColor }} transition={{ duration: 0.5 }} className="h-1 w-20 mt-1" />
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs uppercase tracking-widest mb-6 bg-red-400/10 p-4 border border-red-400/20 rounded font-mono">
            ⚠️ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
          <div className="flex gap-4 p-1 bg-white/5 rounded-lg border border-white/5">
            {(['universes', 'roles', 'powers'] as const).map(t => (
              <button
                key={t} type="button" onClick={() => { setType(t); setMode('new'); setName(''); }}
                className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-mono font-bold rounded-md transition-all ${type === t ? 'bg-blue-600/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Select Entry</span>
            <select
              value={mode === 'new' ? 'NEW' : oldName}
              onChange={handleSelectTag}
              className="w-full bg-[#050508]/80 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-blue-500/50 transition-colors font-mono text-sm tracking-widest appearance-none"
            >
              <option value="NEW">+ INITIALIZE NEW</option>
              {currentOpts.map(o => (
                <option key={o.name} value={o.name}>{o.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">{mode === 'new' ? 'Identifier' : 'Update Identifier'} *</span>
            <input 
              required value={name} onChange={e => { setName(e.target.value); setConfirmDelete(false); }}
              placeholder={`E.G. ${type === 'universes' ? 'DARK HORSE' : type === 'roles' ? 'MAGIC' : 'TELEPATHY'}`}
              className="w-full bg-[#050508]/80 border border-white/10 rounded-lg p-3 text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors font-mono text-sm tracking-widest uppercase"
            />
          </label>

          <AnimatePresence>
            {type === 'universes' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <label className="flex flex-col gap-3 pt-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1 flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Assign Chroma Vibe
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${color === c ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent relative" style={{ backgroundColor: color }}>
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer opacity-0" />
                    </div>
                  </div>
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-[10px] uppercase tracking-widest text-white/30 hover:text-white border border-white/5 rounded-lg transition-all hover:bg-white/5 font-mono">
              Cancel
            </button>
            {mode === 'edit' && (
              <button 
                type="button" 
                onClick={handleDelete}
                className={`flex-1 px-4 py-3 text-[10px] uppercase tracking-widest font-mono font-black border transition-all rounded-lg ${confirmDelete ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-red-950/30 text-red-400 border-red-500/20 hover:bg-red-900/40 hover:border-red-500/40'}`}
              >
                {confirmDelete ? 'CONFIRM' : <><Trash2 className="w-3 h-3 inline mr-1 -mt-0.5"/> DEL</>}
              </button>
            )}
            <button 
              type="submit" disabled={loading || !name.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all disabled:opacity-30 font-mono"
            >
              {loading ? '...' : mode === 'edit' ? 'SAVE' : 'ADD'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

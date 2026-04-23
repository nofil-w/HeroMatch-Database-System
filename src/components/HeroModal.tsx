import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Hero, Universe } from '../types';
import { createHero, updateHero } from '../api';
import { BadgeInput } from './BadgeInput';

interface HeroModalProps {
  hero?: Hero;
  onClose: () => void;
  onSuccess: () => void;
  universes?: Universe[];
  roles?: string[];
  powers?: string[];
  onOpenCustomTag?: () => void;
}

export function HeroModal({ hero, onClose, onSuccess, universes = [], roles = [], powers = [], onOpenCustomTag }: HeroModalProps) {
  const [formData, setFormData] = useState<Partial<Hero>>(
    hero || {
      name: '',
      secret_identity: '',
      universe: universes.length > 0 ? universes[0].name : '',
      alignment: 'Good',
      description: '',
      image_url: '',
      hero_type: roles[0] || 'strength',
      health: 50,
      speed: 50,
      strength: 50,
      powers: []
    }
  );
  
  const selectedUniverse = universes.find(u => u.name === formData.universe);
  const accentColor = selectedUniverse?.color || '#3b82f6';

  // Normalize powers payload on launch
  if (!formData.powers) formData.powers = [];
  else if (formData.powers.length === 1 && formData.powers[0].includes(',')) {
    formData.powers = formData.powers[0].split(',').map(p => p.trim()).filter(Boolean);
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePowersChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, powers: tags }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (hero) {
        await updateHero(hero.id, formData);
      } else {
        await createHero(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred overlay */}
      <motion.div 
        key="hero-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div 
        key="hero-modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#0A0F1A] border rounded-xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden z-10 p-6 md:p-8"
        style={{ 
          borderColor: accentColor + '4D', // 30% alpha
          boxShadow: `0 0 50px ${accentColor}1A` // 10% alpha
        }}
      >
        {/* Dynamic Glow effects with smooth transition */}
        <motion.div 
          animate={{ backgroundColor: accentColor + '1A' }}
          transition={{ duration: 0.8 }}
          className="absolute -top-24 -right-24 w-64 h-64 blur-[120px] rounded-full pointer-events-none" 
        />
        <motion.div 
          animate={{ backgroundColor: accentColor + '0D' }}
          transition={{ duration: 0.8 }}
          className="absolute -bottom-24 -left-24 w-64 h-64 blur-[120px] rounded-full pointer-events-none" 
        />

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="flex flex-col">
            <h2 className="text-2xl font-mono uppercase tracking-[0.2em] text-white font-black italic">
              {hero ? 'Update Operative' : 'Register New Operative'}
            </h2>
            <motion.div 
              animate={{ backgroundColor: accentColor }}
              transition={{ duration: 0.5 }}
              className="h-1 w-20 mt-1" 
            />
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-400 text-xs uppercase tracking-widest mb-6 bg-red-400/10 p-4 border border-red-400/20 rounded font-mono flex items-center gap-2"
          >
            <span className="text-lg">⚠️</span> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Codename *</span>
            <input 
              name="name" 
              value={formData.name || ''} 
              onChange={handleChange} 
              required 
              placeholder="INPUT ID..."
              className="bg-black/40 border border-white/10 p-4 text-sm text-white rounded-lg focus:border-white/40 outline-none transition-all placeholder:text-white/10 font-mono tracking-widest uppercase"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">True Identity</span>
            <input 
              name="secret_identity" 
              value={formData.secret_identity || ''} 
              onChange={handleChange} 
              placeholder="DECRYPTED NAME..."
              className="bg-black/40 border border-white/10 p-4 text-sm text-white rounded-lg focus:border-white/40 outline-none transition-all placeholder:text-white/10 font-mono tracking-widest uppercase"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Origin Universe</span>
            <div className="relative">
              <select 
                name="universe" 
                value={formData.universe || ''} 
                onChange={handleChange} 
                className="w-full bg-black/40 border border-white/10 p-4 text-sm text-white rounded-lg focus:border-white/40 outline-none appearance-none cursor-pointer font-mono tracking-widest uppercase"
                style={{ backgroundImage: `linear-gradient(45deg, transparent 50%, ${accentColor} 50%), linear-gradient(135deg, ${accentColor} 50%, transparent 50%)`, backgroundPosition: 'calc(100% - 20px) 22px, calc(100% - 15px) 22px', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
              >
                {Array.isArray(universes) && universes.length > 0 ? (
                  universes.map(u => (
                    <option key={u.name} value={u.name} className="bg-[#0A0F1A]">{u.name}</option>
                  ))
                ) : (
                  <option value="" disabled className="bg-[#0A0F1A]">No Universes Loaded</option>
                )}
              </select>
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Primary Role Class</span>
            <div className="relative">
              <select 
                name="hero_type" 
                value={formData.hero_type || ''} 
                onChange={handleChange} 
                className="w-full bg-black/40 border border-white/10 p-4 text-sm text-white rounded-lg focus:border-white/40 outline-none appearance-none cursor-pointer font-mono tracking-widest uppercase"
                style={{ backgroundImage: `linear-gradient(45deg, transparent 50%, ${accentColor} 50%), linear-gradient(135deg, ${accentColor} 50%, transparent 50%)`, backgroundPosition: 'calc(100% - 20px) 22px, calc(100% - 15px) 22px', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
              >
                {Array.isArray(roles) && roles.length > 0 ? (
                  roles.map(r => (
                    <option key={r} value={r} className="bg-[#0A0F1A]">{r}</option>
                  ))
                ) : (
                  <option value="" disabled className="bg-[#0A0F1A]">No Roles Loaded</option>
                )}
              </select>
            </div>
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Universal Asset Access</span>
            <div className="flex gap-2 items-center">
              <input 
                name="image_url" 
                value={formData.image_url || ''} 
                onChange={handleChange} 
                placeholder="HTTPS://..."
                className="flex-1 bg-black/40 border border-white/10 p-4 text-sm text-white rounded-lg focus:border-white/40 outline-none transition-all placeholder:text-white/10 font-mono tracking-widest"
              />
              <label className="bg-white/5 border border-white/10 text-white/70 text-[10px] px-6 py-4 rounded-lg cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap uppercase tracking-widest font-mono">
                UPLOAD
                <input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Mission Profile</span>
            <textarea 
              name="description" 
              value={formData.description || ''} 
              onChange={handleChange} 
              rows={3}
              placeholder="CHARACTER INTEL..."
              className="bg-black/40 border border-white/10 p-4 text-sm text-white rounded-lg focus:border-white/40 outline-none transition-all placeholder:text-white/10 font-sans leading-relaxed resize-none"
            />
          </label>

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Combat Ability Vectors</span>
              <div className="h-px flex-1 bg-white/5 mx-4" />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Health', name: 'health' },
                { label: 'Speed', name: 'speed' },
                { label: 'Strength', name: 'strength' },
              ].map((stat) => (
                <div key={stat.name} className="flex flex-col gap-2">
                  <span className="text-[9px] uppercase tracking-widest text-white/60 font-mono ml-1">{stat.label}</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    name={stat.name} 
                    value={formData[stat.name as keyof typeof formData] || 0} 
                    onChange={handleChange}
                    className="bg-black/40 border border-white/10 p-3 text-sm text-white rounded-lg focus:border-white/40 outline-none transition-all font-mono tracking-widest"
                    style={{ focusBorderColor: accentColor }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <BadgeInput 
              label="Combat Powers & resonance" 
              placeholder="INITIALIZE PARAMETERS..."
              value={formData.powers || []} 
              onChange={handlePowersChange}
              suggestions={powers}
              onOpenCustomTag={onOpenCustomTag}
              isAdmin={true} // Modal only accessible to admins anyway
              openUpward={true}
            />
          </div>

          <div className="md:col-span-2 flex gap-4 pt-6 border-t border-white/10">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-black text-white/30 hover:text-white border border-white/5 rounded-xl transition-all hover:bg-white/5 font-mono"
            >
              Abort
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[1.5] relative group overflow-hidden text-white px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-black rounded-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] disabled:opacity-30 font-mono shadow-2xl"
              style={{ backgroundColor: accentColor }}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10">{loading ? 'Processing Data...' : (hero ? 'Execute Modification' : 'finalize Registration')}</span>
            </button>
          </div>
        </form>

        {/* High-tech decorative elements */}
        <div className="absolute top-4 left-4 text-[8px] font-mono text-white/10 tracking-[0.5em] uppercase pointer-events-none">
          X-PROTOCOL://{hero ? 'UPDATE' : 'CREATE'}_SECURE_ASSET
        </div>
      </motion.div>
    </div>
  );
}

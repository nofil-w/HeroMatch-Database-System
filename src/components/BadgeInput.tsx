import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, Target, ChevronDown, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CategorizedSuggestions {
  [category: string]: string[];
}

interface BadgeInputProps {
  label?: string;
  placeholder?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  categorizedSuggestions?: CategorizedSuggestions;
  suggestions?: string[]; // Legacy support
  allowCustom?: boolean;
  onOpenCustomTag?: () => void;
  isAdmin?: boolean;
  openUpward?: boolean;
}

export function BadgeInput({ 
  label, 
  placeholder = 'Search or add...', 
  value, 
  onChange, 
  categorizedSuggestions = {}, 
  suggestions = [], 
  allowCustom = true,
  onOpenCustomTag,
  isAdmin = false,
  openUpward = false
}: BadgeInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Flatten suggestions for search or use Categorized ones
  const categories = Object.keys(categorizedSuggestions);
  
  const getFilteredSuggestions = () => {
    if (categories.length > 0) {
      const filtered: CategorizedSuggestions = {};
      categories.forEach(cat => {
        const matches = categorizedSuggestions[cat].filter(
          s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
        );
        if (matches.length > 0) filtered[cat] = matches;
      });
      return filtered;
    }
    // Fallback to flat list
    return suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s));
  };

  const currentSuggestions = getFilteredSuggestions();
  const hasSuggestions = Array.isArray(currentSuggestions) ? currentSuggestions.length > 0 : Object.keys(currentSuggestions).length > 0;

  const handleAddTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() && allowCustom) {
        handleAddTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      handleRemoveTag(value[value.length - 1]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1 w-full" ref={wrapperRef}>
      {label && <label className="text-[10px] text-blue-400/70 uppercase tracking-widest font-bold mb-1 ml-1">{label}</label>}
      <div 
        className={`flex flex-wrap items-center gap-2 p-2 min-h-[44px] bg-[#0A0F1A]/80 backdrop-blur-md border border-blue-900/30 rounded-lg transition-all duration-300 ${
          isFocused ? 'border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-[#0C1220]' : 'hover:border-blue-500/30'
        }`}
        onClick={() => setIsFocused(true)}
      >
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <Target className="w-4 h-4 text-blue-500/40 ml-1 shrink-0" />
          <div className="flex flex-wrap gap-2 items-center flex-grow">
            {value.map(tag => (
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                key={tag} 
                className="flex items-center gap-1.5 bg-blue-900/30 border border-blue-500/20 text-blue-300 px-2.5 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest font-mono shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
              >
                {tag}
                <X className="w-3 h-3 cursor-pointer hover:text-white transition-colors" onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }} />
              </motion.span>
            ))}
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-blue-100 placeholder:text-blue-500/20 outline-none font-mono tracking-widest uppercase"
            />
          </div>
          <ChevronDown className={`w-4 h-4 text-blue-500/30 mr-1 transition-transform ${isFocused ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isFocused && (inputValue || hasSuggestions || (onOpenCustomTag && isAdmin)) && (
          <motion.div 
            initial={{ opacity: 0, y: openUpward ? -5 : 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: openUpward ? -5 : 5 }}
            className="relative z-50 w-full"
          >
            <div className={cn(
              "absolute left-0 w-full bg-[#0A1220]/95 border border-blue-500/30 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-72 overflow-y-auto backdrop-blur-xl p-1 scrollbar-thin scrollbar-thumb-blue-900",
              openUpward ? "bottom-full mb-2" : "top-2"
            )}>
              
              {/* Manage Tags Option – NOW AT TOP */}
              {onOpenCustomTag && isAdmin && (
                <div className="p-1 border-b border-blue-500/10 mb-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenCustomTag(); setIsFocused(false); }}
                    className="w-full flex items-center gap-3 px-3 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-100 rounded-md transition-all group border border-blue-500/10 font-mono text-[10px] uppercase tracking-widest font-black"
                  >
                    <Edit2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                    Manage Parameters
                  </button>
                </div>
              )}

              {/* Categorized Suggestions */}
              {!Array.isArray(currentSuggestions) ? (
                Object.keys(currentSuggestions).map(category => (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.3em] text-blue-500/60 bg-blue-500/5 rounded-sm mb-1 ml-1 mt-1">
                      {category}
                    </div>
                    {currentSuggestions[category].map(tag => (
                      <div 
                        key={tag}
                        className="px-4 py-2 text-[11px] text-blue-200/80 hover:bg-blue-600/20 hover:text-white cursor-pointer flex items-center justify-between transition-all group font-mono uppercase tracking-widest border-l-2 border-transparent hover:border-blue-400"
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                // Flat Suggestions Fallback
                currentSuggestions.map(tag => (
                  <div 
                    key={tag}
                    className="px-4 py-2 text-[11px] text-blue-200/80 hover:bg-blue-600/20 hover:text-white cursor-pointer flex items-center justify-between transition-all group font-mono uppercase tracking-widest border-l-2 border-transparent hover:border-blue-400"
                    onClick={() => handleAddTag(tag)}
                  >
                    {tag}
                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              )}

              {allowCustom && inputValue.trim() && !hasSuggestions && (
                <div 
                  className="px-4 py-3 text-[11px] text-blue-400 hover:bg-blue-600/20 cursor-pointer flex items-center gap-3 transition-all border-l-2 border-blue-400"
                  onClick={() => handleAddTag(inputValue.trim())}
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-mono uppercase tracking-widest">Register "{inputValue.trim()}"</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


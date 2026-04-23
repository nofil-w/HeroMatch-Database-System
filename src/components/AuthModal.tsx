import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { submitLogin, submitRegister } from '../api';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin 
        ? await submitLogin({ username, password })
        : await submitRegister({ username, password });
      
      localStorage.setItem('token', data.token);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-white/10 rounded-lg p-6 w-full max-w-sm"
      >
        <h2 className="text-xl font-serif italic text-white mb-4">
          {isLogin ? 'Access Terminal' : 'Create Credentials'}
        </h2>
        
        {error && <div className="text-red-400 text-xs uppercase mb-4 bg-red-400/10 p-2 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="bg-white/5 border border-white/10 p-2 text-sm text-white rounded focus:border-white/40 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-white/5 border border-white/10 p-2 text-sm text-white rounded focus:border-white/40 outline-none"
            required
          />
          
          <div className="flex justify-between items-center mt-2">
            <button type="button" onClick={toggleMode} className="text-[10px] text-white/40 uppercase hover:text-white">
              {isLogin ? 'Need an account?' : 'Already have access?'}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="text-[10px] text-white/50 uppercase px-3 py-1 hover:text-white">Cancel</button>
              <button type="submit" disabled={loading} className="bg-white text-black px-4 py-1.5 text-[10px] uppercase font-bold rounded hover:bg-white/80 disabled:opacity-50">
                {loading ? 'WAIT...' : isLogin ? 'LOGIN' : 'REGISTER'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

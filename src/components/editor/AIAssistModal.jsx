import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

export default function AIAssistModal({ 
  target, 
  userInstruction, 
  setUserInstruction, 
  onClose, 
  onConfirm, 
  loading 
}) {
  if (!target) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 m-2"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <Sparkles size={18} sm:size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 italic truncate">Arquitecto IA</h4>
                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{target.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full transition-all shrink-0">
              <X size={18} sm:size={20}/>
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Instrucciones</label>
              <textarea 
                autoFocus
                value={userInstruction}
                onChange={e => setUserInstruction(e.target.value)}
                placeholder='Ej: "Hazlo más sarcástico y directo"...'
                className="w-full h-32 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={onConfirm} disabled={loading} className="flex-1 btn-primary py-4 gap-2 text-white">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={16} />}
                {loading ? 'Procesando...' : 'Empoderar con IA'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

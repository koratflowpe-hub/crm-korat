import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Briefcase, Check, ChevronDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ConfirmModal from './ConfirmModal';

export default function BrandSwitcher({ currentBrand, onBrandChange, brands, onBrandCreated, onBrandDeleted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [brandToDelete, setBrandToDelete] = useState(null);

  const handleCreate = async () => {
    if (!newBrandName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('brands')
      .insert([{ name: newBrandName.trim(), user_id: user.id }])
      .select()
      .single();
    
    if (!error) {
      onBrandCreated(data);
      setNewBrandName('');
      setIsCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;
    const { error } = await supabase.from('brands').delete().eq('id', brandToDelete);
    if (!error) {
      onBrandDeleted(brandToDelete);
      setBrandToDelete(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-6 py-3.5 bg-card border border-border shadow-sm rounded-2xl hover:border-primary/50 transition-all group active:scale-95"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
           <Briefcase size={16} className="text-primary" />
        </div>
        <div className="flex flex-col items-start px-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-1.5 opacity-60">Brand</span>
            <span className="text-sm font-bold text-foreground leading-none">
              {currentBrand?.name || 'Seleccionar Marca'}
            </span>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[110] bg-slate-900/20 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
            <div className="fixed inset-0 z-10 hidden md:block" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed bottom-0 left-0 right-0 md:absolute md:top-full md:bottom-auto md:right-0 mb-0 md:mt-3 w-full md:w-80 bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] md:shadow-2xl rounded-t-[40px] md:rounded-3xl z-[120] md:z-20 overflow-hidden"
            >
              <div className="md:hidden w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-4 mb-2" />
              <div className="p-6 md:p-4 space-y-4">
                <div className="px-2 text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">Gestionar Cuentas</div>
                <div className="max-h-[40vh] md:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      onClick={() => { onBrandChange(brand); setIsOpen(false); }}
                      className={`group flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all ${currentBrand?.id === brand.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">{brand.name}</span>
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setBrandToDelete(brand.id); }}
                            className={`p-2.5 rounded-xl transition-all ${currentBrand?.id === brand.id ? 'bg-white/20 hover:bg-white/30 text-white' : 'opacity-0 group-hover:opacity-100 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white shadow-sm'}`}
                          >
                            <Trash2 size={12} />
                          </button>
                          {currentBrand?.id === brand.id && <Check size={14} className="text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 md:p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                {isCreating ? (
                  <div className="space-y-4">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Nombre de la marca..."
                      className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <div className="flex gap-3">
                      <button onClick={handleCreate} className="flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Registrar Nueva</button>
                      <button onClick={() => setIsCreating(false)} className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white">Cerrar</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-primary hover:bg-primary/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 border-dashed mb-4 md:mb-0"
                  >
                    <Plus size={14} /> Crear Nueva Marca
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={brandToDelete !== null}
        title="¿Eliminar Marca?"
        message="Se perderán todos los guiones asociados a esta cuenta. Esta acción es irreversible."
        onConfirm={confirmDelete}
        onCancel={() => setBrandToDelete(null)}
        confirmText="Sí, Eliminar"
      />
    </div>
  );
}

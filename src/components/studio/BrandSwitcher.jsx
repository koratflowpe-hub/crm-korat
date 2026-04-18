import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Search, Plus, Trash2, Globe, Check 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const BrandSwitcher = ({ brands, currentBrand, onBrandChange, onBrandCreated, onBrandDeleted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newBrandName.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('brands')
      .insert([{ name: newBrandName.trim(), user_id: user.id }])
      .select()
      .single();
    
    if (!error && data) {
      onBrandCreated(data);
      setNewBrandName('');
      setShowAdd(false);
    }
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta marca y todo su contenido asociado?')) return;
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (!error) onBrandDeleted(id);
  };

  return (
    <div className="cs-brand-switcher relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <Globe size={18} className="text-indigo-500" />
        <span className="font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
          {currentBrand?.name || 'Seleccionar Marca'}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
            >
              <div className="p-2 max-h-64 overflow-y-auto">
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => { onBrandChange(brand); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      currentBrand?.id === brand.id 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-semibold truncate">{brand.name}</span>
                    <div className="flex items-center gap-2">
                      {currentBrand?.id === brand.id && <Check size={16} />}
                      <div 
                        onClick={(e) => handleDelete(e, brand.id)}
                        className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                {showAdd ? (
                  <div className="space-y-2 p-1">
                    <input 
                      autoFocus
                      type="text" 
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Nombre de la marca..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowAdd(false)}
                        className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleAdd}
                        disabled={loading}
                        className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? '...' : 'Crear'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAdd(true)}
                    className="w-full flex items-center justify-center gap-2 p-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                  >
                    <Plus size={16} />
                    Nueva Marca
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

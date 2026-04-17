import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, Plus, Trash2, Layers, Search, 
  Sparkles, Hash, Edit3, Check, Tag,
  ChevronRight, Filter, SortAsc, Zap,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

export default function HooksManager({ onClose }) {
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hookToDelete, setHookToDelete] = useState(null);
  
  const [form, setForm] = useState({ title: '', content: '', category: '' });

  useEffect(() => {
    fetchHooks();
  }, []);

  const fetchHooks = async () => {
    setLoading(true);
    const { data } = await supabase.from('hooks_library').select('*').order('created_at', { ascending: false });
    if (data) setHooks(data);
    setLoading(false);
  };

  const startEdit = (hook) => {
    setForm({ title: hook.title, content: hook.content, category: hook.category || '' });
    setEditingId(hook.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setForm({ title: '', content: '', category: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload = { 
      title: form.title, 
      content: form.content, 
      category: form.category.trim() || null,
      user_id: user.id 
    };

    let res;
    if (editingId) {
      res = await supabase.from('hooks_library').update(payload).eq('id', editingId).select().single();
    } else {
      res = await supabase.from('hooks_library').insert([payload]).select().single();
    }
    
    if (!res.error) {
      if (editingId) {
        setHooks(prev => prev.map(h => h.id === editingId ? res.data : h));
      } else {
        setHooks(prev => [res.data, ...prev]);
      }
      handleCancel();
    }
  };

  const confirmDelete = async () => {
    if(!hookToDelete) return;
    const { error } = await supabase.from('hooks_library').delete().eq('id', hookToDelete);
    if (!error) setHooks(prev => prev.filter(h => h.id !== hookToDelete));
    setHookToDelete(null);
  };

  const filteredHooks = hooks.filter(h => 
    h.title.toLowerCase().includes(search.toLowerCase()) || 
    h.content.toLowerCase().includes(search.toLowerCase()) ||
    (h.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(hooks.map(h => h.category).filter(Boolean))];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/40 backdrop-blur-2xl" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="modal-content w-full max-w-5xl h-[95vh] sm:h-[88vh] flex flex-col relative overflow-hidden border border-border/50 shadow-[0_0_100px_rgba(0,0,0,0.4)]"
      >
        {/* Luxury Header */}
        <div className="px-5 sm:px-10 py-5 sm:py-8 border-b border-border bg-muted/20 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4 sm:gap-6">
             <div className="w-11 h-11 sm:w-16 sm:h-16 bg-primary/10 text-primary rounded-xl sm:rounded-[24px] flex items-center justify-center shadow-inner border border-primary/5 shrink-0">
               <Layers size={20} sm:size={32} strokeWidth={2.5} />
             </div>
             <div className="space-y-0.5 sm:space-y-1">
               <h2 className="text-lg sm:text-3xl font-black text-foreground uppercase tracking-tight truncate">Ganchos</h2>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(66,133,244,0.5)]" />
                  <p className="text-[7px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2rem] sm:tracking-[0.3em] truncate">Arsenal Estratégico</p>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
              className={`p-3 sm:px-8 sm:py-3.5 rounded-full font-black uppercase tracking-widest text-[11px] flex items-center gap-2 sm:gap-3 transition-all ${
                isAdding 
                ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                : 'btn-ai shadow-lg shadow-primary/20 text-white'
              }`}
            >
              {isAdding ? <><X size={16} sm:size={18} /> <span className="hidden sm:inline">Cancelar</span></> : <><Plus size={16} sm:size={18} strokeWidth={3} /> <span className="hidden sm:inline">Nuevo Gancho</span></>}
            </button>
            <button onClick={onClose} className="p-2 sm:p-4 bg-muted hover:bg-muted-foreground/10 text-muted-foreground rounded-full transition-all">
              <X size={18} sm:size={24} />
            </button>
          </div>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="px-5 sm:px-10 py-4 sm:py-6 bg-background/50 border-b border-border flex flex-col md:flex-row gap-4 sm:gap-6 items-center">
           <div className="relative flex-1 group w-full">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Filtrar ganchos..." 
               value={search} 
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-card border border-border rounded-xl sm:rounded-[24px] pl-14 pr-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-sm"
             />
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-full border border-border whitespace-nowrap">
                 <Filter size={12} className="text-muted-foreground" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Etiquetas:</span>
              </div>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSearch(cat)}
                  className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    search === cat 
                      ? 'bg-primary text-white border-primary shadow-lg' 
                      : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>

        {/* Main Content Viewport */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-10 custom-scrollbar bg-slate-50/10 dark:bg-black/20">
           <AnimatePresence mode="wait">
             {isAdding ? (
               <motion.div 
                 key="add-form"
                 initial={{ opacity: 0, scale: 0.98, y: 20 }} 
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.98, y: -20 }}
                 className="max-w-4xl mx-auto"
               >
                 <div className="bg-card border border-border p-6 sm:p-12 rounded-[24px] sm:rounded-[50px] shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                   
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                        {editingId ? <Edit3 size={24}/> : <Plus size={24} strokeWidth={3}/>}
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">
                        {editingId ? 'Refinar Gancho Maestro' : 'Ingeniería de Nuevo Gancho'}
                      </h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                     <div className="space-y-3">
                       <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Título Operativo</label>
                       <input 
                         type="text" 
                         placeholder="Ej: Curiosidad Nivel Extremo" 
                         value={form.title} 
                         onChange={e => setForm({...form, title: e.target.value})}
                         className="premium-input w-full px-8 py-5 text-sm"
                       />
                     </div>
                     <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Categoría Psicológica</label>
                        <div className="relative group/tag">
                          <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/tag:text-primary transition-colors" size={18} />
                          <input 
                            type="text" 
                            placeholder="Ej: Polémica, Tutorial, Shock..." 
                            value={form.category} 
                            onChange={e => setForm({...form, category: e.target.value})}
                            className="premium-input w-full pl-16 pr-8 py-5 text-sm"
                          />
                        </div>
                     </div>
                   </div>
                   
                   <div className="mb-10 space-y-3">
                     <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Copy del Gancho (3 Segundos de Impacto)</label>
                     <textarea 
                       placeholder="Escribe el texto que detendrá el scroll instantáneamente..." 
                       value={form.content} 
                       onChange={e => setForm({...form, content: e.target.value})}
                       className="w-full h-44 bg-background border border-border rounded-[40px] p-10 text-lg font-bold text-foreground focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all resize-none shadow-inner"
                     />
                   </div>

                   <div className="flex justify-end items-center gap-6 pt-6 border-t border-border">
                      <button 
                        onClick={handleCancel} 
                        className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Descartar Operación
                      </button>
                      <button 
                        onClick={handleSave}
                        className="btn-ai px-12 py-4 rounded-full shadow-2xl shadow-primary/30 active:scale-95 text-xs font-black uppercase tracking-[0.2em]"
                      >
                        <Check size={18} strokeWidth={3} /> {editingId ? 'Evolucionar Gancho' : 'Asegurar en Vault'}
                      </button>
                   </div>
                 </div>
               </motion.div>
             ) : (
               <motion.div 
                 key="hooks-grid"
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
                 className="grid grid-cols-1 md:grid-cols-2 gap-8"
               >
                 {filteredHooks.map((hook, idx) => (
                   <motion.div 
                     key={hook.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     className="group bg-card border border-border p-10 rounded-[50px] hover:border-primary/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all relative overflow-hidden flex flex-col justify-between min-h-[300px]"
                   >
                     {/* Floating Actions */}
                     <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                        <button 
                          onClick={() => startEdit(hook)}
                          className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => setHookToDelete(hook.id)}
                          className="w-12 h-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center hover:bg-destructive hover:text-white transition-all shadow-xl"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>

                     <div>
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-10 h-10 rounded-[14px] bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                             <Sparkles size={18} />
                           </div>
                           <div className="space-y-1">
                             <h4 className="text-sm font-black text-foreground uppercase tracking-tight">{hook.title}</h4>
                             {hook.category && (
                               <span className="inline-block text-[8px] font-black uppercase tracking-[0.2em] text-primary/60">
                                 {hook.category}
                               </span>
                             )}
                           </div>
                        </div>

                        <p className="text-xl font-bold text-foreground leading-[1.6] italic pr-12 group-hover:text-primary transition-colors">
                          “{hook.content}”
                        </p>
                     </div>

                     <div className="mt-10 pt-8 border-t border-border flex justify-between items-center text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
                       <div className="flex items-center gap-2">
                         <FolderOpen size={12} />
                         <span>Suministros Elite</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Hash size={12} />
                          <span>{hook.id.slice(0, 8)}</span>
                       </div>
                     </div>
                   </motion.div>
                 ))}

                 {filteredHooks.length === 0 && !loading && (
                   <div className="col-span-full py-32 text-center bg-muted/10 rounded-[60px] border-2 border-dashed border-border flex flex-col items-center justify-center">
                     <div className="w-24 h-24 bg-card border border-border rounded-[40px] flex items-center justify-center mb-8 text-muted-foreground/30 shadow-inner">
                        <Layers size={48} strokeWidth={1} />
                     </div>
                     <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Vault Vacío o Filtrado</h3>
                     <p className="text-sm font-medium text-muted-foreground max-w-sm mb-12">No hay ganchos que coincidan con tu búsqueda actual en la base de datos.</p>
                     <button 
                       onClick={() => { setIsAdding(true); setSearch(''); }}
                       className="btn-pill px-10 py-4 bg-foreground text-background text-[11px] font-black uppercase tracking-widest hover:scale-110 transition-all shadow-2xl"
                     >
                       Inyectar Primer Gancho
                     </button>
                   </div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Global Protection Bar */}
        <div className="px-5 sm:px-10 py-4 sm:py-5 bg-background border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-muted-foreground/30">
           <span className="text-center">Cifrado de Alta Calidad • Flow Protection</span>
           <span className="flex items-center gap-2">
             Sistema Estable <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
           </span>
        </div>
      </motion.div>

      <ConfirmModal 
        isOpen={hookToDelete !== null}
        title="¿Ejecutar Purga de Hook?"
        message="Esta pieza de contenido será eliminada de forma permanente del arsenal compartido."
        onConfirm={confirmDelete}
        onCancel={() => setHookToDelete(null)}
      />
    </div>
  );
}

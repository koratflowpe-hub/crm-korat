import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, Plus, Trash2, Megaphone, Search, 
  Zap, Hash, Edit3, Check, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

export default function CtasManager({ onClose }) {
  const [ctas, setCtas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [ctaToDelete, setCtaToDelete] = useState(null);
  
  const [form, setForm] = useState({ title: '', content: '', category: '' });

  useEffect(() => {
    fetchCtas();
  }, []);

  const fetchCtas = async () => {
    setLoading(true);
    const { data } = await supabase.from('ctas_library').select('*').order('created_at', { ascending: false });
    if (data) setCtas(data);
    setLoading(false);
  };

  const startEdit = (cta) => {
    setForm({ title: cta.title, content: cta.content, category: cta.category || '' });
    setEditingId(cta.id);
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
      res = await supabase.from('ctas_library').update(payload).eq('id', editingId).select().single();
    } else {
      res = await supabase.from('ctas_library').insert([payload]).select().single();
    }
    
    if (!res.error) {
      if (editingId) {
        setCtas(prev => prev.map(c => c.id === editingId ? res.data : c));
      } else {
        setCtas(prev => [res.data, ...prev]);
      }
      handleCancel();
    }
  };

  const confirmDelete = async () => {
    if(!ctaToDelete) return;
    const { error } = await supabase.from('ctas_library').delete().eq('id', ctaToDelete);
    if (!error) setCtas(prev => prev.filter(c => c.id !== ctaToDelete));
    setCtaToDelete(null);
  };

  const filteredCtas = ctas.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.content.toLowerCase().includes(search.toLowerCase()) ||
    (c.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(ctas.map(c => c.category).filter(Boolean))];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-neutral-950/98" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        onClick={e => e.stopPropagation()}
        className="bg-card w-full max-w-4xl h-[85vh] rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
               <Megaphone size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Biblioteca de Cierres (CTA)</h2>
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 italic">Tus llamadas a la acción que convierten</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="px-8 py-6 bg-slate-50/50 dark:bg-white/[0.02] border-b border-border/50 flex gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" placeholder="Buscar cierres o categorías..." 
               value={search} onChange={e => setSearch(e.target.value)}
               className="w-full bg-background border border-input rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none font-bold text-foreground"
             />
           </div>
           <button 
             onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
             className={`px-6 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${isAdding ? 'bg-primary/10 text-primary' : 'btn-gradient-primary hover:opacity-90'}`}
           >
             {isAdding ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo Cierre</>}
           </button>
        </div>

        {/* Categories Chips */}
        {categories.length > 0 && !isAdding && (
          <div className="px-8 py-3 bg-slate-50 dark:bg-black/10 border-b border-border flex gap-2 overflow-x-auto no-scrollbar">
             {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setSearch(cat)}
                 className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/20 whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-all"
               >
                 {cat}
               </button>
             ))}
             {search && (
               <button onClick={() => setSearch('')} className="px-3 py-1 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:underline">Limpiar</button>
             )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {isAdding && (
             <motion.div 
               initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
               className="mb-10 bg-slate-50 dark:bg-[#121212] p-8 rounded-[30px] border border-border shadow-sm relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-primary">
                  <Plus size={120} />
                </div>
               <h3 className="text-sm font-black uppercase text-primary mb-6 flex items-center gap-2 relative z-10">
                 {editingId ? <Edit3 size={16}/> : <Plus size={16}/>}
                 {editingId ? 'Editar Cierre Existente' : 'Crear Nuevo Cierre Viral'}
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-10">
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Título del CTA</label>
                   <input 
                     type="text" placeholder="Ej: Invitación a WhatsApp" 
                     value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                     className="w-full bg-background border border-input rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary text-foreground"
                   />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Categoría</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" placeholder="Ej: Venta, Registro, Feedback..." 
                        value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                        className="w-full bg-background border border-input rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                    </div>
                 </div>
               </div>
               
               <div className="mb-6 relative z-10">
                 <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 font-black">Texto del Cierre</label>
                 <textarea 
                   placeholder="Escribe aquí el guion del cierre..." 
                   value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                   className="w-full h-32 bg-background border border-input rounded-3xl p-6 text-sm outline-none focus:ring-2 focus:ring-primary resize-none font-bold text-foreground"
                 />
               </div>

               <div className="flex justify-end gap-3 relative z-10">
                  <button onClick={handleCancel} className="px-6 py-3 font-black uppercase text-xs text-muted-foreground hover:text-foreground transition-all">Descartar</button>
                  <button 
                    onClick={handleSave}
                    className="px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 transition-all btn-gradient-primary"
                  >
                    <Check size={16} /> {editingId ? 'Guardar Cambios' : 'Guardar Cierre'}
                  </button>
               </div>
             </motion.div>
           )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCtas.map(cta => (
                <div 
                  key={cta.id}
                  className="group bg-card border border-border/50 p-7 rounded-[2.5rem] hover:shadow-2xl transition-all relative overflow-hidden hover:border-primary/30 active:scale-[0.98]"
                >
                  <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all flex gap-2 z-10">
                     <button 
                       onClick={() => startEdit(cta)}
                       className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                     >
                       <Edit3 size={16} />
                     </button>
                     <button 
                       onClick={() => setCtaToDelete(cta.id)}
                       className="p-3 bg-destructive/10 text-destructive rounded-2xl hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>

                  <div className="flex items-center gap-4 mb-5">
                     <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                       <Zap size={16} fill="currentColor" />
                     </div>
                     <div>
                       <h4 className="font-black text-foreground uppercase tracking-tight leading-none text-lg">{cta.title}</h4>
                       {cta.category && (
                         <span className="inline-block mt-2 text-[8px] font-black uppercase tracking-widest text-primary px-2.5 py-1 bg-primary/5 rounded-lg border border-primary/10">
                           {cta.category}
                         </span>
                       )}
                     </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#1C1C1C] p-4 rounded-2xl border border-border">
                    <p className="text-sm font-bold text-muted-foreground leading-relaxed italic pr-4">
                      "{cta.content}"
                    </p>
                  </div>
                </div>
              ))}

              {filteredCtas.length === 0 && !loading && (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-6 text-slate-300 border border-border">
                     <Megaphone size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-400">No hay cierres aún</h3>
                  <p className="text-sm font-bold text-slate-500 mt-2">Empieza a construir tu arsenal de CTAs ganadores.</p>
                </div>
              )}
            </div>
        </div>
      </motion.div>

      <ConfirmModal 
        isOpen={ctaToDelete !== null}
        title="¿Eliminar Cierre?"
        message="Esta acción no se puede deshacer. ¿Deseas continuar?"
        onConfirm={confirmDelete}
        onCancel={() => setCtaToDelete(null)}
      />
    </div>
  );
}

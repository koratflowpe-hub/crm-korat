import { Play, Zap, Info, Mic, Sparkles, RefreshCw, Share2, MessageSquare, Plus, Trash2, Link as LinkIcon, Check, LayoutGrid } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '../icons/SocialIcons';

// ─── TAB: PRODUCCIÓN (PLAN TÉCNICO) ───────────────────────────────────────────
export const ProductionTab = ({ form, setForm, openAIPrompt }) => (
  <div className="max-w-5xl mx-auto space-y-10">
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 shadow-sm">
      <div className="bg-primary/10 text-primary p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
        <Info size={24} />
      </div>
      <div className="text-center sm:text-left">
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Desglose Técnico</h4>
        <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-relaxed max-w-2xl">
          Define la estética visual, los planos y la iluminación para garantizar un video de alta calidad.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <Play size={16} className="text-amber-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coreografía Visual</h3>
          </div>
          <button 
            onClick={() => openAIPrompt('shot_list', 'Planos y Escenas')}
            className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles size={12} /> Sugerir IA
          </button>
        </div>
        <textarea
          placeholder="Ej: Close-up al producto con bokeh suave..."
          className="w-full h-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none shadow-sm"
          value={form.shot_list}
          onChange={e => setForm({...form, shot_list: e.target.value})}
        />
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <Zap size={16} className="text-blue-500" />
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Atmosfera y Luz</h3>
          </div>
          <button 
            onClick={() => openAIPrompt('lighting_setup', 'Esquema de Luz')}
            className="text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles size={12} /> Sugerir IA
          </button>
        </div>
        <textarea
          placeholder="Ej: Key Light a 45 grados, Rim light morado..."
          className="w-full h-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none shadow-sm"
          value={form.lighting_setup}
          onChange={e => setForm({...form, lighting_setup: e.target.value})}
        />
      </motion.section>
    </div>

    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Mic size={18} className="text-slate-400" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Especificaciones de Cámara</h3>
      </div>
      <input
        type="text"
        placeholder="Ej: Sony A7IV • 4K 60fps • Lente 35mm f1.8..."
        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
        value={form.camera_setup}
        onChange={e => setForm({...form, camera_setup: e.target.value})}
      />
    </section>
  </div>
);

// ─── TAB: MARKETING (HOOK TESTING) ───────────────────────────────────────────
export const MarketingTab = ({ form, setForm, openAIPrompt }) => (
  <div className="max-w-5xl mx-auto space-y-10">
    <div className="bg-rose-500/5 border border-rose-200 dark:border-rose-900/40 p-5 sm:p-10 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Zap size={20} sm:size={22} fill="currentColor" />
        </div>
        <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Caja de Ganchos Virales</h4>
          <p className="text-[8px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-widest">Pruebas de Retención A/B/C</p>
        </div>
      </div>
      <button 
        onClick={() => openAIPrompt('hook_variations', 'Pruebas de Retención')}
        className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
      >
        <RefreshCw size={14} /> Re-Generar con IA
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {form.hook_variations.length > 0 ? form.hook_variations.map((v, i) => (
        <motion.div 
          key={i} 
          whileHover={{ y: -4 }}
          className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer group relative flex flex-col justify-between h-auto min-h-[260px] ${
            v.selected 
              ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-300 dark:border-rose-900/60 shadow-lg' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300 shadow-sm'
          }`}
          onClick={() => {
            const newVars = form.hook_variations.map((h, idx) => ({ ...h, selected: idx === i }));
            setForm({ ...form, hook_variations: newVars });
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black ${v.selected ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {i + 1}
              </div>
              {v.selected && <Check size={16} className="text-rose-500" />}
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-100 leading-relaxed italic">"{v.content}"</p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Técnica de Retención</span>
          </div>
        </motion.div>
      )) : (
        <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] flex flex-col items-center">
          <Zap size={40} className="text-slate-300 mb-4 opacity-30" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin variaciones disponibles</p>
        </div>
      )}
    </div>
  </div>
);

// ─── TAB: DISTRIBUCIÓN (PLATAFORMAS) ──────────────────────────────────────────
export const DistributionTab = ({ form, setForm, openAIPrompt }) => {
  const platforms = [
    { id: 'reel', name: 'Instagram Reel', icon: <InstagramIcon size={18} />, color: 'text-pink-500' },
    { id: 'tiktok', name: 'TikTok Video', icon: <MessageSquare size={18} />, color: 'text-cyan-500' },
    { id: 'shorts', name: 'YouTube Shorts', icon: <Play size={18} />, color: 'text-red-500' },
    { id: 'fb', name: 'Facebook Watch', icon: <FacebookIcon size={18} />, color: 'text-blue-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest mb-8 text-slate-400 flex items-center gap-3">
          <Share2 size={16} /> Ecosistema de Publicación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => {
                const newList = form.platforms.includes(p.id) 
                  ? form.platforms.filter(x => x !== p.id)
                  : [...form.platforms, p.id];
                setForm({ ...form, platforms: newList });
              }}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${
                form.platforms.includes(p.id) 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xl' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/40'
              }`}
            >
              <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 ${form.platforms.includes(p.id) ? 'dark:bg-slate-100' : ''}`}>
                {React.cloneElement(p.icon, { className: form.platforms.includes(p.id) ? 'text-slate-900' : p.color })}
              </div>
              <span className="text-sm font-bold tracking-tight">{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Copy de Descripción</h3>
           <button onClick={() => openAIPrompt('video_copy', 'Copywriting Viral')} className="btn-ai px-4 py-2 text-[10px] gap-2">
             <Sparkles size={14} /> Redactar con IA
           </button>
        </div>
        <textarea
          placeholder="Escribe el copy optimizado para SEO..."
          className="w-full h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none shadow-sm"
          value={form.video_copy}
          onChange={e => setForm({...form, video_copy: e.target.value})}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
           <LayoutGrid size={16} className="text-slate-400" />
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hashtags Estratégicos</h3>
        </div>
        <input
          type="text"
          placeholder="Ej: #marketing #ia #creadores..."
          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 transition-all"
          value={form.hashtags}
          onChange={e => setForm({...form, hashtags: e.target.value})}
        />
      </section>
    </div>
  );
};

// ─── TAB: REFERENCIAS ────────────────────────────────────────────────────────
export const ReferencesTab = ({ form, setForm }) => {
  const addReference = () => setForm(f => ({ ...f, reference_links: [...f.reference_links, ''] }));
  const updateReference = (i, val) => {
    const list = [...form.reference_links];
    list[i] = val;
    setForm({ ...form, reference_links: list });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
          <LinkIcon size={16} /> Fuentes de Inspiración
        </h3>
        <button onClick={addReference} className="p-2.5 bg-primary text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-primary/20">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {form.reference_links.map((link, i) => (
          <div key={i} className="flex gap-3 items-center group">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4">
               <LinkIcon size={16} className="text-slate-300" />
               <input
                 type="text"
                 value={link}
                 onChange={e => updateReference(i, e.target.value)}
                 placeholder="https://..."
                 className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0"
               />
               {link && (
                 <a href={link} target="_blank" rel="noopener noreferrer" className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all">
                   <Share2 size={16} />
                 </a>
               )}
            </div>
            <button 
              onClick={() => {
                const newList = form.reference_links.filter((_, idx) => idx !== i);
                setForm({ ...form, reference_links: newList });
              }}
              className="p-3 text-slate-400 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {form.reference_links.length === 0 && (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
             <LinkIcon size={40} className="text-slate-300 mx-auto mb-4 opacity-30" />
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No hay referencias guardadas</p>
          </div>
        )}
      </div>
    </div>
  );
};

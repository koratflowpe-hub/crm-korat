import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, Check, Save, Trash2, Edit3, Type, Hash, 
  Link as LinkIcon, Play, Layers, Clock, AlertCircle, ChevronRight,
  Plus, Share2, Sparkles, Lock, Mic, Info,
  Megaphone, Copy, Image as ImageIcon, 
  RefreshCw, MousePointerClick, MessageSquare, Zap, Share as ShareIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { n8nService } from '../services/n8nService';
import ConfirmModal from './ConfirmModal';
import Teleprompter from './Teleprompter';

const InstagramIcon = ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const FacebookIcon = ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

export default function ScriptEditorModal({ script, pillars, onClose, onSave, onDelete }) {
  const [activeTab, setActiveTab] = useState('guion');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [error, setError] = useState(null);
  const isInitialized = useRef(false);
  const [hooks, setHooks] = useState([]);
  const [showDeleteScriptConfirm, setShowDeleteScriptConfirm] = useState(false);
  const [hookToDelete, setHookToDelete] = useState(null);
  const [isAddingHook, setIsAddingHook] = useState(false);
  const [newHook, setNewHook] = useState({ title: '', content: '' });
  
  // Script Architect States
  const [writingMode, setWritingMode] = useState('libre');
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  
  // AI Prompt Overlay States
  const [aiPromptTarget, setAiPromptTarget] = useState(null); // { field, blockId, label }
  const [userInstruction, setUserInstruction] = useState('');
  
  const [form, setForm] = useState({
    title: script?.title || '',
    pillar_id: script?.pillar_id || '',
    status: script?.status || 'idea',
    master_draft: script?.master_draft || '',
    video_copy: script?.video_copy || '',
    hashtags: script?.hashtags || '',
    platforms: script?.platforms || [],
    reference_links: Array.isArray(script?.reference_links) ? script.reference_links : [],
    camera_setup: script?.camera_setup || '',
    lighting_setup: script?.lighting_setup || '',
    shot_list: script?.shot_list || '',
    facebook_copy: script?.facebook_copy || '',
    carousel_data: Array.isArray(script?.carousel_data) ? script.carousel_data : [],
    hook_variations: Array.isArray(script?.hook_variations) ? script.hook_variations : []
  });

  const fetchHooks = async () => {
    const { data } = await supabase.from('hooks_library').select('*');
    if (data) setHooks(data);
  };

  const fetchBlocks = async () => {
    setBlocksLoading(true);
    const { data } = await supabase
      .from('script_blocks')
      .select('*')
      .eq('script_id', script.id)
      .order('block_order', { ascending: true });
    if (data) setBlocks(data);
    setBlocksLoading(false);
  };

  useEffect(() => {
    fetchHooks();
    fetchBlocks();
  }, []);

  // Auto-save logic
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    const timer = setTimeout(() => {
      const relevantOriginal = {
        title: script?.title || '',
        pillar_id: script?.pillar_id || '',
        status: script?.status || 'idea',
        master_draft: script?.master_draft || '',
        video_copy: script?.video_copy || '',
        hashtags: script?.hashtags || '',
        platforms: script?.platforms || [],
        reference_links: Array.isArray(script?.reference_links) ? script.reference_links : [],
        camera_setup: script?.camera_setup || '',
        lighting_setup: script?.lighting_setup || '',
        shot_list: script?.shot_list || ''
      };
      if (JSON.stringify(form) !== JSON.stringify(relevantOriginal)) {
        handleSave(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [form]);

  // Auto-Tab Switching Logic
  useEffect(() => {
    if (!isInitialized.current) return;
    if (form.status === 'ready' && activeTab !== 'produccion') {
      setActiveTab('produccion');
    } else if (form.status === 'published' && activeTab !== 'metadata') {
      setActiveTab('guion');
    } else if ((form.status === 'idea' || form.status === 'drafting') && activeTab === 'produccion') {
      setActiveTab('guion');
    }
  }, [form.status]);

  const handleBlockChange = (id, content) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, text_content: content } : b));
  };

  const saveBlocks = async (currentBlocks = blocks) => {
    const updates = currentBlocks.map(b => 
      supabase.from('script_blocks').update({ text_content: b.text_content }).eq('id', b.id)
    );
    await Promise.all(updates);
  };

  const initTemplate = async (type) => {
    setBlocksLoading(true);
    await supabase.from('script_blocks').delete().eq('script_id', script.id);
    let newBlocks = [];
    if (type === 'standard') {
      newBlocks = [
        { type: 'hook', label: 'Gancho (Estratégico)', placeholder: 'Escribe tu gancho de 3 segundos...' },
        { type: 'development', label: 'Desarrollo (Valor)', placeholder: 'Explica el concepto principal...' },
        { type: 'cta', label: 'Cierre (Llamado a la acción)', placeholder: 'Diles qué hacer ahora...' }
      ];
    } else if (type === 'abt') {
      newBlocks = [
        { type: 'hook', label: 'Gancho', placeholder: 'La promesa irresistible...' },
        { type: 'and', label: 'Y... (Contexto)', placeholder: 'Añade información de soporte...' },
        { type: 'but', label: 'PERO... (El Conflicto)', placeholder: 'Introduce la tensión o el problema...' },
        { type: 'therefore', label: 'POR LO TANTO... (Resolución)', placeholder: 'Cómo se resuelve y qué aprendieron...' },
        { type: 'cta', label: 'Cierre', placeholder: 'CTA final...' }
      ];
    }
    const toInsert = newBlocks.map((b, i) => ({
      script_id: script.id,
      block_type: b.type,
      text_content: '',
      block_order: i
    }));
    const { data } = await supabase.from('script_blocks').insert(toInsert).select();
    if (data) setBlocks(prev => [...prev.filter(b => b.script_id !== script.id), ...data]);
    setBlocksLoading(false);
  };

  const compileDraft = () => {
    const combined = blocks.map(b => b.text_content).filter(Boolean).join('\n\n');
    setForm(f => ({ ...f, master_draft: combined }));
    setWritingMode('libre');
  };

  const handleSave = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setIsSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('scripts')
      .update({
        title: form.title,
        pillar_id: form.pillar_id || null,
        status: form.status,
        master_draft: form.master_draft,
        video_copy: form.video_copy,
        hashtags: form.hashtags,
        platforms: form.platforms,
        reference_links: form.reference_links,
        camera_setup: form.camera_setup,
        lighting_setup: form.lighting_setup,
        shot_list: form.shot_list,
        facebook_copy: form.facebook_copy,
        carousel_data: form.carousel_data,
        hook_variations: form.hook_variations,
        updated_at: new Date().toISOString()
      })
      .eq('id', script.id);
    if (err) {
      setError(err.message);
      if (!isSilent) setLoading(false);
    } else {
      onSave({ ...script, ...form });
      setLastSaved(new Date());
      if (!isSilent) setLoading(false);
    }
    setIsSaving(false);
  };

  // Workflow Authorization Logic
  const getTabStatus = (tabId) => {
    const s = form.status;
    const mapping = {
      guion: ['idea', 'drafting', 'structuring', 'refined', 'ready', 'recorded', 'published'],
      marketing: ['idea', 'drafting', 'structuring', 'refined', 'ready', 'recorded', 'published'],
      produccion: ['ready', 'recorded', 'published'],
      distribucion: ['refined', 'ready', 'recorded', 'published'],
      references: ['idea', 'drafting', 'structuring', 'refined', 'ready', 'recorded', 'published']
    };
    return mapping[tabId]?.includes(s) || false;
  };

  const addReference = () => {
    setForm(f => ({ ...f, reference_links: [...f.reference_links, ''] }));
  };

  const updateReference = (index, val) => {
    const newList = [...form.reference_links];
    newList[index] = val;
    setForm(f => ({ ...f, reference_links: newList }));
  };

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) 
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p]
    }));
  };

  const insertHook = (hText) => {
    setForm(f => ({ ...f, master_draft: f.master_draft + '\n' + hText }));
  };

  const confirmDeleteScript = () => {
    onDelete(script.id);
    setShowDeleteScriptConfirm(false);
  };

  const confirmDeleteHook = async () => {
    if (!hookToDelete) return;
    const { error } = await supabase.from('hooks_library').delete().eq('id', hookToDelete);
    if (!error) setHooks(prev => prev.filter(h => h.id !== hookToDelete));
    setHookToDelete(null);
  };

  const saveNewHook = async () => {
    if (!newHook.title || !newHook.content) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('hooks_library')
      .insert([{ ...newHook, user_id: user.id }])
      .select()
      .single();
    if (!error) {
      setHooks(prev => [data, ...prev]);
      setNewHook({ title: '', content: '' });
      setIsAddingHook(false);
    }
  };

  const handleAIAssist = async () => {
    if (!aiPromptTarget) return;
    
    const { field, blockId } = aiPromptTarget;
    const targetField = blockId ? `block_${blockId}` : field;
    const currentContent = blockId 
      ? blocks.find(b => b.id === blockId)?.text_content 
      : form[field];

    const pilar = pillars.find(p => p.id === form.pillar_id);
    const { data: { user } } = await supabase.auth.getUser();

    const context = {
      script_id: script.id,
      title: form.title,
      current_content: currentContent,
      field_target: targetField,
      block_id: blockId,
      pillar_id: form.pillar_id,
      pillar_name: pilar?.name,
      pillar_description: pilar?.description,
      pillar_objective: pilar?.objective,
      pillar_keywords: pilar?.keywords,
      user_id: user?.id,
      master_draft: form.master_draft,
      video_copy: form.video_copy,
      shot_list: form.shot_list,
      lighting_setup: form.lighting_setup,
      camera_setup: form.camera_setup,
      hashtags: form.hashtags,
      full_blocks: blocks 
    };

    try {
      setLoading(true);
      const response = await n8nService.triggerScriptAi('assist', context, userInstruction);
      
      const newText = response?.generated_text || 
                      response?.text || 
                      response?.output || 
                      response?.content?.parts?.[0]?.text || 
                      (typeof response === 'string' ? response : null);
      
      if (newText) {
         if (blockId) {
            handleBlockChange(blockId, newText);
            saveBlocks(blocks.map(b => b.id === blockId ? { ...b, text_content: newText } : b));
         } else {
            setForm(f => ({ ...f, [field]: (f[field] ? f[field] + '\n\n' : '') + newText }));
         }
         setAiPromptTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setUserInstruction('');
    }
  };

  const openAIPrompt = (field, label, blockId = null) => {
    setAiPromptTarget({ field, label, blockId });
    setUserInstruction('');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="modal-overlay"
      />
      
      {/* AI Prompt Overlay */}
      <AnimatePresence>
        {aiPromptTarget && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAiPromptTarget(null)}
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
                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{aiPromptTarget.label}</p>
                  </div>
                </div>
                <button onClick={() => setAiPromptTarget(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full transition-all shrink-0">
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
                  <button onClick={handleAIAssist} disabled={loading} className="flex-1 btn-primary py-4 gap-2 text-white">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={16} />}
                    {loading ? 'Procesando...' : 'Empoderar con IA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="modal-content w-full lg:max-w-[95vw] h-[98vh] lg:h-[92vh] flex flex-col relative z-[130] rounded-t-[32px] sm:rounded-b-[32px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        
        {/* Header SaaS Elite */}
        <header className="px-4 sm:px-8 py-3 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="h-9 w-9 sm:h-11 sm:w-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/5 shadow-sm shrink-0">
              <Edit3 size={18} sm:size={22} />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Nombre del Guión..."
                className="text-sm sm:text-lg font-bold bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 p-0 w-full placeholder:text-slate-300"
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">
                    {isSaving ? 'Sincronizando' : 'Guardado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowTeleprompter(true)}
              className="p-2 sm:px-5 sm:py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-[11px] font-bold uppercase"
            >
              <Play size={14} fill="currentColor" /> <span className="hidden sm:inline">Grabación</span>
            </button>
            <button
              onClick={() => handleSave()}
              disabled={loading}
              className="btn-primary p-2 sm:px-6 sm:py-2.5 shadow-lg shadow-primary/20 text-xs font-bold gap-2 text-white"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              <span className="hidden sm:inline">Guardar</span>
            </button>
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background">

          {/* SaaS Sidebar Navigation */}
          <nav className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-4 sm:p-6 space-y-2 flex lg:flex-col overflow-x-auto lg:overflow-y-auto no-scrollbar gap-2 lg:gap-0">
            {[
              { id: 'guion', label: 'Estructura', icon: <Type size={16} /> },
              { id: 'marketing', label: 'Viralidad', icon: <Zap size={16} /> },
              { id: 'produccion', label: 'Técnico', icon: <ImageIcon size={16} /> },
              { id: 'distribucion', label: 'Plataformas', icon: <ShareIcon size={16} /> },
              { id: 'references', label: 'Referencias', icon: <LinkIcon size={16} /> },
            ].map(tab => {
              const isAllowed = getTabStatus(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => isAllowed && setActiveTab(tab.id)}
                  disabled={!isAllowed}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                    ${isActive 
                      ? 'bg-primary text-white shadow-md' 
                      : isAllowed 
                        ? 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100' 
                        : 'text-slate-300 cursor-not-allowed grayscale'
                    }`}
                >
                  {React.cloneElement(tab.icon, { size: 16 })}
                  {tab.label}
                  {!isAllowed && <Lock size={12} className="ml-auto opacity-30" />}
                </button>
              );
            })}

            <div className="hidden lg:block pt-8 mt-auto">
              <button
                onClick={() => setShowDeleteScriptConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/5 transition-all"
              >
                <Trash2 size={16} /> Eliminar Guión
              </button>
            </div>
          </nav>

          {/* Elite Editor Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-14 custom-scrollbar bg-slate-50/20 dark:bg-transparent">

            {/* TAB: GUION */}
            {activeTab === 'guion' && (
              <div className="max-w-4xl mx-auto space-y-8">
              <div className="space-y-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                {/* Row 1: Context selectors */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pilar</span>
                    <select
                      value={form.pillar_id}
                      onChange={e => setForm({...form, pillar_id: e.target.value})}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-sm min-w-[180px]"
                    >
                      <option value="">🎯 Sin pilar asignado</option>
                      {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estatus</span>
                    <select
                      value={form.status}
                      onChange={e => setForm({...form, status: e.target.value})}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                    >
                      <option value="idea">Fase Idea</option>
                      <option value="drafting">Borrador</option>
                      <option value="structuring">Ingeniería</option>
                      <option value="refined">Refinado IA</option>
                      <option value="ready">Producción</option>
                      <option value="recorded">Grabado</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Writing mode toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Modo de escritura</span>
                  <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center shadow-sm">
                    <button
                      onClick={() => setWritingMode('libre')}
                      className={`px-4 py-1.5 rounded-lg transition-all flex flex-col items-start ${
                        writingMode === 'libre'
                          ? 'bg-white dark:bg-slate-700 shadow text-primary'
                          : 'text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-black tracking-widest">Libre</span>
                      <span className="text-[8px] font-semibold opacity-60 leading-none">Texto abierto</span>
                    </button>
                    <button
                      onClick={() => setWritingMode('arquitecto')}
                      className={`px-4 py-1.5 rounded-lg transition-all flex flex-col items-start ${
                        writingMode === 'arquitecto'
                          ? 'bg-white dark:bg-slate-700 shadow text-primary'
                          : 'text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-black tracking-widest">Arquitecto</span>
                      <span className="text-[8px] font-semibold opacity-60 leading-none">Bloques narrativos</span>
                    </button>
                  </div>
                </div>
              </div>

                {writingMode === 'libre' ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-0">
                    {/* Label */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GUIÓN MASTER</span>
                    </div>
                    {/* Textarea — no more floating buttons inside */}
                    <textarea
                      value={form.master_draft}
                      onChange={e => setForm({...form, master_draft: e.target.value})}
                      placeholder="Deja fluir la idea aquí. Escribe sin corregir..."
                      className="w-full flex-1 min-h-[320px] h-[min(55vh,520px)] bg-card border border-border rounded-[24px] p-6 sm:p-8 text-sm sm:text-base font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none custom-scrollbar shadow-sm"
                    />
                    {/* Toolbar inferior — siempre visible, jamas tapa el texto */}
                    <div className="flex items-center justify-between mt-2 px-2">
                      <span className="text-[10px] font-medium text-slate-400">
                        {form.master_draft.length.toLocaleString()} caracteres
                      </span>
                      <button
                        onClick={() => openAIPrompt('master_draft', 'Módulo Guión')}
                        className="btn-ai gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center"
                      >
                        <Sparkles size={13} /> Refinar con IA
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {blocks.length === 0 ? (
                      <div className="py-24 text-center bg-muted/20 rounded-[50px] border-2 border-dashed border-border flex flex-col items-center">
                        <div className="w-24 h-24 bg-card text-primary rounded-[32px] flex items-center justify-center mb-8 shadow-2xl border border-border group-hover:scale-110 transition-transform">
                          <Layers size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mb-3 uppercase tracking-tight">Arquitecto de Contenido</h3>
                        <p className="text-sm text-muted-foreground font-medium mb-12 max-w-sm">Estructura tu narrativa usando técnicas de alto impacto viral.</p>
                        <div className="flex gap-6">
                          <button 
                            onClick={() => initTemplate('standard')}
                            className="bg-card px-10 py-5 rounded-[24px] border border-border hover:border-primary transition-all group flex flex-col items-center gap-2 shadow-xl hover:translate-y-[-5px]"
                          >
                            <span className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Clásico Directo</span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">AIDA Model</span>
                          </button>
                          <button 
                            onClick={() => initTemplate('abt')}
                            className="btn-ai px-12 py-5 rounded-[24px] flex flex-col items-center gap-2 shadow-2xl hover:translate-y-[-5px]"
                          >
                            <span className="text-xs font-black uppercase tracking-widest text-white">Ingeniería ABT</span>
                            <span className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">El Secreto de Hollywood</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <div className="flex items-center gap-2.5">
                              <Zap size={18} className="text-amber-500 fill-amber-500/10" />
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Flujo Narrativo Dinámico</p>
                            </div>
                            <button 
                              onClick={compileDraft}
                              className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                              <Check size={14} /> Unificar Guión Final
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {blocks.map((block, idx) => (
                              <motion.div 
                                layoutId={block.id}
                                key={block.id} 
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-primary/30 transition-all shadow-sm group/block relative"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold border border-slate-100 dark:border-slate-700">
                                      0{idx + 1}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-lg">
                                      {block.block_type === 'and' ? 'Contexto' : 
                                       block.block_type === 'but' ? 'Conflicto' : 
                                       block.block_type === 'therefore' ? 'Resolución' : 
                                       block.block_type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-all">
                                    <button onClick={() => openAIPrompt('block', `Fase: ${block.block_type}`, block.id)} className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all">
                                      <Sparkles size={16} />
                                    </button>
                                    <button onClick={async () => {
                                      await supabase.from('script_blocks').delete().eq('id', block.id);
                                      fetchBlocks();
                                    }} className="p-2 text-slate-400 hover:text-destructive transition-colors rounded-lg">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                <textarea 
                                  value={block.text_content}
                                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                  onBlur={() => saveBlocks()}
                                  placeholder="Escribe el contenido..."
                                  className="w-full bg-transparent border-none p-0 text-base font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-300 outline-none focus:ring-0 resize-none min-h-[100px] leading-relaxed"
                                />
                              </motion.div>
                            ))}
                          </div>
                          
                          <button 
                            onClick={async () => {
                              await supabase.from('script_blocks').insert([{ script_id: script.id, block_type: 'custom', block_order: blocks.length, text_content: '' }]);
                              fetchBlocks();
                            }}
                            className="py-4 border shadow-sm border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3"
                          >
                            <Plus size={16} /> Añadir Bloque
                          </button>
                        </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* TAB: PRODUCCION (PLAN TÉCNICO) */}
            {activeTab === 'produccion' && (
              <div className="max-w-5xl mx-auto space-y-10">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 shadow-sm">
                  <div className="bg-primary/10 text-primary p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
                    <Info size={20} sm:size={24} />
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
            )}

            {/* TAB: MARKETING / HOOK TESTING */}
            {activeTab === 'marketing' && (
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
                    className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> Re-Generar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {form.hook_variations.length > 0 ? form.hook_variations.map((v, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -4 }}
                      className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer group relative flex flex-col justify-between h-auto min-h-[260px] sm:h-[300px] ${
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
                          <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-3 py-1 rounded-lg">Ángulo 0{i+1}</span>
                          {v.selected && <Check size={18} className="text-rose-500" strokeWidth={3} />}
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed line-clamp-6 italic">“{v.content}”</p>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ ...form, master_draft: v.content + '\n\n' + form.master_draft });
                        }}
                        className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                         Inyectar al Guión
                      </button>
                    </motion.div>
                  )) : (
                    <div className="col-span-3 py-24 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-black/10">
                       <Megaphone size={32} className="mx-auto text-slate-300 mb-4" />
                       <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Caja de Hooks Vacía</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DISTRIBUCIÓN */}
            {activeTab === 'distribucion' && (
               <div className="max-w-5xl mx-auto space-y-10">
                  <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-3xl shadow-sm">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                              <FacebookIcon size={22} />
                           </div>
                           <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Distribución Facebook</h3>
                        </div>
                        <button 
                           onClick={() => openAIPrompt('facebook_copy', 'Digital Copywriting')}
                           className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                        >
                           <Sparkles size={14} /> Redactar Copy IA
                        </button>
                     </div>
                     <textarea 
                        value={form.facebook_copy}
                        onChange={e => setForm({...form, facebook_copy: e.target.value})}
                        placeholder="Aquí tu copy persuasivo..."
                        className="w-full h-48 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none resize-none shadow-inner leading-relaxed"
                     />
                  </section>
               </div>
            )}

            {/* TAB: REFERENCES */}
            {activeTab === 'references' && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h3 className="text-xl font-black uppercase tracking-widest text-primary">Inspiración Curada</h3>
                  <button onClick={addReference} className="btn-tonal !px-6 !py-2.5 gap-2">
                    <Plus size={18} strokeWidth={3} /> Añadir Link Maestro
                  </button>
                </div>
                
                <div className="grid gap-3">
                  {form.reference_links.map((link, i) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex gap-2 sm:gap-4 p-1 sm:p-2">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 bg-card border border-border rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shadow-xl shrink-0">
                        <LinkIcon size={20} sm:size={24} />
                      </div>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link}
                        onChange={e => updateReference(i, e.target.value)}
                        className="flex-1 bg-card border border-border rounded-xl sm:rounded-2xl px-4 sm:px-6 text-xs sm:text-sm font-bold text-foreground focus:ring-2 focus:ring-primary outline-none shadow-sm min-w-0"
                      />
                      <button 
                        onClick={() => setForm(f => ({ ...f, reference_links: f.reference_links.filter((_, idx) => idx !== i)}))}
                        className="p-3 sm:p-4 text-destructive hover:bg-destructive/10 rounded-xl sm:rounded-2xl transition-all shrink-0"
                      >
                        <Trash2 size={20} sm:size={24} />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {form.reference_links.length === 0 && (
                  <div className="text-center py-32 bg-muted/10 rounded-[40px] border-2 border-dashed border-border opacity-30">
                    <LinkIcon size={64} className="mx-auto mb-6 opacity-20" />
                    <p className="text-lg font-black uppercase tracking-[0.4em]">Sin Referencias Guardadas</p>
                  </div>
                )}
              </div>
            )}

          </main>

          {/* Luxury Right Sidebar Assistant */}
          <aside className="hidden xl:block w-[400px] border-l border-border bg-slate-50/50 dark:bg-black/40 overflow-y-auto custom-scrollbar p-10 space-y-12">
            
            {/* AI Advisor Card */}
            <div className="bg-primary rounded-[40px] p-8 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/20 rounded-[18px] backdrop-blur-md">
                  <Sparkles size={24} fill="currentColor" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Insight Estratégico</h5>
                  <h4 className="text-lg font-black uppercase tracking-tight">Fase: {form.status.toUpperCase()}</h4>
                </div>
              </div>
              <p className="text-sm font-medium leading-[1.7] opacity-90">
                {form.status === 'idea' && "Enfócate en el Ángulo. No intentes escribirlo todo, solo busca el '¿Por qué alguien vería esto?'."}
                {form.status === 'drafting' && "Haz un 'Brain Dump'. Escribe sin corregir. Buscamos autenticidad, no perfección."}
                {form.status === 'structuring' && "Usa el método ABT. Asegúrate de que el 'PERO' genere suficiente tensión narrativa."}
                {form.status === 'ready' && "Revisa la luz. Una buena iluminación hace que tu video se vea 10x más profesional de inmediato."}
                {form.status === 'recorded' && "Momento de post-producción. Enfócate en los primeros 3 segundos para retener al usuario."}
              </p>
            </div>

            {/* Quick Tools */}
            <div className="space-y-6">
               <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] pl-2">Arsenal Maestro</h5>
               <div className="grid grid-cols-2 gap-3">
                  {['CapCut', 'ChatGPT', 'Submagic', 'Pinterest'].map(tool => (
                    <div key={tool} className="bg-card border border-border p-4 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-foreground hover:border-primary transition-all cursor-crosshair shadow-sm">
                      {tool}
                    </div>
                  ))}
               </div>
            </div>

            {/* Quick Hooks Injection */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pl-2">
                <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Hooks Sugeridos</h5>
              </div>
              <div className="space-y-4">
                {hooks.slice(0, 3).map(hook => (
                  <motion.div 
                    key={hook.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => insertHook(hook.content)}
                    className="bg-card border border-border p-6 rounded-[28px] cursor-pointer hover:border-primary/50 shadow-lg group/quick"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">{hook.title}</p>
                      <Plus size={14} className="opacity-0 group-hover/quick:opacity-100 transition-all text-primary" />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium italic line-clamp-2 leading-relaxed">"{hook.content}"</p>
                  </motion.div>
                ))}
              </div>
            </div>

          </aside>
        </div>

        {/* Floating Save Protection */}
        {!isSaving && isInitialized.current && (
           <div className="absolute bottom-10 right-10 z-50 animate-in fade-in slide-in-from-bottom-5">
              <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2">
                 <Check size={14} strokeWidth={4} /> Progreso Resguardado
              </div>
           </div>
        )}
      </motion.div>

      {/* Overlays */}
      <AnimatePresence>
        {showTeleprompter && (
          <Teleprompter 
            text={form.master_draft} 
            onClose={() => setShowTeleprompter(false)} 
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteScriptConfirm}
        title="¿Ejecutar Purga de Guión?"
        message="Esta acción es irreversible. El contenido se perderá para siempre en la nube fría."
        onConfirm={confirmDeleteScript}
        onCancel={() => setShowDeleteScriptConfirm(false)}
      />

      <ConfirmModal
        isOpen={hookToDelete !== null}
        title="Eliminar Hook"
        message="¿Deseas remover esta pieza de tu arsenal creativo?"
        onConfirm={confirmDeleteHook}
        onCancel={() => setHookToDelete(null)}
      />
    </div>
  );
}

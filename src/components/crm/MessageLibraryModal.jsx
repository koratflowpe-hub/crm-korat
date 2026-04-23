import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit3, Trash2, Save, BookOpen, Send, ThumbsUp, 
  Target, Zap, History, HeartPulse, Clock, Star, Megaphone, 
  Layout, ChevronRight, PlayCircle
} from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';

const MessageLibraryModal = ({ isOpen, onClose, initialTab = 'apertura' }) => {
  const { templates, createTemplate, updateTemplate, deleteTemplate, incrementSuccessCount, isLoading } = useTemplates();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('core'); // 'core' | 'extended'
  
  const [formData, setFormData] = useState({
    nombre: '',
    contenido: '',
    etapa: initialTab
  });

  const CORE_ITEMS = [
    { id: 'apertura', label: '01. Apertura', icon: <Target className="w-4 h-4" />, color: 'indigo' },
    { id: 'activador', label: '02. Activador', icon: <Zap className="w-4 h-4" />, color: 'amber' },
    { id: 'video_pilar', label: '03. Video Pilar', icon: <PlayCircle className="w-4 h-4" />, color: 'rose' }
  ];

  const EXTENDED_GROUPS = [
    {
      label: 'Protocolo de Rescate',
      items: [
        { id: 'rescate_35', label: 'Ausente: 35 días', icon: <History className="w-4 h-4" /> },
        { id: 'rescate_60', label: 'Ausente: 60 días', icon: <History className="w-4 h-4" /> },
        { id: 'rescate_90', label: 'Ausente: 90 días', icon: <HeartPulse className="w-4 h-4" /> }
      ]
    },
    {
      label: 'Recordatorios y Fidelización',
      items: [
        { id: 'rec_24h', label: 'Recordatorio 24h', icon: <Clock className="w-4 h-4" /> },
        { id: 'rec_3h', label: 'Recordatorio 3h', icon: <Clock className="w-4 h-4" /> },
        { id: 'post_cita', label: 'Encuesta Post-Cita', icon: <Star className="w-4 h-4" /> },
        { id: 'marketing', label: 'Marketing / Otros', icon: <Megaphone className="w-4 h-4" /> }
      ]
    }
  ];

  const ALL_STAGES = [...CORE_ITEMS.map(i => i.id), ...EXTENDED_GROUPS.flatMap(g => g.items.map(i => i.id))];

  // Sincronizar tab inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      let tab = 'apertura';
      const isExtended = EXTENDED_GROUPS.flatMap(g => g.items).some(i => i.id === initialTab);
      
      if (isExtended) setViewMode('extended');
      else setViewMode('core');

      const validStages = ALL_STAGES;
      if (typeof initialTab === 'string' && (validStages.includes(initialTab) || initialTab === 'seguimiento')) {
        tab = (initialTab === 'seguimiento') ? 'activador' : initialTab;
      }
      
      setActiveTab(tab);
      setFormData({ nombre: '', contenido: '', etapa: tab });
      setEditingId(null);
    }
  }, [isOpen, initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormData(prev => ({ ...prev, etapa: tab }));
    setEditingId(null);
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setFormData({ nombre: t.nombre, contenido: t.contenido, etapa: t.etapa });
  };



  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', contenido: '', etapa: activeTab });
  };

  const handleSave = () => {
    if (!formData.nombre.trim() || !formData.contenido.trim()) return;
    
    if (editingId) {
      updateTemplate(editingId, formData);
    } else {
      createTemplate(formData);
    }
    cancelEdit();
  };

  if (!isOpen) return null;

  const getWinRate = (sent, success) => {
    if (!sent || sent === 0) return 0;
    return Math.round((success / sent) * 100);
  };

  const filteredTemplates = templates
    .filter(t => t.etapa === activeTab)
    .sort((a, b) => {
      const rateA = getWinRate(a.sent_count, a.success_count);
      const rateB = getWinRate(b.sent_count, b.success_count);
      if (rateA === rateB) return (b.sent_count || 0) - (a.sent_count || 0);
      return rateB - rateA;
    });

  const activeTabInfo = [...CORE_ITEMS, ...EXTENDED_GROUPS.flatMap(g => g.items)].find(i => i.id === activeTab);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Biblioteca de Mensajes</h2>
              <p className="text-sm text-slate-500 font-medium">Organización dividida por prioridad estratégica</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Side Navigation */}
          <div className="w-72 bg-slate-50/50 border-r border-slate-100 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* View Mode Toggle */}
            <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-2">
              <button
                onClick={() => setViewMode('core')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${viewMode === 'core' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Principales
              </button>
              <button
                onClick={() => setViewMode('extended')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${viewMode === 'extended' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Otros
              </button>
            </div>

            {viewMode === 'core' ? (
              <div>
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 px-2">
                  🚀 Scripts de Venta
                </h3>
                <div className="space-y-1">
                  {CORE_ITEMS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === item.id 
                          ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                          : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                      }`}
                    >
                      <span className={`${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                      {activeTab === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {EXTENDED_GROUPS.map(group => (
                  <div key={group.label}>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === item.id 
                              ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                              : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                          }`}
                        >
                          <span className={`${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {item.icon}
                          </span>
                          {item.label}
                          {activeTab === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Templates List */}
          <div className="w-1/3 border-r border-slate-100 overflow-y-auto p-6 bg-slate-50/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {activeTabInfo?.label}
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  {filteredTemplates.length}
                </span>
              </h3>
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin text-indigo-600 mb-4 inline-block">⏳</div>
                <p className="text-slate-400 text-sm font-medium">Cargando plantillas...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-medium">No hay plantillas guardadas</p>
                <p className="text-[10px] text-slate-300 mt-1">Crea una nueva a la derecha</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map(t => {
                  const winRate = getWinRate(t.sent_count, t.success_count);
                  const rateColor = winRate >= 15 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : (winRate > 0 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-slate-400 bg-slate-100 border-slate-200');
                  
                  return (
                    <div key={t.id} className={`group p-5 rounded-2xl border transition-all ${editingId === t.id ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-black text-slate-900 text-sm truncate pr-2">{t.nombre}</h4>
                        <div className="flex gap-1 shrink-0 relative z-50">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(t);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} className="pointer-events-none" />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteTemplate(t.id);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} className="pointer-events-none" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed mb-4 font-medium">{t.contenido}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            <Send size={10} /> {t.sent_count || 0}
                          </div>
                          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border ${rateColor}`}>
                            {winRate}%
                          </div>
                        </div>
                        <button 
                          onClick={() => incrementSuccessCount(t.id, t.success_count || 0)}
                          className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg border border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                        >
                          <ThumbsUp size={10} /> +1 ÉXITO
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 p-10 flex flex-col bg-white">
            <div className="flex items-center gap-3 mb-8">
              <div className={`p-2 rounded-xl ${editingId ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Personaliza el mensaje para tus clientes</p>
              </div>
            </div>
            
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Script</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full text-sm font-bold p-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Ej: Rescate 60d - Opción A"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Etapa / Categoría</label>
                  <select
                    value={formData.etapa}
                    onChange={e => setFormData({ ...formData, etapa: e.target.value })}
                    className="w-full text-sm font-bold p-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none transition-all bg-slate-50"
                  >
                    <optgroup label="Scripts Principales">
                      {CORE_ITEMS.map(item => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </optgroup>
                    {EXTENDED_GROUPS.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.items.map(item => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido del Mensaje</label>
                  <div className="flex gap-2">
                    {['{{nombre_salon}}', '{{direccion}}'].map(v => (
                      <button
                        key={v}
                        onClick={() => setFormData({ ...formData, contenido: formData.contenido + v })}
                        className="text-[9px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        Insertar {v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={formData.contenido}
                  onChange={e => setFormData({ ...formData, contenido: e.target.value })}
                  className="w-full flex-1 text-sm font-medium p-5 rounded-[1.5rem] border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none shadow-inner bg-slate-50/30"
                  placeholder="Escribe el mensaje persuasivo aquí... Usa emojis para dar vida al texto. ✨"
                />
              </div>

              <div className="flex gap-3 pt-4">
                {editingId && (
                  <button onClick={cancelEdit} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-black rounded-2xl transition-all active:scale-95">
                    Cancelar
                  </button>
                )}
                <button 
                  onClick={handleSave} 
                  className={`flex-[2] flex items-center justify-center gap-3 py-4 text-white text-sm font-black rounded-2xl transition-all shadow-xl active:scale-95 ${
                    editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                  }`}
                >
                  <Save size={18} /> {editingId ? 'Guardar Cambios' : 'Crear Script Mágico'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MessageLibraryModal;


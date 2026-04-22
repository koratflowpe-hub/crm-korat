import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2, Save, BookOpen } from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';

const MessageLibraryModal = ({ isOpen, onClose, initialTab = 'apertura' }) => {
  const { templates, createTemplate, updateTemplate, deleteTemplate, isLoading } = useTemplates();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    contenido: '',
    etapa: initialTab
  });

  // Sincronizar tab inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Normalizar la etapa: 'seguimiento' en LeadCard es 'activador' en la DB/Biblioteca
      let tab = 'apertura';
      if (typeof initialTab === 'string' && ['apertura', 'activador', 'video', 'seguimiento'].includes(initialTab)) {
        tab = (initialTab === 'seguimiento') ? 'activador' : initialTab;
      }
      
      setActiveTab(tab);
      setFormData({ nombre: '', contenido: '', etapa: tab });
      setEditingId(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter(t => t.etapa === activeTab);

  const handleSave = () => {
    if (!formData.nombre.trim() || !formData.contenido.trim()) return;

    if (editingId) {
      updateTemplate(editingId, formData);
      setEditingId(null);
    } else {
      createTemplate(formData);
    }
    
    setFormData({ nombre: '', contenido: '', etapa: activeTab });
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setFormData({ nombre: t.nombre, contenido: t.contenido, etapa: t.etapa });
  };

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar esta plantilla?')) {
      deleteTemplate(id);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', contenido: '', etapa: activeTab });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEditingId(null);
    setFormData({ nombre: '', contenido: '', etapa: tab });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Biblioteca de Mensajes</h2>
              <p className="text-xs text-slate-500 font-medium">Gestiona tus plantillas predeterminadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {/* Tabs */}
          <div className="flex px-6 pt-4 gap-4 border-b border-slate-200">
            {['apertura', 'activador', 'video'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`pb-3 px-2 text-sm font-bold capitalize transition-colors relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* List */}
            <div className="w-1/2 border-r border-slate-100 overflow-y-auto p-4 bg-slate-50/50">
              {isLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Cargando plantillas...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No hay plantillas guardadas para {activeTab}.</div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map(t => (
                    <div key={t.id} className={`p-4 rounded-xl border transition-all ${editingId === t.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 text-sm">{t.nombre}</h4>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{t.contenido}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Editor */}
            <div className="w-1/2 p-6 flex flex-col bg-white">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                {editingId ? <><Edit3 size={16} className="text-indigo-600"/> Editar Plantilla</> : <><Plus size={16} className="text-indigo-600"/> Nueva Plantilla</>}
              </h3>
              
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre (Identificador)</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full text-sm font-medium p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="Ej: Saludo corto"
                  />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contenido del Mensaje</label>
                  </div>
                  <textarea
                    value={formData.contenido}
                    onChange={e => setFormData({ ...formData, contenido: e.target.value })}
                    className="w-full flex-1 text-sm font-medium p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all resize-none"
                    placeholder="Escribe el mensaje aquí..."
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    Variables permitidas: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{"{{nombre_salon}}"}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">{"{{direccion}}"}</code>
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <button onClick={cancelEdit} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-lg transition-colors">
                      Cancelar
                    </button>
                  )}
                  <button onClick={handleSave} className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                    <Save size={16} /> {editingId ? 'Actualizar' : 'Guardar Plantilla'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MessageLibraryModal;

import React from 'react';
import { UserPlus, X, Edit3, AlertCircle } from 'lucide-react';

export const CreateLeadModal = ({ isOpen, onClose, newLead, setNewLead, handleCreateUser }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserPlus size={18} className="text-primary" /> Nuevo Prospecto
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre del Negocio</label>
            <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={newLead.nombre_salon} onChange={e => setNewLead({...newLead, nombre_salon: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Teléfono</label>
            <input type="tel" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={newLead.telefono} onChange={e => setNewLead({...newLead, telefono: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Dirección</label>
            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={newLead.direccion} onChange={e => setNewLead({...newLead, direccion: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Sitio Web</label>
            <input type="url" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={newLead.sitioweb} onChange={e => setNewLead({...newLead, sitioweb: e.target.value})} />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="flex-[2] py-2.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition-all transform active:scale-95">Registrar Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditLeadModal = ({ isOpen, onClose, editingLead, setEditingLead, handleUpdateLead }) => {
  if (!isOpen || !editingLead) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-8 overflow-hidden transform transition-all">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
             <Edit3 className="text-primary" size={20} /> Optimización de Lead
           </h2>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleUpdateLead} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre</label>
                <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={editingLead.nombre_salon || ''} onChange={e => setEditingLead({...editingLead, nombre_salon: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Teléfono</label>
                <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={editingLead.telefono || ''} onChange={e => setEditingLead({...editingLead, telefono: e.target.value})} />
              </div>
          </div>

          <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Dirección Física</label>
              <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={editingLead.direccion || ''} onChange={e => setEditingLead({...editingLead, direccion: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Enlace Facebook</label>
                <input type="url" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={editingLead.url_facebook || ''} onChange={e => setEditingLead({...editingLead, url_facebook: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Enlace Instagram</label>
                <input type="url" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={editingLead.url_instagram || ''} onChange={e => setEditingLead({...editingLead, url_instagram: e.target.value})} />
              </div>
          </div>
          
          <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Score de Interés (0-100)</label>
              <input type="number" min="0" max="100" className="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base font-bold text-primary focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all" value={editingLead.score_interes || ''} onChange={e => setEditingLead({...editingLead, score_interes: Number(e.target.value)})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Diagnóstico (Puntos de Dolor)</label>
                  <textarea className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none" value={editingLead.dolor_detectado || ''} onChange={e => setEditingLead({...editingLead, dolor_detectado: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Propuesta de Valor (Gancho)</label>
                  <textarea className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none" value={editingLead.gancho_venta || ''} onChange={e => setEditingLead({...editingLead, gancho_venta: e.target.value})} />
              </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Script de Apertura</label>
                <textarea className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none" value={editingLead.mensaje_apertura || ''} onChange={e => setEditingLead({...editingLead, mensaje_apertura: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Script Activador</label>
                <textarea className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none" value={editingLead.mensaje_activador || ''} onChange={e => setEditingLead({...editingLead, mensaje_activador: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Script Video (Paso 3)</label>
                <textarea className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none" value={editingLead.mensaje_video || ''} onChange={e => setEditingLead({...editingLead, mensaje_video: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Script de Cierre</label>
                <textarea className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none" value={editingLead.mensaje_cierre || ''} onChange={e => setEditingLead({...editingLead, mensaje_cierre: e.target.value})} />
              </div>
          </div>
        </form>
        
        <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/30">
           <button onClick={onClose} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cerrar</button>
           <button onClick={handleUpdateLead} className="flex-[2] py-2.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition-all transform active:scale-95">Sincronizar Cambios</button>
        </div>
      </div>
    </div>
  );
};

export const DeleteLeadModal = ({ isOpen, onClose, leadToDelete, confirmDelete }) => {
  if (!isOpen || !leadToDelete) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
       <div className="bg-white w-full max-w-sm rounded-2xl p-8 border border-slate-100 shadow-2xl flex flex-col items-center text-center transform transition-all">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500 border border-rose-100">
             <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar Registro</h3>
          <p className="text-sm text-slate-500 mb-8">¿Confirmas que deseas eliminar a <span className="font-bold text-slate-900">{leadToDelete.nombre_salon}</span>? Esta acción es irreversible.</p>
          
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
            <button onClick={confirmDelete} className="flex-[2] py-2.5 text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 rounded-lg shadow-sm transition-all transform active:scale-95">Eliminar Ahora</button>
          </div>
       </div>
    </div>
  );
};

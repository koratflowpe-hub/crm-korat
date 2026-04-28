import React from 'react';
import { X, Users } from 'lucide-react';
import LeadCard from './LeadCard';

const DrillDownModal = ({ 
  isOpen, 
  onClose, 
  title, 
  leads, 
  colorClass = 'text-slate-900', 
  bgColorClass = 'bg-slate-900',
  // Props for LeadCard
  updateEstado,
  updateNotas,
  updateMensajeApertura,
  updateMensajeActivador,
  updateMensajeVideo,
  updateLastTemplateId,
  deleteLead,
  setEditingLead,
  setIsEditModalOpen,
  setLeadToDelete,
  setIsDeleteModalOpen,
  setIsLibraryModalOpen,
  updateLead,
  formatWa
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#F8FAFC] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColorClass} text-white shadow-sm`}>
              <Users size={20} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${colorClass}`}>{title}</h2>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                {leads.length} Leads en esta etapa
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {leads.length === 0 ? (
            <div className="text-center bg-white p-20 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
              <div className={`w-16 h-16 ${bgColorClass} rounded-full flex items-center justify-center mb-6 opacity-20`}>
                <Users className={`h-8 w-8 ${colorClass}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No hay leads</h3>
              <p className="text-sm text-slate-500 max-w-xs">No hay leads que cumplan con las condiciones de esta métrica actualmente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  updateEstado={updateEstado}
                  updateNotas={updateNotas}
                  updateMensajeApertura={updateMensajeApertura}
                  updateMensajeActivador={updateMensajeActivador}
                  updateMensajeVideo={updateMensajeVideo}
                  updateLastTemplateId={updateLastTemplateId}
                  deleteLead={deleteLead}
                  setEditingLead={setEditingLead}
                  setIsEditModalOpen={setIsEditModalOpen}
                  setLeadToDelete={setLeadToDelete}
                  setIsDeleteModalOpen={setIsDeleteModalOpen}
                  setIsLibraryModalOpen={setIsLibraryModalOpen}
                  updateLead={updateLead}
                  formatWa={formatWa}
                  isSelectionMode={false} // Disable selection in drill-down
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrillDownModal;

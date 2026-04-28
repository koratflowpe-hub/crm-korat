import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Database, CheckSquare, Square, Trash2, X } from 'lucide-react';
import LeadCard from './LeadCard';
import { ESTADOS } from '../../utils/crmHelpers';

// Skeleton de una sola card — imita la forma real de la tarjeta
const LeadCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col gap-4 animate-pulse">
    <div className="flex items-start justify-between pr-10">
      <div className="space-y-2 flex-1">
        <div className="h-5 bg-slate-100 rounded-lg w-3/4" />
        <div className="h-3.5 bg-slate-100 rounded-md w-1/3" />
      </div>
      <div className="w-8 h-8 bg-slate-100 rounded-lg" />
    </div>
    <div className="flex gap-2">
      <div className="h-7 w-32 bg-slate-100 rounded-lg" />
      <div className="h-7 w-14 bg-amber-50 rounded-lg" />
    </div>
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-slate-100 rounded-full shrink-0" />
        <div className="h-3 bg-slate-100 rounded w-4/5" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-slate-100 rounded-full shrink-0" />
        <div className="h-3 bg-slate-100 rounded w-2/5" />
      </div>
    </div>
    <div className="flex gap-3 mt-2">
      <div className="h-9 bg-amber-50 rounded-xl w-24" />
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-slate-100 rounded-lg" />
        <div className="w-8 h-8 bg-slate-100 rounded-lg" />
      </div>
    </div>
    <div className="border-t border-slate-100 pt-3 flex gap-2">
      <div className="h-11 bg-slate-100 rounded-lg flex-[4]" />
      <div className="h-11 bg-emerald-50 rounded-lg w-12" />
    </div>
  </div>
);

const LeadList = ({ 
  leads, 
  loading, 
  updateEstado, 
  updateNotas, 
  updateMensajeApertura, 
  updateMensajeActivador,
  updateMensajeVideo,
  updateLastTemplateId,
  deleteLead, 
  deleteMultipleLeads,
  setEditingLead, 
  setIsEditModalOpen, 
  setLeadToDelete, 
  setIsDeleteModalOpen,
  setIsLibraryModalOpen,
  updateLead,
  formatWa
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.nombre_salon?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.telefono?.includes(searchQuery));
    
    let matchesStatus = false;
    if (statusFilter === 'Todos') {
      matchesStatus = true;
    } else if (statusFilter === 'special:staged') {
      matchesStatus = lead.automation_status === 'staged';
    } else if (statusFilter === 'special:queued') {
      matchesStatus = lead.automation_status === 'queued';
    } else if (statusFilter === 'special:new') {
      matchesStatus = lead.estado_contacto === 'Pendiente' && !lead.enviado_at;
    } else {
      matchesStatus = lead.estado_contacto === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Cálculo de conteos especiales
  const counts = {
    staged: leads.filter(l => l.automation_status === 'staged').length,
    queued: leads.filter(l => l.automation_status === 'queued').length,
    new: leads.filter(l => l.estado_contacto === 'Pendiente' && !l.enviado_at).length
  };

  // Bulk Selection Handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedLeadIds([]);
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]); // Deselect all
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id)); // Select all visible
    }
  };

  const handleToggleLead = (id) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return;
    
    // Sin modal de confirmación como se acordó (directo)
    const leadsToDelete = leads.filter(l => selectedLeadIds.includes(l.id));
    deleteMultipleLeads(leadsToDelete);
    setIsSelectionMode(false);
    setSelectedLeadIds([]);
  };

  return (
    <div className="space-y-6">

      {/* ── Barra Flotante de Selección Múltiple ── */}
      {isSelectionMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-slate-900/20 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-xl transition-colors"
            >
              {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                <CheckSquare size={18} className="text-primary" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
              <span className="text-xs font-bold">Todos</span>
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {selectedLeadIds.length} Seleccionados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={selectedLeadIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <Trash2 size={14} /> Eliminar
            </button>
            <button
              onClick={toggleSelectionMode}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Filtros STICKY ──────────────────────────────────────────────
          Se fija justo debajo de la barra de navegación (h-20 = top-20).
          El backdrop-blur con fondo semitransparente da un efecto premium
          y comunica visualmente que "flota" sobre el contenido.
      ─────────────────────────────────────────────────────────────── */}
      <div className="sticky top-20 z-40 -mx-6 px-6 pt-4 pb-4 bg-[#F8FAFC]/95 backdrop-blur-xl border-b border-slate-100/80 space-y-3">
        {/* Fila 1: Búsqueda y Resultados */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {!loading && (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 border ${
                  isSelectionMode 
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                }`}
              >
                {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
                Selección Múltiple
              </button>
              
              <div className="flex items-center px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm whitespace-nowrap">
                <span className="text-sm font-black text-slate-900">{filteredLeads.length}</span>
                <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase tracking-wider">leads</span>
              </div>
            </div>
          )}
        </div>

        {/* Fila 2: Píldoras de Filtro (Scroll horizontal) */}
        {!loading && (
          <div className="flex overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar gap-2">
            <button
              onClick={() => setStatusFilter('Todos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border ${
                statusFilter === 'Todos'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <span>Todos</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] ${statusFilter === 'Todos' ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                {leads.length}
              </span>
            </button>

            {/* Divisor Visual */}
            <div className="w-px h-6 bg-slate-200 mx-1 self-center shrink-0" />

            {/* Filtros Especiales de Despacho */}
            <button
              onClick={() => setStatusFilter('special:staged')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border ${
                statusFilter === 'special:staged'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                  : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 shadow-sm'
              } ${counts.staged === 0 && statusFilter !== 'special:staged' ? 'opacity-40' : ''}`}
            >
              <span>🚀 Listos</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] ${statusFilter === 'special:staged' ? 'bg-white/20' : 'bg-indigo-100 text-indigo-700'}`}>
                {counts.staged}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('special:queued')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border ${
                statusFilter === 'special:queued'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100'
                  : 'bg-white text-amber-600 border-amber-100 hover:bg-amber-50 shadow-sm'
              } ${counts.queued === 0 && statusFilter !== 'special:queued' ? 'opacity-40' : ''}`}
            >
              <span>⏳ En Cola</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] ${statusFilter === 'special:queued' ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>
                {counts.queued}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('special:new')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border ${
                statusFilter === 'special:new'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                  : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 shadow-sm'
              } ${counts.new === 0 && statusFilter !== 'special:new' ? 'opacity-40' : ''}`}
            >
              <span>🆕 Nuevos</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] ${statusFilter === 'special:new' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>
                {counts.new}
              </span>
            </button>

            {/* Divisor Visual */}
            <div className="w-px h-6 bg-slate-200 mx-1 self-center shrink-0" />
            
            {ESTADOS.filter(st => st !== 'Pendiente').map(st => {
              const count = leads.filter(l => l.estado_contacto === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border ${
                    statusFilter === st
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                  } ${count === 0 && statusFilter !== st ? 'opacity-40 hover:opacity-100' : ''}`}
                >
                  <span>{st}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] ${statusFilter === st ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Grid de Leads ──────────────────────────────────────────────── */}
      <div className="pt-2">
        {loading ? (
          // Skeleton loader: 6 tarjetas que imitan la estructura real
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <LeadCardSkeleton key={i} />)}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center bg-white p-20 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Database className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sin Resultados</h3>
            <p className="text-sm text-slate-500 max-w-xs">No encontramos leads que coincidan con tu búsqueda o filtros actuales.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                updateEstado={updateEstado}
                updateNotas={updateNotas}
                updateMensajeApertura={updateMensajeApertura}
                updateMensajeActivador={updateMensajeActivador}
                updateMensajeVideo={updateMensajeVideo}
                updateLastTemplateId={updateLastTemplateId}
                setEditingLead={setEditingLead}
                setIsEditModalOpen={setIsEditModalOpen}
                setLeadToDelete={setLeadToDelete}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                setIsLibraryModalOpen={setIsLibraryModalOpen}
                updateLead={updateLead}
                formatWa={formatWa}
                isSelectionMode={isSelectionMode}
                isSelected={selectedLeadIds.includes(lead.id)}
                onToggleSelection={() => handleToggleLead(lead.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadList;

import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Database } from 'lucide-react';
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
  deleteLead, 
  setEditingLead, 
  setIsEditModalOpen, 
  setLeadToDelete, 
  setIsDeleteModalOpen,
  setIsLibraryModalOpen,
  formatWa
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.nombre_salon?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.telefono?.includes(searchQuery));
    const matchesStatus = statusFilter === 'Todos' || lead.estado_contacto === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* ── Filtros STICKY ──────────────────────────────────────────────
          Se fija justo debajo de la barra de navegación (h-20 = top-20).
          El backdrop-blur con fondo semitransparente da un efecto premium
          y comunica visualmente que "flota" sobre el contenido.
      ─────────────────────────────────────────────────────────────── */}
      <div className="sticky top-20 z-40 -mx-6 px-6 pt-3 pb-5 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-slate-100/80">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all shadow-sm"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none hover:border-slate-300 transition-all appearance-none cursor-pointer shadow-sm min-w-[200px]"
              >
                <option value="Todos">Todos los estados</option>
                {ESTADOS.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Contador de resultados */}
            {!loading && (
              <div className="hidden md:flex items-center px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <span className="text-xs font-bold text-slate-900">{filteredLeads.length}</span>
                <span className="text-xs text-slate-400 ml-1.5">leads</span>
              </div>
            )}
          </div>
        </div>
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
                setEditingLead={setEditingLead}
                setIsEditModalOpen={setIsEditModalOpen}
                setLeadToDelete={setLeadToDelete}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                setIsLibraryModalOpen={setIsLibraryModalOpen}
                formatWa={formatWa}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadList;

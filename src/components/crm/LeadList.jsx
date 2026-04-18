import React, { useState } from 'react';
import { Search, Filter, ChevronDown, Database } from 'lucide-react';
import LeadCard from './LeadCard';
import { ESTADOS } from '../../utils/crmHelpers';

const LeadList = ({ 
  leads, 
  loading, 
  updateEstado, 
  updateNotas, 
  updateMensajeApertura, 
  deleteLead, 
  setEditingLead, 
  setIsEditModalOpen, 
  setLeadToDelete, 
  setIsDeleteModalOpen,
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
    <div className="space-y-12">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-10">
          <div className="relative flex-1 group w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
              <input 
                  type="text" 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all shadow-sm"
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                      value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-9 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none hover:border-slate-300 transition-all appearance-none cursor-pointer shadow-sm min-w-[200px]"
                  >
                      <option value="Todos">Todos los estados</option>
                      {ESTADOS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                  </div>
              </div>
          </div>
      </div>

      {/* Grid de Leads */}
      <div className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando Leads...</p>
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
                    setEditingLead={setEditingLead} 
                    setIsEditModalOpen={setIsEditModalOpen} 
                    setLeadToDelete={setLeadToDelete}
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
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

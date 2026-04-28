import React, { useState, useEffect } from 'react';
import { Plus, Package, Database, PlayCircle, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Hooks
import { useLeads } from '../hooks/useLeads';
import { useScraper } from '../hooks/useScraper';
import { useCrmConfig } from '../hooks/useCrmConfig';

// Components
import KPIDashboard from '../components/crm/KPIDashboard';
import ScraperControls from '../components/crm/ScraperControls';
import LeadList from '../components/crm/LeadList';
import AutomationHub from '../components/crm/AutomationHub';
import { CreateLeadModal, EditLeadModal, DeleteLeadModal } from '../components/crm/Modals';
import MessageLibraryModal from '../components/crm/MessageLibraryModal';
import DrillDownModal from '../components/crm/DrillDownModal';

// Utils
import { formatWa } from '../utils/crmHelpers';

export default function CRM() {
  // Configuración persistida en Supabase (Keywords, Radio, Límites, Ubicación)
  const {
    pureKeywords, setPureKeywords,
    radius, setRadius,
    limit, setLimit,
    lat, setLat,
    lng, setLng,
    isSavingConfig
  } = useCrmConfig();

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('leads'); // 'leads' | 'automation'
  
  // Lead states para modales
  const [newLead, setNewLead] = useState({ nombre_salon: '', telefono: '', direccion: '', sitioweb: '' });
  const [editingLead, setEditingLead] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Zonas prospectadas (Map data)
  const [zonas, setZonas] = useState([]);

  // Data Hooks
  const { 
    leads, 
    isLoading, 
    updateEstado, 
    updateNotas, 
    updateMensajeApertura, 
    updateMensajeActivador,
    updateMensajeVideo,
    updateLastTemplateId,
    deleteLead, 
    deleteMultipleLeads,
    createLead,
    updateLead,
    refetchLeads
  } = useLeads();

  // Drill Down State
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [drillDownProps, setDrillDownProps] = useState({
    title: '',
    leads: [],
    colorClass: '',
    bgColorClass: ''
  });

  const handleMetricClick = (title, list, colorClass, bgColorClass) => {
    setDrillDownProps({ title, leads: list, colorClass, bgColorClass });
    setIsDrillDownOpen(true);
  };

  const {
    scraping,
    serverOnline,
    scraperLogs,
    iniciarScraper,
    detenerScraper,
    setScraperLogs
  } = useScraper();

  // Fetch initial data (Zonas)
  useEffect(() => {
    const fetchZonas = async () => {
      const { data } = await supabase.from('zonas_prospectadas').select('*');
      if (data) setZonas(data);
    };
    fetchZonas();
    
    // Nombres únicos para evitar conflictos de canales entre re-renders
    const channelId = Date.now();
    const subZonas = supabase
      .channel(`zonas-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zonas_prospectadas' }, fetchZonas)
      .subscribe();
    
    // Este canal es CRÍTICO: la IA (n8n) actualiza el estado del lead en la DB.
    // Con refetchLeads estable (useCallback), este canal solo se crea UNA VEZ.
    const subLeads = supabase
      .channel(`leads-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads_salones' }, () => {
        refetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subZonas);
      supabase.removeChannel(subLeads);
    };
  }, [refetchLeads]);

  // Sincronización de la Biblioteca con la URL para persistencia
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const libraryParam = params.get('library');
    if (libraryParam) {
      setIsLibraryModalOpen(libraryParam === 'true' ? 'apertura' : libraryParam);
    }
  }, []);

  const setLibraryUrl = (val) => {
    const params = new URLSearchParams(window.location.search);
    if (val) {
      params.set('library', val === true ? 'apertura' : val);
    } else {
      params.delete('library');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleOpenLibrary = (tab = 'apertura') => {
    setIsLibraryModalOpen(tab);
    setLibraryUrl(tab);
    setIsMobileMenuOpen(false);
  };

  const handleCloseLibrary = () => {
    setIsLibraryModalOpen(false);
    setLibraryUrl(null);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    createLead(newLead);
    setIsModalOpen(false);
    setNewLead({nombre_salon: '', telefono: '', direccion: '', sitioweb: ''});
  };

  const handleUpdateLead = (e) => {
    e.preventDefault();
    if (editingLead) {
      updateLead(editingLead.id, editingLead);
      setIsEditModalOpen(false);
      setEditingLead(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-primary/20">
      
      {/* Navegación — se oculta cuando la biblioteca está abierta */}
      {!isLibraryModalOpen && (
      <>
        <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <Package size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5}/>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                     Korat<span className="text-primary italic">Flow</span>
                  </h1>
               </div>
                  
               {/* Mobile Menu Toggle */}
               <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="xl:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
               >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>

               {/* Desktop Nav Items */}
               <div className="hidden xl:flex items-center gap-8">
                  {/* Status Group */}
                  <div className="flex items-center gap-8">
                     {/* Server Status */}
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Server</span>
                        <div className="flex items-center gap-1.5">
                           <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                           <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-tight">{serverOnline ? 'Online' : 'Offline'}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                   <button 
                     onClick={() => handleOpenLibrary()} 
                     className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95"
                   >
                     <Database size={16} /> <span>Biblioteca de Mensajes</span>
                   </button>
                   <button 
                     onClick={() => setIsModalOpen(true)} 
                     className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-slate-200 active:scale-95"
                   >
                     <Plus size={16} /> <span>Nuevo Registro</span>
                   </button>
                 </div>
               </div>
            </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="xl:hidden fixed top-16 sm:top-20 inset-x-0 bottom-0 z-[90] bg-white/95 backdrop-blur-xl border-t border-slate-100 p-6 flex flex-col gap-6 overflow-y-auto shadow-2xl">
              <div className="flex flex-col gap-4">
                 <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sistema</h3>
                 <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">Estado del Servidor</span>
                    <div className="flex items-center gap-2">
                       <div className={`w-2.5 h-2.5 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                       <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{serverOnline ? 'Online' : 'Offline'}</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                 <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Acciones</h3>
                 <button 
                   onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }} 
                   className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white hover:bg-slate-800 p-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-slate-200 active:scale-95"
                 >
                   <Plus size={20} /> <span>Nuevo Registro</span>
                 </button>
                 
                 <div className="grid grid-cols-1">
                   <button 
                     onClick={() => handleOpenLibrary()} 
                     className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-4 rounded-2xl font-bold text-sm transition-all active:scale-95 border border-indigo-100"
                   >
                     <Database size={18} /> <span>Biblioteca de Mensajes</span>
                   </button>
                  </div>
              </div>
          </div>
        )}
      </>
      )}

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Section tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveSection('leads')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
              activeSection === 'leads'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Prospectos
          </button>
          <button
            onClick={() => setActiveSection('automation')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
              activeSection === 'automation'
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            🚀 Despacho
          </button>
        </div>

        {activeSection === 'leads' && (
          <>
            {/* Dashboard de KPIs */}
            <KPIDashboard leads={leads} onMetricClick={handleMetricClick} />

            {/* Radar Panel */}
            <ScraperControls 
              lat={lat} lng={lng} setLat={setLat} setLng={setLng}
              zonas={zonas} radius={radius} setRadius={setRadius}
              limit={limit} setLimit={setLimit}
              pureKeywords={pureKeywords} setPureKeywords={setPureKeywords}
              scraping={scraping} scraperLogs={scraperLogs}
              setScraperLogs={setScraperLogs}
              serverOnline={serverOnline}
              iniciarScraper={(params) => iniciarScraper(params, refetchLeads)}
              detenerScraper={detenerScraper}
              isSavingConfig={isSavingConfig}
            />

            {/* Listado de Prospectos */}
            <LeadList 
              leads={leads}
              loading={isLoading}
              updateEstado={updateEstado}
              updateNotas={updateNotas}
              updateMensajeApertura={updateMensajeApertura}
              updateMensajeActivador={updateMensajeActivador}
              updateMensajeVideo={updateMensajeVideo}
              updateLastTemplateId={updateLastTemplateId}
              deleteLead={deleteLead}
              deleteMultipleLeads={deleteMultipleLeads}
              setEditingLead={setEditingLead}
              setIsEditModalOpen={setIsEditModalOpen}
              setLeadToDelete={setLeadToDelete}
              setIsDeleteModalOpen={setIsDeleteModalOpen}
              setIsLibraryModalOpen={handleOpenLibrary}
              updateLead={updateLead}
              formatWa={formatWa}
            />
          </>
        )}

        {activeSection === 'automation' && (
          <AutomationHub leads={leads} />
        )}
      </main>

      {/* Modales */}
      <CreateLeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        newLead={newLead}
        setNewLead={setNewLead}
        handleCreateUser={handleCreateUser}
      />

      <EditLeadModal 
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingLead(null); }}
        editingLead={editingLead}
        setEditingLead={setEditingLead}
        handleUpdateLead={handleUpdateLead}
      />

      <DeleteLeadModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setLeadToDelete(null); }}
        leadToDelete={leadToDelete}
        confirmDelete={() => { deleteLead(leadToDelete); setIsDeleteModalOpen(false); setLeadToDelete(null); }}
      />

      <MessageLibraryModal
        isOpen={!!isLibraryModalOpen}
        initialTab={typeof isLibraryModalOpen === 'string' ? isLibraryModalOpen : 'apertura'}
        onClose={handleCloseLibrary}
        onTabChange={setLibraryUrl}
      />

      {/* Drill Down Modal para KPIs */}
      <DrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        title={drillDownProps.title}
        leads={drillDownProps.leads}
        colorClass={drillDownProps.colorClass}
        bgColorClass={drillDownProps.bgColorClass}
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
        setIsLibraryModalOpen={handleOpenLibrary}
        updateLead={updateLead}
        formatWa={formatWa}
      />
    </div>
  );
}

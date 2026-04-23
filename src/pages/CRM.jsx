import React, { useState, useEffect } from 'react';
import { Plus, Package, Database, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Hooks
import { useLeads } from '../hooks/useLeads';
import { useScraper } from '../hooks/useScraper';

// Components
import KPIDashboard from '../components/crm/KPIDashboard';
import ScraperControls from '../components/crm/ScraperControls';
import LeadList from '../components/crm/LeadList';
import { CreateLeadModal, EditLeadModal, DeleteLeadModal } from '../components/crm/Modals';
import MessageLibraryModal from '../components/crm/MessageLibraryModal';
import LiveDemoModal from '../components/crm/LiveDemoModal';

// Utils
import { formatWa } from '../utils/crmHelpers';

export default function CRM() {
  // State persistido en LocalStorage
  const [pureKeywords, setPureKeywords] = useState(() => localStorage.getItem('kf_pureKeywords') || 'salon,belleza,uñas,spa,barberia');
  const [radius, setRadius] = useState(() => Number(localStorage.getItem('kf_radius')) || 3000);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem('kf_limit')) || 15);
  const [lat, setLat] = useState(() => Number(localStorage.getItem('kf_lat')) || -11.500); 
  const [lng, setLng] = useState(() => Number(localStorage.getItem('kf_lng')) || -77.210);
  const [testMode, setTestMode] = useState(() => localStorage.getItem('kf_testMode') !== 'false');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false); // Puede ser boolean o string (tab name)
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  
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
    createLead,
    updateLead,
    refetchLeads
  } = useLeads(testMode);

  const {
    scraping,
    serverOnline,
    scraperLogs,
    iniciarScraper,
    detenerScraper,
    setScraperLogs
  } = useScraper();

  // Persistencia
  useEffect(() => {
    localStorage.setItem('kf_pureKeywords', pureKeywords);
    localStorage.setItem('kf_radius', radius.toString());
    localStorage.setItem('kf_limit', limit.toString());
    localStorage.setItem('kf_lat', lat.toString());
    localStorage.setItem('kf_lng', lng.toString());
    localStorage.setItem('kf_testMode', testMode.toString());
  }, [pureKeywords, radius, limit, lat, lng, testMode]);

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
      
      {/* Navegación Refactorizada */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
             <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <Package size={20} strokeWidth={2.5}/>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                     Korat<span className="text-primary italic">Flow</span>
                  </h1>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block h-4 w-px bg-slate-200" />
                  
                  {/* Status Group */}
                  <div className="flex items-center gap-4 lg:gap-8">
                     {/* Server Status */}
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Server</span>
                        <div className="flex items-center gap-1.5">
                           <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                           <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-tight">{serverOnline ? 'Online' : 'Offline'}</span>
                        </div>
                     </div>

                     <div className="h-8 w-px bg-slate-100 hidden sm:block" />

                     {/* Test Mode Toggle */}
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Modo de Prueba</span>
                        <button 
                          onClick={() => setTestMode(!testMode)} 
                          className="flex items-center gap-2 group transition-all"
                          title={testMode ? "Sandbox activado: Las eliminaciones NO son permanentes" : "Modo Producción: Las eliminaciones bloquean leads permanentemente"}
                        >
                           <div className={`relative w-9 h-5 rounded-full transition-all duration-300 ${testMode ? 'bg-amber-500 shadow-lg shadow-amber-200' : 'bg-slate-200'}`}>
                              <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${testMode ? 'translate-x-4' : 'translate-x-0'}`} />
                           </div>
                           <span className={`text-[9px] font-extrabold uppercase transition-colors hidden sm:block ${testMode ? 'text-amber-600' : 'text-slate-400'}`}>
                              {testMode ? 'Sandbox' : 'Live'}
                           </span>
                        </button>
                     </div>
                  </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsDemoModalOpen(true)} 
                 className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-100 active:scale-95"
               >
                 <PlayCircle size={16} /> <span>Modo Demo</span>
               </button>
               <button 
                 onClick={() => setIsLibraryModalOpen(true)} 
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
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-12">
        
        {/* Dashboard de KPIs */}
        <KPIDashboard leads={leads} />

        {/* Radar Panel */}
        <ScraperControls 
          lat={lat} lng={lng} setLat={setLat} setLng={setLng}
          zonas={zonas} radius={radius} setRadius={setRadius}
          limit={limit} setLimit={setLimit}
          pureKeywords={pureKeywords} setPureKeywords={setPureKeywords}
          scraping={scraping} scraperLogs={scraperLogs}
          setScraperLogs={setScraperLogs}
          serverOnline={serverOnline}
          iniciarScraper={() => iniciarScraper({ lat, lng, radius, limit, pureKeywords, testMode }, refetchLeads)}
          detenerScraper={detenerScraper}
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
          setEditingLead={setEditingLead}
          setIsEditModalOpen={setIsEditModalOpen}
          setLeadToDelete={setLeadToDelete}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          setIsLibraryModalOpen={setIsLibraryModalOpen}
          updateLead={updateLead}
          formatWa={formatWa}
        />
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
        onClose={() => setIsLibraryModalOpen(false)}
      />

      <LiveDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}

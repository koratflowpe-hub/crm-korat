import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MessageCircle, MapPin, Loader2, Sparkles, Search, Globe, Flame, Edit3, Send, 
  Trash2, UserPlus, X, Target, Crosshair, Phone, Activity, ChevronDown, Bot, Zap, Plus,
  Hash, Database, CheckCircle2, AlertCircle, Box, Trophy, Users, PlusCircle, Filter
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ESTADOS = [
  'Pendiente Análisis IA',
  'Pendiente',
  'Enviar Campaña Automática',
  'Apertura Enviado',
  'Respondió Apertura',
  'Enviar Activador',
  'Activador Enviado',
  'Respondió Activador',
  'Reunión Agendada',
  'No Interesado',
  'Cliente Cerrado'
];

const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

function MapClickHandler({ setLat, setLng }) {
  useMapEvents({
      click(e) {
          setLat(e.latlng.lat);
          setLng(e.latlng.lng);
      }
  });
  return null;
}

const getStatusColor = (status) => {
    switch(status) {
        case 'Apertura Enviado': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
        case 'Respondió Apertura': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'Enviar Activador': return 'bg-violet-50 text-violet-700 border-violet-100';
        case 'Activador Enviado': return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'Respondió Activador': return 'bg-teal-50 text-teal-700 border-teal-100';
        case 'Reunión Agendada': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Cliente Cerrado': return 'bg-slate-900 text-white border-transparent';
        case 'Pendiente Análisis IA': return 'bg-amber-50 text-amber-700 border-amber-100';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

const getTagStyle = (tag) => {
    const t = tag.toUpperCase();
    if (t.includes('CALIENTE')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (t.includes('TIBIO')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (t.includes('FRÍO') || t.includes('FRIO')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (t.includes('SIN WEB')) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (t.includes('CON WEB')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-slate-50 text-slate-500 border-slate-100';
};

const LeadCard = ({ lead, ESTADOS, updateEstado, updateNotas, updateMensajeApertura, updateMensajeActivador, deleteLead, setEditingLead, setIsEditModalOpen, setLeadToDelete, setIsDeleteModalOpen, formatWa }) => {
   const [showStatusMenu, setShowStatusMenu] = useState(false);
   const menuRef = useRef(null);

   useEffect(() => {
     function handleClickOutside(event) {
       if (menuRef.current && !menuRef.current.contains(event.target)) setShowStatusMenu(false);
     }
     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const statusColor = getStatusColor(lead.estado_contacto);

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-visible relative border border-slate-200 hover:border-slate-300">
            
            {/* Action Bar Floating */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                 <button onClick={() => { setEditingLead(lead); setIsEditModalOpen(true); }} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/50 rounded-lg transition-all shadow-sm" title="Editar Lead">
                     <Edit3 size={14} />
                 </button>
                 <button onClick={() => { setLeadToDelete(lead); setIsDeleteModalOpen(true); }} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-lg transition-all shadow-sm" title="Eliminar/Blacklist">
                     <Trash2 size={14} />
                 </button>
            </div>

           <div className="p-5 sm:p-6">
               <div className="flex items-start justify-between pr-14 sm:pr-20 mb-3">
                   <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-tight line-clamp-2 break-words">
                     {lead.nombre_salon}
                   </h3>
               </div>

               {lead.tags_ia && lead.tags_ia.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 mb-4">
                       {lead.tags_ia.map((tag, idx) => (
                           <span key={idx} className={`px-2 py-0.5 text-[10px] font-medium rounded-md border transition-all ${getTagStyle(tag)}`}>{tag}</span>
                       ))}
                   </div>
               )}
               
               <div className="flex flex-wrap items-center gap-2 mb-6 relative" ref={menuRef}>
                   <div 
                      onClick={() => setShowStatusMenu(!showStatusMenu)} 
                      className={`cursor-pointer px-3 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-2 transition-all outline-none ${statusColor} shadow-sm active:scale-95`}
                   >
                       <Activity size={12} strokeWidth={2.5}/>
                       <span className="truncate max-w-[120px]">{lead.estado_contacto || 'Pendiente'}</span>
                       <ChevronDown size={12} className={`transition-transform duration-300 ${showStatusMenu ? 'rotate-180' : ''}`} />
                   </div>
                   
                   {showStatusMenu && (
                       <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                               <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado del Lead</div>
                               {ESTADOS.map(st => (
                                   <div 
                                      key={st} 
                                      onClick={() => { updateEstado(lead.id, st); setShowStatusMenu(false); }}
                                      className={`px-3 py-2 text-xs font-medium cursor-pointer transition-all rounded-md ${lead.estado_contacto === st ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                   >
                                      {st}
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {lead.puntuacion_lead > 0 && (
                       <div className="bg-amber-50 border border-amber-200 text-amber-700 font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 shadow-sm">
                           <Flame size={12} className="fill-amber-500 text-amber-500"/>
                           {lead.puntuacion_lead}<span className="opacity-40 text-[9px]">/10</span>
                       </div>
                   )}
               </div>

               <div className="flex flex-col gap-4 text-[13px] font-bold text-muted-foreground/80">
                   <div className="flex items-start">
                       <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5 mr-4 opacity-70" />
                       <span className="line-clamp-1 leading-none tracking-tight">{lead.direccion || 'Ubicación no precisada'}</span>
                   </div>
                   <div className="flex items-center">
                       <div className="w-4 h-4 flex items-center justify-center mr-4">
                          <Phone size={14} className="text-primary opacity-70" />
                       </div>
                       <span className="font-black text-foreground tracking-widest uppercase">{lead.telefono || 'Sin número'}</span>
                   </div>
                   
                   <div className="flex items-center gap-5 mt-3 px-1">
                        <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 shadow-premium">
                            <span className="text-[12px] font-black">★ {lead.calificacion || '-'}</span> 
                            <span className="text-amber-500/40 text-[9px] font-bold tracking-widest ml-1">[{lead.total_resenas||0}]</span>
                        </div>
                        <div className="flex items-center gap-4">
                           {lead.sitioweb && <a href={lead.sitioweb?.startsWith('http') ? lead.sitioweb : `https://${lead.sitioweb}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground/50 hover:text-primary transition-all"><Globe size={18}/></a>}
                           {lead.url_instagram && <a href={lead.url_instagram?.startsWith('http') ? lead.url_instagram : `https://${lead.url_instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-pink-500/10 rounded-lg text-muted-foreground/50 hover:text-pink-500 transition-all"><InstagramIcon /></a>}
                           {lead.url_facebook && <a href={lead.url_facebook?.startsWith('http') ? lead.url_facebook : `https://${lead.url_facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-blue-500/10 rounded-lg text-muted-foreground/50 hover:text-blue-500 transition-all"><FacebookIcon /></a>}
                        </div>
                   </div>
               </div>
                <div className="bg-slate-50/50 mt-4 border-t border-slate-100">
                  <div className="p-6 space-y-5">
                      {lead.score_interes !== null && lead.score_interes !== undefined && (
                        <div className="space-y-2">
                           <div className="flex justify-between items-end mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Potencial de Venta</span>
                              <span className="text-xs font-bold text-slate-900">{lead.score_interes}%</span>
                           </div>
                           <div className="bg-slate-200 h-1.5 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full rounded-full transition-all duration-1000 ${lead.score_interes > 60 ? 'bg-primary' : 'bg-slate-300'}`} style={{width: `${lead.score_interes}%`}}></div>
                           </div>
                        </div>
                      )}

                      {lead.dolor_detectado && (
                        <div className="bg-white p-4 rounded-lg border border-rose-100 shadow-sm relative overflow-hidden">
                           <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                              Diagnóstico
                           </span>
                           <p className="text-xs text-slate-700 leading-relaxed font-medium">"{lead.dolor_detectado}"</p>
                        </div>
                      )}

                      {lead.gancho_venta && (
                        <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm relative overflow-hidden">
                           <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                              Propuesta Valor
                           </span>
                           <p className="text-xs text-slate-700 leading-relaxed font-medium">"{lead.gancho_venta}"</p>
                        </div>
                      )}

                      {lead.estado_contacto === 'Pendiente' && (
                         <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft Apertura</span>
                               <Edit3 size={12} className="text-slate-300" />
                             </div>
                             <textarea 
                                className="w-full text-xs font-medium p-3 rounded-lg border border-slate-200 bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none min-h-[80px]"
                                defaultValue={lead.mensaje_apertura || ''} 
                                onBlur={(e) => updateMensajeApertura(lead.id, e.target.value)}
                                placeholder="Escribe el mensaje de apertura aquí..."
                             />
                         </div>
                      )}

                      {lead.ultimo_mensaje_cliente && (
                          <div className="bg-slate-900 text-white p-4 rounded-lg shadow-md relative animate-in zoom-in-95">
                             <div className="absolute -top-2 left-4 bg-primary text-white text-[9px] font-bold px-3 py-1 rounded-md uppercase tracking-wider shadow-sm">
                                Respuesta Cliente
                             </div>
                             <p className="text-xs leading-relaxed font-medium mt-1">"{lead.ultimo_mensaje_cliente}"</p>
                          </div>
                      )}

                      {['Respondió Apertura', 'Respondió Activador', 'Apertura Enviado', 'Activador Enviado', 'Reunión Agendada', 'No Interesado'].includes(lead.estado_contacto) && (
                         <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative group/ia overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                               <span className="text-[10px] font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center">
                                   <Bot size={14}/> 
                                 </div>
                                 Asistente IA
                               </span>
                               <button 
                                 onClick={() => updateEstado(lead.id, 'Generar Sugerencia IA')} 
                                 className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-[10px] font-bold rounded-md transition-all"
                               >
                                   Analizar
                               </button>
                            </div>

                            {lead.sugerencia_respuesta_ia && (
                               <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex flex-wrap gap-1.5">
                                     {lead.tipo_respuesta && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase rounded-md">{lead.tipo_respuesta}</span>}
                                     {lead.lectura_rapida && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase rounded-md">{lead.lectura_rapida}</span>}
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                     <p className="text-xs text-slate-700 leading-relaxed font-medium">"{lead.sugerencia_respuesta_ia}"</p>
                                  </div>
                               </div>
                            )}
                         </div>
                      )}
                  </div>
            </div>

            <div className="p-5 pt-4 mt-auto border-t border-slate-100 flex flex-col gap-3">
               <div className="flex gap-2">
                  {lead.estado_contacto === 'Pendiente' ? (
                      <button onClick={() => updateEstado(lead.id, 'Enviar Campaña Automática')} className="flex-[4] flex justify-center items-center px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
                        <Send className="w-3.5 h-3.5 mr-2" /> Enviar Apertura
                      </button>
                  ) : lead.estado_contacto === 'Apertura Enviado' ? (
                      <div className="flex-[4] flex row gap-2">
                        <button onClick={() => updateEstado(lead.id, 'Enviar Activador')} className="flex-1 flex justify-center items-center py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg text-violet-600 bg-violet-50 border border-violet-100 active:scale-95">🚀 Activar</button>
                        <button onClick={() => updateEstado(lead.id, 'Respondió Apertura')} className="flex-1 flex justify-center items-center py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 active:scale-95">✅ OK</button>
                      </div>
                  ) : (lead.estado_contacto === 'Respondió Apertura' || lead.estado_contacto === 'Respondió Activador' || lead.estado_contacto === 'Activador Enviado') ? (
                      <div className="flex-[4] flex row gap-2">
                        <button onClick={() => updateEstado(lead.id, 'Reunión Agendada')} className="flex-1 py-2.5 text-[9px] font-bold uppercase tracking-wider rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100">📅 Agendar</button>
                        <button onClick={() => updateEstado(lead.id, 'Enviar Activador')} className="flex-1 py-2.5 text-[9px] font-bold uppercase tracking-wider rounded-lg text-violet-600 bg-violet-50 border border-violet-100">🚀 Push</button>
                        <button onClick={() => updateEstado(lead.id, 'No Interesado')} className="flex-1 py-2.5 text-[9px] font-bold uppercase tracking-wider rounded-lg text-rose-600 bg-rose-50 border border-rose-100">Discard</button>
                      </div>
                  ) : lead.estado_contacto === 'Reunión Agendada' ? (
                      <button onClick={() => updateEstado(lead.id, 'Cliente Cerrado')} className="flex-[4] py-3 text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white rounded-lg shadow-sm">🏆 GANADO</button>
                  ) : (
                      <div className="flex-[4] py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg text-slate-400 bg-slate-50 border border-slate-100 text-center opacity-50">Sincronizando...</div>
                  )}

                  <a href={`https://wa.me/${formatWa(lead.telefono)}`} target="_blank" rel="noopener noreferrer" 
                     className="flex-[1] flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-all shadow-sm group/wa">
                    <MessageCircle size={20} className="group-hover/wa:scale-110 transition-transform" />
                  </a>
               </div>
               
               <div className="relative">
                  <textarea
                      className="w-full text-[10px] font-medium p-2 rounded-lg border border-slate-100 bg-slate-50/50 text-slate-500 focus:border-slate-300 transition-all outline-none resize-none"
                      placeholder="LOGS Y NOTAS..." 
                      defaultValue={lead.notas || ''} 
                      onBlur={(e) => updateNotas(lead.id, e.target.value)}
                  />
               </div>
            </div>
        </div>
    </div>
    );
};

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const defaultPureKeywords = 'salon,belleza,uñas,pestañas,cejas,cabello,alisado,nails,lash,brows,pedicura,manicura,extensiones,planchado,microblading,spa,estetica,barberia';
  
  const [ubicacion, setUbicacion] = useState(() => localStorage.getItem('kf_ubicacion') || 'salon de belleza');
  const [palabrasClaves, setPalabrasClaves] = useState(() => localStorage.getItem('kf_palabrasClaves') || 'Spa, Nails, Estética');
  const [pureKeywords, setPureKeywords] = useState(() => localStorage.getItem('kf_pureKeywords') || defaultPureKeywords);
  const [radius, setRadius] = useState(() => Number(localStorage.getItem('kf_radius')) || 3000);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem('kf_limit')) || 15);
  const [lat, setLat] = useState(() => Number(localStorage.getItem('kf_lat')) || -11.500); 
  const [lng, setLng] = useState(() => Number(localStorage.getItem('kf_lng')) || -77.210);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ nombre_salon: '', telefono: '', direccion: '', sitioweb: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [scraperLogs, setScraperLogs] = useState([]);
  const [scraperUrl, setScraperUrl] = useState(() => import.meta.env.VITE_SCRAPER_URL || 'http://localhost:3001');
  const [testMode, setTestMode] = useState(() => localStorage.getItem('kf_testMode') !== 'false');

  useEffect(() => {
    localStorage.setItem('kf_ubicacion', ubicacion);
    localStorage.setItem('kf_palabrasClaves', palabrasClaves);
    localStorage.setItem('kf_pureKeywords', pureKeywords);
    localStorage.setItem('kf_radius', radius.toString());
    localStorage.setItem('kf_limit', limit.toString());
    localStorage.setItem('kf_lat', lat.toString());
    localStorage.setItem('kf_lng', lng.toString());
    localStorage.setItem('kf_testMode', testMode.toString());
  }, [ubicacion, palabrasClaves, pureKeywords, radius, limit, lat, lng, testMode]);

  useEffect(() => {
    fetchLeads();
    fetchZonas();
    checkScraperStatus();

    const subLeads = supabase.channel('public:leads_salones').on('postgres_changes', { event: '*', schema: 'public', table: 'leads_salones' }, () => { fetchLeads(); }).subscribe();
    const subZonas = supabase.channel('public:zonas_prospectadas').on('postgres_changes', { event: '*', schema: 'public', table: 'zonas_prospectadas' }, () => { fetchZonas(); }).subscribe();
    const interval = setInterval(checkScraperStatus, 3000);

    return () => {
      supabase.removeChannel(subLeads);
      supabase.removeChannel(subZonas);
      clearInterval(interval);
    };
  }, [scraperUrl]);

  async function checkScraperStatus() {
    try {
      const res = await fetch(`${scraperUrl}/api/scrape/status`);
      const data = await res.json();
      setServerOnline(true);
      setScraping(data.isRunning);
    } catch (err) {
      setServerOnline(false);
      setScraping(false);
    }
  }

  async function fetchZonas() {
    const { data } = await supabase.from('zonas_prospectadas').select('*');
    if (data) setZonas(data);
  }

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase.from('leads_salones').select('*').order('puntuacion_lead', { ascending: false }).order('created_at', { ascending: false }); 
    if (!error) setLeads(data || []);
    setLoading(false);
  }

  async function updateEstado(id, nuevoEstado) {
    const { error } = await supabase.from('leads_salones').update({ estado_contacto: nuevoEstado }).eq('id', id);
    if (!error) setLeads(leads.map(lead => lead.id === id ? { ...lead, estado_contacto: nuevoEstado } : lead));
  }

  async function updateNotas(id, notasText) {
    const { error } = await supabase.from('leads_salones').update({ notas: notasText }).eq('id', id);
    if (!error) setLeads(leads.map(lead => lead.id === id ? { ...lead, notas: notasText } : lead));
  }

  async function updateMensajeApertura(id, texto) {
    const { error } = await supabase.from('leads_salones').update({ mensaje_apertura: texto }).eq('id', id);
    if (!error) setLeads(leads.map(lead => lead.id === id ? { ...lead, mensaje_apertura: texto } : lead));
  }

  async function updateMensajeActivador(id, texto) {
    const { error } = await supabase.from('leads_salones').update({ mensaje_activador: texto }).eq('id', id);
    if (!error) setLeads(leads.map(lead => lead.id === id ? { ...lead, mensaje_activador: texto } : lead));
  }

  async function deleteLead(leadObj) {
    const previousLeads = [...leads];
    setLeads(leads.filter(l => l.id !== leadObj.id));
    try {
      if (!testMode && leadObj.telefono) {
        await supabase.from('leads_rechazados').upsert([{ telefono: leadObj.telefono, nombre_salon: leadObj.nombre_salon }]);
      }
      const { error } = await supabase.from('leads_salones').delete().eq('id', leadObj.id);
      if (error) throw error;
    } catch (err) {
      setLeads(previousLeads);
      alert('Error al eliminar lead.');
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!newLead.nombre_salon || !newLead.telefono) return alert('Nombre y teléfono obligatorios');
    const { data, error } = await supabase.from('leads_salones').insert([{ ...newLead, busqueda_origen: 'Creación Manual' }]).select();
    if (!error) {
        setLeads([data[0], ...leads]);
        setIsModalOpen(false);
        setNewLead({nombre_salon: '', telefono: '', direccion: '', sitioweb: ''});
    }
  }

  async function handleUpdateLead(e) {
    e.preventDefault();
    if (!editingLead) return;
    const { error } = await supabase.from('leads_salones').update({
        nombre_salon: editingLead.nombre_salon,
        telefono: editingLead.telefono,
        direccion: editingLead.direccion,
        sitioweb: editingLead.sitioweb,
        url_facebook: editingLead.url_facebook,
        url_instagram: editingLead.url_instagram,
        mensaje_apertura: editingLead.mensaje_apertura,
        mensaje_activador: editingLead.mensaje_activador,
        score_interes: editingLead.score_interes,
        sugerencia_respuesta_ia: editingLead.sugerencia_respuesta_ia
    }).eq('id', editingLead.id);
    
    if (!error) {
        setLeads(leads.map(l => l.id === editingLead.id ? editingLead : l));
        setIsEditModalOpen(false);
        setEditingLead(null);
    }
  }

  async function iniciarScraper() {
    if (!pureKeywords.trim()) return alert("Las palabras obligatorias no pueden estar vacías.");
    try {
      setScraping(true);
      setScraperLogs(["🚀 Iniciando motor de prospección...", `📍 Área: ${ubicacion}`, `🎯 Objetivo: ${limit} leads`]);
      const res = await fetch(`${scraperUrl}/api/scrape`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ubicacion, palabrasClaves, lat, lng, radius, limit, pureKeywords })
      });
      if (res.ok) setScraperLogs(prev => [...prev, "✅ Comando enviado correctamente."]);
      else { setScraping(false); alert('Error en servidor.'); }
    } catch (err) { setScraping(false); alert('Error conectando con el servidor.'); }
  }

  async function detenerScraper() {
    try {
      const res = await fetch(`${scraperUrl}/api/scrape/stop`, { method: 'POST' });
      if (res.ok) { setScraping(false); setScraperLogs(prev => [...prev, "🛑 Scraper detenido."]); }
    } catch (err) { alert('Error deteniendo el scraper.'); }
  }

  const formatWa = (phone) => {
    let clean = (phone||'').replace(/\D/g, '');
    if (clean.length === 9 && clean.startsWith('9')) clean = '51' + clean;
    return clean;
  };

  const filteredLeads = leads.filter(lead => {
     const ms = (lead.nombre_salon || '').toLowerCase().includes(searchQuery.toLowerCase()) || (lead.telefono || '').toLowerCase().includes(searchQuery.toLowerCase());
     const mst = statusFilter === 'Todos' || lead.estado_contacto === statusFilter;
     return ms && mst;
  });

  const leadsApertura = leads.filter(l => ['Apertura Enviado', 'Respondió Apertura', 'Enviar Activador', 'Activador Enviado', 'Respondió Activador', 'Reunión Agendada', 'Cliente Cerrado'].includes(l.estado_contacto)).length;
  const leadsRespondieronApertura = leads.filter(l => ['Respondió Apertura', 'Enviar Activador', 'Activador Enviado', 'Respondió Activador', 'Reunión Agendada', 'Cliente Cerrado'].includes(l.estado_contacto)).length;
  const tasaApertura = leadsApertura > 0 ? Math.round((leadsRespondieronApertura / leadsApertura) * 100) : 0;
  const leadsActivador = leads.filter(l => ['Activador Enviado', 'Respondió Activador', 'Reunión Agendada', 'Cliente Cerrado'].includes(l.estado_contacto)).length;
  const leadsRespondieronActivador = leads.filter(l => ['Respondió Activador', 'Reunión Agendada', 'Cliente Cerrado'].includes(l.estado_contacto)).length;
  const tasaActivador = leadsActivador > 0 ? Math.round((leadsRespondieronActivador / leadsActivador) * 100) : 0;

  return (
    <div className="min-h-screen bg-background/50 font-sans selection:bg-primary/30 transition-colors duration-300 pb-20">
      
      {/* SaaS Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                    <Box size={18} strokeWidth={2.5} />
                 </div>
                 <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Korat<span className="text-primary italic">Flow</span>
                 </h1>
               </div>
               
               <div className="hidden md:flex items-center gap-6">
                 <div className="h-4 w-px bg-slate-200" />
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Status</span>
                       <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <span className="text-[10px] font-bold text-slate-900 uppercase">{serverOnline ? 'Online' : 'Offline'}</span>
                       </div>
                    </div>
                    <div className="h-8 w-px bg-slate-100" />
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Modo</span>
                       <button onClick={() => setTestMode(!testMode)} className="flex items-center gap-2 mt-1 group">
                          <span className={`text-[10px] font-bold uppercase transition-colors ${testMode ? 'text-amber-500' : 'text-primary'}`}>
                             {testMode ? 'Sandbox' : 'Producción'}
                          </span>
                       </button>
                    </div>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end px-4 border-r border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Base de Datos</span>
                <span className="text-sm font-bold text-slate-900">{leads.length} Leads</span>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Nuevo Lead</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-12">
        
        {/* SaaS KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                 <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                   <Users size={18} />
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prospectos</div>
              </div>
              <div className="space-y-1">
                 <h3 className="text-3xl font-bold text-slate-900">{leads.length}</h3>
                 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Identificados</p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                   <Activity size={18} />
                 </div>
                 <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Conversión: {tasaApertura}%</div>
              </div>
              <div className="space-y-1">
                 <h3 className="text-3xl font-bold text-slate-900">{leadsApertura}</h3>
                 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aperturas Iniciadas</p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                 <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
                   <Flame size={18} />
                 </div>
                 <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Interés Alto</div>
              </div>
              <div className="space-y-1">
                 <h3 className="text-3xl font-bold text-slate-900">{leadsActivador}</h3>
                 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">En Fase de Cierre</p>
              </div>
           </div>

           <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                 <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                   <Trophy size={18} />
                 </div>
                 <div className="text-[10px] font-bold text-primary uppercase tracking-widest">Ratio: {tasaActivador}%</div>
              </div>
              <div className="space-y-1">
                 <h3 className="text-3xl font-bold text-slate-900">{leads.filter(l => l.estado_contacto === 'Cliente Cerrado').length}</h3>
                 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ventas Cerradas</p>
              </div>
           </div>
        </div>

         {/* Radar Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
            <div className="flex flex-col xl:flex-row">
                {/* Map Area */}
                <div className="xl:w-[45%] h-[400px] xl:h-[600px] relative z-0 bg-slate-50 border-r border-slate-100">
                    <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" />
                        {zonas.map(z => (
                            <Circle key={z.id} center={[z.lat, z.lng]} radius={z.radius} pathOptions={{ color: '#0f172a', fillColor: '#0f172a', fillOpacity: 0.1, weight: 1 }} />
                        ))}
                        <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2, dashArray: '5, 5' }} />
                        <MapClickHandler setLat={setLat} setLng={setLng} />
                    </MapContainer>
                    
                    <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-200 shadow-lg text-[10px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Crosshair size={14} className="text-primary animate-pulse"/> 
                        Radar de Prospección Activo
                    </div>
                </div>

                {/* Scraper Controls */}
                <div className="xl:w-[55%] p-8 lg:p-10 flex flex-col gap-8 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                          Motor de Extracción
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider">v2.1 Pro</span>
                        </h2>
                        <p className="text-xs font-medium text-slate-500 mt-1">Identifica negocios locales y analiza su presencia digital con IA.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Leads a Buscar</label>
                            <div className="relative">
                              <input type="number" className="w-full pl-10 h-12 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none" value={limit} onChange={e => setLimit(Number(e.target.value))} />
                              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Radio de Escaneo</label>
                               <span className="text-xs font-bold text-primary">{(radius / 1000).toFixed(1)} KM</span>
                            </div>
                            <div className="h-12 flex items-center px-4 bg-slate-50 rounded-lg border border-slate-200">
                               <input type="range" min="500" max="25000" step="500" className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary" value={radius} onChange={e => setRadius(Number(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 ml-1">
                          Keywords de Filtrado IA
                        </label>
                        <textarea 
                            className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
                            value={pureKeywords}
                            onChange={e => setPureKeywords(e.target.value)}
                            placeholder="Ej: salon, nails, spa, barberia..."
                        />
                    </div>

                    {scraping && (
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 font-mono text-[10px] h-32 overflow-y-auto space-y-1.5 scroll-smooth shadow-inner relative">
                        {scraperLogs.map((log, i) => (
                          <div key={i} className="text-slate-300">
                            <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            {log}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                        onClick={scraping ? detenerScraper : iniciarScraper} disabled={!serverOnline}
                        className={`w-full h-14 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-sm ${
                        scraping ? 'bg-rose-500 text-white hover:bg-rose-600' : 
                        !serverOnline ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' :
                        'bg-primary text-white hover:bg-primary/90 active:scale-95'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {scraping ? <X size={16} /> : <Zap size={16} />}
                            {scraping ? 'Detener Proceso' : !serverOnline ? 'Servidor Desconectado' : `Iniciar Prospección`}
                        </div>
                    </button>
                </div>
            </div>
        </div>

        {/* CRM Filters & List Container */}
        <div className="space-y-12">
        {/* CRM Filters */}
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

        {/* Lead Grid & States */}
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
                      ESTADOS={ESTADOS}
                      updateEstado={updateEstado} 
                      updateNotas={updateNotas}
                      updateMensajeApertura={updateMensajeApertura}
                      updateMensajeActivador={updateMensajeActivador}
                      deleteLead={deleteLead} 
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
      </main>

      {/* Manual Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus size={18} className="text-primary" /> Nuevo Prospecto
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"><X size={18} /></button>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] py-2.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition-all transform active:scale-95">Registrar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Engineering (Edit) Modal */}
      {isEditModalOpen && editingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-8 overflow-hidden transform transition-all">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                 <Edit3 className="text-primary" size={20} /> Optimización de Lead
               </h2>
               <button onClick={() => { setIsEditModalOpen(false); setEditingLead(null); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"><X size={20} /></button>
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

              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Sugerencia IA / Análisis</label>
                  <textarea className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none" value={editingLead.sugerencia_respuesta_ia || ''} onChange={e => setEditingLead({...editingLead, sugerencia_respuesta_ia: e.target.value})} />
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
              </div>
            </form>
            
            <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/30">
               <button onClick={() => { setIsEditModalOpen(false); setEditingLead(null); }} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cerrar</button>
               <button onClick={handleUpdateLead} className="flex-[2] py-2.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition-all transform active:scale-95">Sincronizar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && leadToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-2xl p-8 border border-slate-100 shadow-2xl flex flex-col items-center text-center transform transition-all">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500 border border-rose-100">
                 <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar Registro</h3>
              <p className="text-sm text-slate-500 mb-8">¿Confirmas que deseas eliminar a <span className="font-bold text-slate-900">{leadToDelete.nombre_salon}</span>? Esta acción es irreversible.</p>
              
              <div className="flex gap-3 w-full">
                <button onClick={() => { setIsDeleteModalOpen(false); setLeadToDelete(null); }} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
                <button onClick={() => { deleteLead(leadToDelete); setIsDeleteModalOpen(false); setLeadToDelete(null); }} className="flex-[2] py-2.5 text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 rounded-lg shadow-sm transition-all transform active:scale-95">Eliminar Ahora</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

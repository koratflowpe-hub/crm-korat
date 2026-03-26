import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { MessageCircle, MapPin, Store, Star, Loader2, PlayCircle, Sparkles, Search, Globe, Flame, Edit3, Send, Trash2, UserPlus, X, Target, Crosshair, Phone, Activity, ChevronDown, ChevronUp, Bot, ArrowRight, Zap } from 'lucide-react';
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

const RadarScanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="M12 12l8.5 8.5"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M15.54 8.46a5 5 0 0 0-7.08 7.08"/></svg>
);

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
        case 'Apertura Enviado': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Respondió Apertura': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Enviar Activador': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'Activador Enviado': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'Respondió Activador': return 'bg-teal-50 text-teal-700 border-teal-200';
        case 'Reunión Agendada': return 'bg-green-50 text-green-700 border-green-200';
        case 'Cliente Cerrado': return 'bg-gray-900 text-white border-gray-900';
        case 'Pendiente Análisis IA': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'Enviar Campaña Automática': return 'bg-rose-50 text-rose-700 border-rose-200';
        default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
};

const getTagStyle = (tag) => {
    const t = tag.toUpperCase();
    if (t.includes('CALIENTE')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (t.includes('TIBIO')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (t.includes('FRÍO') || t.includes('FRIO')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (t.includes('SIN WEB')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (t.includes('CON WEB')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (t.includes('SOLO REDES')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (t.includes('INSTAGRAM')) return 'bg-pink-100 text-pink-700 border-pink-200';
    if (t.includes('FACEBOOK')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
};

const LeadCard = ({ lead, ESTADOS, updateEstado, updateNotas, updateMensajeApertura, updateMensajeActivador, deleteLead, testMode, setEditingLead, setIsEditModalOpen, formatWa }) => {
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
       <div className="group bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col overflow-visible relative">
           
           <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button onClick={() => { setEditingLead(lead); setIsEditModalOpen(true); }} className="p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100/50 text-slate-400 hover:text-indigo-600 rounded-full transition-all md:opacity-0 group-hover:opacity-100 hover:scale-110" title="Editar Lead">
                    <Edit3 size={15} />
                </button>
                <button onClick={() => deleteLead(lead)} className="p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100/50 text-slate-400 hover:text-rose-500 rounded-full transition-all md:opacity-0 group-hover:opacity-100 hover:scale-110" title="Eliminar/Blacklist">
                    <Trash2 size={15} />
                </button>
           </div>

           <div className="px-6 pt-6 pb-4">
               <div className="flex items-start justify-between pr-16 mb-2">
                   <h3 className="font-extrabold text-[1.05rem] tracking-tight leading-tight text-slate-800 line-clamp-2 pr-2">{lead.nombre_salon}</h3>
               </div>

               {lead.tags_ia && lead.tags_ia.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 mt-1">
                       {lead.tags_ia.map((tag, idx) => (
                           <span key={idx} className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg border shadow-sm transition-colors ${getTagStyle(tag)}`}>{tag}</span>
                       ))}
                   </div>
               )}
               
               <div className="flex flex-wrap items-center gap-2 mt-3 mb-4 relative" ref={menuRef}>
                   <div 
                      onClick={() => setShowStatusMenu(!showStatusMenu)} 
                      className={`cursor-pointer px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all outline-none ${statusColor} hover:brightness-95 shadow-sm`}
                   >
                       <Activity size={13} strokeWidth={2.5}/>
                       <span className="truncate max-w-[130px]">{lead.estado_contacto || 'Pendiente'}</span>
                       <ChevronDown size={14} className={`transition-transform duration-200 ${showStatusMenu ? 'rotate-180' : ''}`} />
                   </div>
                   
                   {showStatusMenu && (
                       <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                           <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
                               <div className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">Cambiar Etapa Manual</div>
                               {ESTADOS.map(st => (
                                   <div 
                                      key={st} 
                                      onClick={() => { updateEstado(lead.id, st); setShowStatusMenu(false); }}
                                      className={`px-3 py-2.5 text-xs font-bold cursor-pointer transition-colors rounded-xl ${lead.estado_contacto === st ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                   >
                                      {st}
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {lead.puntuacion_lead > 0 && (
                       <div className="bg-orange-50 border border-orange-200 text-orange-700 font-bold px-2.5 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-sm">
                           <Flame size={13} className="fill-orange-500 text-orange-500"/>{lead.puntuacion_lead}/10
                       </div>
                   )}
               </div>

               <div className="flex flex-col gap-2.5 text-[13px] font-medium text-slate-500">
                   <div className="flex items-start">
                       <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 mr-2" />
                       <span className="line-clamp-1 leading-snug">{lead.direccion || 'Ubicación no precisada'}</span>
                   </div>
                   <div className="flex items-center">
                       <Phone className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                       <span className="font-bold text-slate-700">{lead.telefono || 'Sin número'}</span>
                   </div>
                   
                   <div className="flex items-center gap-3 mt-1.5">
                       <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                           <Star className="w-3.5 h-3.5 fill-current" /> <span className="text-xs font-bold">{lead.calificacion || '-'}</span> <span className="text-amber-600/70 text-[10px]">({lead.total_resenas||0})</span>
                       </div>
                       {lead.sitioweb && <a href={lead.sitioweb?.startsWith('http') ? lead.sitioweb : `https://${lead.sitioweb}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors"><Globe size={15}/></a>}
                       {lead.url_instagram && <a href={lead.url_instagram?.startsWith('http') ? lead.url_instagram : `https://${lead.url_instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-500 transition-colors"><InstagramIcon /></a>}
                       {lead.url_facebook && <a href={lead.url_facebook?.startsWith('http') ? lead.url_facebook : `https://${lead.url_facebook}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors"><FacebookIcon /></a>}
                   </div>
               </div>
           </div>

           <div className="border-t border-slate-100/80 bg-slate-50/50 pt-2">
                  <div className="px-6 pb-5 space-y-4 transition-all">
                      {lead.score_interes !== null && lead.score_interes !== undefined && (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/70 shadow-sm">
                            <Flame size={16} className={lead.score_interes > 60 ? 'text-orange-500' : 'text-slate-400'}/>
                            <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className={`h-full ${lead.score_interes > 60 ? 'bg-gradient-to-r from-orange-400 to-rose-500' : lead.score_interes > 30 ? 'bg-amber-400' : 'bg-slate-400'}`} style={{width: `${Math.min(100, Math.max(0, lead.score_interes))}%`}}></div>
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-700">{lead.score_interes} pts</span>
                        </div>
                      )}
                      {lead.dolor_detectado && (
                        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                          <span className="text-[10px] font-black text-rose-400 tracking-widest uppercase mb-1.5 flex items-center gap-1.5"><Target size={12}/> Diagnóstico IA (Dolor)</span>
                          <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{lead.dolor_detectado}</p>
                        </div>
                      )}

                      {lead.gancho_venta && (
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                          <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase mb-1.5 flex items-center gap-1.5"><ArrowRight size={12}/> Ángulo de Venta</span>
                          <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{lead.gancho_venta}</p>
                        </div>
                      )}

                      {lead.estado_contacto === 'Pendiente' && (
                         <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-4 rounded-xl border border-indigo-100 shadow-sm mt-3 animate-in fade-in">
                             <span className="text-[10px] font-black text-indigo-600 tracking-widest uppercase mb-2 block flex items-center gap-1.5"><Edit3 size={12}/> Borrador: Mensaje de Apertura</span>
                             <textarea 
                                className="w-full text-[13px] font-medium text-slate-700 bg-white border border-indigo-100 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[90px] shadow-sm transition-all"
                                defaultValue={lead.mensaje_apertura || ''} 
                                onBlur={(e) => updateMensajeApertura(lead.id, e.target.value)}
                             />
                             <p className="text-[10px] text-indigo-400/80 mt-2 font-medium italic">Edita el texto a tu gusto antes de lanzarlo.</p>
                         </div>
                      )}

                      {['Apertura Enviado', 'Respondió Apertura'].includes(lead.estado_contacto) && (
                         <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-4 rounded-xl border border-purple-100 shadow-sm mt-3 animate-in fade-in">
                             <span className="text-[10px] font-black text-purple-600 tracking-widest uppercase mb-2 block flex items-center gap-1.5"><Edit3 size={12}/> Borrador: Mensaje Activador</span>
                             <textarea 
                                className="w-full text-[13px] font-medium text-slate-700 bg-white border border-purple-100 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none resize-none min-h-[90px] shadow-sm transition-all"
                                defaultValue={lead.mensaje_activador || ''} 
                                onBlur={(e) => updateMensajeActivador(lead.id, e.target.value)}
                             />
                             <p className="text-[10px] text-purple-400/80 mt-2 font-medium italic">Si el cliente no responde, este será el mensaje de rescate.</p>
                         </div>
                      )}

                      {lead.ultimo_mensaje_cliente && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm mt-4 animate-in fade-in relative">
                             <div className="absolute -top-2.5 left-4 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded border border-slate-700 shadow-sm uppercase tracking-widest flex items-center gap-1.5"><MessageCircle size={10}/> El cliente escribió:</div>
                             <p className="text-[14px] text-slate-700 italic font-medium mt-1">"{lead.ultimo_mensaje_cliente}"</p>
                          </div>
                      )}

                      {['Respondió Apertura', 'Respondió Activador', 'Apertura Enviado', 'Activador Enviado', 'Reunión Agendada', 'No Interesado'].includes(lead.estado_contacto) && (
                         <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 mt-3 shadow-inner">
                            <div className="flex justify-between items-center mb-2">
                               <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase flex items-center gap-1.5"><Bot size={12}/> Copiloto IA </span>
                               <button onClick={() => updateEstado(lead.id, 'Generar Sugerencia IA')} className="text-[10px] bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-black uppercase tracking-tighter active:scale-95">
                                   🤖 Generar Estrategia
                               </button>
                            </div>

                            {lead.sugerencia_respuesta_ia && (
                               <div className="space-y-3 mt-3 pt-3 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex gap-2">
                                     {lead.tipo_respuesta && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-lg shadow-sm">{lead.tipo_respuesta}</span>}
                                     {lead.lectura_rapida && <span className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 text-[9px] font-bold rounded-lg line-clamp-1">{lead.lectura_rapida}</span>}
                                  </div>
                                  <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-sm">
                                     <p className="text-[13px] text-indigo-950 leading-relaxed font-bold italic">"{lead.sugerencia_respuesta_ia}"</p>
                                  </div>
                                  {lead.nota_tactica && (
                                     <div className="flex items-start gap-1.5 text-[11px] font-bold text-slate-500">
                                        <Zap size={10} className="mt-0.5 shrink-0 text-amber-500" />
                                        <span>{lead.nota_tactica}</span>
                                     </div>
                                  )}
                               </div>
                            )}
                         </div>
                      )}
                      
                      <div className="relative group/note mt-2">
                          <textarea
                              className="w-full text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[70px] shadow-sm transition-all"
                              placeholder="Añadir nota interna para el equipo..." defaultValue={lead.notas || ''} onBlur={(e) => updateNotas(lead.id, e.target.value)}
                          />
                      </div>
                  </div>
           </div>

           <div className="mt-auto"></div>

           <div className="p-4 bg-white border-t border-slate-100/80 rounded-b-3xl flex gap-2.5 items-center">
               
               {lead.estado_contacto === 'Pendiente' ? (
                   <button onClick={() => updateEstado(lead.id, 'Enviar Campaña Automática')} className="flex-[3] flex justify-center items-center px-4 py-3.5 text-sm font-extrabold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:-translate-y-0.5">
                     <Send className="w-4 h-4 mr-2" /> Lanzar Apertura
                   </button>
               ) : lead.estado_contacto === 'Apertura Enviado' ? (
                   <div className="flex-[3] flex flex-row gap-2">
                     <button onClick={() => updateEstado(lead.id, 'Enviar Activador')} className="flex-1 flex justify-center items-center px-2 py-3.5 text-[12px] font-bold rounded-2xl text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all shadow-sm group">
                       <span className="text-base mr-1 group-hover:scale-110 transition-transform">🚀</span> Push Activador
                     </button>
                     <button onClick={() => updateEstado(lead.id, 'Respondió Apertura')} className="flex-1 flex justify-center items-center px-2 py-3.5 text-[12px] font-bold rounded-2xl text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm group">
                       <span className="text-base mr-1 group-hover:scale-110 transition-transform">✅</span> Respondió
                     </button>
                   </div>
               ) : (lead.estado_contacto === 'Respondió Apertura' || lead.estado_contacto === 'Respondió Activador' || lead.estado_contacto === 'Activador Enviado') ? (
                   <div className="flex-[3] flex flex-row gap-2">
                     <button onClick={() => updateEstado(lead.id, 'Reunión Agendada')} className="flex-1 flex justify-center items-center px-1 py-3.5 text-[11px] font-bold rounded-2xl text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm group">
                       <span className="text-base mr-1 group-hover:scale-110 transition-transform">✅</span> Agendar
                     </button>
                     <button onClick={() => updateEstado(lead.id, 'Enviar Activador')} className="flex-1 flex justify-center items-center px-1 py-3.5 text-[11px] font-bold rounded-2xl text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all shadow-sm group">
                       <span className="text-base mr-1 group-hover:scale-110 transition-transform">🚀</span> Push
                     </button>
                     <button onClick={() => updateEstado(lead.id, 'No Interesado')} className="flex-1 flex justify-center items-center px-1 py-3.5 text-[11px] font-bold rounded-2xl text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all shadow-sm group">
                       <span className="text-base mr-1 group-hover:scale-110 transition-transform">💀</span> Perder
                     </button>
                   </div>
               ) : lead.estado_contacto === 'Reunión Agendada' ? (
                   <button onClick={() => updateEstado(lead.id, 'Cliente Cerrado')} className="flex-[3] flex justify-center items-center px-4 py-3.5 text-sm font-black rounded-2xl text-white bg-slate-900 hover:bg-black transition-all shadow-md hover:-translate-y-0.5">
                     🏆 Ganado (Cerrar)
                   </button>
               ) : (
                   <div className="flex-[3] flex justify-center items-center px-4 py-3.5 text-[13px] font-bold rounded-2xl text-slate-400 border border-slate-200 bg-slate-50 cursor-not-allowed">
                     {lead.estado_contacto === 'Pendiente Análisis IA' ? '🤖 IA Analizando local...' : 
                      lead.estado_contacto === 'Enviar Campaña Automática' ? '⏱️ Enviando Whatsapp...' : 
                      lead.estado_contacto === 'Enviar Activador' ? '⏱️ Lanzando Activador...' : lead.estado_contacto}
                   </div>
               )}

               <a href={`https://wa.me/${formatWa(lead.telefono)}`} target="_blank" rel="noopener noreferrer" 
                  className="flex-[1] flex justify-center items-center px-4 py-3.5 rounded-2xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                 <MessageCircle className="w-5 h-5" />
               </a>
           </div>

       </div>
   );
};

function App() {
  const [leads, setLeads] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  
  // Params del Scraper y Filtros - Guardados en LocalStorage
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
  
  // Nilah CRM Engine Mode
  const [testMode, setTestMode] = useState(() => localStorage.getItem('kf_testMode') !== 'false');

  // Guardar configuración automáticamente cuando cambie
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

    const subLeads = supabase
      .channel('public:leads_salones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads_salones' }, () => {
        fetchLeads();
      })
      .subscribe();

    const subZonas = supabase
      .channel('public:zonas_prospectadas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zonas_prospectadas' }, () => {
        fetchZonas();
      })
      .subscribe();

    const interval = setInterval(checkScraperStatus, 3000);

    return () => {
      supabase.removeChannel(subLeads);
      supabase.removeChannel(subZonas);
      clearInterval(interval);
    };
  }, []);

  async function checkScraperStatus() {
    try {
      const res = await fetch('http://127.0.0.1:3001/api/scrape/status');
      const data = await res.json();
      setScraping(data.isRunning);
    } catch (err) {
      console.log('Error checking scraper status', err);
    }
  }

  async function fetchZonas() {
    const { data } = await supabase.from('zonas_prospectadas').select('*');
    if (data) setZonas(data);
  }

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads_salones')
      .select('*')
      .order('puntuacion_lead', { ascending: false })
      .order('created_at', { ascending: false }); 

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      setLeads(data || []);
    }
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
    if (!window.confirm(`¿Seguro que deseas eliminar a ${leadObj.nombre_salon}? \n\n${!testMode ? '(Modo Producción: Este lead irá a la Blacklist y nunca más se volverá a raspar de Google)' : '(Modo Pruebas: Podrá volver a ser capturado si vuelves a escanear)' }`)) return;
    
    const previousLeads = [...leads];
    setLeads(leads.filter(l => l.id !== leadObj.id));

    if (!testMode) {
      await supabase.from('leads_rechazados').upsert([{ 
        telefono: leadObj.telefono, 
        nombre_salon: leadObj.nombre_salon 
      }]);
    }

    const { error } = await supabase.from('leads_salones').delete().eq('id', leadObj.id);
    if (error) setLeads(previousLeads);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!newLead.nombre_salon || !newLead.telefono) return alert('Nombre y teléfono obligatorios');
    const { data, error } = await supabase.from('leads_salones').insert([{
        nombre_salon: newLead.nombre_salon,
        telefono: newLead.telefono,
        direccion: newLead.direccion,
        sitioweb: newLead.sitioweb,
        busqueda_origen: 'Creación Manual'
    }]).select();

    if (!error) {
        setLeads([data[0], ...leads]);
        setIsModalOpen(false);
        setNewLead({nombre_salon: '', telefono: '', direccion: '', sitioweb: ''});
    }
  }

  async function handleUpdateLead(e) {
    e.preventDefault();
    if (!editingLead) return;
    const { error } = await supabase.from('leads_salones')
        .update({
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
        })
        .eq('id', editingLead.id);
    
    if (!error) {
        setLeads(leads.map(l => l.id === editingLead.id ? editingLead : l));
        setIsEditModalOpen(false);
        setEditingLead(null);
    } else {
        alert("Error guardando cambios del lead.");
        console.error(error);
    }
  }

  async function iniciarScraper() {
    if (!pureKeywords.trim()) return alert("Las palabras obligatorias no pueden estar vacías.");
    try {
      setScraping(true);
      await fetch('http://127.0.0.1:3001/api/scrape', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ubicacion, palabrasClaves, lat, lng, radius, limit, pureKeywords })
      });
    } catch (err) {
      alert('Error iniciando scraper local.');
      setScraping(false);
    }
  }

  const formatWa = (phone) => {
    let clean = (phone||'').replace(/\D/g, '');
    if (clean.length === 9 && clean.startsWith('9')) clean = '51' + clean;
    return clean;
  };

  const filteredLeads = leads.filter(lead => {
     const ms = lead.nombre_salon?.toLowerCase().includes(searchQuery.toLowerCase()) || lead.telefono?.includes(searchQuery);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* Navbar Premium */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  Nilah Geo-Prospector
                </h1>
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Enterprise Edition V3</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 mr-2">
                 <button 
                    onClick={() => setTestMode(!testMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${testMode ? 'bg-amber-500' : 'bg-indigo-600'}`}
                 >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${testMode ? 'translate-x-1' : 'translate-x-6'}`}/>
                 </button>
                 <span className={`text-xs font-bold uppercase tracking-wider ${testMode ? 'text-amber-600' : 'text-indigo-600'}`}>
                    {testMode ? 'Modo Pruebas' : 'Modo Producción'}
                 </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-slate-500">Volumen Total</span>
                <span className="text-lg font-bold text-slate-800">{filteredLeads.length} <span className="text-sm text-slate-400">/ {leads.length}</span></span>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="hidden sm:flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-xl font-bold transition-colors">
                <UserPlus size={18} /> Nuevo Manual
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Radar Geográfico Panel */}
        <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200/60 mb-8 flex flex-col xl:flex-row overflow-hidden">
            
            {/* Map Area */}
            <div className="xl:w-[45%] h-[400px] xl:h-auto relative z-0 bg-slate-100 border-b xl:border-b-0 xl:border-r border-slate-200">
                <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    
                    {/* Zonas Antiguas */}
                    {zonas.map(z => (
                        <Circle key={z.id} center={[z.lat, z.lng]} radius={z.radius} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 1 }} />
                    ))}
                    
                    {/* Zona Actual (Seleccionable) */}
                    <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.25, weight: 2, dashArray: '5, 5' }} />
                    
                    <MapClickHandler setLat={setLat} setLng={setLng} />
                </MapContainer>
                <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 text-sm font-bold text-slate-800 flex items-center gap-2 pointer-events-none">
                    <Crosshair className="text-indigo-600 w-4 h-4"/> 
                    Haz clic en el mapa para apuntar el bot
                </div>
            </div>

            {/* Controles de Filtros Estrictos */}
            <div className="xl:w-[55%] p-6 lg:p-8 flex flex-col gap-6 relative z-10 bg-white">
                <div>
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1"><Target className="w-5 h-5 text-indigo-500"/> Configuración del Ojo de Águila</h2>
                   <p className="text-sm text-slate-500">El bot buscará salones en el radio dibujado y filtrará la basura (tattoos, gyms).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Límite de Prospectos</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500" value={limit} onChange={e => setLimit(Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Radio de Acción (Metros)</label>
                        <input type="range" min="500" max="25000" step="500" className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer mt-3" value={radius} onChange={e => setRadius(Number(e.target.value))} />
                        <div className="text-right text-xs font-bold text-indigo-600 mt-2">{radius / 1000} km dibujados 🔵</div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">Filtro de Descarte (Obligatorios)</label>
                    <textarea 
                        className="w-full px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium text-rose-900 resize-none min-h-[80px]"
                        value={pureKeywords}
                        onChange={e => setPureKeywords(e.target.value)}
                        placeholder="salon, uñas, pestañas, etc..."
                    />
                    <p className="text-xs text-rose-500 mt-1.5 font-medium">Si el negocio detectado no contiene al menos una de estas palabras, el bot lo ignorará automáticamente para no ensuciar tu CRM.</p>
                </div>

                <button
                    onClick={iniciarScraper} disabled={scraping}
                    className={`w-full py-4 rounded-xl font-bold text-sm shadow-md transition-all mt-2 ${
                    scraping ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        {scraping ? <Loader2 className="w-5 h-5 animate-spin" /> : <RadarScanIcon />}
                        {scraping ? 'Peinando la zona en vivo...' : `Lanzar Bot a capturar ${limit} Leads en el mapa`}
                    </div>
                </button>
            </div>
        </div>

        {/* CRM UI (Igual que antes pero optimizado) */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-[2]">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    placeholder="Filtrar CRM por nombre o teléfono..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <select
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 bg-white border text-slate-700 font-bold border-slate-200/80 rounded-2xl px-5 py-3.5 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
                <option value="Todos">Todas las Etapas</option>
                {ESTADOS.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Aperturas</p>
                   <p className="text-2xl font-black text-slate-800">{leadsApertura}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center"><MessageCircle className="w-6 h-6 text-blue-500"/></div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Respuestas %</p>
                   <p className="text-2xl font-black text-emerald-600">{tasaApertura}%</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center"><Target className="w-6 h-6 text-emerald-500"/></div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Activadores</p>
                   <p className="text-2xl font-black text-slate-800">{leadsActivador}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center"><Sparkles className="w-6 h-6 text-purple-500"/></div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cierres %</p>
                   <p className="text-2xl font-black text-emerald-600">{tasaActivador}%</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center"><Flame className="w-6 h-6 text-emerald-500"/></div>
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center h-64"><Loader2 className="h-10 w-10 animate-spin text-indigo-500 m-auto" /></div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-3xl shadow-sm border border-slate-200 mt-6"><Store className="h-10 w-10 text-slate-300 mx-auto mb-4" /><h3 className="text-xl font-bold text-slate-800">El Pipeline está limpio</h3></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  testMode={testMode} 
                  setEditingLead={setEditingLead} 
                  setIsEditModalOpen={setIsEditModalOpen} 
                  formatWa={formatWa}
              />
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><UserPlus size={20} className="text-indigo-600"/> Nuevo Prospecto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre del Negocio *</label>
                <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" value={newLead.nombre_salon} onChange={e => setNewLead({...newLead, nombre_salon: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono (WhatsApp) *</label>
                <input type="tel" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" value={newLead.telefono} onChange={e => setNewLead({...newLead, telefono: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">SItio Web</label>
                <input type="url" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500" value={newLead.sitioweb} onChange={e => setNewLead({...newLead, sitioweb: e.target.value})} />
              </div>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 py-3 text-white font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl flex justify-center items-center gap-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {isEditModalOpen && editingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Edit3 size={20} className="text-indigo-600"/> Editar Prospecto</h2>
              <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingLead(null); }} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdateLead} className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nombre del Negocio</label>
                    <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" 
                           value={editingLead.nombre_salon || ''} onChange={e => setEditingLead({...editingLead, nombre_salon: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Teléfono</label>
                    <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" 
                           value={editingLead.telefono || ''} onChange={e => setEditingLead({...editingLead, telefono: e.target.value})} />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Dirección</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" 
                         value={editingLead.direccion || ''} onChange={e => setEditingLead({...editingLead, direccion: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5"><FacebookIcon/> Link de Facebook</label>
                    <input type="url" className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" 
                           value={editingLead.url_facebook || ''} onChange={e => setEditingLead({...editingLead, url_facebook: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5"><InstagramIcon/> Link de Instagram</label>
                    <input type="url" className="w-full px-4 py-2.5 bg-pink-50/50 border border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm" 
                           value={editingLead.url_instagram || ''} onChange={e => setEditingLead({...editingLead, url_instagram: e.target.value})} />
                  </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                  <div>
                    <label className="block text-xs font-bold text-orange-600 uppercase mb-1.5 flex items-center gap-1.5"><Flame size={14}/> Score Interés (0-100)</label>
                    <input type="number" min="0" max="100" className="w-full px-4 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm font-bold" 
                           value={editingLead.score_interes || ''} onChange={e => setEditingLead({...editingLead, score_interes: Number(e.target.value)})} />
                  </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sugerencia Especial IA</label>
                  <textarea className="w-full px-4 py-3 bg-indigo-50/40 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-vertical min-h-[60px]" 
                         value={editingLead.sugerencia_respuesta_ia || ''} onChange={e => setEditingLead({...editingLead, sugerencia_respuesta_ia: e.target.value})} placeholder="La IA sugiere responder con..." />
              </div>

              <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-purple-600 uppercase mb-1.5">Mensaje 1 (Apertura AI)</label>
                  <textarea className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium resize-vertical min-h-[80px]" 
                         value={editingLead.mensaje_apertura || ''} onChange={e => setEditingLead({...editingLead, mensaje_apertura: e.target.value})} />
              </div>
              
              <div>
                  <label className="block text-xs font-bold text-indigo-600 uppercase mb-1.5">Mensaje 2 (Activador Analista)</label>
                  <textarea className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium resize-vertical min-h-[80px]" 
                         value={editingLead.mensaje_activador || ''} onChange={e => setEditingLead({...editingLead, mensaje_activador: e.target.value})} />
              </div>

              <div className="mt-2 flex gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingLead(null); }} className="flex-[1] py-3.5 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] py-3.5 text-white font-bold bg-indigo-600 hover:bg-indigo-700 rounded-xl flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition-all">Guardar Cambios del Prospecto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

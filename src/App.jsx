import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { MessageCircle, MapPin, Store, Star, Loader2, PlayCircle, Sparkles, Search, Globe, Flame, Edit3, Send, Trash2, UserPlus, X, Target, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ESTADOS = [
  'Pendiente Análisis IA',
  'Pendiente',
  'Enviar Campaña Automática',
  'Campaña Enviada',
  'Contactado',
  'Respondió',
  'Reunión Agendada',
  'No Interesado',
  'Cliente Cerrado'
];

function MapClickHandler({ setLat, setLng }) {
  useMapEvents({
      click(e) {
          setLat(e.latlng.lat);
          setLng(e.latlng.lng);
      }
  });
  return null;
}

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

        {loading ? (
          <div className="flex justify-center h-64"><Loader2 className="h-10 w-10 animate-spin text-indigo-500 m-auto" /></div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-3xl shadow-sm border border-slate-200 mt-6"><Store className="h-10 w-10 text-slate-300 mx-auto mb-4" /><h3 className="text-xl font-bold text-slate-800">El Pipeline está limpio</h3></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="group bg-white rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)] transition-all flex flex-col overflow-hidden relative">
                
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {lead.puntuacion_lead > 0 && (
                        <div className="bg-orange-100 border border-orange-200 text-orange-700 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-sm">
                            <Flame size={14} className="fill-orange-500 text-orange-500"/>{lead.puntuacion_lead}/10
                        </div>
                    )}
                    <button onClick={() => deleteLead(lead)} className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="p-6 pb-4">
                  <div className="pr-20 mb-3"><h3 className="font-bold text-[1.1rem] leading-tight text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">{lead.nombre_salon}</h3></div>
                  <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-start text-sm text-slate-500 font-medium">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 mr-2" />
                        <span className="line-clamp-2 leading-snug">{lead.direccion || 'Ubicación no precisada'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium mt-1">
                          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-current" />{lead.calificacion || '-'} <span className="text-amber-600/60 text-xs">({lead.total_resenas||0})</span>
                          </div>
                          {lead.sitioweb && (
                              <a href={lead.sitioweb?.startsWith('http') ? lead.sitioweb : `https://${lead.sitioweb}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg hover:text-slate-900 transition-colors">
                                  <Globe size={14} /> Web
                              </a>
                          )}
                          {lead.url_instagram && (
                              <a href={lead.url_instagram?.startsWith('http') ? lead.url_instagram : `https://${lead.url_instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg hover:bg-pink-100 transition-colors">
                                  <InstagramIcon /> IG
                              </a>
                          )}
                          {lead.url_facebook && (
                              <a href={lead.url_facebook?.startsWith('http') ? lead.url_facebook : `https://${lead.url_facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                                  <FacebookIcon /> FB
                              </a>
                          )}
                      </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gradient-to-b from-slate-50 to-white flex-1 space-y-3 border-y border-slate-100/60">
                  {lead.dolor_detectado && (
                    <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100/50">
                      <span className="text-[10px] font-bold text-rose-500 tracking-widest mb-1 block">Diagnóstico de IA</span>
                      <p className="text-sm text-rose-900/90 font-medium">{lead.dolor_detectado}</p>
                    </div>
                  )}
                  {lead.gancho_venta && (
                    <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/50">
                      <span className="text-[10px] font-bold text-emerald-500 tracking-widest mb-1 block">Ángulo de Venta</span>
                      <p className="text-sm text-emerald-900/90 font-medium">{lead.gancho_venta}</p>
                    </div>
                  )}
                  <div className="relative group/note mt-4">
                      <div className="absolute top-2 left-3 text-slate-400 group-focus-within/note:text-indigo-500"><Edit3 size={14} /></div>
                      <textarea
                          className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200/80 rounded-xl p-2.5 pl-8 focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[60px]"
                          placeholder="Añadir nota interna" defaultValue={lead.notas || ''} onBlur={(e) => updateNotas(lead.id, e.target.value)}
                      />
                  </div>
                </div>

                <div className="p-4 bg-white flex flex-col gap-3 border-t border-slate-100">
                  <select
                    value={lead.estado_contacto || 'Pendiente Análisis IA'}
                    onChange={(e) => updateEstado(lead.id, e.target.value)}
                    className={`custom-select text-sm font-bold rounded-xl px-3.5 py-3 border-0 ring-1 ring-inset outline-none w-full ${lead.estado_contacto === 'Enviar Campaña Automática' ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-slate-50 text-slate-700 ring-slate-200'}`}
                  >
                    {ESTADOS.map(estado => <option key={estado} value={estado}>{estado}</option>)}
                  </select>
                  <div className="flex gap-2">
                      <button onClick={() => updateEstado(lead.id, 'Enviar Campaña Automática')} className="flex-[2] flex justify-center items-center px-4 py-2.5 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700">
                        <Send className="w-4 h-4 mr-2" /> Lanzar Nilah
                      </button>
                      <a href={`https://wa.me/${formatWa(lead.telefono)}${lead.mensaje_apertura ? `?text=${encodeURIComponent(lead.mensaje_apertura)}` : ''}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center px-4 py-2.5 rounded-xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white">
                        <MessageCircle className="w-5 h-5" />
                      </a>
                  </div>
                </div>
              </div>
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
    </div>
  );
}

const RadarScanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="M12 12l8.5 8.5"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M15.54 8.46a5 5 0 0 0-7.08 7.08"/></svg>
  );

const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

export default App;

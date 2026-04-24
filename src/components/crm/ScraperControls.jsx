import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import { Crosshair, Hash, X, Zap, Terminal, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

function MapClickHandler({ setLat, setLng }) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    }
  });
  return null;
}

const ScraperControls = ({
  lat, lng, setLat, setLng,
  zonas, radius, setRadius,
  limit, setLimit,
  pureKeywords, setPureKeywords,
  scraping, scraperLogs, setScraperLogs,
  serverOnline, iniciarScraper, detenerScraper
}) => {
  const [showConsole, setShowConsole] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll al final de los logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [scraperLogs, showConsole]);

  const [detectedCity, setDetectedCity] = useState("Huaral");

  // Efecto para detectar el nombre de la ciudad según las coordenadas del mapa
  useEffect(() => {
    const fetchCityName = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || "Huaral";
        setDetectedCity(city);
      } catch (err) {
        console.error("Error al detectar ciudad:", err);
      }
    };
    fetchCityName();
  }, [lat, lng]);

  const lastLog = scraperLogs[scraperLogs.length - 1] || "Esperando instrucciones...";

  const handleStartScraper = () => {
    // Construimos los parámetros que n8n necesita para que no lleguen como undefined
    const params = {
      ubicacion: detectedCity, // ¡Ahora la ubicación es real y detectada!
      lat: lat,
      lng: lng,
      radius: radius,
      limit: limit,
      pureKeywords: pureKeywords,
      testMode: true
    };
    iniciarScraper(params);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden mb-12 transition-all hover:shadow-2xl">
      <div className="flex flex-col xl:flex-row">

        {/* ── Área del Mapa ── */}
        <div className="xl:w-[45%] h-[400px] xl:h-[580px] relative z-0 bg-slate-50 border-r border-slate-100">
          <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" />
            {zonas.map(z => (
              <Circle key={z.id} center={[z.lat, z.lng]} radius={z.radius} pathOptions={{ color: '#0f172a', fillColor: '#0f172a', fillOpacity: 0.1, weight: 1 }} />
            ))}
            <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2, dashArray: '5, 5' }} />
            <MapClickHandler setLat={setLat} setLng={setLng} />
          </MapContainer>

          <div className="absolute top-6 left-6 z-[400] bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white shadow-xl text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            Radar: {detectedCity}
          </div>
        </div>

        {/* ── Controles del Scraper ── */}
        <div className="xl:w-[55%] p-8 lg:p-12 flex flex-col gap-8 bg-white relative">
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Zap size={18} className="text-primary fill-primary/20" />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Sourcing Engine</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Extraer Leads</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">Configura los parámetros de búsqueda local.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad Objetivo</label>
              <div className="relative group">
                <input
                  type="number"
                  className="w-full pl-12 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-xl font-black text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value))}
                />
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-primary transition-colors" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Radio de Acción</label>
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{(radius / 1000).toFixed(1)} KM</span>
              </div>
              <div className="h-14 flex items-center px-6 bg-slate-50/50 rounded-2xl border border-slate-200">
                <input
                  type="range" min="500" max="25000" step="500"
                  className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación de Búsqueda</label>
              <div className="relative group">
                <input
                  type="text"
                  className="w-full pl-12 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  value={detectedCity}
                  onChange={e => setDetectedCity(e.target.value)}
                  placeholder="Ciudad detectada..."
                />
                <Crosshair className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-primary transition-colors" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtros de Nicho</label>
              <div className="relative group">
                <input
                  type="text"
                  className="w-full pl-12 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  value={pureKeywords}
                  onChange={e => setPureKeywords(e.target.value)}
                  placeholder="Ej: salon, spa..."
                />
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-primary transition-colors" />
              </div>
            </div>
          </div>

          {/* ── NUEVA CONSOLA "STATUS TICKER" ── */}
          <div className="mt-2 group/console relative">
            {scraping && (
              <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-primary/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 animate-bounce flex items-center gap-2">
                  <Activity size={12} className="animate-pulse" />
                  Escaneo de Inteligencia Activo
                </div>
              </div>
            )}
            
            <div 
              className={`flex items-center gap-3 p-1.5 pl-4 rounded-2xl border transition-all duration-500 overflow-hidden ${
                scraping 
                ? 'bg-slate-900 border-primary/50 shadow-lg shadow-primary/10' 
                : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 shrink-0">
                <Terminal size={14} className={scraping ? 'text-primary' : 'text-slate-400'} />
                {scraping && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <p className={`text-[11px] font-mono font-bold truncate ${scraping ? 'text-primary/90' : 'text-slate-500'}`}>
                  {scraping ? '> ' : ''}{lastLog}
                </p>
              </div>

              <button
                onClick={() => setShowConsole(!showConsole)}
                className={`p-2 rounded-xl transition-all ${
                  scraping 
                  ? 'hover:bg-white/10 text-slate-500 hover:text-white' 
                  : 'hover:bg-white text-slate-400 hover:text-slate-600'
                }`}
              >
                {showConsole ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Panel de Logs Expandido */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${showConsole ? 'max-h-56 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
              <div 
                ref={scrollRef}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-[10px] h-48 overflow-y-auto space-y-2.5 shadow-2xl custom-scrollbar"
              >
                {scraperLogs.length === 0 ? (
                  <div className="text-slate-600 italic">No hay logs en esta sesión.</div>
                ) : (
                  scraperLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 text-slate-400 leading-relaxed border-l border-slate-800/50 pl-3">
                      <span className="text-slate-600 shrink-0 font-bold tracking-tighter w-14">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
                      <span className={log.includes('ERROR') ? 'text-rose-400' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-200'}>
                        {log}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Botón Principal con Efecto de Carga Premium */}
          <button
            onClick={scraping ? detenerScraper : handleStartScraper}
            disabled={!serverOnline}
            className={`group relative overflow-hidden w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
              scraping ? 'bg-slate-900 text-white' :
              !serverOnline ? 'bg-slate-100 text-slate-300 cursor-not-allowed' :
              'bg-slate-900 text-white hover:bg-primary shadow-xl shadow-slate-200 hover:shadow-primary/30 active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center gap-3 relative z-10">
              {scraping ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <span className="animate-pulse">Analizando Mercado...</span>
                  </div>
                </>
              ) : (
                <>
                  <Zap size={18} className="fill-current" />
                  {!serverOnline ? 'Servidor Offline' : 'Lanzar Prospección'}
                </>
              )}
            </div>
            
            {/* Animación de escaneo láser cuando está activo */}
            {scraping && (
              <div className="absolute inset-0 bg-slate-900">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#3b82f6] animate-scan-line"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-primary/5 animate-pulse"></div>
                </div>
              </div>
            )}
            
            {/* Efecto de brillo al hover */}
            {!scraping && <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScraperControls;

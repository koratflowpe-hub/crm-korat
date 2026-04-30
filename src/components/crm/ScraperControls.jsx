import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, useMap, Marker, CircleMarker } from 'react-leaflet';
import { Crosshair, Hash, Zap, Terminal, ChevronDown, ChevronUp, Activity, Database, Search, Layers, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para el icono por defecto de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Sincronizar vista del mapa con coordenadas (con animación suave)
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    // Usamos flyTo para que el usuario vea el desplazamiento hacia la nueva ciudad
    map.flyTo(center, map.getZoom(), {
      duration: 1.5
    });
  }, [center, map]);
  return null;
}

// ── Capturar clicks en el mapa
function MapClickHandler({ setCoords }) {
  useMapEvents({
    click(e) {
      setCoords(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// ── Presets de nicho
const NICHE_PRESETS = [
  { label: '✨ Pestañas', keywords: 'pestañas,eyelashes,volumen,lifting,extensiones', radius: 3000 },
  { label: '👁️ Lash',     keywords: 'lash,lashes,studio,mirada',                   radius: 3000 },
  { label: '💅 Nail',     keywords: 'nail,nails,manicure,pedicure',                radius: 3000 },
  { label: '🎨 Uñas',     keywords: 'uñas,acrilicas,gel,esmalte',                  radius: 3000 },
  { label: '💄 Beauty',   keywords: 'beauty,estetica,facial,maquillaje',           radius: 3000 },
];

// ── Capas de mapa disponibles
const MAP_LAYERS = {
  carto:     'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const ScraperControls = ({
  lat, lng, setLat, setLng, setCoords,
  zonas, radius, setRadius,
  limit, setLimit,
  pureKeywords, setPureKeywords,
  scraping, scraperLogs, setScraperLogs,
  serverOnline, iniciarScraper, detenerScraper,
  isSavingConfig,
  isExpanded,
  onToggle
}) => {
  const [showConsole, setShowConsole] = useState(false);
  const [mapLayer, setMapLayer]       = useState('carto');   // 'carto' | 'satellite' | 'dark'
  const [activePreset, setActivePreset] = useState(null);
  const scrollRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [scraperLogs, showConsole]);

  const [detectedCity, setDetectedCity] = useState('Huaral');

  // Geocodificación inversa
  useEffect(() => {
    const fetchCityName = async () => {
      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || 'Huaral';
        setDetectedCity(city);
      } catch (err) { console.error('Reverse geocode error:', err); }
    };
    fetchCityName();
  }, [lat, lng]);

  // Búsqueda por texto (Forward geocoding)
  const handleSearch = async (e) => {
    if (e?.key && e.key !== 'Enter') return;
    e?.preventDefault?.();
    
    if (!detectedCity.trim()) return;

    try {
      // Añadimos ", Peru" para asegurar resultados locales
      const query = detectedCity.toLowerCase().includes('peru') ? detectedCity : `${detectedCity}, Peru`;
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        
        setCoords(newLat, newLng);
        
        setScraperLogs(prev => [...prev, `Ubicación encontrada: ${data[0].display_name}`]);
      } else {
        setScraperLogs(prev => [...prev, `No se encontró la ubicación: ${detectedCity}`]);
      }
    } catch (err) {
      console.error('Forward geocode error:', err);
      setScraperLogs(prev => [...prev, "Error en el servicio de búsqueda de mapas."]);
    }
  };

  // Aplicar preset de nicho
  const applyPreset = (preset, idx) => {
    setActivePreset(idx);
    setPureKeywords(preset.keywords);
    setRadius(preset.radius);
  };

  const lastLog = scraperLogs[scraperLogs.length - 1] || 'Radar listo para iniciar...';

  const handleStartScraper = async () => {
    setScraperLogs(prev => [...prev, `📡 Validando ubicación en radar: ${detectedCity}...`]);
    
    let targetLat = lat;
    let targetLng = lng;

    try {
      // Intentamos una búsqueda rápida para asegurar que el radar está donde dice el texto
      const query = detectedCity.toLowerCase().includes('peru') ? detectedCity : `${detectedCity}, Peru`;
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        targetLat = parseFloat(data[0].lat);
        targetLng = parseFloat(data[0].lon);
        setCoords(targetLat, targetLng);
        setScraperLogs(prev => [...prev, `✅ Radar posicionado en: ${data[0].display_name}`]);
      }
    } catch (err) {
      console.warn("No se pudo re-validar ubicación, usando coordenadas actuales.");
    }

    iniciarScraper({ 
      ubicacion: detectedCity, 
      lat: targetLat, 
      lng: targetLng, 
      radius, 
      limit, 
      pureKeywords, 
      testMode: true 
    });
  };

  // ── Vista compacta
  if (!isExpanded) {
    return (
      <div
        onClick={onToggle}
        className={`group cursor-pointer bg-white border border-slate-200/60 rounded-2xl p-4 mb-8 transition-all hover:shadow-lg hover:border-primary/30 flex items-center justify-between ${scraping ? 'ring-2 ring-primary/20 bg-primary/[0.02]' : ''}`}
      >
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div className={`p-3 rounded-xl transition-colors ${scraping ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
            <Activity size={20} className={scraping ? 'animate-pulse' : ''} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inteligencia de Mercado</span>
              {scraping && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full animate-pulse">
                  <div className="w-1 h-1 bg-primary rounded-full" /> ESCANEANDO
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Radar en <span className="text-primary">{detectedCity}</span>
              </h3>
              <div className="h-4 w-px bg-slate-200" />
              <p className="text-xs font-medium text-slate-500 truncate italic">
                {scraping ? lastLog : `${(radius / 1000).toFixed(1)}km | ${limit} leads | "${pureKeywords}"`}
              </p>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all hover:bg-primary active:scale-95">
          <Zap size={14} />
          {scraping ? 'Ver Progreso' : 'Abrir Radar'}
        </button>
      </div>
    );
  }

  // ── Vista expandida
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden mb-12 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col xl:flex-row">

        {/* ── Área del Mapa ── */}
        <div className="xl:w-[45%] h-[420px] xl:h-[600px] relative z-0 bg-slate-50 border-r border-slate-100">
          <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <ChangeView center={[lat, lng]} />
            <TileLayer url={MAP_LAYERS[mapLayer]} />

            {/* Zonas ya prospectadas */}
            {zonas.map(z => (
              <Circle
                key={z.id}
                center={[z.lat, z.lng]}
                radius={z.radius}
                pathOptions={{ color: '#0f172a', fillColor: '#0f172a', fillOpacity: 0.08, weight: 1.5, interactive: false }}
              />
            ))}

            {/* Círculo activo (sonar cuando scraping) */}
            <Circle
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                color:       scraping ? '#22c55e' : '#3b82f6',
                fillColor:   scraping ? '#22c55e' : '#3b82f6',
                fillOpacity: scraping ? 0.12 : 0.15,
                weight:      scraping ? 2.5 : 2,
                dashArray:   scraping ? undefined : '6 4',
                interactive: false
              }}
            />

            {/* Pin visual en el centro - DRAGGABLE para ajuste fino */}
            <Marker 
              position={[lat, lng]} 
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  setCoords(position.lat, position.lng);
                  setScraperLogs(prev => [...prev, `📍 Posición ajustada manualmente.`]);
                }
              }}
            />
            
            {/* Punto de mira (siempre visible) */}
            <CircleMarker
              center={[lat, lng]}
              radius={6}
              pathOptions={{ color: 'white', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
              interactive={false}
            />

            <MapClickHandler setCoords={setCoords} />
          </MapContainer>

          {/* ── Badge ciudad ── */}
          <div className="absolute top-4 left-4 z-[400] bg-white/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white shadow-xl text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${scraping ? 'bg-emerald-400' : 'bg-primary'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${scraping ? 'bg-emerald-500' : 'bg-primary'}`} />
            </div>
            {scraping ? '⚡ Escaneando' : `Radar: ${detectedCity}`}
          </div>

          {/* ── Efecto Sonar (overlay) cuando scraping ── */}
          {scraping && (
            <div className="absolute inset-0 z-[300] pointer-events-none flex items-center justify-center">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="absolute rounded-full border-2 border-emerald-400/60"
                  style={{
                    width:  '40%',
                    height: '40%',
                    animation: `sonar-ping 2s ease-out ${i * 0.6}s infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* ── Toggle de Capa de Mapa ── */}
          <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1.5">
            {Object.entries({ carto: '🗺️', satellite: '🛰️', dark: '🌑' }).map(([key, icon]) => (
              <button
                key={key}
                onClick={() => setMapLayer(key)}
                title={{ carto: 'Mapa Normal', satellite: 'Satélite', dark: 'Modo Oscuro' }[key]}
                className={`w-9 h-9 rounded-xl border text-base shadow-md transition-all active:scale-90 ${
                  mapLayer === key
                    ? 'bg-primary border-primary text-white shadow-primary/30'
                    : 'bg-white/90 backdrop-blur-sm border-white/60 hover:bg-white'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* ── Coordenadas actuales y Ayuda ── */}
          <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-1">
            <div className="bg-black/50 backdrop-blur-sm text-white/80 px-3 py-1.5 rounded-xl text-[10px] font-mono w-fit">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
            <div className="bg-primary/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-bold animate-bounce w-fit">
              📍 Arrastra el pin para ajustar
            </div>
          </div>
        </div>

        {/* ── Controles del Scraper ── */}
        <div className="xl:w-[55%] p-8 lg:p-10 flex flex-col gap-7 bg-white relative">

          {/* Header */}
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
            <button
              onClick={onToggle}
              className="p-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-2xl transition-all active:scale-90"
              title="Minimizar Radar"
            >
              <ChevronUp size={20} />
            </button>
          </div>

          {/* ── Presets de Nicho ── */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Presets de Nicho</label>
            <div className="flex flex-wrap gap-2">
              {NICHE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset, idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    activePreset === idx
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Grid: Cantidad + Radio ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
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
            <div className="space-y-2.5">
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

          {/* ── Grid: Ubicación + Nicho ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación de Búsqueda</label>
              <div className="relative group">
                <input
                  type="text"
                  className="w-full pl-12 pr-12 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  value={detectedCity}
                  onChange={e => setDetectedCity(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Ciudad o dirección..."
                />
                <Crosshair className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-primary transition-colors" />
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/10 rounded-xl text-slate-300 hover:text-primary transition-all"
                  title="Buscar ubicación"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Filtros de Nicho</label>
                {isSavingConfig ? (
                  <span className="text-[10px] font-bold text-indigo-500 animate-pulse flex items-center gap-1">
                    <Database size={10} /> Guardando...
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <Database size={10} /> Sincronizado
                  </span>
                )}
              </div>
              <div className="relative group">
                <input
                  type="text"
                  className="w-full pl-12 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  value={pureKeywords}
                  onChange={e => { setPureKeywords(e.target.value); setActivePreset(null); }}
                  placeholder="Ej: salon, spa..."
                />
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-primary transition-colors" />
              </div>
            </div>
          </div>

          {/* ── Consola de Status ── */}
          <div className="group/console relative">
            {scraping && (
              <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-emerald-500/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 animate-bounce flex items-center gap-2">
                  <Activity size={12} className="animate-pulse" />
                  Escaneo de Inteligencia Activo
                </div>
              </div>
            )}

            <div className={`flex items-center gap-3 p-1.5 pl-4 rounded-2xl border transition-all duration-500 overflow-hidden ${
              scraping ? 'bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/10' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2 shrink-0">
                <Terminal size={14} className={scraping ? 'text-emerald-400' : 'text-slate-400'} />
                {scraping && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-mono font-bold truncate ${scraping ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {scraping ? '> ' : ''}{lastLog}
                </p>
              </div>
              <button
                onClick={() => setShowConsole(!showConsole)}
                className={`p-2 rounded-xl transition-all ${
                  scraping ? 'hover:bg-white/10 text-slate-500 hover:text-white' : 'hover:bg-white text-slate-400 hover:text-slate-600'
                }`}
              >
                {showConsole ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-out ${showConsole ? 'max-h-56 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
              <div ref={scrollRef} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-[10px] h-48 overflow-y-auto space-y-2.5 shadow-2xl custom-scrollbar">
                {scraperLogs.length === 0 ? (
                  <div className="text-slate-600 italic">No hay logs en esta sesión.</div>
                ) : (
                  scraperLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 text-slate-400 leading-relaxed border-l border-slate-800/50 pl-3">
                      <span className="text-slate-600 shrink-0 font-bold tracking-tighter w-14">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={log.includes('ERROR') ? 'text-rose-400' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-200'}>
                        {log}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Botón de Acción ── */}
          <button
            onClick={scraping ? detenerScraper : handleStartScraper}
            disabled={!serverOnline}
            className={`group relative overflow-hidden w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
              scraping       ? 'bg-slate-900 text-white' :
              !serverOnline  ? 'bg-slate-100 text-slate-300 cursor-not-allowed' :
              'bg-slate-900 text-white hover:bg-primary shadow-xl shadow-slate-200 hover:shadow-primary/30 active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center gap-3 relative z-10">
              {scraping ? (
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                  </span>
                  <span className="animate-pulse">Analizando Mercado...</span>
                </div>
              ) : (
                <>
                  <Zap size={18} className="fill-current" />
                  {!serverOnline ? 'Servidor Offline' : 'Lanzar Prospección'}
                </>
              )}
            </div>
            {scraping && (
              <div className="absolute inset-0 bg-slate-900">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_15px_#22c55e] animate-scan-line" />
              </div>
            )}
            {!scraping && <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />}
          </button>
        </div>
      </div>

      {/* ── Keyframes del efecto Sonar ── */}
      <style>{`
        @keyframes sonar-ping {
          0%   { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.8); opacity: 0;   }
        }
      `}</style>
    </div>
  );
};

export default ScraperControls;

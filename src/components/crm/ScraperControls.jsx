import React from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import { Crosshair, Hash, X, Zap } from 'lucide-react';
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
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div className="flex flex-col xl:flex-row">
            {/* Area del Mapa */}
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

            {/* Controles del Scraper */}
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

                {(scraping || scraperLogs.length > 0) && (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 font-mono text-[10px] h-32 overflow-y-auto overflow-x-hidden space-y-1.5 scroll-smooth shadow-inner relative group break-all">
                    {!scraping && scraperLogs.length > 0 && (
                      <button 
                        onClick={() => setScraperLogs([])}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Limpiar Consola"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {scraperLogs.map((log, i) => (
                      <div key={i} className="text-slate-300 leading-relaxed">
                        <span className="text-slate-500 mr-2 shrink-0">[{new Date().toLocaleTimeString()}]</span>
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
  );
};

export default ScraperControls;

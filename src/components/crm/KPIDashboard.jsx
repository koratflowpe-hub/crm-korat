import React from 'react';
import { Users, Activity, Flame, Trophy } from 'lucide-react';

const KPIDashboard = ({ leads }) => {
  const leadsApertura = leads.filter(l => l.estado_contacto === 'Apertura Enviado').length;
  const leadsActivador = leads.filter(l => 
    ['Activador Enviado', 'Respondió Apertura', 'Video Enviado', 'Respondió Activador', 'Respondió Video'].includes(l.estado_contacto)
  ).length;
  const leadsCerrados = leads.filter(l => l.estado_contacto === 'Cliente Cerrado').length;
  
  const tasaApertura = leads.length > 0 ? Math.round((leadsApertura / leads.length) * 100) : 0;
  const tasaActivador = leads.length > 0 ? Math.round((leadsCerrados / leads.length) * 100) : 0;

  return (
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
             <h3 className="text-3xl font-bold text-slate-900">{leadsCerrados}</h3>
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ventas Cerradas</p>
          </div>
       </div>
    </div>
  );
};

export default KPIDashboard;

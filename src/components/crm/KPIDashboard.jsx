import React from 'react';
import { Users, Activity, Flame, Trophy } from 'lucide-react';

const KPIDashboard = ({ leads, onMetricClick }) => {
  // 1. Total Prospectos Reales (excluyendo "No Interesado" si quisieras, pero por ahora todos)
  const allLeads = leads;
  
  // 2. Interés Inicial (Aperturas y más allá): Han recibido al menos el primer mensaje
  const aperturasList = leads.filter(l => 
    l.estado_contacto !== 'Pendiente' && 
    l.estado_contacto !== 'No Interesado'
  );

  // 3. Oportunidades Hot (Fases avanzadas: Desde que responden al activador o se envía video)
  const hotList = leads.filter(l => 
    ['Respondió Activador', 'Video Enviado', 'Respondió Video', 'Cierre Enviado', 'Respondió Cierre', 'Reunión Agendada'].includes(l.estado_contacto)
  );

  // 4. Ventas Cerradas
  const cerradosList = leads.filter(l => l.estado_contacto === 'Cliente Cerrado');
  
  const tasaApertura = allLeads.length > 0 ? Math.round((aperturasList.length / allLeads.length) * 100) : 0;
  const tasaCierre = hotList.length > 0 ? Math.round((cerradosList.length / hotList.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
       <div 
        onClick={() => onMetricClick('Total Prospectos', allLeads, 'text-slate-900', 'bg-slate-900')}
        className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-slate-300 hover:-translate-y-1"
       >
          <div className="flex justify-between items-center mb-4">
             <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
               <Users size={18} />
             </div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Datos</div>
          </div>
          <div className="space-y-1">
             <h3 className="text-3xl font-bold text-slate-900">{allLeads.length}</h3>
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Identificados</p>
          </div>
       </div>

       <div 
        onClick={() => onMetricClick('Interés Inicial', aperturasList, 'text-emerald-600', 'bg-emerald-500')}
        className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-200 hover:-translate-y-1"
       >
          <div className="flex justify-between items-center mb-4">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
               <Activity size={18} />
             </div>
             <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Conversión: {tasaApertura}%</div>
          </div>
          <div className="space-y-1">
             <h3 className="text-3xl font-bold text-slate-900">{aperturasList.length}</h3>
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aperturas Iniciadas</p>
          </div>
       </div>

       <div 
        onClick={() => onMetricClick('Oportunidades Hot', hotList, 'text-orange-600', 'bg-orange-500')}
        className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-orange-200 hover:-translate-y-1"
       >
          <div className="flex justify-between items-center mb-4">
             <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
               <Flame size={18} />
             </div>
             <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Alta Intención</div>
          </div>
          <div className="space-y-1">
             <h3 className="text-3xl font-bold text-slate-900">{hotList.length}</h3>
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">En Fase de Cierre</p>
          </div>
       </div>

       <div 
        onClick={() => onMetricClick('Ventas Cerradas', cerradosList, 'text-primary', 'bg-primary')}
        className="bg-primary/5 p-6 rounded-xl border border-primary/20 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/40 hover:-translate-y-1"
       >
          <div className="flex justify-between items-center mb-4">
             <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
               <Trophy size={18} />
             </div>
             <div className="text-[10px] font-bold text-primary uppercase tracking-widest">Ratio Cierre: {tasaCierre}%</div>
          </div>
          <div className="space-y-1">
             <h3 className="text-3xl font-bold text-slate-900">{cerradosList.length}</h3>
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ventas Efectivas</p>
          </div>
       </div>
    </div>
  );
};

export default KPIDashboard;

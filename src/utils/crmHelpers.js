export const ESTADOS = [
  'Pendiente Análisis IA',
  'Pendiente',
  'Enviar Campaña Automática',
  'Apertura Enviado',
  'Respondió Apertura',
  'Enviar Activador',
  'Activador Enviado',
  'Respondió Activador',
  'Video Enviado',
  'Respondió Video',
  'Cierre Enviado',
  'Respondió Cierre',
  'Reunión Agendada',
  'No Interesado',
  'Cliente Cerrado'
];

export const getStatusColor = (status) => {
    switch(status) {
        case 'Apertura Enviado': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
        case 'Respondió Apertura': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'Enviar Activador': return 'bg-violet-50 text-violet-700 border-violet-100';
        case 'Activador Enviado': return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'Respondió Activador': return 'bg-teal-50 text-teal-700 border-teal-100';
        case 'Video Enviado': return 'bg-rose-50 text-rose-700 border-rose-100';
        case 'Respondió Video': return 'bg-pink-50 text-pink-700 border-pink-100';
        case 'Cierre Enviado': return 'bg-purple-50 text-purple-700 border-purple-100';
        case 'Respondió Cierre': return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100';
        case 'Reunión Agendada': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Cliente Cerrado': return 'bg-slate-900 text-white border-transparent';
        case 'Pendiente Análisis IA': return 'bg-amber-50 text-amber-700 border-amber-100';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

export const getTagStyle = (tag) => {
    const t = tag.toUpperCase();
    if (t.includes('CALIENTE')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (t.includes('TIBIO')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (t.includes('FRÍO') || t.includes('FRIO')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (t.includes('SIN WEB')) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (t.includes('CON WEB')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-slate-50 text-slate-500 border-slate-100';
};

export const formatWa = (phone) => {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('00')) clean = clean.substring(2);
    return clean;
};

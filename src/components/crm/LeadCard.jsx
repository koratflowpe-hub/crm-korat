import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, MapPin, Globe, Flame, Edit3, Send, 
  Trash2, Phone, Activity, ChevronDown, ChevronUp, Bot, MoreHorizontal, Sparkles, Zap
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../icons/SocialIcons';
import { getStatusColor, getTagStyle, formatWa, ESTADOS } from '../../utils/crmHelpers';

const LeadCard = ({ 
  lead, 
  updateEstado, 
  updateNotas, 
  updateMensajeApertura, 
  updateMensajeActivador, 
  setEditingLead, 
  setIsEditModalOpen, 
  setLeadToDelete, 
  setIsDeleteModalOpen 
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showAISection, setShowAISection] = useState(false);
  const menuRef = useRef(null);
  const actionsRef = useRef(null);

  // Un solo handler para todos los menús flotantes
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowStatusMenu(false);
      if (actionsRef.current && !actionsRef.current.contains(event.target)) setShowActions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-expandir la sección de IA cuando el scraper está analizando
  useEffect(() => {
    if (
      lead.estado_contacto === 'Pendiente Análisis IA' ||
      lead.estado_contacto === 'Generar Sugerencia IA'
    ) {
      setShowAISection(true);
    }
  }, [lead.estado_contacto]);

  const statusColor = getStatusColor(lead.estado_contacto);

  // Determina si hay datos de IA para mostrar el botón acordeón
  const hasAIData =
    (lead.score_interes !== null && lead.score_interes !== undefined) ||
    !!lead.dolor_detectado ||
    !!lead.gancho_venta ||
    !!lead.sugerencia_respuesta_ia ||
    !!lead.ultimo_mensaje_cliente ||
    lead.estado_contacto === 'Pendiente Análisis IA' ||
    lead.estado_contacto === 'Generar Sugerencia IA' ||
    ['Respondió Apertura', 'Respondió Activador', 'Apertura Enviado', 'Activador Enviado', 'Reunión Agendada', 'No Interesado'].includes(lead.estado_contacto);

  const renderActionButtons = () => {
    const s = lead.estado_contacto;
    if (s === 'Pendiente') {
      return (
        <button onClick={() => updateEstado(lead.id, 'Enviar Campaña Automática')} className="flex-[4] flex justify-center items-center px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-95">
          <Send className="w-3.5 h-3.5 mr-2" /> Enviar Apertura
        </button>
      );
    }
    if (s === 'Apertura Enviado') {
      return (
        <div className="flex-[4] flex row gap-2">
          <button onClick={() => updateEstado(lead.id, 'Enviar Activador')} className="flex-1 flex justify-center items-center py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg text-violet-600 bg-violet-50 border border-violet-100 active:scale-95 transition-all">🚀 Activar</button>
          <button onClick={() => updateEstado(lead.id, 'Respondió Apertura')} className="flex-1 flex justify-center items-center py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 active:scale-95 transition-all">✅ OK</button>
        </div>
      );
    }
    if (['Respondió Apertura', 'Respondió Activador', 'Activador Enviado'].includes(s)) {
      return (
        <div className="flex-[4] flex row gap-2">
          <button onClick={() => updateEstado(lead.id, 'Reunión Agendada')} className="flex-1 py-2.5 text-[9px] font-bold uppercase tracking-wider rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 active:scale-95 transition-all">📅 Agendar</button>
          <button onClick={() => updateEstado(lead.id, 'Enviar Activador')} className="flex-1 py-2.5 text-[9px] font-bold uppercase tracking-wider rounded-lg text-violet-600 bg-violet-50 border border-violet-100 active:scale-95 transition-all">🚀 Push</button>
          <button onClick={() => updateEstado(lead.id, 'No Interesado')} className="flex-1 py-2.5 text-[9px] font-bold uppercase tracking-wider rounded-lg text-rose-600 bg-rose-50 border border-rose-100 active:scale-95 transition-all">Descartar</button>
        </div>
      );
    }
    if (s === 'Reunión Agendada') {
      return (
        <button onClick={() => updateEstado(lead.id, 'Cliente Cerrado')} className="flex-[4] py-3 text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white rounded-lg shadow-sm active:scale-95 transition-all">🏆 GANADO</button>
      );
    }
    if (s === 'Pendiente Análisis IA' || s === 'Generar Sugerencia IA') {
      return (
        <div className="flex-[4] py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg text-amber-600 bg-amber-50 border border-amber-100 text-center animate-pulse flex items-center justify-center gap-2">
          <Bot size={14}/> 🤖 Analizando...
        </div>
      );
    }
    return <div className="flex-[4] py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg text-slate-400 bg-slate-50 border border-slate-100 text-center opacity-50 italic">Cargando...</div>;
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-visible relative border border-slate-200 hover:border-slate-300">
      
      {/* Menú "..." — reemplaza los botones flotantes separados para evitar clicks accidentales */}
      <div className="absolute top-4 right-4 z-10" ref={actionsRef}>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 rounded-lg transition-all shadow-sm"
          title="Opciones"
        >
          <MoreHorizontal size={16} />
        </button>
        {showActions && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
            <button
              onClick={() => { setEditingLead(lead); setIsEditModalOpen(true); setShowActions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit3 size={13} className="text-slate-400" /> Editar Lead
            </button>
            <div className="h-px bg-slate-100 mx-3" />
            <button
              onClick={() => { setLeadToDelete(lead); setIsDeleteModalOpen(true); setShowActions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={13} /> Eliminar Lead
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════
          BLOQUE SUPERIOR: Info del Negocio
      ═══════════════════════════════════ */}
      <div className="p-5 sm:p-6">
        {/* Nombre */}
        <div className="flex items-start justify-between pr-10 mb-3">
          <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-tight line-clamp-2 break-words">
            {lead.nombre_salon}
          </h3>
        </div>

        {/* Tags IA */}
        {lead.tags_ia && lead.tags_ia.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {lead.tags_ia.map((tag, idx) => (
              <span key={idx} className={`px-2 py-0.5 text-[10px] font-medium rounded-md border transition-all ${getTagStyle(tag)}`}>{tag}</span>
            ))}
          </div>
        )}

        {/* Status + Score */}
        <div className="flex flex-wrap items-center gap-2 mb-6 relative" ref={menuRef}>
          <div
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-2 transition-all outline-none ${statusColor} shadow-sm active:scale-95`}
          >
            <Activity size={12} strokeWidth={2.5}/>
            <span className="truncate max-w-[130px]">{lead.estado_contacto || 'Pendiente'}</span>
            <ChevronDown size={12} className={`transition-transform duration-300 ${showStatusMenu ? 'rotate-180' : ''}`} />
          </div>

          {showStatusMenu && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado del Lead</div>
                {ESTADOS.map(st => (
                  <div
                    key={st}
                    onClick={() => { updateEstado(lead.id, st); setShowStatusMenu(false); }}
                    className={`px-3 py-2 text-xs font-medium cursor-pointer transition-all rounded-lg ${lead.estado_contacto === st ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
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

        {/* Datos de contacto */}
        <div className="flex flex-col gap-4 text-[13px] font-bold text-muted-foreground/80 overflow-hidden">
          <div className="flex items-start overflow-hidden">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5 mr-4 opacity-70" />
            <span className="line-clamp-1 leading-none tracking-tight break-words">{lead.direccion || 'Ubicación no precisada'}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 flex items-center justify-center mr-4">
              <Phone size={14} className="text-primary opacity-70" />
            </div>
            <span className="font-black text-foreground tracking-widest uppercase">{lead.telefono || 'Sin número'}</span>
          </div>

          {/* Rating + Redes Sociales */}
          <div className="flex items-center gap-5 mt-1 px-1">
            <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
              <span className="text-[12px] font-black">★ {lead.calificacion || '-'}</span>
              <span className="text-amber-500/40 text-[9px] font-bold tracking-widest ml-1">[{lead.total_resenas || 0}]</span>
            </div>
            <div className="flex items-center gap-3">
              {lead.sitioweb && <a href={lead.sitioweb?.startsWith('http') ? lead.sitioweb : `https://${lead.sitioweb}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground/50 hover:text-primary transition-all"><Globe size={18}/></a>}
              {lead.url_instagram && <a href={lead.url_instagram?.startsWith('http') ? lead.url_instagram : `https://${lead.url_instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-pink-500/10 rounded-lg text-muted-foreground/50 hover:text-pink-500 transition-all"><InstagramIcon /></a>}
              {lead.url_facebook && <a href={lead.url_facebook?.startsWith('http') ? lead.url_facebook : `https://${lead.url_facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-blue-500/10 rounded-lg text-muted-foreground/50 hover:text-blue-500 transition-all"><FacebookIcon /></a>}
            </div>
          </div>
          {/* Diagnóstico IA (Siempre visible si existe) */}
        {lead.dolor_detectado && (
          <div className="mt-4 bg-rose-50/30 p-4 rounded-xl border border-rose-100/50 shadow-sm">
            <span className="text-[10px] font-black text-rose-500 tracking-widest uppercase mb-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Diagnóstico IA
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">"{lead.dolor_detectado}"</p>
          </div>
        )}
      </div>
      </div>


      {/* ═══════════════════════════════════════
          BOTÓN ACORDEÓN — Análisis IA
          Solo visible si hay datos de IA o el lead está siendo analizado
      ═══════════════════════════════════════ */}
      {hasAIData && (
        <button
          onClick={() => setShowAISection(!showAISection)}
          className={`mx-5 sm:mx-6 mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all group/ai ${showAISection ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500'}`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={12} className={showAISection ? 'text-primary' : 'text-slate-400'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {showAISection ? 'Ocultar Análisis IA' : 'Ver Análisis IA'}
            </span>
          </div>
          {showAISection
            ? <ChevronUp size={14} className="text-primary" />
            : <ChevronDown size={14} className="text-slate-400" />
          }
        </button>
      )}

      {showAISection && (
        <div className="bg-slate-50/50 border-t border-slate-100">
          <div className="p-6 space-y-6">
            
            {/* Scripts de Contacto (Agrupados en el acordeón) */}
            <div className="space-y-4">
              {/* Mensaje de Apertura */}
              {(lead.estado_contacto === 'Pendiente' || !!lead.mensaje_apertura) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Propuesta de Apertura</span>
                    <Edit3 size={12} className="text-slate-300" />
                  </div>
                  <textarea
                    className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none min-h-[90px] resize-none"
                    defaultValue={lead.mensaje_apertura || ''}
                    onBlur={(e) => updateMensajeApertura(lead.id, e.target.value)}
                    placeholder="Escribe el mensaje de apertura..."
                  />
                </div>
              )}

              {/* Mensaje Seguimiento (Antiguo Activador) */}
              {(['Apertura Enviado', 'Respondió Apertura', 'Enviar Activador', 'Respondió Activador', 'Activador Enviado'].includes(lead.estado_contacto) || !!lead.mensaje_activador) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Seguimiento Estratégico</span>
                    <Zap size={12} className="text-violet-400" />
                  </div>
                  <textarea
                    className="w-full text-xs font-semibold p-3 rounded-xl border border-violet-100 bg-violet-50/30 shadow-sm focus:border-violet-300 focus:ring-1 focus:ring-violet-200 transition-all outline-none min-h-[90px] resize-none"
                    defaultValue={lead.mensaje_activador || ''}
                    onBlur={(e) => updateMensajeActivador(lead.id, e.target.value)}
                    placeholder="Escribe el seguimiento aquí..."
                  />
                </div>
              )}
            </div>

            <div className="h-px bg-slate-200/60" />

            {/* Score de interés */}
            {lead.score_interes !== null && lead.score_interes !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Potencial de Venta</span>
                  <span className="text-xs font-bold text-slate-900">{lead.score_interes}%</span>
                </div>
                <div className="bg-slate-200 h-1.5 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${lead.score_interes > 60 ? 'bg-primary' : 'bg-slate-300'}`}
                    style={{ width: `${lead.score_interes}%` }}
                  />
                </div>
              </div>
            )}


            {/* Propuesta de Valor */}
            {lead.gancho_venta && (
              <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
                <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase mb-1 flex items-center gap-1.5">Propuesta Valor</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">"{lead.gancho_venta}"</p>
              </div>
            )}

            {/* Skeleton mientras la IA analiza */}
            {lead.estado_contacto === 'Pendiente Análisis IA' && (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-slate-100 rounded-lg border border-slate-200 border-dashed" />
                <div className="h-24 bg-slate-100 rounded-lg border border-slate-200 border-dashed" />
              </div>
            )}

            {/* Respuesta del cliente */}
            {lead.ultimo_mensaje_cliente && (
              <div className="bg-slate-900 text-white p-4 rounded-lg shadow-md relative">
                <div className="absolute -top-2 left-4 bg-primary text-white text-[9px] font-bold px-3 py-1 rounded-md uppercase tracking-wider shadow-sm">Respuesta Cliente</div>
                <p className="text-xs leading-relaxed font-medium mt-1">"{lead.ultimo_mensaje_cliente}"</p>
              </div>
            )}

            {/* Asistente IA */}
            {['Respondió Apertura', 'Respondió Activador', 'Apertura Enviado', 'Activador Enviado', 'Reunión Agendada', 'No Interesado'].includes(lead.estado_contacto) && (
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative group/ia overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center"><Bot size={14}/></div>
                    Asistente IA
                  </span>
                  <button onClick={() => updateEstado(lead.id, 'Generar Sugerencia IA')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-[10px] font-bold rounded-md transition-all active:scale-95">Analizar</button>
                </div>
                {lead.sugerencia_respuesta_ia && (
                  <div className="space-y-3">
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
      )}

      {/* ═══════════════════════════════════════
          BARRA DE ACCIONES — siempre visible
      ═══════════════════════════════════════ */}
      <div className="p-5 pt-4 mt-auto border-t border-slate-100 flex flex-col gap-3">
        <div className="flex gap-2">
          {renderActionButtons()}

          <a
            href={`https://wa.me/${formatWa(lead.telefono)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-[1] flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-all shadow-sm group/wa"
          >
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
  );
};

export default LeadCard;

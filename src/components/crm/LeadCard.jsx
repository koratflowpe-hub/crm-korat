import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, MapPin, Globe, Flame, Edit3, Send, Activity,
  Trash2, Phone, ChevronDown, ChevronUp, Bot, MoreHorizontal, Sparkles, Zap, Video, BookOpen, Copy, Check, Settings, PlayCircle, Rocket, Clock
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../icons/SocialIcons';
import { getStatusColor, getTagStyle, formatWa, ESTADOS, getTemplateRating } from '../../utils/crmHelpers';
import { useTemplates } from '../../hooks/useTemplates';
import { n8nService } from '../../services/n8nService';
import { useAutomation } from '../../hooks/useAutomation';

const LeadCard = ({ 
  lead, 
  updateEstado, 
  updateNotas, 
  updateMensajeApertura, 
  updateMensajeActivador, 
  updateMensajeVideo,
  updateMensajeCierre,
  updateLastTemplateId,
  setEditingLead, 
  setIsEditModalOpen, 
  setLeadToDelete, 
  setIsDeleteModalOpen,
  setIsLibraryModalOpen,
  updateLead
}) => {
  const { stageForSending, unstage } = useAutomation();
  const [stagingTab, setStagingTab] = useState(null); // which tab is being staged
  const { templates, incrementSentCount, incrementSuccessCount } = useTemplates();

  // Automation status badge
  const automationStatus = lead.automation_status || 'idle';
  const isStaged = automationStatus === 'staged';
  const isQueued = automationStatus === 'queued';
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedTab, setCopiedTab] = useState(null);
  const [isSendingFlow, setIsSendingFlow] = useState(false);
  const menuRef = useRef(null);
  const actionsRef = useRef(null);
  const aperturaRef = useRef(null);
  const activadorRef = useRef(null);
  const videoRef = useRef(null);
  const cierreRef = useRef(null);
  const notasRef = useRef(null);

  const [localApertura, setLocalApertura] = useState(lead.mensaje_apertura || '');
  const [localActivador, setLocalActivador] = useState(lead.mensaje_activador || '');
  const [localVideo, setLocalVideo] = useState(lead.mensaje_video || '');
  const [localCierre, setLocalCierre] = useState(lead.mensaje_cierre || '');

  // Sincronizar estado local si el lead cambia externamente
  useEffect(() => {
    setLocalApertura(lead.mensaje_apertura || '');
  }, [lead.mensaje_apertura]);

  useEffect(() => {
    setLocalActivador(lead.mensaje_activador || '');
  }, [lead.mensaje_activador]);

  useEffect(() => {
    setLocalVideo(lead.mensaje_video || '');
  }, [lead.mensaje_video]);

  useEffect(() => {
    setLocalCierre(lead.mensaje_cierre || '');
  }, [lead.mensaje_cierre]);

  // Auto-ajuste de altura para textareas
  useEffect(() => {
    const adjustHeight = (ref) => {
      if (ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = ref.current.scrollHeight + 'px';
      }
    };
    adjustHeight(aperturaRef);
    adjustHeight(activadorRef);
    adjustHeight(videoRef);
    adjustHeight(cierreRef);
    adjustHeight(notasRef);
  }, [localApertura, localActivador, localVideo, localCierre, lead.notas, isExpanded]);

  const handleSendFlow = async (tipo) => {
    if (!lead.telefono) {
      alert("El lead no tiene un número de teléfono válido.");
      return;
    }

    // Priorizar el contenido editado manualmente
    let content = '';
    if (tipo === 'apertura') content = localApertura;
    else if (tipo === 'activador') content = localActivador;
    else if (tipo === 'video') content = localVideo;
    else if (tipo === 'cierre') content = localCierre;
    
    // Fallback: si no hay contenido manual, buscar la primera plantilla de ese tipo
    if (!content) {
      const templateType = tipo === 'video' ? 'video_pilar' : tipo;
      const template = templates.find(t => t.etapa === templateType);
      if (template) {
        content = template.contenido;
        content = content.replace(/{{nombre_salon}}/g, lead.nombre_salon || '[NOMBRE DEL NEGOCIO]');
        content = content.replace(/{{direccion}}/g, lead.direccion || '[DIRECCIÓN]');
      }
    }

    if (!content) {
      alert(`No hay mensaje de ${tipo} para enviar.`);
      return;
    }

    setIsSendingFlow(tipo);
    try {
      await n8nService.sendMessage({
        phone: lead.telefono,
        message: content,
        type: tipo,
        lead_name: lead.nombre_salon,
        lead_id: lead.id,
        service: lead.tags_ia ? lead.tags_ia.join(', ') : '',
        interaction_type: tipo,
        interaction_step: tipo === 'apertura' ? '01_APERTURA' : (tipo === 'activador' ? '02_ACTIVADOR' : (tipo === 'video' ? '03_VIDEO' : '04_CIERRE'))
      });
      
      const templateType = tipo === 'video' ? 'video_pilar' : tipo;
      const template = templates.find(t => t.etapa === templateType);
      if (template && incrementSentCount) incrementSentCount(template.id);
      
      const nuevoEstado = tipo === 'apertura' ? 'Apertura Enviado' : (tipo === 'activador' ? 'Activador Enviado' : (tipo === 'video' ? 'Video Enviado' : 'Cierre Enviado'));
      handleUpdateEstado(nuevoEstado);
      
      updateNotas(lead.id, (lead.notas || '') + `\n[${new Date().toLocaleDateString()}] Mensaje de ${tipo.toUpperCase()} enviado.`);
    } catch (error) {
      alert(`Error al enviar el flujo: ${error.message}`);
    } finally {
      setIsSendingFlow(false);
      setTimeout(() => setCopiedTab(tipo), 100);
      setTimeout(() => setCopiedTab(null), 2000);
    }
  };

  const handleStageForSending = async (tipo) => {
    let content = '';
    if (tipo === 'apertura') content = localApertura;
    else if (tipo === 'activador') content = localActivador;
    else if (tipo === 'video') content = localVideo;
    else if (tipo === 'cierre') content = localCierre;

    if (!content) {
      alert(`Escribe el mensaje de ${tipo} antes de prepararlo.`);
      return;
    }
    setStagingTab(tipo);
    try {
      await stageForSending(lead.id, content, tipo);
      setTimeout(() => setStagingTab(null), 1500);
    } catch (e) {
      setStagingTab(null);
      alert('Error al preparar: ' + e.message);
    }
  };

  const handleUnstage = async () => {
    await unstage(lead.id);
  };

  const handleCopy = (text, tabName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const applyTemplate = (templateContent, updater) => {
    if (!templateContent) return;
    let content = templateContent;
    content = content.replace(/{{nombre_salon}}/g, lead.nombre_salon || '[NOMBRE DEL NEGOCIO]');
    content = content.replace(/{{direccion}}/g, lead.direccion || '[DIRECCIÓN]');
    if (updater === updateMensajeApertura) setLocalApertura(content);
    if (updater === updateMensajeActivador) setLocalActivador(content);
    if (updater === updateMensajeVideo) setLocalVideo(content);
    if (updater === updateMensajeCierre) setLocalCierre(content);
    updater(lead.id, content);
  };

  const applyTemplateById = (templateId, updater) => {
    if (!templateId) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    let content = template.contenido;
    content = content.replace(/{{nombre_salon}}/g, lead.nombre_salon || '[NOMBRE DEL NEGOCIO]');
    content = content.replace(/{{direccion}}/g, lead.direccion || '[DIRECCIÓN]');
    if (updater === updateMensajeApertura) setLocalApertura(content);
    if (updater === updateMensajeActivador) setLocalActivador(content);
    if (updater === updateMensajeVideo) setLocalVideo(content);
    if (updater === updateMensajeCierre) setLocalCierre(content);
    updater(lead.id, content);

    if (incrementSentCount) incrementSentCount(template.id);
    if (updateLastTemplateId) updateLastTemplateId(lead.id, template.id);
  };

  const handleUpdateEstado = (newEstado) => {
    updateEstado(lead.id, newEstado);
    if (newEstado.includes('Respondió') && lead.last_template_id && incrementSuccessCount) {
      incrementSuccessCount(lead.last_template_id);
    }
  };

  const handleFeedback = (tipo, funciono) => {
    if (funciono) {
      const stageName = tipo === 'video' ? 'Video' : tipo.charAt(0).toUpperCase() + tipo.slice(1);
      handleUpdateEstado(`Respondió ${stageName}`);
    } else {
      updateNotas(lead.id, (lead.notas || '') + `\n[${new Date().toLocaleDateString()}] ❌ El mensaje de ${tipo.toUpperCase()} no obtuvo respuesta.`);
    }
  };

  // Un solo handler para todos los menús flotantes
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowStatusMenu(false);
      if (actionsRef.current && !actionsRef.current.contains(event.target)) setShowActions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProgress = () => {
    const s = lead.estado_contacto;
    if (s === 'Cliente Cerrado') return 100;
    if (s === 'Reunión Agendada') return 90;
    if (['Video Enviado', 'Respondió Video'].includes(s)) return 75;
    if (['Enviar Activador', 'Activador Enviado', 'Respondió Activador'].includes(s)) return 50;
    if (['Apertura Enviado', 'Respondió Apertura'].includes(s)) return 25;
    if (s === 'No Interesado') return 100;
    return 5;
  };

  const statusColor = getStatusColor(lead.estado_contacto);

  return (
    <div className={`h-fit group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-visible relative border border-slate-200 hover:border-slate-300 ${
      isStaged ? 'ring-2 ring-amber-400/30 border-amber-200' :
      isQueued ? 'ring-2 ring-primary/30 border-primary/20' :
      isExpanded ? 'ring-2 ring-primary/5' : ''
    }`}>
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 rounded-t-2xl overflow-hidden">
        <div className={`h-full ${lead.estado_contacto === 'No Interesado' ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${getProgress()}%` }} />
      </div>

      {/* Automation Status Badge */}
      {(isStaged || isQueued) && (
        <div className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
          isQueued ? 'bg-primary text-white shadow-sm shadow-primary/30' : 'bg-amber-400 text-white shadow-sm shadow-amber-200'
        }`}>
          {isQueued ? <Clock size={9} /> : <Rocket size={9} />}
          {isQueued ? 'En Cola' : 'Listo'}
        </div>
      )}

      {/* Menú de Opciones */}
      <div className="absolute top-4 right-4 z-10" ref={actionsRef}>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 rounded-lg transition-all shadow-sm"
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

      {/* BLOQUE SUPERIOR: Info del Negocio */}
      <div className="p-5 sm:p-6 pb-2">
        <div className="flex items-start justify-between pr-10 mb-3">
          <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-tight line-clamp-2">
            {lead.nombre_salon}
          </h3>
        </div>

        {/* Status Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-4 relative" ref={menuRef}>
          <div
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-2 transition-all ${statusColor} shadow-sm active:scale-95`}
          >
            <Activity size={12} strokeWidth={2.5}/>
            <span className="truncate">{lead.estado_contacto || 'Pendiente'}</span>
            <ChevronDown size={12} className={`transition-transform duration-300 ${showStatusMenu ? 'rotate-180' : ''}`} />
          </div>

          {showStatusMenu && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                {ESTADOS.map(st => (
                  <div
                    key={st}
                    onClick={() => { handleUpdateEstado(st); setShowStatusMenu(false); }}
                    className={`px-3 py-2 text-xs font-medium cursor-pointer transition-all rounded-lg ${lead.estado_contacto === st ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    {st}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contacto Simple */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-xs text-slate-500 font-semibold">
            <MapPin size={14} className="mr-2 text-primary opacity-70" />
            <span className="truncate">{lead.direccion || 'Sin dirección'}</span>
          </div>
          <div className="flex items-center text-xs text-slate-900 font-black tracking-widest uppercase">
            <Phone size={14} className="mr-2 text-primary opacity-70" />
            {lead.telefono || 'Sin número'}
          </div>
        </div>

        {/* Redes Sociales Rápidas */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {lead.sitioweb && <a href={lead.sitioweb?.startsWith('http') ? lead.sitioweb : `https://${lead.sitioweb}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 hover:bg-primary/10 rounded-lg text-slate-400 hover:text-primary transition-all border border-slate-100"><Globe size={16}/></a>}
            {lead.url_instagram && <a href={lead.url_instagram?.startsWith('http') ? lead.url_instagram : `https://${lead.url_instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 hover:bg-pink-50 rounded-lg text-slate-400 hover:text-pink-500 transition-all border border-slate-100"><InstagramIcon /></a>}
            {lead.url_facebook && <a href={lead.url_facebook?.startsWith('http') ? lead.url_facebook : `https://${lead.url_facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-500 transition-all border border-slate-100"><FacebookIcon /></a>}
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all border border-primary/10"
          >
            {isExpanded ? 'Ver Menos' : 'Ver Detalles'}
            <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ESTRATEGIA E INSIGHTS DE IA (Condicional / Compacto) */}
        <div className="mb-4 space-y-3">
          {!isExpanded && lead.score_interes !== undefined && (
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  <Flame size={10} className="text-emerald-500" />
                  <span className="text-[10px] font-black tracking-tighter">{lead.score_interes}% Interés</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 max-w-[60%] truncate italic">
                  "{lead.gancho_venta || 'Analizando...'}"
                </p>
            </div>
          )}

          {isExpanded && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Contexto Completo */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 block">Contexto Detectado</span>
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{lead.contexto_usado || 'Sin contexto detectado'}</p>
              </div>

              {/* Bloque de Estrategia: Dolor y Gancho (Sin fondo negro) */}
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 group">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Flame size={14} className="text-rose-500" />
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Dolor Detectado</span>
                  </div>
                  <p className="text-[12px] font-medium text-slate-700 leading-relaxed italic">
                    "{lead.dolor_detectado || 'Analizando puntos de dolor...'}"
                  </p>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 group">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Gancho de Venta</span>
                  </div>
                  <p className="text-[12px] font-black text-slate-800 leading-relaxed">
                    {lead.gancho_venta || 'Generando propuesta de valor...'}
                  </p>
                </div>
              </div>

              {/* Servicios y Tags */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {lead.servicios_detectados && lead.servicios_detectados.split(',').map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-white text-slate-500 border border-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-tight shadow-sm">
                      {s.trim()}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    let tags = [];
                    if (Array.isArray(lead.tags_ia)) tags = lead.tags_ia;
                    else if (typeof lead.tags_ia === 'string') {
                      tags = lead.tags_ia.replace(/[{}]/g, '').split(',').map(t => t.trim()).filter(Boolean);
                    }
                    return tags.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[8px] font-black uppercase tracking-tighter">
                        #{t}
                      </span>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          {/* SECCIÓN DE SCRIPTS: Apertura y Activador */}
          <div className="px-5 sm:px-6 pb-6 space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              
              {/* Script de Apertura */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={10} /> 01. Apertura
                  </span>
                  <select 
                    onChange={(e) => { applyTemplateById(e.target.value, updateMensajeApertura); e.target.value = ''; }}
                    className="text-[9px] border border-slate-200 rounded-md px-2 py-1 outline-none text-slate-500 bg-white font-bold"
                  >
                    <option value="">📚 Biblioteca</option>
                    {templates.filter(t => t.etapa === 'apertura').map(t => (
                      <option key={t.id} value={t.id}>{getTemplateRating(t.sent_count, t.success_count)} {t.nombre}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  ref={aperturaRef}
                  className="w-full text-[11px] font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none min-h-[60px] resize-none overflow-hidden text-slate-700 mb-2 shadow-sm"
                  value={localApertura}
                  onChange={(e) => setLocalApertura(e.target.value)}
                  onBlur={() => updateMensajeApertura(lead.id, localApertura)}
                  placeholder="Mensaje de apertura..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendFlow('apertura')}
                    disabled={isSendingFlow === 'apertura'}
                    className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isSendingFlow === 'apertura' ? <span className="animate-spin">⏳</span> : <Send size={11} />}
                    {isSendingFlow === 'apertura' ? 'Enviando...' : 'Enviar'}
                  </button>
                  <button
                    onClick={() => handleStageForSending('apertura')}
                    disabled={stagingTab === 'apertura'}
                    className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 border ${
                      isStaged && lead.staged_etapa === 'apertura'
                        ? 'bg-amber-400 text-white border-amber-400'
                        : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                    }`}
                    title="Preparar para envío automático"
                  >
                    {stagingTab === 'apertura' ? <span className="animate-spin text-[10px]">⏳</span> : <Rocket size={11} />}
                    {stagingTab === 'apertura' ? '' : isStaged && lead.staged_etapa === 'apertura' ? '✓' : ''}
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleFeedback('apertura', true)} className="flex-1 py-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-100 transition-colors">✅ Funcionó</button>
                  <button onClick={() => handleFeedback('apertura', false)} className="flex-1 py-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-100 transition-colors">❌ No funcionó</button>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              {/* Script de Activador */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Flame size={10} /> 02. Activador
                  </span>
                  <select 
                    onChange={(e) => { applyTemplateById(e.target.value, updateMensajeActivador); e.target.value = ''; }}
                    className="text-[9px] border border-slate-200 rounded-md px-2 py-1 outline-none text-amber-600 bg-white font-bold"
                  >
                    <option value="">📚 Biblioteca</option>
                    {templates.filter(t => t.etapa === 'activador').map(t => (
                      <option key={t.id} value={t.id}>{getTemplateRating(t.sent_count, t.success_count)} {t.nombre}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  ref={activadorRef}
                  className="w-full text-[11px] font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10 transition-all outline-none min-h-[60px] resize-none overflow-hidden text-slate-700 mb-2 shadow-sm"
                  value={localActivador}
                  onChange={(e) => setLocalActivador(e.target.value)}
                  onBlur={() => updateMensajeActivador(lead.id, localActivador)}
                  placeholder="Mensaje activador..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendFlow('activador')}
                    disabled={isSendingFlow === 'activador'}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isSendingFlow === 'activador' ? <span className="animate-spin">⏳</span> : <Send size={11} />}
                    {isSendingFlow === 'activador' ? 'Enviando...' : 'Enviar'}
                  </button>
                  <button
                    onClick={() => handleStageForSending('activador')}
                    disabled={stagingTab === 'activador'}
                    className={`py-2 px-3 rounded-lg text-[10px] font-black transition-all active:scale-95 flex items-center gap-1.5 border ${
                      isStaged && lead.staged_etapa === 'activador'
                        ? 'bg-amber-400 text-white border-amber-400'
                        : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                    }`}
                    title="Preparar para envío automático"
                  >
                    {stagingTab === 'activador' ? <span className="animate-spin text-[10px]">⏳</span> : <Rocket size={11} />}
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleFeedback('activador', true)} className="flex-1 py-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-100 transition-colors">✅ Funcionó</button>
                  <button onClick={() => handleFeedback('activador', false)} className="flex-1 py-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-100 transition-colors">❌ No funcionó</button>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              {/* Script de Video */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                    <PlayCircle size={10} /> 03. Video
                  </span>
                  <select 
                    onChange={(e) => { applyTemplateById(e.target.value, updateMensajeVideo); e.target.value = ''; }}
                    className="text-[9px] border border-slate-200 rounded-md px-2 py-1 outline-none text-rose-600 bg-white font-bold"
                  >
                    <option value="">📚 Biblioteca</option>
                    {templates.filter(t => t.etapa === 'video_pilar').map(t => (
                      <option key={t.id} value={t.id}>{getTemplateRating(t.sent_count, t.success_count)} {t.nombre}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  ref={videoRef}
                  className="w-full text-[11px] font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 transition-all outline-none min-h-[60px] resize-none overflow-hidden text-slate-700 mb-2 shadow-sm"
                  value={localVideo}
                  onChange={(e) => setLocalVideo(e.target.value)}
                  onBlur={() => updateMensajeVideo(lead.id, localVideo)}
                  placeholder="Mensaje con video pilar..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendFlow('video')}
                    disabled={isSendingFlow === 'video'}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isSendingFlow === 'video' ? <span className="animate-spin">⏳</span> : <Send size={11} />}
                    {isSendingFlow === 'video' ? 'Enviando...' : 'Enviar'}
                  </button>
                  <div className="py-2 px-3 rounded-lg text-[9px] font-black bg-slate-100 text-slate-400 border border-slate-200 flex items-center gap-1">
                    <Activity size={10} /> MANUAL
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleFeedback('video', true)} className="flex-1 py-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-100 transition-colors">✅ Funcionó</button>
                  <button onClick={() => handleFeedback('video', false)} className="flex-1 py-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-100 transition-colors">❌ No funcionó</button>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              {/* Script de Cierre */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={10} /> 04. Cierre
                  </span>
                  <select 
                    onChange={(e) => { applyTemplateById(e.target.value, updateMensajeCierre); e.target.value = ''; }}
                    className="text-[9px] border border-slate-200 rounded-md px-2 py-1 outline-none text-purple-600 bg-white font-bold"
                  >
                    <option value="">📚 Biblioteca</option>
                    {templates.filter(t => t.etapa === 'cierre').map(t => (
                      <option key={t.id} value={t.id}>{getTemplateRating(t.sent_count, t.success_count)} {t.nombre}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  ref={cierreRef}
                  className="w-full text-[11px] font-semibold p-3 rounded-xl border border-slate-200 bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/10 transition-all outline-none min-h-[60px] resize-none overflow-hidden text-slate-700 mb-2 shadow-sm"
                  value={localCierre}
                  onChange={(e) => setLocalCierre(e.target.value)}
                  onBlur={() => updateMensajeCierre(lead.id, localCierre)}
                  placeholder="Mensaje de cierre final..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendFlow('cierre')}
                    disabled={isSendingFlow === 'cierre'}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isSendingFlow === 'cierre' ? <span className="animate-spin">⏳</span> : <Send size={11} />}
                    {isSendingFlow === 'cierre' ? 'Enviando...' : 'Enviar'}
                  </button>
                  <button
                    onClick={() => handleStageForSending('cierre')}
                    disabled={stagingTab === 'cierre'}
                    className={`py-2 px-3 rounded-lg text-[10px] font-black transition-all active:scale-95 flex items-center gap-1.5 border ${
                      isStaged && lead.staged_etapa === 'cierre'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                    }`}
                    title="Preparar para envío automático"
                  >
                    {stagingTab === 'cierre' ? <span className="animate-spin text-[10px]">⏳</span> : <Rocket size={11} />}
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleFeedback('cierre', true)} className="flex-1 py-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-100 transition-colors">✅ Funcionó</button>
                  <button onClick={() => handleFeedback('cierre', false)} className="flex-1 py-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-100 transition-colors">❌ No funcionó</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* BARRA DE ACCIONES FINALES */}
      <div className="p-5 pt-0 mt-auto flex flex-col gap-3">
        <div className="flex gap-2">
          {/* Botón Principal Dinámico Simplificado */}
          {lead.estado_contacto === 'Cliente Cerrado' ? (
            <div className="flex-[4] py-3 text-center text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-black uppercase tracking-widest">
              🏆 CLIENTE GANADO
            </div>
          ) : (
            <>
              <button 
                onClick={() => handleUpdateEstado('Reunión Agendada')}
                className="flex-[2] py-3 text-[10px] font-black uppercase tracking-wider rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
              >
                Agendar
              </button>
              <button 
                onClick={() => handleUpdateEstado('No Interesado')}
                className="flex-[2] py-3 text-[10px] font-black uppercase tracking-wider rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
              >
                Descartar
              </button>
            </>
          )}

          {/* WhatsApp Directo */}
          <a
            href={`https://wa.me/${formatWa(lead.telefono)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-[1] flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-all shadow-sm group/wa"
          >
            <MessageCircle size={20} className="group-hover/wa:scale-110 transition-transform" />
          </a>
        </div>

        {/* Notas Rápidas */}
        <div className="relative">
          <textarea
            ref={notasRef}
            className="w-full text-[10px] font-medium p-2 rounded-lg border border-slate-100 bg-slate-50/50 text-slate-500 focus:border-slate-300 transition-all outline-none resize-none overflow-hidden"
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

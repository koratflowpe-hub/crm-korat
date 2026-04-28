import React, { useState, useEffect } from 'react';
import { X, Send, Smartphone, Sparkles, MessageCircle, PlayCircle } from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';
import { n8nService } from '../../services/n8nService';

const LiveDemoModal = ({ isOpen, onClose }) => {
  const { templates } = useTemplates();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  // Agrupamos plantillas por categoría para el selector (solo las relevantes para la Demo)
  const relevantCategories = ['rescate_35', 'rescate_60', 'rescate_90', 'rec_24h', 'rec_3h', 'post_cita', 'apertura', 'activador', 'video_pilar', 'marketing', 'demo'];
  
  const groupedTemplates = templates.reduce((acc, t) => {
    if (relevantCategories.includes(t.etapa)) {
      if (!acc[t.etapa]) acc[t.etapa] = [];
      acc[t.etapa].push(t);
    }
    return acc;
  }, {});

  const categoryLabels = {
    rescate_35: 'Pilar 1: Rescate 35 Días',
    rescate_60: 'Pilar 1: Rescate 60 Días',
    rescate_90: 'Pilar 1: Rescate 90 Días',
    rec_24h: 'Pilar 2: Recordatorio (24h)',
    rec_3h: 'Pilar 2: Recordatorio (3h)',
    post_cita: 'Pilar 2: Post-Cita',
    apertura: 'Pilar 3: Apertura (Lead)',
    activador: 'Pilar 3: Activador / Interés',
    video_pilar: 'Pilar 3: Video Pilares',
    marketing: 'Pilar 3: Marketing / Otros',
    demo: 'Demos / Pruebas en Vivo'
  };

  useEffect(() => {
    if (selectedTemplateId) {
      const t = templates.find(t => t.id === selectedTemplateId);
      if (t) {
        setMessageContent(t.contenido);
      }
    } else {
      setMessageContent('');
    }
  }, [selectedTemplateId, templates]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!phoneNumber || !messageContent) return;

    setIsSending(true);
    setStatus(null);
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    
    try {
      await n8nService.sendMessage({
        phone: phoneNumber,
        message: messageContent,
        type: selectedTemplate?.etapa || 'demo'
      });
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex overflow-hidden max-h-[85vh]">
        
        {/* Left Side: Setup */}
        <div className="w-1/2 p-8 flex flex-col bg-slate-50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <PlayCircle size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Demo</h2>
                <p className="text-sm text-slate-500 font-medium">Demuestra KoratFlow en tiempo real</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Número del Prospecto (WhatsApp)
              </label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="+1 234 567 8900"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Script de la Bóveda (Demos)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 bg-slate-50 mb-4"
              >
                <option value="">Selecciona un script mágico...</option>
                {relevantCategories.map(category => (
                  groupedTemplates[category] && (
                    <optgroup key={category} label={categoryLabels[category] || category}>
                      {groupedTemplates[category].map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </optgroup>
                  )
                ))}
              </select>

              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Ajuste en vivo (Opcional)
              </label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="El texto de la plantilla aparecerá aquí y puedes ajustarlo..."
                className="w-full flex-1 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm text-slate-700 resize-none bg-slate-50"
              />
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!phoneNumber || !messageContent || isSending}
            className={`mt-6 w-full py-4 rounded-xl font-black text-white flex justify-center items-center gap-2 transition-all shadow-lg ${
              isSending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95'
            }`}
          >
            {isSending ? (
              <><span className="animate-spin">⏳</span> Enviando Demo...</>
            ) : status === 'success' ? (
              <>✅ Enviado con éxito</>
            ) : status === 'error' ? (
              <>❌ Error al enviar</>
            ) : (
              <><Send size={20} /> Disparar Mensaje en Vivo</>
            )}
          </button>
        </div>

        {/* Right Side: Phone Preview */}
        <div className="w-1/2 bg-slate-900 relative p-8 flex items-center justify-center">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900 pointer-events-none" />

          {/* iPhone Mockup */}
          <div className="relative w-[300px] h-[600px] bg-slate-800 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-700 overflow-hidden transform scale-95 hover:scale-100 transition-transform duration-500">
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-700 w-32 mx-auto rounded-b-xl z-20" />
            
            {/* Screen */}
            <div className="w-full h-full bg-[#EFEAE2] rounded-[2.5rem] overflow-hidden flex flex-col relative z-10">
              {/* WhatsApp Header */}
              <div className="bg-[#00A884] text-white px-4 py-3 pt-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">KoratFlow Nilah</h3>
                  <p className="text-[10px] opacity-80">En línea</p>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')] bg-repeat flex flex-col justify-end">
                {messageContent ? (
                  <div className="bg-[#D9FDD3] p-3 rounded-2xl rounded-tr-none max-w-[85%] self-end shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <p className="text-[13px] text-slate-800 whitespace-pre-wrap">{messageContent}</p>
                    <span className="text-[9px] text-slate-500 text-right block mt-1">Ahora</span>
                  </div>
                ) : (
                  <div className="text-center opacity-50 space-y-3 mb-10">
                    <MessageCircle size={40} className="mx-auto text-slate-500" />
                    <p className="text-xs font-medium text-slate-600">El mensaje de prueba<br/>aparecerá aquí</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LiveDemoModal;

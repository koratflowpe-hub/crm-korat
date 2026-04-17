import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, FileText, Check, AlertCircle, Rocket } from 'lucide-react';
import { n8nService } from '../services/n8nService';

export default function BulkImportModal({ onClose, onImported }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('input'); // input, processing, success

  const handleProcess = async () => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      setError(null);
      
      const results = await n8nService.triggerScriptAi(
        'extract_bulk_ideas', 
        { raw_text: text },
        `IMPORTANTE: Extrae las ideas del documento manteniendo el texto original del contenido INTEGRALMENTE (100% idéntico, no resumas ni cambies palabras en el 'master_draft'). 

Tu tarea es ORGANIZAR y COMPLETAR:
1. "pillars": Detecta los pilares. Si el texto no da descripción u objetivo para un pilar, CRÉALOS tú basándote en el contexto para que el pilar esté completo.
2. "scripts": Extrae cada video. El campo 'master_draft' DEBE ser el texto original extraído. 
3. COMPLETADO: Si faltan campos como 'video_copy' o 'hashtags', genéralos tú de forma brillante para que el usuario tenga el guion listo para usar.
        
Devuelve un JSON con: { "pillars": [{name, description, objective, keywords}], "scripts": [{title, master_draft, pillar_name, video_copy, hashtags}] }`
      );

      if (results && results.scripts && Array.isArray(results.scripts)) {
        onImported(results);
        setStep('success');
        setTimeout(onClose, 2000);
      } else {
        throw new Error("No se pudieron extraer ideas del texto o el formato no es válido.");
      }
    } catch (err) {
      setError(err.message || "Error al procesar el documento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200]">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="modal-overlay"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="modal-content max-w-2xl pointer-events-auto"
          >
            {/* Header */}
            <header className="modal-header">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                   <FileText size={24} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Extractor Pro</h2>
                   <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5 opacity-80">IA Engine v2.0</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-all">
                <X size={20} />
              </button>
            </header>

            <div className="modal-body p-5 sm:p-10">
              {step === 'input' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="mb-8">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                      <Sparkles size={14} className="text-gemini" /> Contenido Maestro
                    </label>
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Pega aquí el texto largo de Claude o tus notas..."
                      className="premium-input w-full h-80 rounded-[20px] sm:rounded-[32px] p-4 sm:p-6 text-sm leading-relaxed border-border focus:ring-primary/20"
                    />
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-xs font-bold animate-shake">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/20 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border">
                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2.5 text-foreground/80 text-[10px] font-black uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Estructura Inteligente
                      </div>
                      <div className="flex items-center gap-2.5 text-foreground/80 text-[10px] font-black uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Copys & Hashtags
                      </div>
                    </div>
                    <button 
                      onClick={handleProcess}
                      disabled={loading || !text.trim()}
                      className={`btn-primary w-full md:w-auto px-12 py-5 group ${loading ? 'opacity-50' : ''}`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                          <span>Cerebro IA Trabajando...</span>
                        </>
                      ) : (
                        <>
                          <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                          <span>Iniciar Extracción</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-20 text-center"
                >
                  <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-emerald-500/20 shadow-xl border border-emerald-500/20">
                    <Check size={48} strokeWidth={3} />
                  </div>
                  <h3 className="text-3xl font-black text-foreground uppercase tracking-tight mb-3">¡Éxito Total!</h3>
                  <p className="text-muted-foreground font-medium text-lg leading-relaxed">Ideas procesadas y aterrizadas en tu estudio.</p>
                </motion.div>
              )}
            </div>

            <footer className="px-5 sm:px-8 py-4 sm:py-5 bg-muted/40 text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-[0.2rem] sm:tracking-[0.4em] text-center opacity-40">
               Korat Flow Agencia • Digital Brain System
            </footer>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

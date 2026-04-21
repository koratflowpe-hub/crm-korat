import React, { useRef } from 'react';
import { Maximize2, Minimize2, Sparkles, Play, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MasterEditor — Editor de texto libre principal del guión.
 * Props:
 *  - value: string              → contenido del borrador
 *  - onChange: (val) => void    → actualiza el form en el hook
 *  - onOpenAI: (field, label) => void → abre el modal de IA
 *  - isZenMode: boolean         → modo pantalla completa
 *  - setIsZenMode: (bool) => void
 *  - onTeleprompter: () => void → abre el teleprompter (solo en zen mode)
 */
export default function MasterEditor({ value, onChange, onOpenAI, isZenMode, setIsZenMode, onTeleprompter }) {
  const textareaRef = useRef(null);

  const wordCount = value
    ? value.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = value ? value.length : 0;

  // ── ZEN MODE: Pantalla limpia total ──────────────────────────────────────
  if (isZenMode) {
    return (
      <AnimatePresence>
        <motion.div
          key="zen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            touchAction: 'pan-y',
          }}
        >
          {/* ── Barra Zen Superior: flotante y mínima ── */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 shrink-0 border-b border-slate-100 dark:border-slate-800/60">
            {/* Botón Regresar */}
            <button
              onClick={() => setIsZenMode(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all touch-manipulation"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-semibold hidden sm:inline">Salir de pantalla completa</span>
            </button>

            {/* Stats centrales: discretas */}
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest select-none">
              <span>{wordCount} palabras</span>
              <span>·</span>
              <span>{charCount} chars</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Guardado</span>
              </div>
            </div>

            {/* Acciones: IA + Grabación */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAI?.('master_draft', 'Borrador Maestro')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-primary bg-primary/5 hover:bg-primary/10 transition-all text-[11px] font-black uppercase tracking-widest touch-manipulation"
              >
                <Sparkles size={13} />
                <span className="hidden sm:inline">IA</span>
              </button>
              <button
                onClick={onTeleprompter}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all touch-manipulation"
              >
                <Play size={12} fill="currentColor" />
                <span className="hidden sm:inline">Grabar</span>
              </button>
            </div>
          </div>

          {/* ── Área de escritura: pura, sin bordes ni marcos ── */}
          <div className="flex-1 overflow-y-auto overscroll-none" style={{ touchAction: 'pan-y' }}>
            <textarea
              ref={textareaRef}
              autoFocus
              className="w-full h-full min-h-full bg-transparent resize-none outline-none
                         text-xl sm:text-2xl leading-loose
                         text-slate-800 dark:text-slate-100
                         font-light placeholder:text-slate-200 dark:placeholder:text-slate-800
                         selection:bg-primary/10 overscroll-none
                         px-6 sm:px-16 md:px-28 lg:px-48
                         py-10 sm:py-14"
              placeholder="Escribe tu guión maestro aquí..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ touchAction: 'pan-y', minHeight: '100%' }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── MODO NORMAL: Tarjeta con bordes redondeados ───────────────────────────
  return (
    <div className="w-full">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative"
        style={{ minHeight: '600px' }}
      >
        {/* ── Toolbar Superior ── */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Borrador Maestro</span>
          <div className="flex items-center gap-2">
            {/* Botón IA */}
            <button
              onClick={() => onOpenAI?.('master_draft', 'Borrador Maestro')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
            >
              <Sparkles size={12} />
              <span className="hidden sm:inline">Asistencia</span> IA
            </button>
            {/* Botón Zen / Pantalla completa */}
            <button
              onClick={() => setIsZenMode(true)}
              className="p-2 text-slate-400 hover:text-primary transition-all rounded-lg hover:bg-white dark:hover:bg-slate-800"
              title="Pantalla Completa"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* ── Área de Texto ── */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto overscroll-none" style={{ touchAction: 'pan-y' }}>
          <textarea
            ref={textareaRef}
            className="w-full h-full min-h-[500px] bg-transparent resize-none outline-none text-lg text-slate-800 dark:text-slate-100 leading-relaxed font-light placeholder:text-slate-300 dark:placeholder:text-slate-700 selection:bg-primary/10 overscroll-none"
            placeholder="Escribe tu guión maestro aquí... Cada palabra cuenta."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ touchAction: 'pan-y' }}
          />
        </div>

        {/* ── Footer: Estadísticas ── */}
        <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Palabras: <span className="text-slate-900 dark:text-slate-100 font-black">{wordCount}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Chars: <span className="text-slate-900 dark:text-slate-100 font-black">{charCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Auto-guardado activo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

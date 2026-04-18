import React, { useRef } from 'react';
import { Maximize2, Minimize2, Sparkles } from 'lucide-react';

/**
 * MasterEditor — Editor de texto libre principal del guión.
 * Props:
 *  - value: string              → contenido del borrador
 *  - onChange: (val) => void    → actualiza el form en el hook
 *  - onOpenAI: (field, label) => void → abre el modal de IA
 *  - isZenMode: boolean         → modo pantalla completa
 *  - setIsZenMode: (bool) => void
 */
export default function MasterEditor({ value, onChange, onOpenAI, isZenMode, setIsZenMode }) {
  const textareaRef = useRef(null);

  const wordCount = value
    ? value.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = value ? value.length : 0;

  return (
    <div className={`transition-all duration-500 ease-in-out ${isZenMode ? 'fixed inset-0 z-50 bg-background p-6 flex flex-col' : 'w-full'}`}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative group/editor" style={{ minHeight: isZenMode ? '100%' : '600px' }}>

        {/* ── Toolbar Superior ── */}
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Borrador Maestro</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón IA */}
            <button
              onClick={() => onOpenAI?.('master_draft', 'Borrador Maestro')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
            >
              <Sparkles size={12} />
              Asistencia IA
            </button>
            {/* Botón Zen */}
            <button
              onClick={() => setIsZenMode(!isZenMode)}
              className="p-2 text-slate-400 hover:text-primary transition-all rounded-lg hover:bg-white dark:hover:bg-slate-800"
              title={isZenMode ? 'Salir de Modo Zen' : 'Modo Zen'}
            >
              {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* ── Área de Texto ── */}
        <div className="flex-1 p-8 md:p-12">
          <textarea
            ref={textareaRef}
            className="w-full h-full min-h-[500px] bg-transparent resize-none outline-none text-lg text-slate-800 dark:text-slate-100 leading-relaxed font-light placeholder:text-slate-300 dark:placeholder:text-slate-700 selection:bg-primary/10"
            placeholder="Escribe tu guión maestro aquí... Cada palabra cuenta."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        {/* ── Footer: Estadísticas ── */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Palabras: <span className="text-slate-900 dark:text-slate-100 font-black">{wordCount}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Caracteres: <span className="text-slate-900 dark:text-slate-100 font-black">{charCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Auto-guardado activo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

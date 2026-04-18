import React from 'react';

export default function WritingModeToggle({ mode, setMode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Modo de escritura</span>
      <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center shadow-sm">
        <button
          onClick={() => setMode('libre')}
          className={`px-4 py-1.5 rounded-lg transition-all flex flex-col items-start ${
            mode === 'libre'
              ? 'bg-white dark:bg-slate-700 shadow text-primary'
              : 'text-slate-500'
          }`}
        >
          <span className="text-[12px] font-black tracking-widest">Libre</span>
          <span className="text-[9px] font-semibold opacity-60 leading-none">Texto abierto</span>
        </button>
        <button
          onClick={() => setMode('arquitecto')}
          className={`px-4 py-1.5 rounded-lg transition-all flex flex-col items-start ${
            mode === 'arquitecto'
              ? 'bg-white dark:bg-slate-700 shadow text-primary'
              : 'text-slate-500'
          }`}
        >
          <span className="text-[12px] font-black tracking-widest">Arquitecto</span>
          <span className="text-[9px] font-semibold opacity-60 leading-none">Bloques narrativos</span>
        </button>
      </div>
    </div>
  );
}

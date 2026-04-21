import React from 'react';
import { Edit3, Play, Save, X } from 'lucide-react';

export default function EditorHeader({ 
  title, 
  onTitleChange, 
  isSaving, 
  loading, 
  onSave, 
  onTeleprompter, 
  onClose 
}) {
  return (
    <header className="px-4 sm:px-8 py-3 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-20">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="h-9 w-9 sm:h-11 sm:w-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/5 shadow-sm shrink-0">
          <Edit3 size={18} sm:size={22} />
        </div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Nombre del Guión..."
            className="text-sm sm:text-lg font-bold bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 p-0 w-full placeholder:text-slate-300"
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 truncate">
                {isSaving ? 'Sincronizando' : 'Guardado'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onTeleprompter}
          className="hidden sm:flex p-2 sm:px-5 sm:py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl items-center gap-2 hover:scale-105 transition-all text-[11px] font-bold uppercase"
        >
          <Play size={14} fill="currentColor" /> <span className="hidden sm:inline">Grabación</span>
        </button>
        <button
          onClick={() => onSave()}
          disabled={loading}
          className="btn-primary p-2 sm:px-6 sm:py-2.5 shadow-lg shadow-primary/20 text-xs font-bold gap-2 text-white"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          <span className="hidden sm:inline">Guardar</span>
        </button>
        <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
          <X size={20} />
        </button>
      </div>
    </header>
  );
}

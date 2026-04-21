import React from 'react';
import { Type, Sparkles, ImageIcon, ShareIcon, LinkIcon, Zap, Lock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'guion',       label: 'Estructura',  icon: Type },
  { id: 'marketing',   label: 'Viralidad',   icon: Zap },
  { id: 'produccion',  label: 'Técnico',     icon: ImageIcon },
  { id: 'distribucion',label: 'Plataformas', icon: ShareIcon },
  { id: 'references',  label: 'Referencias', icon: LinkIcon },
];

export default function EditorSidebar({ activeTab, setActiveTab, getTabStatus, onDeleteScript }) {
  const currentIndex = MENU_ITEMS.findIndex(t => t.id === activeTab);

  const goTo = (id) => {
    if (getTabStatus(id)) setActiveTab(id);
  };

  const goPrev = () => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (getTabStatus(MENU_ITEMS[i].id)) { setActiveTab(MENU_ITEMS[i].id); return; }
    }
  };
  const goNext = () => {
    for (let i = currentIndex + 1; i < MENU_ITEMS.length; i++) {
      if (getTabStatus(MENU_ITEMS[i].id)) { setActiveTab(MENU_ITEMS[i].id); return; }
    }
  };

  const hasPrev = MENU_ITEMS.slice(0, currentIndex).some(t => getTabStatus(t.id));
  const hasNext = MENU_ITEMS.slice(currentIndex + 1).some(t => getTabStatus(t.id));

  const activeItem = MENU_ITEMS[currentIndex];
  const ActiveIcon = activeItem?.icon;

  return (
    <>
      {/* ── DESKTOP: sidebar vertical ── */}
      <nav className="hidden lg:flex w-64 border-r border-slate-100 dark:border-slate-800 p-6 flex-col gap-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-4 mb-2">Navegación</p>
        {MENU_ITEMS.map(tab => {
          const isAllowed = getTabStatus(tab.id);
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => isAllowed && setActiveTab(tab.id)}
              disabled={!isAllowed}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all
                ${isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : isAllowed
                    ? 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    : 'text-slate-300 cursor-not-allowed grayscale'
                }`}
            >
              <Icon size={16} />
              {tab.label}
              {!isAllowed && <Lock size={12} className="ml-auto opacity-30" />}
            </button>
          );
        })}

        <div className="pt-8 mt-auto">
          <button
            onClick={onDeleteScript}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 size={16} /> Eliminar Guión
          </button>
        </div>
      </nav>

      {/* ── MOBILE: barra de navegación inferior tipo app ── */}
      <div className="lg:hidden flex flex-col border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Fila superior: título de fase actual + flechas */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
          {/* Flecha Anterior */}
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation
              ${hasPrev
                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
                : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
              }`}
          >
            <ChevronLeft size={16} />
            <span className="hidden xs:inline">
              {hasPrev ? MENU_ITEMS.slice(0, currentIndex).filter(t => getTabStatus(t.id)).at(-1)?.label : 'Anterior'}
            </span>
          </button>

          {/* Fase actual */}
          <div className="flex items-center gap-2">
            {ActiveIcon && <ActiveIcon size={14} className="text-primary" />}
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
              {activeItem?.label}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {currentIndex + 1}/{MENU_ITEMS.length}
            </span>
          </div>

          {/* Flecha Siguiente */}
          <button
            onClick={goNext}
            disabled={!hasNext}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all touch-manipulation
              ${hasNext
                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
                : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
              }`}
          >
            <span className="hidden xs:inline">
              {hasNext ? MENU_ITEMS.slice(currentIndex + 1).find(t => getTabStatus(t.id))?.label : 'Siguiente'}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Fila inferior: pestañas con indicador de progreso */}
        <div className="flex items-end px-3 pt-2 pb-0 gap-1 overflow-x-auto no-scrollbar">
          {MENU_ITEMS.map((tab, idx) => {
            const isAllowed = getTabStatus(tab.id);
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => isAllowed && setActiveTab(tab.id)}
                disabled={!isAllowed}
                className={`relative flex flex-col items-center gap-1 px-3 pb-2.5 pt-1.5 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap touch-manipulation shrink-0
                  ${isActive
                    ? 'text-primary'
                    : isAllowed
                      ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                  }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {/* Indicador activo */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t-full" />
                )}
                {!isAllowed && (
                  <Lock size={8} className="absolute top-1 right-1 opacity-30" />
                )}
              </button>
            );
          })}

          {/* Botón Eliminar en móvil */}
          <button
            onClick={onDeleteScript}
            className="flex flex-col items-center gap-1 px-3 pb-2.5 pt-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/5 transition-all whitespace-nowrap touch-manipulation shrink-0 ml-auto"
          >
            <Trash2 size={15} />
            <span>Borrar</span>
          </button>
        </div>
      </div>
    </>
  );
}

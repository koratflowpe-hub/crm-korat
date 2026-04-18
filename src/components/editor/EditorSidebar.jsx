import React from 'react';
import { Type, Sparkles, ImageIcon, ShareIcon, LinkIcon, Zap, Lock, Trash2, LayoutGrid } from 'lucide-react';

export default function EditorSidebar({ activeTab, setActiveTab, getTabStatus, onDeleteScript }) {
  const menuItems = [
    { id: 'guion', label: 'Estructura', icon: <Type size={16} /> },
    { id: 'marketing', label: 'Viralidad', icon: <Zap size={16} /> },
    { id: 'produccion', label: 'Técnico', icon: <ImageIcon size={16} /> },
    { id: 'distribucion', label: 'Plataformas', icon: <ShareIcon size={16} /> },
    { id: 'references', label: 'Referencias', icon: <LinkIcon size={16} /> },
  ];

  return (
    <nav className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-4 sm:p-6 space-y-2 flex lg:flex-col overflow-x-auto lg:overflow-y-auto no-scrollbar gap-2 lg:gap-0">
      <div className="hidden lg:block mb-4">
         <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-4">Navegación</p>
      </div>
      {menuItems.map(tab => {
        const isAllowed = getTabStatus(tab.id);
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => isAllowed && setActiveTab(tab.id)}
            disabled={!isAllowed}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap
              ${isActive 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : isAllowed 
                  ? 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100' 
                  : 'text-slate-300 cursor-not-allowed grayscale'
              }`}
          >
            {tab.icon}
            {tab.label}
            {!isAllowed && <Lock size={12} className="ml-auto opacity-30" />}
          </button>
        );
      })}

      <div className="pt-4 lg:pt-8 mt-auto px-4 lg:px-0">
        <button
          onClick={onDeleteScript}
          className="w-full h-12 flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 bg-destructive/5 lg:bg-transparent transition-all border border-destructive/10 lg:border-none"
        >
          <Trash2 size={16} /> <span className="lg:inline">Eliminar Guión</span>
        </button>
      </div>
    </nav>
  );
}

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Target, Zap, ChevronLeft, ChevronRight, Hash, Sparkles, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';

export default function Sidebar({ collapsed, setCollapsed, isMobile }) {
  const location = useLocation();
  const { isSidebarHidden } = useThemeStore();

  const navItems = [
    {
      name: 'Leads (CRM)',
      short: 'Leads',
      description: 'Gestión de Leads',
      path: '/',
      icon: <Target size={20} />,
    },
    {
      name: 'Estudio Creativo',
      short: 'Estudio',
      description: 'Producción de Contenido',
      path: '/creator-flow',
      icon: <Zap size={20} />,
    }
  ];

  return (
    <>
      <aside 
        className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-[100] hidden md:flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}
        style={{ 
          transform: isSidebarHidden ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        {/* Brand Header */}
        <div className={`h-20 flex items-center transition-all duration-300 ${collapsed ? 'justify-center px-4' : 'justify-between px-6'} border-b border-slate-100`}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm">
                <Box size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                  Korat<span className="text-primary italic">Flow</span>
                </h1>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Agencia de Creadores
                </p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-md transition-all shadow-sm"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {!collapsed && (
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 ml-4 mb-2">
              Menú Principal
            </h3>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 rounded-md transition-all group ${
                  isActive 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                } ${collapsed ? 'p-3 justify-center' : 'p-3 px-4'}`}
              >
                <div className={`flex-shrink-0 transition-all ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-900'}`}>
                  {React.cloneElement(item.icon, { strokeWidth: isActive ? 2.5 : 2 })}
                </div>
                
                {!collapsed && (
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">
                      {item.name}
                    </div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {!collapsed && (
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sistema</p>
                  <div className="flex items-center gap-1.5">
                     <span className="text-[11px] font-bold text-emerald-600 uppercase">Activo</span>
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full rounded-full" />
                </div>
             </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav 
        className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/80 z-[150] flex items-center justify-around shadow-[0_-1px_0_rgba(0,0,0,0.06)] dark:bg-slate-950/95 dark:border-slate-800/80"
        style={{ 
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '10px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive 
                  ? 'text-primary' 
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/10' : ''}`}>
                {React.cloneElement(item.icon, { size: 24, strokeWidth: isActive ? 2.5 : 2 })}
              </div>
              <span className="text-xs font-medium">{item.short}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

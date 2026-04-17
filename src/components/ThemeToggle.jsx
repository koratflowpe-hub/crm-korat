import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Modo Día' : 'Modo Noche'}
      className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 border-2 shadow-sm ${
        isDark 
          ? 'bg-[#2D3035] border-slate-600 text-yellow-400 hover:bg-slate-700 hover:scale-110 active:scale-95'
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:scale-110 active:scale-95'
      }`}
    >
      {isDark ? <Sun size={20} strokeWidth={3} /> : <Moon size={20} strokeWidth={3} />}
    </button>
  );
}

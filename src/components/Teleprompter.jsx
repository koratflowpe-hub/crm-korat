import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Type, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Teleprompter({ text, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // 1-10
  // Fuente adaptable: 28px base en móvil, 48px en desktop
  const [fontSize, setFontSize] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640 ? 28 : 48
  );
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += scrollSpeed;
        }
      }, 50);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, scrollSpeed]);

  const resetScroll = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setIsPlaying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col text-white"
      style={{ touchAction: 'pan-y', overscrollBehavior: 'none' }}
    >
      {/* Top Controls */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/90 to-transparent z-10 gap-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        {/* Controles de Tamaño y Velocidad — fila en móvil */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 flex-1">
          {/* Fuente */}
          <div className="flex items-center gap-2">
            <Type size={16} className="text-slate-400 shrink-0" />
            <input
              type="range" min="16" max="100" value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="accent-indigo-500 w-20 sm:w-28 h-1.5 rounded-full"
            />
            <span className="text-[10px] font-bold text-slate-500 w-6">{fontSize}</span>
          </div>
          {/* Velocidad */}
          <div className="flex items-center gap-2">
            <ArrowDown size={16} className="text-slate-400 shrink-0" />
            <input
              type="range" min="1" max="10" value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="accent-indigo-500 w-20 sm:w-28 h-1.5 rounded-full"
            />
            <span className="text-[10px] font-bold text-slate-500 w-4">{scrollSpeed}x</span>
          </div>
        </div>

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all shrink-0 touch-manipulation"
        >
          <X size={20} />
        </button>
      </div>

      {/* Reading Line Indicator */}
      <div className="absolute top-1/2 left-0 right-0 h-16 sm:h-24 border-y border-indigo-500/30 bg-indigo-500/5 -translate-y-1/2 pointer-events-none z-0" />

      {/* Text Container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 sm:px-12 scroll-smooth no-scrollbar"
        style={{
          paddingTop: '40vh',
          paddingBottom: '45vh',
          fontSize: `${fontSize}px`,
          lineHeight: 1.5,
          overscrollBehavior: 'none',
          touchAction: 'pan-y',
        }}
      >
        <p className="text-center font-bold tracking-tight text-slate-100 whitespace-pre-wrap">
          {text || 'Escribe el guión para verlo aquí...'}
        </p>
      </div>

      {/* Bottom Controls */}
      <div
        className="flex items-center justify-center gap-4 py-4"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl px-6 py-3 rounded-3xl border border-white/10 shadow-2xl">
          <button
            onClick={resetScroll}
            className="p-3 text-slate-400 hover:text-white transition-all touch-manipulation"
          >
            <RotateCcw size={22} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all shadow-xl shadow-indigo-600/40 touch-manipulation"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <div className="w-8 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
            {scrollSpeed}x
          </div>
        </div>
      </div>
    </motion.div>
  );
}

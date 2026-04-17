import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Type, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Teleprompter({ text, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // 1-10
  const [fontSize, setFontSize] = useState(48);
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
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center text-white"
    >
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Type size={18} className="text-slate-400" />
            <input 
              type="range" min="20" max="120" value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="accent-indigo-500 w-24 h-1.5 rounded-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <ArrowDown size={18} className="text-slate-400" />
            <input 
              type="range" min="1" max="10" value={scrollSpeed} 
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="accent-indigo-500 w-24 h-1.5 rounded-full"
            />
          </div>
        </div>
        
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
          <X size={24} />
        </button>
      </div>

      {/* Reading Line Indicator */}
      <div className="absolute top-1/2 left-0 right-0 h-24 border-y border-indigo-500/30 bg-indigo-500/5 -translate-y-1/2 pointer-events-none z-0" />

      {/* Text Container */}
      <div 
        ref={scrollRef}
        className="w-full max-w-4xl h-full overflow-y-auto px-10 py-[40vh] scroll-smooth no-scrollbar"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
      >
        <p className="text-center font-bold tracking-tight text-slate-100 whitespace-pre-wrap">
          {text || "Escribe el guión para verlo aquí..."}
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 flex items-center gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
        <button 
          onClick={resetScroll}
          className="p-3 text-slate-400 hover:text-white transition-all"
        >
          <RotateCcw size={24} />
        </button>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-16 h-16 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all shadow-xl shadow-indigo-600/40"
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
        </button>
        <div className="w-12 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
          {scrollSpeed}x
        </div>
      </div>
    </motion.div>
  );
}

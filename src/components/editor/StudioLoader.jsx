import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
  'Conectando con tu cerebro creativo...',
  'Cargando bloques narrativos...',
  'Sincronizando tu estrategia de contenido...',
  'Activando el motor de ideas...',
  'Preparando el estudio...',
];

const Particle = ({ delay, size, x, y, duration }) => (
  <motion.div
    className="absolute rounded-full bg-primary/30"
    style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    animate={{
      y: [0, -30, 0],
      opacity: [0, 0.8, 0],
      scale: [0.5, 1, 0.5],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  delay: i * 0.4,
  size: Math.random() * 6 + 3,
  x: Math.random() * 80 + 10,
  y: Math.random() * 80 + 10,
  duration: Math.random() * 2 + 2,
}));

export default function StudioLoader({ message }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(88, 28, 235, 0.15) 0%, rgba(0,0,0,0.96) 70%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Partículas flotantes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map(p => <Particle key={p.id} {...p} />)}
      </div>

      {/* Contenedor central */}
      <div className="relative flex flex-col items-center gap-8 z-10">

        {/* Orbe central */}
        <div className="relative flex items-center justify-center">
          {/* Anillos orbitales */}
          {[1.6, 1.3, 1.1].map((scale, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-primary/20"
              style={{ width: 80 * scale, height: 80 * scale }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.05, 1] }}
              transition={{ duration: 4 + i * 1.5, repeat: Infinity, ease: 'linear' }}
            />
          ))}

          {/* Núcleo brillante */}
          <motion.div
            className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
              boxShadow: '0 0 60px rgba(124, 58, 237, 0.6), 0 0 120px rgba(124, 58, 237, 0.2)',
            }}
            animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Ícono de cerebro / escritura */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                fill="white"
                fillOpacity="0.9"
                animate={{ fillOpacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Barra de progreso */}
        <div className="w-64 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Mensaje dinámico */}
        <div className="text-center" style={{ minHeight: '40px' }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={message || msgIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60"
            >
              {message || MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Indicador de puntos */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.8, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, delay: i * 0.3, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

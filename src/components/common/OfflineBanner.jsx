import React from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner({ isOffline }) {
  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-2 bg-gradient-to-r from-red-500/90 to-orange-500/90 backdrop-blur-md border-b border-red-500/50 shadow-lg text-white"
        >
          <WifiOff className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Estás navegando sin conexión. Los datos mostrados pueden no estar actualizados.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

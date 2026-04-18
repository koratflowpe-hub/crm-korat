import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScriptEditorMain from './editor/ScriptEditorMain';

export default function ScriptEditorModal({ scriptId, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-[95vw] h-full sm:h-[90vh] rounded-none sm:rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
        >
          <ScriptEditorMain 
            scriptId={scriptId} 
            onClose={onClose}
            onSaveComplete={() => {}} // Could trigger a refresh in parent if needed
            onDeleteComplete={() => {}}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

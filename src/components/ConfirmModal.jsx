import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Eliminar", type = "danger" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="modal-overlay"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="modal-content max-w-sm pointer-events-auto p-8 flex flex-col items-center text-center"
            >
              <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-6 shadow-2xl ${
                type === 'danger' 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {type === 'danger' ? <Trash2 size={36} strokeWidth={2.5} /> : <AlertCircle size={36} strokeWidth={2.5} />}
              </div>
              
              <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight uppercase">
                {title || 'Confirmar'}
              </h3>
              <p className="text-sm font-medium text-muted-foreground mb-8 leading-relaxed px-2">
                {message || 'Esta acción no se puede deshacer.'}
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={onCancel}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 ${type === 'danger' ? 'btn-danger bg-destructive text-white border-none' : 'btn-primary'}`}
                >
                  {confirmText}
                </button>
              </div>

              <button
                onClick={onCancel}
                className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-muted"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

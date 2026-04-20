import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Check, Sparkles, Trash2, Plus, RotateCcw } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';

const BLOCK_LABELS = {
  hook:        'Gancho',
  and:         'Contexto',
  but:         'Conflicto',
  therefore:   'Resolución',
  cta:         'Llamado a la Acción',
  problem:     'Problema',
  agitation:   'Agitación',
  solution:    'Solución',
  development: 'Desarrollo',
  value:       'Valor',
};

const COLLAPSED_HEIGHT = 100; // px cuando el bloque no está activo

/**
 * Textarea con altura dinámica.
 * - Definido FUERA del componente padre para evitar que React lo destruya en cada render.
 * - Usa manipulación directa del DOM (sin useState/useEffect) para que NUNCA pierda el foco.
 */
const BlockTextarea = ({ value, onChange, onSave, placeholder }) => {
  const ref = useRef(null);

  // Establecer altura inicial al montar (sin foco → colapsado)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = `${COLLAPSED_HEIGHT}px`;
    }
  }, []);

  // Si el contenido cambia desde afuera (ej. AI llenar el bloque) y tiene foco, ajustar
  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement !== el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const expand = (el) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const collapse = (el) => {
    el.style.height = `${COLLAPSED_HEIGHT}px`;
  };

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value);
        expand(e.target);
      }}
      onFocus={(e) => expand(e.target)}
      onBlur={(e) => {
        collapse(e.target);
        onSave();
      }}
      className="w-full bg-transparent border-none p-0 text-base font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-300 outline-none focus:ring-0 resize-none leading-relaxed overflow-hidden"
      style={{ transition: 'height 0.25s ease' }}
    />
  );
};

export default function ScriptArchitect({ 
  blocks, 
  loading, 
  onBlockChange, 
  onSaveBlocks, 
  onInitTemplate, 
  onResetBlocks,
  onCompileDraft, 
  onOpenAI, 
  onAddBlock,
  onDeleteBlock
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (blocks.length === 0) {
    return (
      <div className="py-24 text-center bg-muted/20 rounded-[50px] border-2 border-dashed border-border flex flex-col items-center">
        <div className="w-24 h-24 bg-card text-primary rounded-[32px] flex items-center justify-center mb-8 shadow-2xl border border-border group-hover:scale-110 transition-transform">
          <Layers size={48} strokeWidth={1} />
        </div>
        <h3 className="text-3xl font-black text-foreground mb-3 uppercase tracking-tight">Arquitecto de Contenido</h3>
        <p className="text-sm text-muted-foreground font-medium mb-12 max-w-sm">Estructura tu narrativa usando técnicas de alto impacto viral.</p>
        <div className="flex flex-wrap justify-center gap-6">
          <button 
            onClick={() => onInitTemplate('standard')}
            className="bg-card px-10 py-5 rounded-[24px] border border-border hover:border-primary transition-all group flex flex-col items-center gap-2 shadow-xl hover:translate-y-[-5px]"
          >
            <span className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Clásico Directo</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Hook-Value-CTA</span>
          </button>
          <button 
            onClick={() => onInitTemplate('abt')}
            className="bg-card px-10 py-5 rounded-[24px] border border-border hover:border-primary transition-all group flex flex-col items-center gap-2 shadow-xl hover:translate-y-[-5px]"
          >
            <span className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Ingeniería ABT</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">And-But-Therefore</span>
          </button>
          <button 
            onClick={() => onInitTemplate('pas')}
            className="bg-card px-10 py-5 rounded-[24px] border border-border hover:border-primary transition-all group flex flex-col items-center gap-2 shadow-xl hover:translate-y-[-5px]"
          >
            <span className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Método PAS</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Problem-Agitate-Solve</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-2 gap-3">
        <div className="flex items-center gap-2.5">
          <Zap size={18} className="text-amber-500 fill-amber-500/10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Flujo Narrativo Dinámico</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg border border-green-100 dark:border-green-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span>
          </div>
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-[10px] font-bold uppercase tracking-widest border border-rose-200 dark:border-rose-900 shadow-sm"
            title="Elegir otra estructura"
          >
            <RotateCcw size={14} /> Reiniciar Estructura
          </button>
          <button 
            onClick={onCompileDraft}
            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Check size={14} /> Unificar Guión
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {blocks.map((block, idx) => (
          <motion.div 
            layoutId={block.id}
            key={block.id} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-primary/30 transition-[border-color] duration-200 shadow-sm group/block relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold border border-slate-100 dark:border-slate-700">
                  0{idx + 1}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-lg">
                  {BLOCK_LABELS[block.block_type] || block.block_type}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-all">
                <button onClick={() => onOpenAI('block', `Fase: ${block.block_type}`, block.id)} className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all">
                  <Sparkles size={16} />
                </button>
                <button onClick={() => onDeleteBlock(block.id)} className="p-2 text-slate-400 hover:text-destructive transition-colors rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <BlockTextarea 
              value={block.text_content}
              onChange={(val) => onBlockChange(block.id, val)}
              onSave={() => onSaveBlocks()}
              placeholder="Escribe el contenido..."
            />
          </motion.div>
        ))}
      </div>
      
      <button 
        onClick={onAddBlock}
        className="py-4 border shadow-sm border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3"
      >
        <Plus size={16} /> Añadir Bloque
      </button>

      <ConfirmModal 
        isOpen={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={() => {
          onResetBlocks();
          setShowResetConfirm(false);
        }}
        title="¿Reiniciar Arquitectura?"
        message="Atención: Esta acción borrará todos los bloques de contenido actuales y te devolverá a la selección de plantillas. Hazlo solo si deseas descartar este borrador estructurado."
        confirmText="Sí, reiniciar"
        type="danger"
      />
    </div>
  );
}

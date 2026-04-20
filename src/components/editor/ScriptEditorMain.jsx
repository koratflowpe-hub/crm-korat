import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScriptEditor } from '../../hooks/useScriptEditor';
import EditorHeader from './EditorHeader';
import EditorSidebar from './EditorSidebar';
import WritingModeToggle from './WritingModeToggle';
import MasterEditor from './MasterEditor';
import ScriptArchitect from './ScriptArchitect';
import { ProductionTab, MarketingTab, DistributionTab, ReferencesTab } from './EditorTabs';
import AIAssistModal from './AIAssistModal';
import StudioLoader from './StudioLoader';
import Teleprompter from '../Teleprompter';
import ConfirmModal from '../ConfirmModal';
import { supabase } from '../../lib/supabase';
import { STATUS_CONFIG, COLUMN_ORDER } from '../../utils/studioHelpers';

export default function ScriptEditorMain({ scriptId, onClose, onSaveComplete, onDeleteComplete }) {
  const {
    script,
    form,
    setForm,
    blocks,
    pillars,
    loading,
    isSaving,
    aiLoading,
    lastSaved,
    error,
    activeTab,
    setActiveTab,
    isZenMode,
    setIsZenMode,
    writingMode,
    setWritingMode,
    blocksLoading,
    handleSave,
    handleBlockChange,
    saveBlocks,
    initTemplate,
    resetBlocks,
    compileDraft,
    fetchBlocks,
    aiPromptTarget,
    setAiPromptTarget,
    userInstruction,
    setUserInstruction,
    handleAIAssist
  } = useScriptEditor(scriptId);

  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getTabStatus = (tabId) => {
    const s = form.status;
    const mapping = {
      guion: COLUMN_ORDER,
      marketing: COLUMN_ORDER,
      produccion: ['ready', 'recorded', 'published'],
      distribucion: ['ready', 'recorded', 'published'],
      references: COLUMN_ORDER
    };
    return mapping[tabId]?.includes(s) || false;
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('scripts').delete().eq('id', scriptId);
      if (error) {
        console.error("Error al eliminar guión:", error);
        alert("No se pudo eliminar el guión: " + error.message);
      } else {
        if (onDeleteComplete) onDeleteComplete(scriptId);
        if (onClose) onClose();
      }
    } catch (err) {
      console.error("Excepción al eliminar:", err);
      alert("Error inesperado al intentar eliminar.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Mostrar el loader premium mientras se cargan los datos iniciales
  if (!script && loading) {
    return <StudioLoader />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <EditorHeader 
        title={form.title}
        onTitleChange={(val) => setForm({ ...form, title: val })}
        isSaving={isSaving}
        loading={loading}
        onSave={() => handleSave()}
        onTeleprompter={() => setShowTeleprompter(true)}
        onClose={onClose}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <EditorSidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          getTabStatus={getTabStatus}
          onDeleteScript={() => setShowDeleteConfirm(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-14 custom-scrollbar bg-slate-50/20 dark:bg-transparent">
          {activeTab === 'guion' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="space-y-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Pilar Estratégico</span>
                    <select
                      value={form.pillar_id}
                      onChange={e => setForm({...form, pillar_id: e.target.value})}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-sm min-w-[220px]"
                    >
                      <option value="">🎯 Sin pilar asignado</option>
                      {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Estatus del Ciclo</span>
                    <select
                      value={form.status}
                      onChange={e => setForm({...form, status: e.target.value})}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                    >
                      {COLUMN_ORDER.map(statusKey => (
                        <option key={statusKey} value={statusKey}>
                          {STATUS_CONFIG[statusKey]?.label || statusKey}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <WritingModeToggle mode={writingMode} setMode={setWritingMode} />
              </div>

              {/* FIX: 'libre' usa MasterEditor, 'arquitecto' usa ScriptArchitect */}
              {writingMode === 'libre' ? (
                <MasterEditor 
                  value={form.master_draft}
                  onChange={(val) => setForm({ ...form, master_draft: val })}
                  onOpenAI={(field, label) => setAiPromptTarget({ field, label })}
                  isZenMode={isZenMode}
                  setIsZenMode={setIsZenMode}
                />
              ) : (
                <ScriptArchitect 
                  blocks={blocks}
                  loading={blocksLoading}
                  onBlockChange={handleBlockChange}
                  onSaveBlocks={saveBlocks}
                  onInitTemplate={initTemplate}
                  onResetBlocks={resetBlocks}
                  onCompileDraft={compileDraft}
                  onOpenAI={(field, label, blockId) => setAiPromptTarget({ field, label, blockId })}
                  onAddBlock={async () => {
                    await supabase.from('script_blocks').insert([{
                      script_id: scriptId,
                      block_type: 'custom',
                      block_order: blocks.length,
                      text_content: ''
                    }]);
                    fetchBlocks();
                  }}
                  onDeleteBlock={async (id) => {
                    await supabase.from('script_blocks').delete().eq('id', id);
                    fetchBlocks();
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'marketing' && (
            <MarketingTab 
              form={form} 
              setForm={setForm} 
              openAIPrompt={(field, label) => setAiPromptTarget({ field, label })} 
            />
          )}

          {activeTab === 'produccion' && (
            <ProductionTab 
              form={form} 
              setForm={setForm} 
              openAIPrompt={(field, label) => setAiPromptTarget({ field, label })} 
            />
          )}

          {activeTab === 'distribucion' && (
            <DistributionTab 
              form={form} 
              setForm={setForm} 
              openAIPrompt={(field, label) => setAiPromptTarget({ field, label })} 
            />
          )}

          {activeTab === 'references' && (
            <ReferencesTab 
              form={form} 
              setForm={setForm} 
            />
          )}
        </main>
      </div>

      {/* FIX: usa aiLoading en lugar de loading para no bloquear el editor */}
      <AIAssistModal 
        target={aiPromptTarget}
        userInstruction={userInstruction}
        setUserInstruction={setUserInstruction}
        onClose={() => setAiPromptTarget(null)}
        onConfirm={handleAIAssist}
        loading={aiLoading}
      />

      {showTeleprompter && (
        <Teleprompter 
          text={form.master_draft} 
          onClose={() => setShowTeleprompter(false)} 
        />
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="¿Eliminar Guión?"
        message="Esta acción no se puede deshacer. Todos los bloques narrativos también se eliminarán."
        confirmText="¡Sí, eliminar!"
        type="danger"
      />
    </div>
  );
}

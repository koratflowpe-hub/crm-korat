import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, ChevronDown, Layers, BookOpen, 
  Sparkles, Megaphone, Layout, ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext } from '@hello-pangea/dnd';

// Libs & Service
import { supabase } from '../lib/supabase';
import { useThemeStore } from '../store/themeStore';

// Modular Components
import BrandSwitcher from '../components/BrandSwitcher';
import ConfirmModal from '../components/ConfirmModal';
import HooksManager from '../components/HooksManager';
import CtasManager from '../components/CtasManager';
import BulkImportModal from '../components/BulkImportModal';

// Studio Specific Components
import { KanbanColumn } from '../components/studio/KanbanColumn';
import { PillarCard } from '../components/studio/PillarCard';
import { PillarModal, PillarInfoModal, ScriptModal } from '../components/studio/StudioModals';
import StudioLoader from '../components/editor/StudioLoader';

// Hooks & Helpers
import { useStudioData } from '../hooks/useStudioData';
import { STATUS_CONFIG, COLUMN_ORDER } from '../utils/studioHelpers';

// Styles
import './CreatorStudio.css';

export default function CreatorStudio() {
  const navigate = useNavigate();
  const terminalScrollRef = useRef(null);
  const { setSidebarHidden } = useThemeStore();

  // State
  const [activeTab, setActiveTab] = useState(COLUMN_ORDER[0]);
  const [viewMode, setViewMode]   = useState('production'); // 'production' | 'strategy' | 'library'
  const [searchQuery, setSearchQuery] = useState('');
  const [pillarSearch, setPillarSearch] = useState('');
  
  // Modals Visibility
  const [showPillarModal, setShowPillarModal]   = useState(false);
  const [editingPillar, setEditingPillar]       = useState(null);
  const [viewingPillarInfo, setViewingPillarInfo] = useState(null);
  const [showHooksManager, setShowHooksManager] = useState(false);
  const [showCtasManager, setShowCtasManager] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showScriptModal, setShowScriptModal]   = useState(false);
  const [scriptModalStatus, setScriptModalStatus] = useState('idea');
  const [scriptModalPillarId, setScriptModalPillarId] = useState('');
  const [showPillarSelector, setShowPillarSelector] = useState(false);
  const [pillarToDelete, setPillarToDelete] = useState(null);

  // Hook Data
  const {
    brands, setBrands,
    selectedBrand, setSelectedBrand,
    pillars, setPillars,
    scripts, setScripts,
    loading,
    fetchData,
    updateScriptStatus,
    deletePillar,
    addScriptLocally,
    addPillarLocally,
    updatePillarLocally
  } = useStudioData();

  // Sync scroll for mobile pagination
  useEffect(() => {
    const container = terminalScrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const width = container.offsetWidth;
      const index = Math.round(scrollLeft / width);
      if (COLUMN_ORDER[index]) setActiveTab(COLUMN_ORDER[index]);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handlers
  const handlePillarSave = (p) => {
    if (editingPillar) { updatePillarLocally(p); } 
    else { addPillarLocally(p); }
    setShowPillarModal(false);
    setEditingPillar(null);
  };

  const onDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    await updateScriptStatus(draggableId, destination.droppableId);
  };

  const openScriptModal = (status = 'idea', pilarId = '') => {
    setScriptModalStatus(status);
    setScriptModalPillarId(pilarId);
    setShowScriptModal(true);
  };

  const scrollToColumn = (col) => {
    setActiveTab(col);
    const container = terminalScrollRef.current;
    const el = document.getElementById(`column-${col}`);
    if (container && el) {
      container.style.scrollSnapType = 'none';
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setTimeout(() => { container.style.scrollSnapType = 'x mandatory'; }, 600);
    }
  };

  const confirmDeletePillar = async () => {
    if (!pillarToDelete) return;
    const { error } = await deletePillar(pillarToDelete);
    if (!error) setPillarToDelete(null);
  };

  // Filter scripts
  const filteredScripts = scripts.filter(s => 
    s.brand_id === selectedBrand?.id && 
    (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (s.pillars?.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getScriptsByStatus = (status) => filteredScripts.filter(s => s.status === status);

  if (loading && brands.length === 0) {
    return <StudioLoader message="Sincronizando Cerebro Creativo..." />;
  }

  return (
    <div className="cs-root">
      {/* ─── Top Command Bar ─── */}
      <header className="cs-topbar">
        <div className="cs-topbar-row">
          <div className="cs-brand-mark">
            <div className="cs-brand-icon"><Sparkles size={18} /></div>
            <div className="cs-brand-text">
              <h1>Creator Studio</h1>
              <p>Hyper-Agencia Intelligence</p>
            </div>
          </div>

          <div className="cs-switcher-desktop">
            <div className="cs-view-switcher">
              {[
                { id: 'production', label: 'Producción', icon: <Sparkles size={16} /> },
                { id: 'strategy', label: 'Estrategia', icon: <Layers size={16} /> },
                { id: 'library', label: 'Biblioteca', icon: <BookOpen size={16} /> }
              ].map(mode => (
                <button 
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`cs-view-btn ${viewMode === mode.id ? 'cs-view-btn--active' : ''}`}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <BrandSwitcher 
            brands={brands} currentBrand={selectedBrand} 
            onBrandChange={setSelectedBrand} 
            onBrandCreated={b => { setBrands(prev => [b, ...prev]); setSelectedBrand(b); }}
            onBrandDeleted={id => { setBrands(prev => prev.filter(b => b.id !== id)); if(selectedBrand?.id === id) setSelectedBrand(brands[0]); }}
          />
        </div>

        {/* Mobile View Switcher */}
        <div className="cs-switcher-mobile">
          <div className="cs-view-switcher">
            {[
              { id: 'production', label: 'PROD' },
              { id: 'strategy', label: 'ESTRAT' },
              { id: 'library', label: 'LIB' }
            ].map(mode => (
              <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`cs-view-btn ${viewMode === mode.id ? 'cs-view-btn--active' : ''}`}
              >
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <AnimatePresence mode="wait">
        {viewMode === 'strategy' && (
          <motion.div 
            key="strategy-hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="cs-deck-wrap"
          >
            <div className="cs-strategy-header">
              <div className="cs-pillar-selector-wrap">
                <button onClick={() => setShowPillarSelector(!showPillarSelector)} className="cs-pillar-selector-btn">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={16} />
                    <span>{pillarSearch ? `Filtrando: ${pillarSearch}` : 'Buscar pilar...'}</span>
                  </div>
                  <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {showPillarSelector && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="cs-pillar-selector-dropdown">
                      <input autoFocus placeholder="Filtrar..." className="cs-pillar-search-input" value={pillarSearch} onChange={(e) => setPillarSearch(e.target.value)} />
                      {pillars.filter(p => !pillarSearch || p.name.toLowerCase().includes(pillarSearch.toLowerCase())).map(p => (
                        <button key={p.id} className="cs-pillar-opt" onClick={() => { setViewingPillarInfo(p); setShowPillarSelector(false); setPillarSearch(''); }}>
                          <span className="mr-2 text-lg">{p.emoji || '🎯'}</span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => setShowPillarModal(true)} className="cs-pillar-add-btn desktop-only">
                <Plus size={18} /><span>Nuevo Pilar</span>
              </button>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cs-strategy-deck">
              {pillars.length === 0 ? (
                <div className="cs-empty-state-full">
                  <Layout size={48} className="mb-4 text-slate-300" />
                  <p>Inicia definiendo tus pilares estratégicos.</p>
                  <button onClick={() => setShowPillarModal(true)} className="cs-btn cs-btn--primary mt-4">Crear Primer Pilar</button>
                </div>
              ) : (
                pillars.map(pillar => (
                  <PillarCard 
                    key={pillar.id} pillar={pillar} 
                    scriptCount={scripts.filter(s => s.pillar_id === pillar.id).length} 
                    onClick={() => setViewingPillarInfo(pillar)} 
                  />
                ))
              )}
            </motion.div>
          </motion.div>
        )}

        {viewMode === 'production' && (
          <motion.main 
            key="production-board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="cs-board"
          >
            <div className="cs-phase-nav">
              <div className="cs-phase-nav-inner">
                {COLUMN_ORDER.map(col => (
                  <button key={col} onClick={() => scrollToColumn(col)} className={`cs-phase-btn ${activeTab === col ? 'cs-phase-btn--active' : ''}`}>
                    {STATUS_CONFIG[col].icon}{STATUS_CONFIG[col].label}
                    <span className="cs-phase-count">{getScriptsByStatus(col).length}</span>
                  </button>
                ))}
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div ref={terminalScrollRef} className="cs-board-scroll">
                {COLUMN_ORDER.map(col => (
                  <KanbanColumn 
                    key={col} status={col} scripts={getScriptsByStatus(col)} 
                    onAddIdea={() => openScriptModal(col)} 
                  />
                ))}
              </div>
            </DragDropContext>
          </motion.main>
        )}

        {viewMode === 'library' && (
          <motion.div 
            key="library-hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="cs-library-deck"
          >
            <div className="cs-library-grid-header"><h2>Catálogo de Recursos</h2></div>
            <div className="cs-library-cards">
              <button onClick={() => setShowHooksManager(true)} className="cs-library-card">
                <div className="cs-library-icon cs-library-icon--hooks"><Sparkles size={24} /></div>
                <div className="cs-library-info"><h3>Ganchos Maestros</h3><p>Arsenal de hooks de alto impacto.</p></div>
                <ArrowUpRight className="cs-library-arrow" size={20} />
              </button>
              <button onClick={() => setShowCtasManager(true)} className="cs-library-card">
                <div className="cs-library-icon cs-library-icon--ctas"><Megaphone size={24} /></div>
                <div className="cs-library-info"><h3>Cierres (CTAs)</h3><p>Convierte audiencia en clientes.</p></div>
                <ArrowUpRight className="cs-library-arrow" size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modals ─── */}
      <AnimatePresence>
        {(showPillarModal || editingPillar) && (
          <PillarModal 
            pillar={editingPillar} brand={selectedBrand}
            onClose={() => { setShowPillarModal(false); setEditingPillar(null); }} 
            onSave={handlePillarSave}
          />
        )}
        {viewingPillarInfo && (
          <PillarInfoModal 
            pillar={viewingPillarInfo} 
            onClose={() => setViewingPillarInfo(null)} 
            onEdit={(p) => { setViewingPillarInfo(null); setEditingPillar(p); }}
            onStartCreating={(pid) => { setViewingPillarInfo(null); openScriptModal('idea', pid); }}
          />
        )}
        {showHooksManager && <HooksManager onClose={() => setShowHooksManager(false)} />}
        {showCtasManager && <CtasManager onClose={() => setShowCtasManager(false)} />}
        {showBulkImport && (
          <BulkImportModal 
            onClose={() => setShowBulkImport(false)} 
            onImported={async () => { fetchData(); setShowBulkImport(false); }} 
          />
        )}
        {showScriptModal && (
          <ScriptModal 
            pillars={pillars} brandId={selectedBrand?.id} 
            defaultStatus={scriptModalStatus}
            defaultPillarId={scriptModalPillarId}
            onClose={() => setShowScriptModal(false)} 
            onSave={s => addScriptLocally(s)} 
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={pillarToDelete !== null}
        title="¿Eliminar Pilar?"
        message="Esta acción borrará la estrategia del pilar. Los guiones se mantendrán sin pilar."
        onConfirm={confirmDeletePillar}
        onCancel={() => setPillarToDelete(null)}
      />

      {/* ─── Floating Action Buttons ─── */}
      <div className="cs-fab-group">
        <button onClick={() => setShowCtasManager(true)} className="cs-fab cs-fab--secondary cs-fab--pink" title="CTAs"><Megaphone size={20} /></button>
        <button onClick={() => setShowHooksManager(true)} className="cs-fab cs-fab--secondary" title="Hooks"><Sparkles size={20} /></button>
        <button onClick={() => openScriptModal('idea')} className="cs-fab cs-fab--primary" title="Nueva Idea"><Plus size={26} /></button>
      </div>
    </div>
  );
}

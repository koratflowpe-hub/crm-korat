import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { ScriptCard } from './ScriptCard';
import { STATUS_CONFIG } from '../../utils/studioHelpers';

const EmptyState = ({ config, onAddIdea, status }) => (
  <div className="cs-empty-state">
    <div className="cs-empty-state-icon">{config.icon}</div>
    <p className="cs-empty-state-text">
      Aún no hay ideas en<br /><strong>{config.label}</strong>
    </p>
    <button className="cs-empty-state-cta" onClick={() => onAddIdea(status)}>
      <Plus size={14} strokeWidth={3} />
      Agregar idea
    </button>
  </div>
);

/**
 * dndReady viene del padre (CreatorStudio) y es true una sola vez
 * después del primer montaje. Esto evita el flash blanco que ocurría
 * cuando cada columna manejaba su propio estado y se reiniciaba en
 * cada re-render del padre.
 */
export const KanbanColumn = ({ status, scripts, onAddIdea, dndReady }) => {
  const config = STATUS_CONFIG[status];

  return (
    <div id={`column-${status}`} className="cs-column">
      <div className="cs-column-header">
        <div className="cs-column-header-left">
          <div className={`cs-column-dot ${config.color}`} />
          <h3 className="cs-column-title">{config.label}</h3>
        </div>
        <span className="cs-column-count">{scripts.length}</span>
      </div>

      {dndReady ? (
        // ── Modo DnD activo ───────────────────────────────────────────────
        <Droppable droppableId={String(status)} mode="standard" direction="vertical">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`cs-column-body cs-column-body--dnd ${snapshot.isDraggingOver ? 'cs-column-body--dragging-over' : ''}`}
            >
              {/* Renderizar EmptyState si no hay scripts, pero dejarlo en el DOM si se está arrastrando encima para evitar saltos */}
              {scripts.length === 0 && (
                <div style={{ display: snapshot.isDraggingOver ? 'none' : 'block' }}>
                  <EmptyState config={config} onAddIdea={onAddIdea} status={status} />
                </div>
              )}
              
              {scripts.map((script, index) => (
                <ScriptCard key={script.id} script={script} index={index} draggable />
              ))}
              
              {provided.placeholder}
              
              {scripts.length > 0 && (
                <button onClick={() => onAddIdea(status)} className="cs-add-idea-btn">
                  <Plus size={16} /> Crear Idea
                </button>
              )}
            </div>
          )}
        </Droppable>
      ) : (

        // ── Fallback estático (antes de que DnD esté listo) ───────────────
        <div className="cs-column-body">
          {scripts.length === 0 ? (
            <EmptyState config={config} onAddIdea={onAddIdea} status={status} />
          ) : (
            scripts.map((script) => (
              <ScriptCard key={script.id} script={script} index={0} draggable={false} />
            ))
          )}
          {scripts.length > 0 && (
            <button onClick={() => onAddIdea(status)} className="cs-add-idea-btn">
              <Plus size={16} /> Crear Idea
            </button>
          )}
        </div>
      )}
    </div>
  );
};

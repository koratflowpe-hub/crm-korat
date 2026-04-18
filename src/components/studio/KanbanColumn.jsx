import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { ScriptCard } from './ScriptCard';
import { STATUS_CONFIG } from '../../utils/studioHelpers';

export const KanbanColumn = ({ status, scripts, onAddIdea }) => {
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

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div 
            {...provided.droppableProps} 
            ref={provided.innerRef} 
            className={`cs-column-body ${snapshot.isDraggingOver ? 'cs-column-body--dragging-over' : ''}`}
          >
            {scripts.length === 0 && !snapshot.isDraggingOver ? (
              <div className="cs-empty-state">
                <div className="cs-empty-state-icon">
                  {config.icon}
                </div>
                <p className="cs-empty-state-text">
                  Aún no hay ideas en<br/><strong>{config.label}</strong>
                </p>
                <button
                  className="cs-empty-state-cta"
                  onClick={() => onAddIdea(status)}
                >
                  <Plus size={14} strokeWidth={3} />
                  Agregar idea
                </button>
              </div>
            ) : (
              scripts.map((script, index) => (
                <ScriptCard key={script.id} script={script} index={index} />
              ))
            )}
            {provided.placeholder}
            
            {scripts.length > 0 && (
              <button 
                onClick={() => onAddIdea(status)}
                className="cs-add-idea-btn"
              >
                <Plus size={16} />
                Incubar Idea
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

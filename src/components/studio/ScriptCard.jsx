import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ScriptCard = ({ script, index }) => {
  const navigate = useNavigate();

  return (
    <Draggable draggableId={script.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => navigate(`/studio/edit/${script.id}`)}
          className={`cs-script-card ${snapshot.isDragging ? 'cs-script-card--dragging' : ''}`}
        >
          <div className="cs-script-card-meta">
            {script.pillars ? (
              <span 
                className="cs-script-pillar-tag"
                style={{ 
                  color: script.pillars.hex_color, 
                  borderColor: script.pillars.hex_color + '40', 
                  backgroundColor: script.pillars.hex_color + '0C' 
                }}
              >
                {script.pillars.name}
              </span>
            ) : (
              <span className="cs-script-pillar-tag cs-script-pillar-tag--empty">
                Sin Pilar
              </span>
            )}
            <div className="cs-script-date">
              <Clock size={11} />
              <span>
                {new Date(script.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          </div>
          <h4 className="cs-script-title">{script.title}</h4>
        </div>
      )}
    </Draggable>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Vista compartida de la tarjeta (contenido visual)
const CardContent = ({ script }) => (
  <>
    <div className="cs-script-card-meta">
      {script.pillars ? (
        <span
          className="cs-script-pillar-tag"
          style={{
            color: script.pillars.hex_color,
            borderColor: script.pillars.hex_color + '40',
            backgroundColor: script.pillars.hex_color + '0C',
          }}
        >
          {script.pillars.name}
        </span>
      ) : (
        <span className="cs-script-pillar-tag cs-script-pillar-tag--empty">Sin Pilar</span>
      )}
      <div className="cs-script-date">
        <Clock size={11} />
        <span>
          {new Date(script.updated_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
          })}
        </span>
      </div>
    </div>
    <h4 className="cs-script-title">{script.title}</h4>
  </>
);

export const ScriptCard = ({ script, index, draggable = true }) => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const wasDragged = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClick = () => {
    if (wasDragged.current) {
      wasDragged.current = false;
      return;
    }
    navigate(`/studio/edit/${script.id}`);
  };

  // ── Sin DnD: tarjeta estática clicable ───────────────────────────────
  if (!draggable) {
    return (
      <div onClick={() => navigate(`/studio/edit/${script.id}`)} className="cs-script-card">
        <CardContent script={script} />
      </div>
    );
  }

  // ── Con DnD: tarjeta arrastrable (solo escritorio) ────────────────────
  return (
    <Draggable
      draggableId={String(script.id)}
      index={index}
      isDragDisabled={!isDesktop}
    >
      {(provided, snapshot) => {
        if (snapshot.isDragging) wasDragged.current = true;

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={handleClick}
            className={`cs-script-card ${snapshot.isDragging ? 'cs-script-card--dragging' : ''}`}
            style={{
              ...provided.draggableProps.style,
              cursor: snapshot.isDragging ? 'grabbing' : isDesktop ? 'grab' : 'pointer',
            }}
          >
            <CardContent script={script} />
          </div>
        );
      }}
    </Draggable>
  );
};

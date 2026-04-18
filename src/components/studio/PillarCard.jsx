import React from 'react';

export const PillarCard = ({ pillar, scriptCount, onClick }) => {
  return (
    <button
      onClick={() => onClick(pillar)}
      className="cs-pillar-card"
    >
      <div className="cs-pillar-card-top">
        <div className="cs-pillar-card-name-row items-center">
          <div className="cs-pillar-bar" style={{ backgroundColor: pillar.hex_color, width: '4px', height: '20px', borderRadius: '4px' }} />
          <span className="text-xl mr-1">{pillar.emoji || '🎯'}</span>
          <h4 className="cs-pillar-name" style={{ fontSize: '15px', fontWeight: 700 }}>{pillar.name}</h4>
        </div>
        <div className="cs-pillar-count" style={{ padding: '4px 10px', fontSize: '12px' }}>
          {scriptCount} Ideas
        </div>
      </div>
      
      <div style={{ padding: '4px 0' }}>
        <p className={`cs-pillar-objective ${!pillar.objective ? 'cs-pillar-objective--empty' : ''}`}>
          {pillar.objective || 'Sin objetivo estratégico definido todavía...'}
        </p>
      </div>

      <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
         <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Click para ver detalles</span>
         <div style={{ height: '1px', flex: 1, background: '#F1F5F9' }} />
      </div>
    </button>
  );
};

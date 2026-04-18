import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScriptEditorMain from '../components/editor/ScriptEditorMain';

export default function ScriptEditorPage() {
  // FIX: La ruta define `:scriptId`, no `:id`
  const { scriptId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <ScriptEditorMain 
        scriptId={scriptId} 
        onClose={() => navigate('/creator-flow')}
        onDeleteComplete={() => navigate('/creator-flow')}
      />
    </div>
  );
}

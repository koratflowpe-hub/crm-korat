import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { n8nService } from '../services/n8nService';

const DEFAULT_FORM = {
  title: '',
  pillar_id: '',
  status: 'idea',
  master_draft: '',
  video_copy: '',
  hashtags: '',
  platforms: [],
  reference_links: [],
  camera_setup: '',
  lighting_setup: '',
  shot_list: '',
  facebook_copy: '',
  carousel_data: [],
  hook_variations: [],
};

export function useScriptEditor(scriptId) {
  const [script, setScript]         = useState(null);
  const [pillars, setPillars]        = useState([]);
  const [form, setForm]              = useState(DEFAULT_FORM);
  const [blocks, setBlocks]          = useState([]);

  // FIX: Dos estados de carga separados.
  // `loading` = carga inicial de datos (bloquea la UI principal).
  // `isSaving` = guardado en segundo plano (no bloquea nada).
  const [loading, setLoading]        = useState(true);
  const [isSaving, setIsSaving]      = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [aiLoading, setAiLoading]    = useState(false);

  const [lastSaved, setLastSaved]    = useState(new Date());
  const [error, setError]            = useState(null);
  const [activeTab, setActiveTab]    = useState('guion');
  const [isZenMode, setIsZenMode]    = useState(false);
  const [writingMode, setWritingMode] = useState('libre');

  // AI states
  const [aiPromptTarget, setAiPromptTarget]   = useState(null);
  const [userInstruction, setUserInstruction] = useState('');

  // FIX: Ref para controlar que el auto-save no dispare en el primer render.
  const isDataLoaded = useRef(false);

  // ── Fetch Blocks ──────────────────────────────────────────────────────────
  // FIX: useCallback para evitar re-renders innecesarios.
  const fetchBlocks = useCallback(async () => {
    if (!scriptId) return;
    try {
      setBlocksLoading(true);
      const { data, error: err } = await supabase
        .from('script_blocks')
        .select('*')
        .eq('script_id', scriptId)
        .order('block_order', { ascending: true });
      if (err) throw err;
      setBlocks(data ?? []);
    } catch (err) {
      console.error('[useScriptEditor] fetchBlocks error:', err);
    } finally {
      setBlocksLoading(false);
    }
  }, [scriptId]);

  // ── Fetch Script + Pillars + Blocks ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!scriptId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      isDataLoaded.current = false; // Prevenir auto-save durante la carga

      // Peticiones en paralelo para mayor velocidad
      const [{ data: pillarsData }, { data: scriptData, error: scriptError }] = await Promise.all([
        supabase.from('pillars').select('id, name, description, objective, keywords').order('created_at', { ascending: true }),
        supabase.from('scripts').select('*').eq('id', scriptId).single(),
      ]);

      if (scriptError) throw scriptError;

      if (pillarsData) setPillars(pillarsData);

      setScript(scriptData);
      setForm({
        title:           scriptData.title           ?? '',
        pillar_id:       scriptData.pillar_id        ?? '',
        status:          scriptData.status           ?? 'idea',
        master_draft:    scriptData.master_draft     ?? '',
        video_copy:      scriptData.video_copy       ?? '',
        hashtags:        scriptData.hashtags         ?? '',
        platforms:       Array.isArray(scriptData.platforms)         ? scriptData.platforms         : [],
        reference_links: Array.isArray(scriptData.reference_links)   ? scriptData.reference_links   : [],
        camera_setup:    scriptData.camera_setup     ?? '',
        lighting_setup:  scriptData.lighting_setup   ?? '',
        shot_list:       scriptData.shot_list        ?? '',
        facebook_copy:   scriptData.facebook_copy    ?? '',
        carousel_data:   Array.isArray(scriptData.carousel_data)     ? scriptData.carousel_data     : [],
        hook_variations: Array.isArray(scriptData.hook_variations)   ? scriptData.hook_variations   : [],
      });

      // Cargar bloques en paralelo con el resto
      await fetchBlocks();
    } catch (err) {
      console.error('[useScriptEditor] fetchData error:', err);
      setError(err.message ?? 'Error al cargar el guión');
    } finally {
      setLoading(false);
      // Activar auto-save sólo DESPUÉS de que los datos estén completamente cargados
      isDataLoaded.current = true;
    }
  }, [scriptId, fetchBlocks]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handle Save ───────────────────────────────────────────────────────────
  // FIX: NUNCA tocar `loading` aquí. Solo usa `isSaving` para el indicador visual.
  const handleSave = useCallback(async (isSilent = false) => {
    if (!scriptId) return;
    setIsSaving(true);
    if (!isSilent) setError(null);

    const { error: err } = await supabase
      .from('scripts')
      .update({
        title:           form.title,
        pillar_id:       form.pillar_id || null,
        status:          form.status,
        master_draft:    form.master_draft,
        video_copy:      form.video_copy,
        hashtags:        form.hashtags,
        platforms:       form.platforms,
        reference_links: form.reference_links,
        camera_setup:    form.camera_setup,
        lighting_setup:  form.lighting_setup,
        shot_list:       form.shot_list,
        facebook_copy:   form.facebook_copy,
        carousel_data:   form.carousel_data,
        hook_variations: form.hook_variations,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', scriptId);

    if (err) {
      console.error('[useScriptEditor] handleSave error:', err);
      if (!isSilent) setError(err.message);
    } else {
      setLastSaved(new Date());
    }
    setIsSaving(false);
  }, [scriptId, form]);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  // FIX: Solo dispara cuando los datos ya están cargados (`isDataLoaded.current`)
  useEffect(() => {
    if (!isDataLoaded.current || !scriptId) return;

    const timer = setTimeout(() => {
      handleSave(true); // isSilent = true: no muestra errores en UI
    }, 2000);

    return () => clearTimeout(timer);
  }, [form, scriptId]); // handleSave NO incluida para evitar loop infinito

  // ── Blocks ────────────────────────────────────────────────────────────────
  const handleBlockChange = useCallback((id, content) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, text_content: content } : b));
  }, []);

  const saveBlocks = useCallback(async (currentBlocks = blocks) => {
    const updates = currentBlocks
      .filter(b => b.id) // solo bloques con id válido
      .map(b => supabase.from('script_blocks').update({ text_content: b.text_content }).eq('id', b.id));
    await Promise.all(updates);
  }, [blocks]);

  const initTemplate = useCallback(async (type) => {
    if (!scriptId) return;
    setBlocksLoading(true);
    await supabase.from('script_blocks').delete().eq('script_id', scriptId);

    const templates = {
      valor:    [
        { type: 'hook',        label: 'Gancho Estratégico',      placeholder: 'Escribe tu gancho de 3 segundos...' },
        { type: 'development', label: 'Desarrollo (Valor)',       placeholder: 'Explica el concepto principal...' },
        { type: 'cta',         label: 'Cierre (CTA)',             placeholder: 'Diles qué hacer ahora...' },
      ],
      standard: [
        { type: 'hook',        label: 'Gancho Estratégico',      placeholder: 'Escribe tu gancho de 3 segundos...' },
        { type: 'development', label: 'Desarrollo (Valor)',       placeholder: 'Explica el concepto principal...' },
        { type: 'cta',         label: 'Cierre (CTA)',             placeholder: 'Diles qué hacer ahora...' },
      ],
      abt: [
        { type: 'hook',       label: 'Gancho',                   placeholder: 'La promesa irresistible...' },
        { type: 'and',        label: 'Y... (Contexto)',           placeholder: 'Añade información de soporte...' },
        { type: 'but',        label: 'PERO... (El Conflicto)',    placeholder: 'Introduce la tensión...' },
        { type: 'therefore',  label: 'POR LO TANTO (Resolución)',placeholder: 'Cómo se resuelve...' },
        { type: 'cta',        label: 'Cierre',                   placeholder: 'CTA final...' },
      ],
      pas: [
        { type: 'problem',    label: 'Problema',                 placeholder: 'El dolor del usuario...' },
        { type: 'agitation',  label: 'Agitación',                placeholder: 'Por qué ese problema es grave...' },
        { type: 'solution',   label: 'Solución',                 placeholder: 'Cómo resuelves el problema...' },
        { type: 'cta',        label: 'Cierre (CTA)',             placeholder: 'Guía al siguiente paso...' },
      ],
    };

    const chosen = templates[type] ?? templates.standard;
    const toInsert = chosen.map((b, i) => ({
      script_id: scriptId,
      block_type: b.type,
      text_content: '',
      block_order: i,
    }));

    const { data } = await supabase.from('script_blocks').insert(toInsert).select();
    if (data) setBlocks(data);
    setBlocksLoading(false);
  }, [scriptId]);

  const resetBlocks = useCallback(async () => {
    if (!scriptId) return;
    setBlocksLoading(true);
    await supabase.from('script_blocks').delete().eq('script_id', scriptId);
    setBlocks([]);
    setBlocksLoading(false);
  }, [scriptId]);

  const compileDraft = useCallback(() => {
    const combined = blocks
      .map(b => b.text_content)
      .filter(Boolean)
      .join('\n\n');
    setForm(f => ({ ...f, master_draft: combined }));
    setWritingMode('libre');
  }, [blocks]);

  // ── AI Assist ─────────────────────────────────────────────────────────────
  const handleAIAssist = useCallback(async () => {
    if (!aiPromptTarget) return;

    const { field, blockId, label } = aiPromptTarget;
    const currentContent = blockId
      ? blocks.find(b => b.id === blockId)?.text_content
      : form[field];

    const pilar = pillars.find(p => p.id === form.pillar_id);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const context = {
        script_id:           scriptId,
        title:               form.title,
        current_content:     currentContent,
        field_target:        blockId ? `block_${blockId}` : field,
        block_id:            blockId,
        pillar_id:           form.pillar_id,
        pillar_name:         pilar?.name,
        pillar_description:  pilar?.description,
        pillar_objective:    pilar?.objective,
        pillar_keywords:     pilar?.keywords,
        user_id:             user?.id,
        master_draft:        form.master_draft,
        video_copy:          form.video_copy,
        shot_list:           form.shot_list,
        lighting_setup:      form.lighting_setup,
        camera_setup:        form.camera_setup,
        hashtags:            form.hashtags,
        full_blocks:         blocks,
      };

      setAiLoading(true);
      const response = await n8nService.triggerScriptAi('assist', context, userInstruction);

      const newText =
        response?.generated_text ??
        response?.text ??
        response?.output ??
        response?.content?.parts?.[0]?.text ??
        (typeof response === 'string' ? response : null);

      if (newText) {
        if (blockId) {
          const updatedBlocks = blocks.map(b =>
            b.id === blockId ? { ...b, text_content: newText } : b
          );
          setBlocks(updatedBlocks);
          await saveBlocks(updatedBlocks);
        } else {
          setForm(f => ({ ...f, [field]: f[field] ? `${f[field]}\n\n${newText}` : newText }));
        }
        setAiPromptTarget(null);
      }
    } catch (err) {
      console.error('[useScriptEditor] handleAIAssist error:', err);
    } finally {
      setAiLoading(false);
      setUserInstruction('');
    }
  }, [aiPromptTarget, blocks, form, pillars, scriptId, userInstruction, saveBlocks]);

  return {
    // Data
    script,
    form,
    setForm,
    blocks,
    pillars,
    // Loading states
    loading,
    isSaving,
    aiLoading,
    blocksLoading,
    lastSaved,
    error,
    // UI state
    activeTab,
    setActiveTab,
    isZenMode,
    setIsZenMode,
    writingMode,
    setWritingMode,
    // Actions
    handleSave,
    fetchBlocks,
    handleBlockChange,
    saveBlocks,
    initTemplate,
    resetBlocks,
    compileDraft,
    // AI
    aiPromptTarget,
    setAiPromptTarget,
    userInstruction,
    setUserInstruction,
    handleAIAssist,
  };
}

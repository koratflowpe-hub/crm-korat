import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const VALID_STATUSES = ['idea', 'drafting', 'ready', 'recorded', 'published'];

export function useStudioData() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [pillars, setPillars] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [pRes, sRes, tRes, bRes] = await Promise.all([
      supabase.from('pillars').select('*').order('created_at', { ascending: false }),
      supabase.from('scripts').select('*, pillars(*)').order('updated_at', { ascending: false }),
      supabase.from('tags').select('*'),
      supabase.from('brands').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    const activeBrands = bRes.data || [];
    setBrands(activeBrands);

    if (activeBrands.length > 0) {
      setSelectedBrand(prev => prev ? activeBrands.find(b => b.id === prev.id) || activeBrands[0] : activeBrands[0]);
    } else {
      const { data } = await supabase.from('brands').insert([{ name: 'Marca Personal', user_id: user.id }]).select().single();
      if (data) { 
        setBrands([data]); 
        setSelectedBrand(data); 
      }
    }

    // Normalizar scripts con status inválido para que no causen errores 400
    const rawScripts = (sRes.data || []).map(s => ({
      ...s,
      status: VALID_STATUSES.includes(s.status) ? s.status : 'idea',
    }));

    setPillars(pRes.data || []);
    setScripts(rawScripts);
    setTags(tRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Actualiza el status de un script en Supabase.
   * Retorna { error } para que el llamador pueda revertir el estado
   * optimista local si la operación falla.
   */
  const updateScriptStatus = async (scriptId, newStatus) => {
    if (!VALID_STATUSES.includes(newStatus)) {
      console.error('[useStudioData] updateScriptStatus: status inválido:', newStatus);
      return { error: new Error(`Status inválido: ${newStatus}`) };
    }

    const { error } = await supabase
      .from('scripts')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', scriptId);

    if (error) {
      console.error('[useStudioData] updateScriptStatus error:', error.message, error);
    }

    return { error };
  };

  const deletePillar = async (pillarId) => {
    const { error } = await supabase.from('pillars').delete().eq('id', pillarId);
    if (!error) {
      setPillars(prev => prev.filter(p => p.id !== pillarId));
    }
    return { error };
  };

  const addScriptLocally = (script) => {
    setScripts(prev => [script, ...prev]);
  };

  const addPillarLocally = (pillar) => {
    setPillars(prev => [pillar, ...prev]);
  };

  const updatePillarLocally = (pillar) => {
    setPillars(prev => prev.map(x => x.id === pillar.id ? pillar : x));
  };

  return {
    brands, setBrands,
    selectedBrand, setSelectedBrand,
    pillars, setPillars,
    scripts, setScripts,
    tags, setTags,
    loading,
    fetchData,
    updateScriptStatus,
    deletePillar,
    addScriptLocally,
    addPillarLocally,
    updatePillarLocally
  };
}

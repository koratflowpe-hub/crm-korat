import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useCrmConfig = () => {
  const [config, setConfig] = useState({
    pureKeywords: 'salon,belleza,uñas,spa,barberia',
    radius: 3000,
    limit: 15,
    lat: -11.500,
    lng: -77.210
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar configuración inicial
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('crm_scraper_config')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.warn('No se pudo cargar la configuración de Supabase, usando local:', error.message);
          return;
        }

        if (data) {
          setConfig({
            pureKeywords: data.pure_keywords || 'salon,belleza,uñas,spa,barberia',
            radius: Number(data.radius) || 3000,
            limit: Number(data.scraper_limit) || 15,
            lat: parseFloat(data.lat) || -11.500,
            lng: parseFloat(data.lng) || -77.210
          });
        }
      } catch (err) {
        console.error('Error al cargar config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Función para guardar cambios con debounce
  const saveToSupabase = useCallback(async (newConfig) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('crm_scraper_config')
        .update({
          pure_keywords: newConfig.pureKeywords,
          radius: Number(newConfig.radius),
          scraper_limit: Number(newConfig.limit),
          lat: parseFloat(newConfig.lat),
          lng: parseFloat(newConfig.lng),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
    } catch (err) {
      console.error('Error al guardar config en Supabase:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounce ref
  const debounceTimer = useRef(null);

  const updateField = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);

    // Cancelar timer previo
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Programar guardado en 800ms
    debounceTimer.current = setTimeout(() => {
      saveToSupabase(newConfig);
    }, 800);
  };

  return {
    ...config,
    isLoadingConfig: isLoading,
    isSavingConfig: isSaving,
    setPureKeywords: (val) => updateField('pureKeywords', val),
    setRadius: (val) => updateField('radius', val),
    setLimit: (val) => updateField('limit', val),
    setLat: (val) => updateField('lat', val),
    setLng: (val) => updateField('lng', val),
    setConfig: (newConfig) => {
      setConfig(newConfig);
      saveToSupabase(newConfig);
    }
  };
};

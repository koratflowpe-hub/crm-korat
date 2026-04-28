import { useState, useEffect, useCallback } from 'react';
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
          .single();

        if (error) {
          console.warn('No se pudo cargar la configuración de Supabase, usando local:', error.message);
          return;
        }

        if (data) {
          setConfig({
            pureKeywords: data.pure_keywords,
            radius: data.radius,
            limit: data.scraper_limit,
            lat: data.lat,
            lng: data.lng
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

  // Función para guardar cambios (con debouncing manual opcional o directo)
  const saveConfig = useCallback(async (newConfig) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('crm_scraper_config')
        .update({
          pure_keywords: newConfig.pureKeywords,
          radius: newConfig.radius,
          scraper_limit: newConfig.limit,
          lat: newConfig.lat,
          lng: newConfig.lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
    } catch (err) {
      console.error('Error al guardar config:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update individual field and save
  const updateField = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    // Guardamos en Supabase (aquí podrías añadir un debounce si lo prefieres)
    saveConfig(newConfig);
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
      saveConfig(newConfig);
    }
  };
};

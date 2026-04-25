import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useLeads = (testMode = true) => {
  const queryClient = useQueryClient();

  // Fetch Leads
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_salones')
        .select('*')
        .order('puntuacion_lead', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchOnWindowFocus: true,
    staleTime: 0, // Siempre considerar datos como potencialmente stale
    // Polling de seguridad: si el canal Realtime pierde un evento de la IA (n8n),
    // esta red de respaldo re-consultará automáticamente cada 8 segundos.
    refetchInterval: 8000,
    refetchIntervalInBackground: false, // Solo cuando la pestaña está activa
  });


  // Mutaciones
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('leads_salones')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (updatedLead) => {
      // Actualización optimista del cache
      queryClient.setQueryData(['leads'], (old) => 
        old.map(l => l.id === updatedLead.id ? updatedLead : l)
      );
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadObj) => {
      if (!testMode && leadObj.telefono) {
        await supabase.from('leads_rechazados').upsert([{ 
          telefono: leadObj.telefono, 
          nombre_salon: leadObj.nombre_salon 
        }]);
      }
      const { error } = await supabase.from('leads_salones').delete().eq('id', leadObj.id);
      if (error) throw error;
      return leadObj.id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['leads'], (old) => old.filter(l => l.id !== deletedId));
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (newLead) => {
      const { data, error } = await supabase
        .from('leads_salones')
        .insert([{ ...newLead, busqueda_origen: 'Creación Manual' }])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (newLead) => {
      queryClient.setQueryData(['leads'], (old) => [newLead, ...old]);
    },
  });

  return {
    leads,
    isLoading,
    error,
    updateLead: (id, updates) => updateLeadMutation.mutate({ id, updates }),
    deleteLead: (leadObj) => deleteLeadMutation.mutate(leadObj),
    createLead: (newLead) => createLeadMutation.mutate(newLead),
    // Helpers específicos para legibilidad
    updateEstado: (id, estado) => updateLeadMutation.mutate({ id, updates: { estado_contacto: estado } }),
    updateNotas: (id, notas) => updateLeadMutation.mutate({ id, updates: { notas } }),
    updateMensajeApertura: (id, texto) => updateLeadMutation.mutate({ id, updates: { mensaje_apertura: texto } }),
    updateMensajeActivador: (id, texto) => updateLeadMutation.mutate({ id, updates: { mensaje_activador: texto } }),
    updateMensajeVideo: (id, texto) => updateLeadMutation.mutate({ id, updates: { mensaje_video: texto } }),
    updateMensajeCierre: (id, texto) => updateLeadMutation.mutate({ id, updates: { mensaje_cierre: texto } }),
    updateLastTemplateId: (id, templateId) => updateLeadMutation.mutate({ id, updates: { last_template_id: templateId } }),
    // useCallback garantiza referencia estable: el useEffect en CRM.jsx no recreará el canal Supabase en cada render
    refetchLeads: useCallback(() => queryClient.invalidateQueries({ queryKey: ['leads'] }), [queryClient]),
  };
};

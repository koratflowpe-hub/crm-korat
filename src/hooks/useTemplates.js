import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch Templates
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['message_templates'],
    queryFn: async () => {
      // In case the table doesn't exist yet, we return an empty array to avoid breaking the app immediately
      try {
        const { data, error } = await supabase
          .from('message_templates')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("Could not fetch templates. Table might not exist yet.", err);
        return [];
      }
    },
  });

  // Create Template
  const createTemplateMutation = useMutation({
    mutationFn: async (newTemplate) => {
      const { data, error } = await supabase
        .from('message_templates')
        .insert([newTemplate])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (newTemplate) => {
      queryClient.setQueryData(['message_templates'], (old) => [newTemplate, ...old]);
    },
  });

  // Update Template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (updatedTemplate) => {
      queryClient.setQueryData(['message_templates'], (old) => 
        old.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
      );
    },
  });

  // Delete Template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => {
      // 1. Limpiar referencias en leads_salones para evitar error 409 Conflict (Foreign Key)
      // Esto es necesario porque no podemos alterar el esquema de la BD directamente
      await supabase
        .from('leads_salones')
        .update({ last_template_id: null })
        .eq('last_template_id', id);

      // 2. Proceder con el borrado de la plantilla
      const { error } = await supabase.from('message_templates').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['message_templates'], (old) => old.filter(t => t.id !== deletedId));
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate: (newTemplate) => createTemplateMutation.mutate(newTemplate),
    updateTemplate: (id, updates) => updateTemplateMutation.mutate({ id, updates }),
    deleteTemplate: (id) => deleteTemplateMutation.mutate(id),
    incrementSentCount: (id, currentCount = 0) => updateTemplateMutation.mutate({ id, updates: { sent_count: currentCount + 1 } }),
    incrementSuccessCount: (id, currentCount = 0) => updateTemplateMutation.mutate({ id, updates: { success_count: currentCount + 1 } }),
  };
};

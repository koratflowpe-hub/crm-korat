// src/hooks/useAutomation.js
// Central automation hook: manages staging, scheduling, Spintax, and anti-ban logic
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// SCHEDULE CONFIG — "Ritmo de Salón"
// Based on salon owner's daily rhythm to maximize open rates
// ─────────────────────────────────────────────────────────────
export const SCHEDULE_CONFIG = {
  // day: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  0: { // Sunday — Optional, stage 1 only
    label: 'Domingo',
    badge: 'Opcional',
    badgeColor: '#6b7280',
    blocks: [{ start: '10:00', end: '11:30', maxMessages: 20 }],
    total: 20,
  },
  1: { // Monday — Prime day
    label: 'Lunes',
    badge: 'Día Prime',
    badgeColor: '#16a34a',
    blocks: [
      { start: '08:30', end: '09:30', maxMessages: 25 },
      { start: '14:00', end: '15:30', maxMessages: 30 },
      { start: '19:00', end: '20:00', maxMessages: 15 },
    ],
    total: 70,
  },
  2: { // Tuesday — 2nd best
    label: 'Martes',
    badge: 'Día Prime',
    badgeColor: '#16a34a',
    blocks: [
      { start: '08:30', end: '09:30', maxMessages: 25 },
      { start: '14:00', end: '15:30', maxMessages: 30 },
      { start: '19:00', end: '20:00', maxMessages: 15 },
    ],
    total: 70,
  },
  3: { // Wednesday — Mid-week
    label: 'Miércoles',
    badge: 'Día Prime',
    badgeColor: '#16a34a',
    blocks: [
      { start: '08:30', end: '09:30', maxMessages: 25 },
      { start: '14:00', end: '15:30', maxMessages: 30 },
      { start: '19:00', end: '20:00', maxMessages: 15 },
    ],
    total: 70,
  },
  4: { // Thursday — Moderate
    label: 'Jueves',
    badge: 'Moderado',
    badgeColor: '#d97706',
    blocks: [
      { start: '08:30', end: '09:30', maxMessages: 20 },
      { start: '14:00', end: '15:00', maxMessages: 25 },
      { start: '19:00', end: '19:45', maxMessages: 15 },
    ],
    total: 60,
  },
  5: { // Friday — Reduced
    label: 'Viernes',
    badge: 'Reducido',
    badgeColor: '#ea580c',
    blocks: [
      { start: '08:30', end: '09:00', maxMessages: 20 },
      { start: '14:00', end: '14:45', maxMessages: 20 },
    ],
    total: 40,
  },
  6: { // Saturday — OFF
    label: 'Sábado',
    badge: 'Día OFF',
    badgeColor: '#dc2626',
    blocks: [],
    total: 0,
  },
};

// ─────────────────────────────────────────────────────────────
// SPINTAX PROCESSOR
// Converts {option1|option2|option3} into a random choice
// ─────────────────────────────────────────────────────────────
export function processSpintax(text) {
  if (!text) return text;
  return text.replace(/\{([^{}]+)\}/g, (match, options) => {
    const choices = options.split('|');
    return choices[Math.floor(Math.random() * choices.length)];
  });
}

// ─────────────────────────────────────────────────────────────
// IRREGULAR PAUSE CALCULATOR (Anti-Ban)
// Returns a pause in seconds between messages — human-like
// ─────────────────────────────────────────────────────────────
export function getIrregularPause(messageIndex, blockTotal) {
  const base = 45 + Math.random() * 135; // 45s to 180s base

  // "Coffee break" after every 10 messages — humans get distracted
  if (messageIndex > 0 && messageIndex % 10 === 0) {
    return base + 600 + Math.random() * 300; // +10-15 min
  }

  // Slight acceleration in the middle, slowdown at edges
  const positionFactor = 1 + (0.5 - Math.abs(messageIndex / blockTotal - 0.5));
  return Math.floor(base * positionFactor);
}

// ─────────────────────────────────────────────────────────────
// SLOT DISTRIBUTOR — Smart Time-Aware Scheduling
// Takes N staged leads and assigns exact scheduled_at timestamps.
// — Skips blocks that have already ended.
// — If a block is currently active, starts from NOW (with a short buffer).
// — If all today's blocks are past, rolls over to the next valid schedule day.
// ─────────────────────────────────────────────────────────────

/**
 * Given a base date and an HH:MM string, returns a Date for that time on the base date.
 */
function timeOnDate(baseDate, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Find the next date (from a given start date) that has available blocks.
 * Looks up to 7 days ahead to avoid infinite loop.
 */
function findNextAvailableDate(fromDate) {
  for (let i = 1; i <= 7; i++) {
    const candidate = new Date(fromDate);
    candidate.setDate(candidate.getDate() + i);
    candidate.setHours(0, 0, 0, 0);
    const dow = candidate.getDay();
    const cfg = SCHEDULE_CONFIG[dow];
    if (cfg && cfg.blocks.length > 0) return candidate;
  }
  return null;
}

export function distributeSlots(stagedLeads, targetDate = new Date()) {
  const now = new Date();
  // Use a 2-minute buffer so we never schedule something too close to "now"
  const BUFFER_MS = 2 * 60 * 1000;

  const slots = [];
  let leadIndex = 0;

  // Collect all available blocks: first from targetDate, then roll over to next valid day
  const buildBlockList = (baseDate) => {
    const dayOfWeek = baseDate.getDay();
    const dayConfig = SCHEDULE_CONFIG[dayOfWeek];
    if (!dayConfig || dayConfig.blocks.length === 0) return [];

    return dayConfig.blocks.map(block => ({
      block,
      blockEnd: timeOnDate(baseDate, block.end),
      blockStart: timeOnDate(baseDate, block.start),
      baseDate,
    }));
  };

  let allBlocks = buildBlockList(targetDate);

  // Filter out blocks that have already ended (end time <= now)
  let futureBlocks = allBlocks.filter(({ blockEnd }) => blockEnd > now);

  // If no blocks remain today, roll over to the next available day
  if (futureBlocks.length === 0) {
    const nextDate = findNextAvailableDate(targetDate);
    if (!nextDate) {
      const dayOfWeek = targetDate.getDay();
      const dayConfig = SCHEDULE_CONFIG[dayOfWeek];
      return {
        error: `No hay bloques futuros disponibles esta semana. Hoy es ${dayConfig?.label || 'hoy'} (${dayConfig?.badge || ''}).`,
        slots: [],
      };
    }
    futureBlocks = buildBlockList(nextDate);
  }

  for (const { block, blockStart } of futureBlocks) {
    if (leadIndex >= stagedLeads.length) break;

    // If the block hasn't started yet, schedule from its start.
    // If the block is currently active (start <= now < end), schedule from now + buffer.
    let currentTime = blockStart > now
      ? new Date(blockStart)
      : new Date(now.getTime() + BUFFER_MS);

    let messagesInBlock = 0;

    while (messagesInBlock < block.maxMessages && leadIndex < stagedLeads.length) {
      const lead = stagedLeads[leadIndex];
      const processedMessage = processSpintax(lead.staged_message);

      slots.push({
        lead_id: lead.id,
        scheduled_at: new Date(currentTime),
        processed_message: processedMessage,
        spintax_variant_used: processedMessage !== lead.staged_message ? processedMessage : null,
      });

      const pause = getIrregularPause(messagesInBlock, block.maxMessages);
      currentTime = new Date(currentTime.getTime() + pause * 1000);

      messagesInBlock++;
      leadIndex++;
    }
  }

  const unscheduled = stagedLeads.slice(leadIndex);
  return { slots, unscheduled, totalScheduled: slots.length };
}

// ─────────────────────────────────────────────────────────────
// COPY DIVERSITY CHECKER (Anti-Ban)
// Returns a warning if any message appears more than 8 times in a batch
// ─────────────────────────────────────────────────────────────
export function checkCopyDiversity(stagedLeads, maxRepeat = 8) {
  const messageCounts = {};
  const warnings = [];

  stagedLeads.forEach(lead => {
    if (!lead.staged_message) return;
    // Normalize: trim whitespace, lowercase for comparison
    const key = lead.staged_message.trim().toLowerCase().slice(0, 80);
    messageCounts[key] = (messageCounts[key] || 0) + 1;
  });

  Object.entries(messageCounts).forEach(([msg, count]) => {
    if (count > maxRepeat) {
      warnings.push({
        message: msg.slice(0, 40) + '...',
        count,
        excess: count - maxRepeat,
      });
    }
  });

  const diversity = Object.keys(messageCounts).length / Math.max(stagedLeads.length, 1);

  return {
    isHealthy: warnings.length === 0,
    diversity: Math.round(diversity * 100),
    warnings,
    messageCounts,
  };
}

// ─────────────────────────────────────────────────────────────
// RESPONSE HEAT MAP DATA
// Processes leads to generate hour-based response analytics
// ─────────────────────────────────────────────────────────────
export function buildHeatMapData(leads) {
  const heatMap = {};

  // Initialize all hours 8-20
  for (let h = 8; h <= 20; h++) {
    heatMap[h] = { hour: h, responses: 0, sent: 0, rate: 0 };
  }

  leads.forEach(lead => {
    if (lead.enviado_at) {
      const sentHour = new Date(lead.enviado_at).getHours();
      if (heatMap[sentHour]) heatMap[sentHour].sent++;
    }
    if (lead.respondido_at) {
      const responseHour = new Date(lead.respondido_at).getHours();
      if (heatMap[responseHour]) heatMap[responseHour].responses++;
    }
  });

  // Calculate rates
  Object.values(heatMap).forEach(h => {
    h.rate = h.sent > 0 ? Math.round((h.responses / h.sent) * 100) : 0;
  });

  return Object.values(heatMap);
}

// ─────────────────────────────────────────────────────────────
// REACT HOOK
// ─────────────────────────────────────────────────────────────
export const useAutomation = () => {
  const queryClient = useQueryClient();

  // ── Fetch staged leads
  const { data: stagedLeads = [], isLoading: loadingStaged } = useQuery({
    queryKey: ['staged-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_salones')
        .select('id, nombre_salon, telefono, staged_message, staged_etapa, automation_status, scheduled_at, enviado_at, respondido_at, response_time_minutes')
        .in('automation_status', ['staged', 'queued'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // ── Fetch sent/responded leads for analytics
  const { data: analyticsLeads = [] } = useQuery({
    queryKey: ['analytics-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_salones')
        .select('id, automation_status, staged_etapa, enviado_at, respondido_at, response_time_minutes')
        .in('automation_status', ['sent', 'failed', 'cancelled'])
        .not('enviado_at', 'is', null)
        .order('enviado_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // ── Stage a lead for sending (prepare step)
  const stageMutation = useMutation({
    mutationFn: async ({ leadId, message, etapa }) => {
      const { data, error } = await supabase
        .from('leads_salones')
        .update({
          automation_status: 'staged',
          staged_message: message,
          staged_etapa: etapa,
          scheduled_at: null,
          enviado_at: null,
        })
        .eq('id', leadId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staged-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // ── Remove from staging (unstage)
  const unstageMutation = useMutation({
    mutationFn: async (leadId) => {
      const { error } = await supabase
        .from('leads_salones')
        .update({ automation_status: 'idle', staged_message: null, staged_etapa: null, scheduled_at: null })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staged-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // ── Schedule a batch: convert staged → queued with exact timestamps
  const scheduleBatchMutation = useMutation({
    mutationFn: async ({ leads: leadsToSchedule, targetDate }) => {
      const { slots, unscheduled, error: slotError } = distributeSlots(leadsToSchedule, targetDate || new Date());

      if (slotError) throw new Error(slotError);

      // Batch update with individual scheduled_at times
      const updates = slots.map(slot =>
        supabase
          .from('leads_salones')
          .update({
            automation_status: 'queued',
            scheduled_at: slot.scheduled_at.toISOString(),
            staged_message: slot.processed_message, // Save the Spintax-resolved version
            spintax_variant_used: slot.spintax_variant_used,
          })
          .eq('id', slot.lead_id)
      );

      await Promise.all(updates);
      return { scheduled: slots.length, unscheduled: unscheduled.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staged-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // ── Cancel all queued messages for a lead (Auto-Kill on response)
  const cancelLeadQueueMutation = useMutation({
    mutationFn: async (leadId) => {
      const { error } = await supabase
        .from('leads_salones')
        .update({ automation_status: 'cancelled', scheduled_at: null })
        .eq('id', leadId)
        .eq('automation_status', 'queued');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staged-leads'] });
    },
  });

  // ── Computed analytics
  const heatMapData = useMemo(() => buildHeatMapData(analyticsLeads), [analyticsLeads]);

  const diversityCheck = useMemo(
    () => checkCopyDiversity(stagedLeads.filter(l => l.automation_status === 'staged')),
    [stagedLeads]
  );

  const stagedCount = stagedLeads.filter(l => l.automation_status === 'staged').length;
  const queuedCount = stagedLeads.filter(l => l.automation_status === 'queued').length;

  // Ghosting: sent but no response after 24h
  const ghostingLeads = useMemo(() => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return analyticsLeads.filter(l =>
      l.automation_status === 'sent' &&
      l.enviado_at &&
      new Date(l.enviado_at) < cutoff &&
      !l.respondido_at
    );
  }, [analyticsLeads]);

  return {
    // Data
    stagedLeads,
    analyticsLeads,
    stagedCount,
    queuedCount,
    ghostingLeads,
    heatMapData,
    diversityCheck,
    loadingStaged,
    // Actions
    stageForSending: useCallback(
      (leadId, message, etapa) => stageMutation.mutate({ leadId, message, etapa }),
      [stageMutation]
    ),
    unstage: useCallback((leadId) => unstageMutation.mutate(leadId), [unstageMutation]),
    scheduleBatch: useCallback(
      (leadsToSchedule, targetDate) => scheduleBatchMutation.mutateAsync({ leads: leadsToSchedule, targetDate }),
      [scheduleBatchMutation]
    ),
    cancelLeadQueue: useCallback((leadId) => cancelLeadQueueMutation.mutate(leadId), [cancelLeadQueueMutation]),
    isScheduling: scheduleBatchMutation.isPending,
    scheduleError: scheduleBatchMutation.error?.message,
    // Helpers exposed for UI
    SCHEDULE_CONFIG,
    processSpintax,
    checkCopyDiversity,
  };
};

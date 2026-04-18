import React from 'react';
import { 
  Sparkles, Edit, Check, Video, ShieldCheck, Target 
} from 'lucide-react';

export const STATUS_CONFIG = {
  idea:             { label: 'Incubación',      color: 'bg-cyan-500',      icon: <Sparkles size={14} /> },
  writing:          { label: 'Guionización',    color: 'bg-violet-500',    icon: <Edit size={14} /> },
  ready:            { label: 'Listo 🎥',        color: 'bg-emerald-500',   icon: <Check size={14} /> },
  recorded:         { label: 'Grabado',         color: 'bg-rose-500',      icon: <Video size={14} /> },
  published:        { label: 'Publicado',       color: 'bg-slate-500',     icon: <ShieldCheck size={14} /> },
};

export const COLUMN_ORDER = ['idea', 'writing', 'ready', 'recorded', 'published'];

export const PILLAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
];

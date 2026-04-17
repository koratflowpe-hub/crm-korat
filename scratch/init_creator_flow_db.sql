-- ============================================================
-- SCRIPT CORRECTO: Creator Flow Studio
-- Ejecuta esto en el SQL Editor de tu Dashboard de Supabase.
-- Si ya ejecutaste el script anterior, usa la sección de "FIX" al final.
-- ============================================================

-- 1. Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pillars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    hex_color TEXT DEFAULT '#4f46e5',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    hex_color TEXT DEFAULT '#8b5cf6',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pillar_id UUID REFERENCES public.pillars(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Nuevo Guion',
    status TEXT CHECK (status IN ('idea', 'drafting', 'structuring', 'ready_to_record', 'editing', 'published')) DEFAULT 'idea',
    draft_1 TEXT,
    master_draft TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.script_blocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
    block_order INTEGER NOT NULL DEFAULT 0,
    block_type TEXT CHECK (block_type IN ('hook', 'development_1', 'development_2', 'cta')),
    text_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - CORRECTO CON TODAS LAS OPERACIONES
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_blocks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ELIMINAR POLÍTICAS ANTERIORES (por si ya existían mal hechas)
-- ============================================================
DROP POLICY IF EXISTS "Users can fully manage their own pillars" ON public.pillars;
DROP POLICY IF EXISTS "Users can fully manage their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can fully manage their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can manage blocks of their scripts" ON public.script_blocks;

-- ============================================================
-- POLÍTICAS CORRECTAS: SELECT, INSERT, UPDATE, DELETE separados
-- ============================================================

-- PILLARS
CREATE POLICY "pillars_select" ON public.pillars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pillars_insert" ON public.pillars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pillars_update" ON public.pillars FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pillars_delete" ON public.pillars FOR DELETE USING (auth.uid() = user_id);

-- TAGS
CREATE POLICY "tags_select" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tags_insert" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tags_update" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tags_delete" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- SCRIPTS
CREATE POLICY "scripts_select" ON public.scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scripts_insert" ON public.scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scripts_update" ON public.scripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scripts_delete" ON public.scripts FOR DELETE USING (auth.uid() = user_id);

-- SCRIPT_BLOCKS (heredado desde scripts)
CREATE POLICY "blocks_select" ON public.script_blocks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.scripts WHERE id = script_blocks.script_id AND user_id = auth.uid())
);
CREATE POLICY "blocks_insert" ON public.script_blocks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.scripts WHERE id = script_blocks.script_id AND user_id = auth.uid())
);
CREATE POLICY "blocks_update" ON public.script_blocks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.scripts WHERE id = script_blocks.script_id AND user_id = auth.uid())
);
CREATE POLICY "blocks_delete" ON public.script_blocks FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.scripts WHERE id = script_blocks.script_id AND user_id = auth.uid())
);

-- ============================================================
-- TRIGGER: Auto-actualizar updated_at en scripts
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_scripts_updated_at ON public.scripts;
CREATE TRIGGER set_scripts_updated_at
BEFORE UPDATE ON public.scripts
FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- ============================================================
-- FIN DEL SCRIPT
-- Luego de ejecutarlo, crea tu usuario desde Supabase > Authentication > Users
-- y al iniciar sesión en la App, podrás crear Pilares y Guiones normalmente.
-- ============================================================

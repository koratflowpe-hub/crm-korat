-- ============================================================
-- MIGRACIÓN: Anti-duplicados en leads_salones
-- Proyecto: hywlytsbogbassecflbw (KoratFlow Scraper)
-- Ejecutar en el Supabase del scraper
-- ============================================================

-- Paso 1: Primero limpiar los duplicados que ya existen
-- (conservamos el registro con el ID más antiguo por teléfono)
DELETE FROM leads_salones
WHERE id NOT IN (
  SELECT MIN(id)
  FROM leads_salones
  WHERE telefono IS NOT NULL AND telefono != ''
  GROUP BY telefono
  UNION
  -- Conservar también los que no tienen teléfono (por nombre)
  SELECT MIN(id)
  FROM leads_salones
  WHERE (telefono IS NULL OR telefono = '')
  GROUP BY nombre_salon
);

-- Paso 2: Agregar UNIQUE CONSTRAINT en telefono
-- Esto hace que el "resolution=ignore-duplicates" de Supabase funcione
ALTER TABLE leads_salones 
ADD CONSTRAINT leads_salones_telefono_unique 
UNIQUE (telefono);

-- Paso 3 (opcional pero recomendado): índice en nombre_salon para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_leads_salones_nombre 
ON leads_salones (nombre_salon);

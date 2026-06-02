-- =============================================================================
-- StudyAI - Schema de Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase:
--   Supabase Dashboard -> SQL Editor -> New query -> pegar y ejecutar.
-- =============================================================================

CREATE TABLE IF NOT EXISTS notes (
    -- Identificador unico de la nota (UUID o slug generado por el backend)
    note_id         TEXT        PRIMARY KEY,

    -- Metadatos basicos
    title           TEXT        NOT NULL DEFAULT '',
    filename        TEXT        NOT NULL DEFAULT '',
    image_ext       TEXT,                           -- extension del archivo original (jpg, png, pdf...)

    -- Contenido estructurado de la nota en JSON
    content_json    TEXT        NOT NULL DEFAULT '{}',

    -- Etiquetas como array JSON serializado, p.ej. '["historia","biologia"]'
    tags            TEXT        NOT NULL DEFAULT '[]',

    -- Fecha de creacion (zona horaria UTC)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Integraciones opcionales (pueden ser NULL si no se usan)
    notion_url      TEXT,
    drive_file_id   TEXT,
    drive_url       TEXT,
    obsidian_path   TEXT,

    -- Usuario propietario (user_id proviene de Clerk, formato "user_XXXX")
    user_id         TEXT        NOT NULL
);

-- Indice para filtrar notas por usuario (consultas mas frecuentes)
CREATE INDEX IF NOT EXISTS idx_notes_user_id
    ON notes (user_id);

-- Indice para ordenar por fecha de creacion descendente
CREATE INDEX IF NOT EXISTS idx_notes_created_at
    ON notes (created_at DESC);

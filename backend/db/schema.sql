CREATE TABLE IF NOT EXISTS notes (
    note_id     TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT 'Sin título',
    filename    TEXT NOT NULL,
    image_ext   TEXT,
    content_json TEXT NOT NULL,
    tags        TEXT NOT NULL DEFAULT '[]',
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    notion_url  TEXT,
    drive_file_id TEXT,
    drive_url   TEXT,
    obsidian_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);

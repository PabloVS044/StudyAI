# Reporte de Pruebas de Endpoints

Este reporte resume el resultado de probar los endpoints del backend usando FastAPI TestClient en un entorno controlado.

| Endpoint | Status Code | ¿Exitoso? | Detalle / Respuesta |
| --- | --- | --- | --- |
| `POST /api/extract` | 500 | ❌ No | `{"detail":"MISTRAL_API_KEY no configurada"}` |
| `GET /api/notes` | 200 | ✅ Sí | `[{"note_id":"test-note-123","title":"Física Moderna de Prueba","filename":"fisica_moderna.png","image_ext":"png","date":"2026-05-25T03:20:16Z","text_preview":"La teoría de la relatividad especial y la` |
| `POST /api/notes/save` | 200 | ✅ Sí | `{"note_id":"test-save-999","saved":true}` |
| `POST /api/notes/search` | 400 | ❌ No | `{"detail":"Pinecone o Mistral no configurados"}` |
| `POST /api/integrations/notion/{note_id} (ID: test-note-123)` | 400 | ❌ No | `{"detail":"Notion no configurado (faltan NOTION_TOKEN y/o NOTION_DATABASE_ID)"}` |
| `GET /api/integrations/obsidian/{note_id}/export (ID: test-note-123)` | 200 | ✅ Sí | `[Markdown export, 654 caracteres]` |
| `POST /api/integrations/drive/{note_id} (ID: test-note-123)` | 400 | ❌ No | `{"detail":"Google Drive no configurado (faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET)"}` |

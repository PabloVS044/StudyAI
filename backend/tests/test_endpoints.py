import sys
import json
from pathlib import Path
from fastapi.testclient import TestClient

# Agregar directorio del backend al path de python
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from main import app
from services import sqlite_client
from config import settings

client = TestClient(app)

def run_tests():
    print("Iniciando pruebas de los endpoints de StudyAI...")
    # Configuración de base de datos e inserción de nota de prueba
    sqlite_client.init_db(settings.DB_PATH)
    test_note_id = "test-note-123"

    # Limpiar primero en caso de ejecuciones previas fallidas
    sqlite_client.delete_note(test_note_id)

    note_content = {
        "titulo": "Física Moderna de Prueba",
        "texto_principal": "La teoría de la relatividad especial y la mecánica cuántica son pilares de la física moderna.",
        "formulas": [
            {"descripcion": "Equivalencia masa-energía", "latex": "E=mc^2", "texto_plano": "E=mc^2"}
        ],
        "listas": [
            {"tipo": "viñetas", "items": ["Relatividad", "Mecánica Cuántica", "Efecto Fotoeléctrico"]}
        ],
        "diagramas_figuras": [
            {"descripcion": "Diagrama de niveles de energía del átomo de hidrógeno"}
        ],
        "definiciones": [
            {"termino": "Fotón", "definicion": "Partícula elemental portadora de la radiación electromagnética."}
        ],
        "observaciones": "Revisar ecuaciones de Maxwell en detalle."
    }

    sqlite_client.create_note(
        note_id=test_note_id,
        title="Física Moderna de Prueba",
        filename="fisica_moderna.png",
        image_ext="png",
        content_json=json.dumps(note_content, ensure_ascii=False)
    )

    results = []

    # 1. POST /api/extract
    print("Probando: POST /api/extract")
    files = {"files": ("test.png", b"fake image bytes", "image/png")}
    try:
        response = client.post("/api/extract", files=files)
        results.append({
            "endpoint": "POST /api/extract",
            "status_code": response.status_code,
            "response": response.text[:200],
            "ok": response.status_code < 400
        })
    except Exception as e:
        results.append({
            "endpoint": "POST /api/extract",
            "status_code": "Error",
            "response": str(e),
            "ok": False
        })

    # 2. GET /api/notes
    print("Probando: GET /api/notes")
    try:
        response = client.get("/api/notes")
        results.append({
            "endpoint": "GET /api/notes",
            "status_code": response.status_code,
            "response": response.text[:200],
            "ok": response.status_code < 400
        })
    except Exception as e:
        results.append({
            "endpoint": "GET /api/notes",
            "status_code": "Error",
            "response": str(e),
            "ok": False
        })

    # 3. POST /api/notes/save
    print("Probando: POST /api/notes/save")
    try:
        save_payload = {
            "note_id": "test-save-999",
            "filename": "guardado_test.png",
            "image_ext": "png",
            "content": note_content
        }
        response = client.post("/api/notes/save", json=save_payload)
        results.append({
            "endpoint": "POST /api/notes/save",
            "status_code": response.status_code,
            "response": response.text[:200],
            "ok": response.status_code < 400
        })
        sqlite_client.delete_note("test-save-999")
    except Exception as e:
        results.append({
            "endpoint": "POST /api/notes/save",
            "status_code": "Error",
            "response": str(e),
            "ok": False
        })

    # 4. POST /api/notes/search
    print("Probando: POST /api/notes/search")
    try:
        search_payload = {
            "query": "relatividad",
            "top_k": 3
        }
        response = client.post("/api/notes/search", json=search_payload)
        results.append({
            "endpoint": "POST /api/notes/search",
            "status_code": response.status_code,
            "response": response.text[:200],
            "ok": response.status_code < 400
        })
    except Exception as e:
        results.append({
            "endpoint": "POST /api/notes/search",
            "status_code": "Error",
            "response": str(e),
            "ok": False
        })

    # 5. POST /api/integrations/notion/{note_id}
    print("Probando: POST /api/integrations/notion/{note_id}")
    try:
        response = client.post(f"/api/integrations/notion/{test_note_id}")
        results.append({
            "endpoint": f"POST /api/integrations/notion/{{note_id}} (ID: {test_note_id})",
            "status_code": response.status_code,
            "response": response.text[:200],
            "ok": response.status_code < 400
        })
    except Exception as e:
        results.append({
            "endpoint": f"POST /api/integrations/notion/{{note_id}} (ID: {test_note_id})",
            "status_code": "Error",
            "response": str(e),
            "ok": False
        })

    # 6. GET /api/integrations/obsidian/{note_id}/export
    print("Probando: GET /api/integrations/obsidian/{note_id}/export")
    try:
        response = client.get(f"/api/integrations/obsidian/{test_note_id}/export")
        results.append({
            "endpoint": f"GET /api/integrations/obsidian/{{note_id}}/export (ID: {test_note_id})",
            "status_code": response.status_code,
            "response": response.text[:200] if len(response.text) < 200 else f"[Markdown export, {len(response.text)} caracteres]",
            "ok": response.status_code < 400
        })
    except Exception as e:
        results.append({
            "endpoint": f"GET /api/integrations/obsidian/{{note_id}}/export (ID: {test_note_id})",
            "status_code": "Error",
            "response": str(e),
            "ok": False
        })

    # 7. POST /api/integrations/drive/{note_id}
    print("Probando: POST /api/integrations/drive/{note_id}")
    try:
        response = client.post(f"/api/integrations/drive/{test_note_id}")
        results.append({
            "endpoint": f"POST /api/integrations/drive/{{note_id}} (ID: {test_note_id})",
            "status_code": response.status_code,
            "response": response.text[:200],
            "ok": response.status_code < 400
        })
    except Exception as e:
        results.append({
            "endpoint": f"POST /api/integrations/drive/{{note_id}} (ID: {test_note_id})",
            "status_code": "Error",
            "response": str(e),
            "ok": False
        })

    # Limpiar nota de prueba
    sqlite_client.delete_note(test_note_id)

    # Escribir reporte en reporte_endpoints.md
    report_path = backend_dir / "tests" / "reporte_endpoints.md"
    report_path.parent.mkdir(exist_ok=True)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Reporte de Pruebas de Endpoints\n\n")
        f.write("Este reporte resume el resultado de probar los endpoints del backend usando FastAPI TestClient en un entorno controlado.\n\n")
        f.write("| Endpoint | Status Code | ¿Exitoso? | Detalle / Respuesta |\n")
        f.write("| --- | --- | --- | --- |\n")

        for res in results:
            ok_str = "✅ Sí" if res["ok"] else "❌ No"
            # Limpiar saltos de línea y formatear respuesta
            resp_detail = res["response"].replace("|", "\\|").replace("\n", " ").strip()
            f.write(f"| `{res['endpoint']}` | {res['status_code']} | {ok_str} | `{resp_detail}` |\n")

    print(f"\nReporte generado exitosamente en: {report_path}")

if __name__ == "__main__":
    run_tests()

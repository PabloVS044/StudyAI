"""Generate study flashcards from note content using Mistral."""
import json
import re
from mistralai import Mistral

_PROMPT = """Eres un asistente de estudio. A partir del siguiente contenido de apuntes, genera exactamente {count} flashcards de estudio.

Devuelve ÚNICAMENTE un JSON válido con esta estructura, sin texto adicional, sin markdown, sin explicaciones:
[
  {{
    "pregunta": "Pregunta de estudio clara y específica",
    "respuesta": "Respuesta concisa y precisa"
  }}
]

Reglas:
- Genera exactamente {count} pares pregunta-respuesta
- Las preguntas deben ser útiles para estudiar y repasar el tema
- Las respuestas deben ser claras y concisas
- Usa el idioma del contenido de los apuntes
- Si hay definiciones, fórmulas o conceptos clave, priorízalos
- Responde ÚNICAMENTE con el JSON, sin ningún texto adicional

Contenido de los apuntes:
{content}"""


def _content_to_text(content: dict) -> str:
    """Flatten NoteContent dict into readable text for Mistral."""
    parts = []
    if content.get("titulo"):
        parts.append(f"Título: {content['titulo']}")
    if content.get("texto_principal"):
        parts.append(content["texto_principal"])
    for d in content.get("definiciones", []):
        if d.get("termino") and d.get("definicion"):
            parts.append(f"{d['termino']}: {d['definicion']}")
    for lista in content.get("listas", []):
        items = lista.get("items", [])
        if items:
            parts.append("\n".join(f"- {item}" for item in items))
    for f in content.get("formulas", []):
        if f.get("descripcion"):
            desc = f["descripcion"]
            plain = f.get("texto_plano", "")
            parts.append(f"Fórmula — {desc}: {plain}" if plain else f"Fórmula — {desc}")
    if content.get("observaciones"):
        parts.append(content["observaciones"])
    return "\n\n".join(parts)


def generate_flashcards(api_key: str, content: dict, count: int = 10) -> list[dict]:
    """Call Mistral and return a list of validated flashcard dicts."""
    text = _content_to_text(content)
    if not text.strip():
        raise ValueError("La nota no tiene contenido suficiente para generar flashcards.")

    client = Mistral(api_key=api_key)
    prompt = _PROMPT.format(count=count, content=text[:6000])

    resp = client.chat.complete(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = resp.choices[0].message.content.strip()

    # Strip markdown code fences if present (same pattern as ocr.py)
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
    raw = raw.strip()
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)

    try:
        cards = json.loads(raw, strict=False)
    except json.JSONDecodeError as e:
        raise ValueError(f"Mistral devolvió una respuesta no válida como JSON: {e}") from e

    if not isinstance(cards, list):
        raise ValueError("La respuesta de Mistral no es una lista de flashcards.")

    validated = [
        {"pregunta": c["pregunta"], "respuesta": c["respuesta"]}
        for c in cards
        if isinstance(c, dict) and c.get("pregunta") and c.get("respuesta")
    ]

    if not validated:
        raise ValueError("Mistral no generó flashcards válidas. Intenta con una nota con más contenido.")

    return validated

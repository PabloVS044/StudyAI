"""Generate multiple-choice quiz questions from note content using Mistral."""
import json
import re
from mistralai import Mistral

_DIFFICULTY_HINT = {
    "facil": "preguntas de conceptos básicos y recuerdo directo (recall)",
    "medio": "preguntas de aplicación de los conceptos",
    "dificil": "preguntas de análisis, casos y razonamiento avanzado",
}

_PROMPT = """Eres un asistente de estudio. A partir del siguiente contenido de apuntes, genera exactamente {count} preguntas de opción múltiple.

Dificultad: {difficulty} — {difficulty_hint}.

Devuelve ÚNICAMENTE un JSON válido con esta estructura, sin texto adicional, sin markdown, sin explicaciones:
[
  {{
    "pregunta": "Enunciado claro y específico de la pregunta",
    "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correcta": 0,
    "explicacion": "Explicación breve de por qué esa opción es correcta"
  }}
]

Reglas:
- Genera exactamente {count} preguntas
- CADA pregunta debe tener EXACTAMENTE 4 opciones
- "correcta" es el índice (0, 1, 2 o 3) de la opción correcta dentro de "opciones"
- Solo una opción es correcta por pregunta
- "explicacion" debe ser breve y clara
- Usa el idioma del contenido de los apuntes (español)
- Ajusta la complejidad a la dificultad indicada
- Responde ÚNICAMENTE con el JSON array, sin ningún texto adicional

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


def generate_quiz(api_key: str, content: dict, count: int, difficulty: str) -> list[dict]:
    """Call Mistral and return a list of validated multiple-choice question dicts."""
    text = _content_to_text(content)
    if not text.strip():
        raise ValueError("La nota no tiene contenido suficiente para generar el quiz.")

    hint = _DIFFICULTY_HINT.get(difficulty, _DIFFICULTY_HINT["medio"])

    client = Mistral(api_key=api_key)
    prompt = _PROMPT.format(
        count=count,
        difficulty=difficulty,
        difficulty_hint=hint,
        content=text[:6000],
    )

    resp = client.chat.complete(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = resp.choices[0].message.content.strip()

    # Strip markdown code fences if present (same pattern as flashcard_generator.py)
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
    raw = raw.strip()
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)
    raw = re.sub(r'\\(?!")', r'\\\\', raw)  # escapa LaTeX (\frac, \\ ...) invalido en JSON

    try:
        items = json.loads(raw, strict=False)
    except json.JSONDecodeError as e:
        raise ValueError(f"Mistral devolvió una respuesta no válida como JSON: {e}") from e

    if not isinstance(items, list):
        raise ValueError("La respuesta de Mistral no es una lista de preguntas.")

    validated = []
    for q in items:
        if not isinstance(q, dict):
            continue
        pregunta = q.get("pregunta")
        opciones = q.get("opciones")
        correcta = q.get("correcta")
        explicacion = q.get("explicacion")
        if not pregunta or not isinstance(opciones, list) or len(opciones) != 4:
            continue
        if not isinstance(correcta, int) or isinstance(correcta, bool) or not (0 <= correcta <= 3):
            continue
        if not explicacion:
            continue
        validated.append({
            "pregunta": pregunta,
            "opciones": [str(o) for o in opciones],
            "correcta": correcta,
            "explicacion": explicacion,
        })

    if not validated:
        raise ValueError("Mistral no generó preguntas válidas. Intenta con una nota con más contenido.")

    return validated

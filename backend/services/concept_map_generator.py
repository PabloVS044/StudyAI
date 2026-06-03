"""Generate a concept map (nodes + edges) from note content using Mistral."""
import json
import re
from mistralai import Mistral

_PROMPT = """Eres un asistente de estudio. A partir del siguiente contenido de apuntes, genera un MAPA CONCEPTUAL.

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional, sin markdown, sin explicaciones:
{{
  "nodes": [
    {{"id": "n1", "label": "Concepto"}}
  ],
  "edges": [
    {{"source": "n1", "target": "n2", "label": "relacion"}}
  ]
}}

Reglas:
- Genera entre 8 y 15 nodos. Cada nodo debe tener "id" (único, formato "n1", "n2"...) y "label" (nombre corto del concepto)
- Cada edge debe tener "source" y "target" (ids de nodos existentes) y "label" (verbo o relación corta, máx 4 palabras)
- Los ids en edges deben corresponder a ids definidos en nodes
- Usa el idioma del contenido (español)
- Responde ÚNICAMENTE con el JSON, sin ningún texto adicional

Contenido de los apuntes:
{content}"""


def _content_to_text(content: dict) -> str:
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


def generate_concept_map(api_key: str, content: dict) -> dict:
    """Call Mistral and return a validated concept map dict with nodes and edges."""
    text = _content_to_text(content)
    if not text.strip():
        raise ValueError("La nota no tiene contenido suficiente para generar el mapa conceptual.")

    client = Mistral(api_key=api_key)
    prompt = _PROMPT.format(content=text[:6000])

    resp = client.chat.complete(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = resp.choices[0].message.content.strip()

    # Strip markdown code fences
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
    raw = raw.strip()
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)
    raw = re.sub(r'\\(?!")', r'\\\\', raw)  # escape LaTeX sequences invalid in JSON

    try:
        data = json.loads(raw, strict=False)
    except json.JSONDecodeError as e:
        raise ValueError(f"Mistral devolvió una respuesta no válida como JSON: {e}") from e

    if not isinstance(data, dict):
        raise ValueError("La respuesta de Mistral no es un objeto JSON.")

    nodes = data.get("nodes")
    edges = data.get("edges")

    if not isinstance(nodes, list) or not nodes:
        raise ValueError("El mapa conceptual no contiene nodos válidos.")

    # Validate nodes: each must have id and label
    valid_ids = set()
    validated_nodes = []
    for node in nodes:
        if not isinstance(node, dict):
            continue
        nid = node.get("id")
        label = node.get("label")
        if not nid or not label:
            continue
        valid_ids.add(str(nid))
        validated_nodes.append({"id": str(nid), "label": str(label)})

    if not validated_nodes:
        raise ValueError("El mapa conceptual no contiene nodos válidos con id y label.")

    # Validate edges: source and target must reference existing node ids
    validated_edges = []
    if isinstance(edges, list):
        for edge in edges:
            if not isinstance(edge, dict):
                continue
            source = str(edge.get("source", ""))
            target = str(edge.get("target", ""))
            label = edge.get("label", "")
            if source not in valid_ids or target not in valid_ids:
                continue
            validated_edges.append({"source": source, "target": target, "label": str(label)})

    return {"nodes": validated_nodes, "edges": validated_edges}

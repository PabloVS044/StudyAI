"""Mistral pixtral-12b OCR — ported from the original app.py with minor cleanup."""
import base64
import re
import json
try:
    from mistralai import Mistral
except ImportError:
    from mistralai.client import Mistral

_PROMPT = """Analiza esta imagen de apuntes de clase y extrae TODO el contenido de forma estructurada.

Devuelve un JSON con exactamente esta estructura:
{
  "titulo": "título o tema principal si lo hay, sino null",
  "texto_principal": "todo el texto corrido, párrafos y explicaciones",
  "formulas": [
    {"descripcion": "nombre o contexto de la fórmula", "latex": "fórmula en LaTeX", "texto_plano": "fórmula en texto plano"}
  ],
  "listas": [
    {"tipo": "numerada o viñetas", "items": ["item1", "item2"]}
  ],
  "diagramas_figuras": [
    {"descripcion": "descripción detallada del diagrama o figura"}
  ],
  "definiciones": [
    {"termino": "término", "definicion": "definición"}
  ],
  "observaciones": "notas adicionales, subrayados importantes, anotaciones al margen"
}

Reglas:
- Si no hay contenido de un tipo, usa lista vacía [] o null
- Las fórmulas matemáticas SIEMPRE en LaTeX válido
- Transcribe TODO el texto visible, incluyendo texto pequeño y anotaciones
- Para diagramas, describe lo que representan con detalle
- Responde ÚNICAMENTE con el JSON, sin markdown ni explicaciones extra"""


def extract_content(api_key: str, image_bytes: bytes, mime_type: str) -> dict:
    """Call pixtral-12b and return the parsed JSON dict."""
    client = Mistral(api_key=api_key)
    b64 = base64.standard_b64encode(image_bytes).decode()

    resp = client.chat.complete(
        model="pixtral-12b-2409",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": f"data:{mime_type};base64,{b64}"},
                {"type": "text", "text": _PROMPT},
            ],
        }],
    )

    raw = resp.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)
    return json.loads(raw, strict=False)

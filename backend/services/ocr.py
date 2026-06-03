"""Mistral vision OCR -> structured JSON. Modelo configurable (OCR_MODEL)."""
import os
import base64
import re
import json

try:
    from mistralai import Mistral
except ImportError:
    from mistralai.client import Mistral

# Modelo de vision. pixtral-large es mucho mas preciso con formulas que pixtral-12b.
# Configurable via env por si el plan no lo soporta; con fallback automatico.
_OCR_MODEL = os.environ.get("OCR_MODEL", "pixtral-large-latest")
_FALLBACK_MODEL = "pixtral-12b-2409"

_PROMPT = r"""Eres un transcriptor experto de apuntes academicos (incluye matematicas y ciencias).
Analiza la imagen y extrae TODO el contenido en un JSON con EXACTAMENTE esta estructura:
{
  "titulo": "titulo o tema principal si lo hay, sino null",
  "texto_principal": "todo el texto corrido, parrafos y explicaciones",
  "formulas": [
    {"descripcion": "nombre o contexto de la formula", "latex": "formula en LaTeX valido", "texto_plano": "formula en texto legible"}
  ],
  "listas": [
    {"tipo": "numerada o vinetas", "items": ["item1", "item2"]}
  ],
  "diagramas_figuras": [
    {"descripcion": "descripcion detallada del diagrama o figura"}
  ],
  "definiciones": [
    {"termino": "termino", "definicion": "definicion"}
  ],
  "observaciones": "notas adicionales, subrayados, anotaciones al margen",
  "tags": ["Tag1", "Tag2", "Tag3"]
}

REGLAS PARA FORMULAS (criticas, hazlo con maximo cuidado):
- Transcribe cada formula EXACTAMENTE como aparece, simbolo por simbolo. NO la simplifiques, NO la "corrijas", NO inventes terminos que no esten.
- LaTeX VALIDO y renderable con KaTeX. Usa: \frac{a}{b} para fracciones, x^{2} para exponentes, x_{i} para subindices, \sqrt{}, \int, \sum, \prod, \lim, \partial, \nabla, vectores \vec{}, matrices con \begin{matrix}...\end{matrix}.
- Letras griegas con su comando: \alpha \beta \gamma \delta \theta \lambda \mu \pi \sigma \omega \Delta \Sigma \Omega, etc.
- Respeta parentesis, corchetes, limites de integrales/sumatorias (\int_{a}^{b}, \sum_{i=1}^{n}), y signos (=, \neq, \leq, \geq, \approx, \pm, \cdot, \times, \to, \infty).
- Una entrada por formula independiente; NO juntes varias en una sola.
- "texto_plano": version legible de la formula sin comandos LaTeX (ej: "integral de 0 a 1 de x^2 dx").
- Si un simbolo es ambiguo, elige el mas probable pero conserva la estructura correcta.

OTRAS REGLAS:
- Si no hay contenido de un tipo, usa [] o null.
- Transcribe TODO el texto visible, incluido texto pequeno y anotaciones.
- Para diagramas, describe que representan con detalle.
- "tags": 1-4 etiquetas de la materia/tema (ej: "Biologia", "Calculo", "Quimica Organica", "Algebra Lineal"), en espanol, capitalizadas.
- Responde UNICAMENTE con el JSON, sin markdown ni explicaciones extra."""


def _call(client, model, b64, mime_type):
    return client.chat.complete(
        model=model,
        temperature=0,
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": f"data:{mime_type};base64,{b64}"},
                {"type": "text", "text": _PROMPT},
            ],
        }],
    )


def extract_content(api_key: str, image_bytes: bytes, mime_type: str) -> dict:
    """Llama al modelo de vision y devuelve el JSON parseado."""
    client = Mistral(api_key=api_key)
    b64 = base64.standard_b64encode(image_bytes).decode()

    try:
        resp = _call(client, _OCR_MODEL, b64, mime_type)
    except Exception:
        # Fallback si el modelo configurado no esta disponible en el plan
        resp = _call(client, _FALLBACK_MODEL, b64, mime_type)

    raw = resp.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)
    # LaTeX (\frac, \alpha, \\ linebreak...) son backslashes que rompen json.loads.
    # Duplica TODO backslash salvo el que escapa comillas (\"), asi se vuelven literales.
    raw = re.sub(r'\\(?!")', r'\\\\', raw)
    return json.loads(raw, strict=False)

"""Generate text embeddings using Mistral's mistral-embed model (1024 dims)."""
from mistralai import Mistral


def get_embedding(api_key: str, text: str) -> list[float]:
    client = Mistral(api_key=api_key)
    resp = client.embeddings.create(model="mistral-embed", inputs=[text[:8000]])
    return resp.data[0].embedding


def note_to_embed_text(content: dict) -> str:
    """Flatten a note content dict to a single string for embedding.

    We prioritise semantic fields (title, main text, definitions) over
    structural ones (raw formulas, diagram descriptions).
    """
    parts: list[str] = []
    if content.get("titulo"):
        parts.append(content["titulo"])
    if content.get("texto_principal"):
        parts.append(content["texto_principal"])
    for d in content.get("definiciones") or []:
        parts.append(f"{d.get('termino', '')}: {d.get('definicion', '')}")
    for l in content.get("listas") or []:
        parts.extend(l.get("items") or [])
    if content.get("observaciones"):
        parts.append(content["observaciones"])
    return " ".join(parts)[:8000]

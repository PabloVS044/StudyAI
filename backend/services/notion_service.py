"""Export a note to a Notion database page."""
from typing import Optional


def _rich(text: str) -> list:
    """Split long text into Notion rich_text blocks (max 2000 chars each)."""
    chunks = [text[i:i+2000] for i in range(0, len(text), 2000)]
    return [{"type": "text", "text": {"content": c}} for c in chunks]


def _paragraph(text: str) -> dict:
    return {"object": "block", "type": "paragraph",
            "paragraph": {"rich_text": _rich(text)}}


def _heading(text: str, level: int = 2) -> dict:
    t = f"heading_{level}"
    return {"object": "block", "type": t,
            t: {"rich_text": [{"type": "text", "text": {"content": text}}]}}


def _callout(text: str, emoji: str = "💡") -> dict:
    return {"object": "block", "type": "callout",
            "callout": {"rich_text": _rich(text[:2000]),
                        "icon": {"type": "emoji", "emoji": emoji}}}


def create_note_page(
    token: str,
    database_id: str,
    note_id: str,
    filename: str,
    content: dict,
) -> Optional[str]:
    """Create a Notion page and return its URL, or None on failure."""
    from notion_client import Client
    client = Client(auth=token)

    title = content.get("titulo") or filename
    blocks: list[dict] = []

    if content.get("texto_principal"):
        blocks.append(_heading("Texto Principal"))
        for para in (content["texto_principal"] or "").split("\n\n"):
            if para.strip():
                blocks.append(_paragraph(para.strip()))

    if content.get("formulas"):
        blocks.append(_heading("Fórmulas"))
        for f in content["formulas"]:
            if f.get("descripcion"):
                blocks.append({
                    "object": "block", "type": "paragraph",
                    "paragraph": {"rich_text": [
                        {"type": "text", "text": {"content": f["descripcion"]},
                         "annotations": {"bold": True}}
                    ]}
                })
            if f.get("latex"):
                blocks.append({"object": "block", "type": "equation",
                                "equation": {"expression": f["latex"]}})
            elif f.get("texto_plano"):
                blocks.append({"object": "block", "type": "code",
                                "code": {"rich_text": _rich(f["texto_plano"]),
                                         "language": "plain text"}})

    if content.get("definiciones"):
        blocks.append(_heading("Definiciones"))
        for d in content["definiciones"]:
            blocks.append({
                "object": "block", "type": "paragraph",
                "paragraph": {"rich_text": [
                    {"type": "text", "text": {"content": f"{d.get('termino', '')}: "},
                     "annotations": {"bold": True}},
                    {"type": "text", "text": {"content": d.get("definicion", "")}},
                ]}
            })

    if content.get("listas"):
        blocks.append(_heading("Listas"))
        for lista in content["listas"]:
            btype = "numbered_list_item" if lista.get("tipo") == "numerada" else "bulleted_list_item"
            for item in lista.get("items") or []:
                blocks.append({
                    "object": "block", "type": btype,
                    btype: {"rich_text": _rich(item[:2000])}
                })

    if content.get("diagramas_figuras"):
        blocks.append(_heading("Diagramas y Figuras"))
        for d in content["diagramas_figuras"]:
            blocks.append(_callout(d.get("descripcion", ""), "🖼️"))

    if content.get("observaciones"):
        blocks.append(_heading("Observaciones"))
        blocks.append(_callout(content["observaciones"][:2000]))

    page = client.pages.create(
        parent={"database_id": database_id},
        properties={
            "Name": {"title": [{"text": {"content": title[:2000]}}]},
            "Filename": {"rich_text": [{"text": {"content": filename}}]},
            "Note ID": {"rich_text": [{"text": {"content": note_id}}]},
        },
        children=blocks[:100],  # Notion API limit per request
    )
    return page.get("url")

"""Notion OAuth + export service (per-user tokens)."""
import base64
from typing import Optional

import httpx

_NOTION_VERSION = "2022-06-28"
_NOTION_BASE = "https://api.notion.com/v1"


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": _NOTION_VERSION,
        "Content-Type": "application/json",
    }


def exchange_code(client_id: str, client_secret: str, code: str, redirect_uri: str) -> dict:
    """Exchange OAuth authorization code for tokens. Returns full Notion token response dict."""
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    resp = httpx.post(
        f"{_NOTION_BASE}/oauth/token",
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
        },
        json={"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def search_parents(token: str) -> list[dict]:
    """Return accessible pages as [{id, title}]."""
    resp = httpx.post(
        f"{_NOTION_BASE}/search",
        headers=_headers(token),
        json={"filter": {"property": "object", "value": "page"}},
        timeout=15,
    )
    resp.raise_for_status()
    results = resp.json().get("results", [])
    out = []
    for r in results:
        title = ""
        props = r.get("properties", {})
        # Try title property first, then page title array
        for prop in props.values():
            if prop.get("type") == "title":
                parts = prop.get("title", [])
                title = "".join(p.get("plain_text", "") for p in parts)
                break
        if not title:
            # Fallback: top-level title array (some page types)
            for chunk in r.get("title", []):
                title += chunk.get("plain_text", "")
        out.append({"id": r["id"], "title": title or "(Untitled)"})
    return out


def search_databases(token: str) -> list[dict]:
    """Return accessible databases as [{id, title}]."""
    resp = httpx.post(
        f"{_NOTION_BASE}/search",
        headers=_headers(token),
        json={"filter": {"property": "object", "value": "database"}},
        timeout=15,
    )
    resp.raise_for_status()
    results = resp.json().get("results", [])
    out = []
    for r in results:
        title = "".join(chunk.get("plain_text", "") for chunk in r.get("title", []))
        out.append({"id": r["id"], "title": title or "(Untitled)"})
    return out


def create_book_database(token: str, parent_page_id: str, title: str) -> dict:
    """Create a Notion database (book) under parent_page_id. Returns {id, title}."""
    resp = httpx.post(
        f"{_NOTION_BASE}/databases",
        headers=_headers(token),
        json={
            "parent": {"type": "page_id", "page_id": parent_page_id},
            "title": [{"type": "text", "text": {"content": title}}],
            "properties": {
                "Name": {"title": {}},
                "Filename": {"rich_text": {}},
                "Note ID": {"rich_text": {}},
            },
        },
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    db_title = "".join(chunk.get("plain_text", "") for chunk in data.get("title", []))
    return {"id": data["id"], "title": db_title or title}


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

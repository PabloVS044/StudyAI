"""Export a note as Obsidian-compatible Markdown."""
import re
from pathlib import Path
from typing import Optional


def _safe_filename(text: str) -> str:
    return re.sub(r'[^\w\s\-]', '', text).strip().replace(' ', '_') or "nota"


def to_markdown(note_id: str, filename: str, created_at: str, content: dict,
                notion_url: Optional[str] = None,
                drive_url: Optional[str] = None) -> str:
    lines = ["---"]
    lines.append(f"note_id: \"{note_id}\"")
    lines.append(f"filename: \"{filename}\"")
    lines.append(f"date: \"{created_at}\"")
    if notion_url:
        lines.append(f"notion_url: \"{notion_url}\"")
    if drive_url:
        lines.append(f"drive_url: \"{drive_url}\"")
    lines.append("tags: [studyai, apuntes]")
    lines.append("---\n")

    title = content.get("titulo") or filename
    lines.append(f"# {title}\n")

    if content.get("texto_principal"):
        lines += ["## Texto Principal\n", content["texto_principal"], ""]

    if content.get("formulas"):
        lines.append("## Fórmulas\n")
        for f in content["formulas"]:
            if f.get("descripcion"):
                lines.append(f"**{f['descripcion']}**\n")
            if f.get("latex"):
                lines += [f"$$", f["latex"], "$$\n"]
            elif f.get("texto_plano"):
                lines.append(f"`{f['texto_plano']}`\n")

    if content.get("definiciones"):
        lines.append("## Definiciones\n")
        for d in content["definiciones"]:
            lines.append(f"**{d.get('termino', '')}**: {d.get('definicion', '')}\n")

    if content.get("listas"):
        lines.append("## Listas\n")
        for lista in content["listas"]:
            for i, item in enumerate(lista.get("items") or []):
                prefix = f"{i+1}." if lista.get("tipo") == "numerada" else "-"
                lines.append(f"{prefix} {item}")
            lines.append("")

    if content.get("diagramas_figuras"):
        lines.append("## Diagramas y Figuras\n")
        for d in content["diagramas_figuras"]:
            lines.append(f"> [!info] Diagrama\n> {d.get('descripcion', '')}\n")

    if content.get("observaciones"):
        lines += ["## Observaciones\n",
                  f"> [!note]\n> {content['observaciones']}\n"]

    return "\n".join(lines)


def save_to_vault(vault_path: str, note_id: str, filename: str,
                  created_at: str, content: dict,
                  notion_url: Optional[str] = None,
                  drive_url: Optional[str] = None) -> str:
    """Write the .md file to {vault_path}/StudyAI/{safe_name}.md.
    Returns the absolute path written."""
    md = to_markdown(note_id, filename, created_at, content, notion_url, drive_url)
    title = content.get("titulo") or filename
    fname = _safe_filename(title) + ".md"

    dest = Path(vault_path) / "StudyAI"
    dest.mkdir(parents=True, exist_ok=True)
    out = dest / fname
    out.write_text(md, encoding="utf-8")
    return str(out)

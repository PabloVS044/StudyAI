"""Chat router for StudyAI - implements RAG using Pinecone and Mistral."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth import get_current_user
from config import settings
from services import supabase_client, embeddings, pinecone_client

try:
    from mistralai import Mistral
except ImportError:
    from mistralai.client import Mistral

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.post("")
async def chat_rag(req: ChatRequest, user_id: str = Depends(get_current_user)):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY no configurada")

    try:
        vector = embeddings.get_embedding(settings.MISTRAL_API_KEY, req.question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al generar embedding: {exc}")

    matches = []
    if settings.PINECONE_API_KEY:
        try:
            matches = pinecone_client.query_similar(
                settings.PINECONE_API_KEY,
                settings.PINECONE_INDEX_NAME,
                vector,
                top_k=3
            )
        except Exception:
            pass

    context_parts = []
    sources = []

    for m in matches:
        note_id = m["note_id"]
        score = m["score"]
        row = supabase_client.get_note(note_id, user_id)
        if not row:
            continue

        content = supabase_client.note_content(row)
        title = row["title"]
        sources.append({"note_id": note_id, "title": title, "score": round(score, 4)})

        note_text = f"--- APUNTE: {title} ---\n"
        if content.get("texto_principal"):
            note_text += f"Texto Principal:\n{content['texto_principal']}\n"
        if content.get("definiciones"):
            note_text += "Definiciones:\n"
            for d in content["definiciones"]:
                if d.get("termino") and d.get("definicion"):
                    note_text += f"- {d.get('termino')}: {d.get('definicion')}\n"
        if content.get("formulas"):
            note_text += "Fórmulas:\n"
            for f in content["formulas"]:
                eq = f.get("latex") or f.get("texto_plano") or ""
                desc = f.get("descripcion") or ""
                note_text += f"- {desc}: {eq}\n"
        if content.get("listas"):
            for l in content["listas"]:
                tipo = l.get("tipo") or "viñetas"
                note_text += f"Lista ({tipo}):\n"
                for item in (l.get("items") or []):
                    note_text += f"  * {item}\n"
        if content.get("observaciones"):
            note_text += f"Observaciones/Anotaciones:\n{content['observaciones']}\n"

        context_parts.append(note_text)

    context = "\n\n".join(context_parts)

    system_prompt = (
        "Eres un asistente de estudio inteligente llamado StudyAI.\n"
        "Tu objetivo es responder las preguntas del usuario utilizando la información de sus apuntes académicos adjuntos en el contexto.\n"
        "Si la información en el contexto es suficiente para responder, utilízala prioritariamente. "
        "Si el contexto no contiene la respuesta completa, responde utilizando tu propio conocimiento general, pero indica de manera clara qué partes provienen de los apuntes y qué partes provienen de tu conocimiento general.\n\n"
        "Contexto de los apuntes:\n"
        f"{context if context else '[No hay apuntes relevantes en el contexto]'}\n"
    )

    try:
        client = Mistral(api_key=settings.MISTRAL_API_KEY)
        resp = client.chat.complete(
            model="mistral-small-latest",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.question}
            ]
        )
        answer = resp.choices[0].message.content
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error en Mistral Chat: {exc}")

    return {"answer": answer, "sources": sources}

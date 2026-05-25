"""Chat router for StudyAI - implements RAG using Pinecone and Mistral."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings
from services import sqlite_client, embeddings, pinecone_client

try:
    from mistralai import Mistral
except ImportError:
    from mistralai.client import Mistral

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.post("")
async def chat_rag(req: ChatRequest):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY no configurada")

    # 1. Generar embedding para la pregunta
    try:
        vector = embeddings.get_embedding(settings.MISTRAL_API_KEY, req.question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al generar embedding: {exc}")

    # 2. Buscar las 3 notas más relevantes en Pinecone (si Pinecone está configurado)
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
            # Continuar sin contexto si Pinecone falla
            pass

    # 3. Recuperar contenido completo de SQLite y construir el contexto
    context_parts = []
    sources = []

    for m in matches:
        note_id = m["note_id"]
        score = m["score"]
        row = sqlite_client.get_note(note_id)
        if not row:
            continue

        content = sqlite_client.note_content(row)
        title = row["title"]
        sources.append({
            "note_id": note_id,
            "title": title,
            "score": round(score, 4)
        })

        # Estructurar texto de la nota para el contexto
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

    # 4. Construir prompt del sistema
    system_prompt = (
        "Eres un asistente de estudio inteligente llamado StudyAI.\n"
        "Tu objetivo es responder las preguntas del usuario utilizando la información de sus apuntes académicos adjuntos en el contexto.\n"
        "Si la información en el contexto es suficiente para responder, utilízala prioritariamente. "
        "Si el contexto no contiene la respuesta completa, responde utilizando tu propio conocimiento general, pero indica de manera clara qué partes provienen de los apuntes y qué partes provienen de tu conocimiento general.\n\n"
        "Contexto de los apuntes:\n"
        f"{context if context else '[No hay apuntes relevantes en el contexto]'}\n"
    )

    # 5. Invocar Mistral Chat
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

    return {
        "answer": answer,
        "sources": sources
    }

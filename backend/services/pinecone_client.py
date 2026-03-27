"""Pinecone vector store — stores embeddings, powers semantic search."""
from typing import Optional
from pinecone import Pinecone

_index = None


def _get_index(api_key: str, index_name: str):
    global _index
    if _index is None:
        pc = Pinecone(api_key=api_key)
        _index = pc.Index(index_name)
    return _index


def upsert_vector(
    api_key: str,
    index_name: str,
    note_id: str,
    vector: list[float],
    metadata: dict,
) -> None:
    idx = _get_index(api_key, index_name)
    # Keep metadata lightweight — full content lives in SQLite
    safe_meta = {k: v for k, v in metadata.items() if isinstance(v, (str, int, float, bool))}
    idx.upsert(vectors=[{"id": note_id, "values": vector, "metadata": safe_meta}])


def query_similar(
    api_key: str,
    index_name: str,
    vector: list[float],
    top_k: int = 5,
) -> list[dict]:
    idx = _get_index(api_key, index_name)
    result = idx.query(vector=vector, top_k=top_k, include_metadata=True)
    return [
        {"note_id": m.id, "score": m.score, "meta": dict(m.metadata or {})}
        for m in result.matches
    ]


def delete_vector(api_key: str, index_name: str, note_id: str) -> None:
    _get_index(api_key, index_name).delete(ids=[note_id])

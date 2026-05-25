import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, ExternalLink } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { searchNotes, getNote, imageUrl } from "../api/client";
import Modal from "../components/Modal";
import NoteDetailView from "../components/NoteDetailView";
import Spinner from "../components/Spinner";
import TopBar from "../components/TopBar";
import type { NoteDetail, SearchResultItem } from "../types/note";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const [selected, setSelected] = useState<NoteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query.trim()), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function doSearch(q: string) {
    setLoading(true);
    setError("");
    try {
      setResults(await searchNotes(q, 8));
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en la búsqueda");
    } finally {
      setLoading(false);
    }
  }

  async function openNote(noteId: string) {
    setLoadingDetail(true);
    try {
      setSelected(await getNote(noteId));
    } finally {
      setLoadingDetail(false);
    }
  }

  const pct = (score: number) => Math.round(score * 100);
  const isPineconeError = error.includes("Pinecone") || error.includes("no configurados");

  return (
    <>
      <TopBar searchPlaceholder="Search your notes..." />
      <main className="flex-1 ml-0 md:ml-64 pt-[112px] px-gutter pb-xl max-w-3xl w-full mx-auto">
      <h1 className="text-2xl font-bold text-on-background mb-1 flex items-center gap-2">
        <Sparkles size={22} className="text-primary" />
        Búsqueda Semántica
      </h1>
      <p className="text-on-surface-variant text-sm mb-6">
        Busca por significado — no solo palabras exactas. Usa Pinecone + Mistral embeddings.
      </p>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <Spinner size={16} />
          </span>
        )}
        <input
          type="text"
          placeholder="Ej: derivadas, termodinámica, ciclo de Krebs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-xl pl-11 pr-11 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none transition-colors"
          autoFocus
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-error-container/70 border border-error/20 rounded-lg text-on-error-container text-sm mb-4">
          {isPineconeError
            ? "La búsqueda semántica necesita Pinecone y Mistral configurados en el backend."
            : error}
        </div>
      )}

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <p className="text-on-surface-variant text-sm text-center py-8">
          No se encontraron notas similares. Intenta con otros términos.
        </p>
      )}

      <div className="space-y-3">
        {results.map((r) => (
          <button
            key={r.note_id}
            onClick={() => openNote(r.note_id)}
            className="w-full text-left bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant hover:border-primary/40 rounded-xl p-4 transition-all group"
          >
            <div className="flex gap-4">
              {r.image_ext && (
                <img
                  src={imageUrl(r.note_id)}
                  alt={r.title}
                  className="w-14 h-14 object-cover rounded-lg border border-outline-variant shrink-0"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">
                    {r.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.max(pct(r.score), 10)}px`, maxWidth: 60 }}
                    />
                    <span className="text-[10px] text-outline font-mono">{pct(r.score)}%</span>
                  </div>
                </div>
                <p className="text-xs text-outline mt-0.5 mb-1.5">
                  {r.filename} · {r.date ? new Date(r.date).toLocaleDateString("es") : ""}
                </p>
                <p className="text-xs text-on-surface-variant line-clamp-2">{r.text_preview}</p>
                {(r.notion_url || r.drive_url) && (
                  <div className="flex gap-2 mt-2">
                    {r.notion_url && (
                      <a href={r.notion_url} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-primary">
                        <ExternalLink size={9} /> Notion
                      </a>
                    )}
                    {r.drive_url && (
                      <a href={r.drive_url} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-primary">
                        <ExternalLink size={9} /> Drive
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      <Modal open={!!selected || loadingDetail} onClose={() => setSelected(null)} title={selected?.title ?? "Cargando…"} wide>
        {loadingDetail ? (
          <div className="flex justify-center py-10"><Spinner size={28} /></div>
        ) : selected ? (
          <NoteDetailView
            noteId={selected.note_id}
            filename={selected.filename}
            imageExt={selected.image_ext}
            content={selected.content}
            saved
            notionUrl={selected.notion_url}
            driveUrl={selected.drive_url}
          />
        ) : null}
      </Modal>
      </main>
    </>
  );
}

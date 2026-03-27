import { useState, useEffect, useCallback } from "react";
import { BookOpen, RefreshCw, Search } from "lucide-react";
import { listNotes } from "../api/client";
import NoteCard from "../components/NoteCard";
import Spinner from "../components/Spinner";
import type { NoteListItem } from "../types/note";

export default function LibraryPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setNotes(await listNotes(100));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar notas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(filter.toLowerCase()) ||
          n.text_preview.toLowerCase().includes(filter.toLowerCase())
      )
    : notes;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-violet-400" />
            Biblioteca
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {notes.length} nota{notes.length !== 1 ? "s" : ""} guardada{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-40"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Filter */}
      {notes.length > 4 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Filtrar por título o contenido…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full max-w-sm bg-[#17171f] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>{notes.length === 0 ? "Aún no hay notas guardadas." : "No hay notas que coincidan."}</p>
          {notes.length === 0 && (
            <p className="text-sm mt-1">Sube fotos de apuntes en la sección de carga.</p>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((note) => (
            <NoteCard key={note.note_id} note={note} onDeleted={load} />
          ))}
        </div>
      )}
    </div>
  );
}

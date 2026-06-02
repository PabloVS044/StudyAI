import { useState, useEffect, useCallback } from "react";
import TopBar from "../components/TopBar";
import NoteCard from "../components/NoteCard";
import Spinner from "../components/Spinner";
import { listNotes } from "../api/client";
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
    <>
      <TopBar searchPlaceholder="Search your library..." />
      <main className="flex-1 ml-0 md:ml-64 pt-[112px] px-gutter pb-xl max-w-container-max w-full mx-auto">
        {/* Page Header */}
        <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-display-lg text-on-background mb-2">Library</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl">
              Your processed documents, lecture notes, and captured materials organized for deep focus.
              {!loading && notes.length > 0 && (
                <span className="ml-2 text-on-surface-variant/60">
                  ({notes.length} nota{notes.length !== 1 ? "s" : ""})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}>refresh</span>
              <span className="text-label-md">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search filter — shown when there are enough notes */}
        {notes.length > 4 && (
          <div className="mb-lg bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4">
            <div className="text-label-md text-on-surface-variant flex items-center gap-2 mr-2">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Filter:
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
              <input
                type="text"
                placeholder="Filter by title or content..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg pl-9 pr-4 py-2 text-label-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
              />
            </div>
            {filter && (
              <button
                onClick={() => setFilter("")}
                className="text-caption text-primary hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-[56px] opacity-20 block mx-auto mb-4">auto_stories</span>
            <p className="text-body-lg">
              {notes.length === 0
                ? "No notes saved yet."
                : "No notes match your filter."}
            </p>
            {notes.length === 0 && (
              <p className="text-body-md text-on-surface-variant/60 mt-1">
                Upload photos of your notes in the capture section.
              </p>
            )}
          </div>
        )}

        {/* Note Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
            {filtered.map((note) => (
              <NoteCard key={note.note_id} note={note} onDeleted={load} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

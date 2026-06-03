import { useState, useEffect, useCallback } from "react";
import TopBar from "../components/TopBar";
import NoteCard from "../components/NoteCard";
import Spinner from "../components/Spinner";
import { listNotes, listNotebooks } from "../api/client";
import type { NoteListItem, Notebook } from "../types/note";
import { useAppSettings } from "../context/AppSettings";

const COPY = {
  es: {
    searchPlaceholder: "Buscar en tu biblioteca...",
    title: "Biblioteca",
    subtitle: "Tus documentos procesados, apuntes de clase y materiales capturados organizados para una concentración profunda.",
    nota: "nota",
    notas: "notas",
    refresh: "Actualizar",
    filterLabel: "Filtrar:",
    filterPlaceholder: "Filtrar por título o contenido...",
    clear: "Limpiar",
    emptyNoNotes: "Aún no hay notas guardadas.",
    emptyNoNotesSub: "Sube fotos de tus apuntes en la sección de captura.",
    emptyNoMatch: "Ninguna nota coincide con tu filtro.",
    errorDefault: "Error al cargar notas",
    allBooks: "Todos",
    noBook: "Sin libro",
    bookLabel: "Libro:",
  },
  en: {
    searchPlaceholder: "Search your library...",
    title: "Library",
    subtitle: "Your processed documents, lecture notes, and captured materials organized for deep focus.",
    nota: "note",
    notas: "notes",
    refresh: "Refresh",
    filterLabel: "Filter:",
    filterPlaceholder: "Filter by title or content...",
    clear: "Clear",
    emptyNoNotes: "No notes saved yet.",
    emptyNoNotesSub: "Upload photos of your notes in the capture section.",
    emptyNoMatch: "No notes match your filter.",
    errorDefault: "Error loading notes",
    allBooks: "All",
    noBook: "No notebook",
    bookLabel: "Notebook:",
  },
} as const;

// Sentinel values for the notebook selector
const ALL_BOOKS = "__all__";
const NO_BOOK = "__none__";

export default function LibraryPage() {
  const { lang } = useAppSettings();
  const t = COPY[lang];
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [selectedBook, setSelectedBook] = useState<string>(ALL_BOOKS);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [fetchedNotes, fetchedNotebooks] = await Promise.all([
        listNotes(100),
        listNotebooks(),
      ]);
      setNotes(fetchedNotes);
      setNotebooks(fetchedNotebooks);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorDefault);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Notes filtered by selected notebook, then by text filter
  const byBook: NoteListItem[] = (() => {
    if (selectedBook === ALL_BOOKS) return notes;
    if (selectedBook === NO_BOOK) return notes.filter((n) => !(n as any).notebook_id);
    const nbId = Number(selectedBook);
    return notes.filter((n) => (n as any).notebook_id === nbId);
  })();

  const filtered = filter
    ? byBook.filter(
        (n) =>
          n.title.toLowerCase().includes(filter.toLowerCase()) ||
          n.text_preview.toLowerCase().includes(filter.toLowerCase())
      )
    : byBook;

  // Label for the current section heading
  const sectionLabel: string | null = (() => {
    if (selectedBook === ALL_BOOKS) return null;
    if (selectedBook === NO_BOOK) return t.noBook;
    const nb = notebooks.find((nb) => nb.id === Number(selectedBook));
    return nb ? nb.name : null;
  })();

  return (
    <>
      <TopBar searchPlaceholder={t.searchPlaceholder} />
      <main className="flex-1 ml-0 md:ml-64 pt-[112px] px-4 md:px-gutter pb-xl max-w-container-max w-full mx-auto overflow-y-auto">
        <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-headline-lg md:text-display-lg text-on-background mb-2">{t.title}</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl">
              {t.subtitle}
              {!loading && notes.length > 0 && (
                <span className="ml-2 text-on-surface-variant/60">
                  ({notes.length} {notes.length !== 1 ? t.notas : t.nota})
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
              <span className="text-label-md">{t.refresh}</span>
            </button>
          </div>
        </div>

        {/* Notebook selector */}
        {notebooks.length > 0 && (
          <div className="mb-md flex flex-wrap items-center gap-2">
            <span className="text-label-md text-on-surface-variant flex items-center gap-1 mr-1">
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              {t.bookLabel}
            </span>
            {[
              { value: ALL_BOOKS, label: t.allBooks },
              ...notebooks.map((nb) => ({ value: String(nb.id), label: nb.name })),
              { value: NO_BOOK, label: t.noBook },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedBook(value)}
                className={`px-3 py-1.5 rounded-full text-label-sm border transition-colors ${
                  selectedBook === value
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {label}
                {value !== ALL_BOOKS && value !== NO_BOOK && notebooks.find((nb) => nb.id === Number(value))?.note_count != null && (
                  <span className="ml-1 opacity-60 text-[11px]">
                    ({notebooks.find((nb) => nb.id === Number(value))!.note_count})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Search filter — shown when there are enough notes */}
        {notes.length > 4 && (
          <div className="mb-lg bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4">
            <div className="text-label-md text-on-surface-variant flex items-center gap-2 mr-2">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              {t.filterLabel}
            </div>
            <div className="relative flex-1 min-w-0 max-w-sm w-full">
              <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
              <input
                type="text"
                placeholder={t.filterPlaceholder}
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
                {t.clear}
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
              {notes.length === 0 ? t.emptyNoNotes : t.emptyNoMatch}
            </p>
            {notes.length === 0 && (
              <p className="text-body-md text-on-surface-variant/60 mt-1">
                {t.emptyNoNotesSub}
              </p>
            )}
          </div>
        )}


        {/* Section heading when a specific notebook is selected */}
        {!loading && sectionLabel && filtered.length > 0 && (
          <div className="mb-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">menu_book</span>
            <h3 className="text-title-md text-on-background font-semibold">{sectionLabel}</h3>
            <span className="text-body-sm text-on-surface-variant/60">
              — {filtered.length} {filtered.length !== 1 ? t.notas : t.nota}
            </span>
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

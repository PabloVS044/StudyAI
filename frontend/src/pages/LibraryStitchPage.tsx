import { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import Modal from "../components/Modal";
import NoteDetailView from "../components/NoteDetailView";
import Spinner from "../components/Spinner";
import { getNote, listNotes } from "../api/client";
import type { NoteDetail, NoteListItem } from "../types/note";

const typeIcons: Record<string, string> = {
  image: "image",
  note: "edit_note",
};

const typeColors: Record<string, string> = {
  image: "bg-surface-container-high text-on-surface-variant",
  note: "bg-secondary-container/50 text-on-secondary-container",
};

function formatDate(date?: string) {
  if (!date) return "Sin fecha";
  return new Date(date).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LibraryPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteListItem | null>(null);
  const [detail, setDetail] = useState<NoteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadNotes = useCallback(async () => {
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

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const allTags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags ?? []))).sort(),
    [notes],
  );

  const filteredNotes = activeTag
    ? notes.filter((note) => (note.tags ?? []).includes(activeTag))
    : notes;

  async function openNote(note: NoteListItem) {
    setSelectedNote(note);
    setDetail(null);
    setDetailError("");
    setLoadingDetail(true);
    try {
      setDetail(await getNote(note.note_id));
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Error al cargar la nota");
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <>
      <TopBar searchPlaceholder="Search your library..." />
      <main className="flex-1 ml-0 md:ml-64 pt-[112px] px-gutter pb-xl max-w-container-max w-full mx-auto overflow-y-auto">
        <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-display-lg text-on-background mb-2">Library</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl">
              Your processed documents, lecture notes, and captured materials organized for deep focus.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadNotes}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[20px] ${loading ? "animate-spin" : ""}`}>sync</span>
              <span className="text-label-md">Refresh</span>
            </button>
          </div>
        </div>

        <div className="mb-lg bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
          <div className="text-label-md text-on-surface-variant flex items-center gap-2 mr-1">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Tags:
          </div>
          {allTags.length === 0 ? (
            <span className="text-caption text-on-surface-variant">No tags available yet</span>
          ) : (
            allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                  activeTag === tag
                    ? "bg-primary-container/10 text-primary border-primary-container/20"
                    : "bg-secondary-container/30 text-on-secondary-container border-secondary-container hover:bg-secondary-container/50"
                }`}
              >
                <span className="text-caption font-bold">{tag}</span>
              </button>
            ))
          )}
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="ml-auto text-caption text-primary hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        )}

        {error && (
          <div className="p-4 bg-error-container/60 border border-error/20 rounded-lg text-on-error-container text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filteredNotes.length === 0 && (
          <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/50 rounded-xl">
            <span className="material-symbols-outlined text-[44px] text-outline mb-3">library_books</span>
            <p className="text-on-surface font-semibold">
              {notes.length === 0 ? "Aun no hay notas guardadas." : "No hay notas con ese tag."}
            </p>
            <p className="text-body-md text-on-surface-variant mt-1">
              {notes.length === 0 ? "Sube fotos de apuntes desde Capture para empezar." : "Limpia el filtro para ver toda la biblioteca."}
            </p>
          </div>
        )}

        {!loading && !error && filteredNotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
            {filteredNotes.map((note) => {
              const docType = note.image_ext ? "image" : "note";
              return (
                <article
                  key={note.note_id}
                  onClick={() => openNote(note)}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-64 group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[docType]}`}>
                      <span className="material-symbols-outlined fill">{typeIcons[docType]}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary-container/10 text-primary text-caption flex items-center gap-1 border border-primary-container/20">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      AI Processed
                    </span>
                  </div>

                  <div className="flex-1 min-h-0">
                    <h3 className="text-headline-md text-on-surface mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-body-md text-on-surface-variant line-clamp-1">{note.filename}</p>
                    <p className="text-body-md text-on-surface-variant line-clamp-2 mt-2 text-sm">
                      {note.text_preview}
                    </p>
                    {(note.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-caption">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between items-center text-caption text-on-surface-variant">
                    <span>{formatDate(note.date)}</span>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"
                      aria-label="More options"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Modal
        open={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={selectedNote?.title}
        wide
      >
        {loadingDetail ? (
          <div className="flex justify-center py-10"><Spinner size={28} /></div>
        ) : detailError ? (
          <p className="text-red-400 text-sm">{detailError}</p>
        ) : detail ? (
          <NoteDetailView
            noteId={detail.note_id}
            filename={detail.filename}
            imageExt={detail.image_ext}
            content={detail.content}
            saved
            notionUrl={detail.notion_url}
            driveUrl={detail.drive_url}
          />
        ) : null}
      </Modal>
    </>
  );
}

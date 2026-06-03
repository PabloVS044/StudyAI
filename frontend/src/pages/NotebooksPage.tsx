import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import {
  listNotebooks,
  createNotebook,
  deleteNotebook,
  getNotebook,
  removeNoteFromNotebook,
} from "../api/client";
import type { Notebook, NoteListItem } from "../types/note";
import { useAppSettings } from "../context/AppSettings";
import { notify } from "../lib/toast";
import { confirmDialog } from "../lib/swal";

const COPY = {
  es: {
    title: "Libros de notas",
    subtitle: "Agrupa tus notas en libros para estudiar por modulo o tema.",
    newBook: "Nuevo libro",
    emptyBooks: "Aun no tienes libros. Crea uno para empezar.",
    notes: "notas",
    delete: "Eliminar",
    deleteConfirmTitle: "Eliminar libro",
    deleteConfirmText: "El libro se borrara pero las notas se conservan.",
    deleteConfirm: "Eliminar",
    deleteCancel: "Cancelar",
    deleteError: "Error al eliminar el libro.",
    deleted: "Libro eliminado.",
    back: "Volver",
    examBtn: "Hacer parcial",
    removeNote: "Quitar del libro",
    removeNoteConfirmTitle: "Quitar nota",
    removeNoteConfirmText: "La nota seguira existiendo en tu biblioteca.",
    removeNoteConfirm: "Quitar",
    removeNoteCancel: "Cancelar",
    removeNoteError: "Error al quitar la nota.",
    removed: "Nota quitada del libro.",
    emptyNotes: "Este libro no tiene notas aun.",
    createModalTitle: "Nuevo libro de notas",
    namePlaceholder: "Nombre del libro",
    descPlaceholder: "Descripcion (opcional)",
    create: "Crear",
    creating: "Creando...",
    cancel: "Cancelar",
    nameRequired: "El nombre es obligatorio.",
    createError: "Error al crear el libro.",
    searchPlaceholder: "Buscar...",
    noNotebooks: "Sin libros",
  },
  en: {
    title: "Notebooks",
    subtitle: "Group your notes into notebooks to study by module or topic.",
    newBook: "New notebook",
    emptyBooks: "No notebooks yet. Create one to get started.",
    notes: "notes",
    delete: "Delete",
    deleteConfirmTitle: "Delete notebook",
    deleteConfirmText: "The notebook will be deleted but notes are kept.",
    deleteConfirm: "Delete",
    deleteCancel: "Cancel",
    deleteError: "Error deleting notebook.",
    deleted: "Notebook deleted.",
    back: "Back",
    examBtn: "Take exam",
    removeNote: "Remove from notebook",
    removeNoteConfirmTitle: "Remove note",
    removeNoteConfirmText: "The note will remain in your library.",
    removeNoteConfirm: "Remove",
    removeNoteCancel: "Cancel",
    removeNoteError: "Error removing note.",
    removed: "Note removed from notebook.",
    emptyNotes: "This notebook has no notes yet.",
    createModalTitle: "New notebook",
    namePlaceholder: "Notebook name",
    descPlaceholder: "Description (optional)",
    create: "Create",
    creating: "Creating...",
    cancel: "Cancel",
    nameRequired: "Name is required.",
    createError: "Error creating notebook.",
    searchPlaceholder: "Search...",
    noNotebooks: "No notebooks",
  },
} as const;

type View = "list" | "detail";

export default function NotebooksPage() {
  const { lang } = useAppSettings();
  const t = COPY[lang];
  const navigate = useNavigate();

  const [view, setView] = useState<View>("list");
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  // detail state
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [detailNotes, setDetailNotes] = useState<NoteListItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // create modal
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadNotebooks();
  }, []);

  async function loadNotebooks() {
    setLoading(true);
    try {
      const data = await listNotebooks();
      setNotebooks(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function openNotebook(nb: Notebook) {
    setSelectedNotebook(nb);
    setView("detail");
    setDetailLoading(true);
    try {
      const data = await getNotebook(nb.id);
      setSelectedNotebook(data.notebook);
      setDetailNotes(data.notes);
    } catch {
      notify.error(t.deleteError);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDelete(nb: Notebook, e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: t.deleteConfirmTitle,
      text: t.deleteConfirmText,
      confirmText: t.deleteConfirm,
      cancelText: t.deleteCancel,
      icon: "warning",
    });
    if (!ok) return;
    try {
      await deleteNotebook(nb.id);
      notify.success(t.deleted);
      setNotebooks((prev) => prev.filter((n) => n.id !== nb.id));
    } catch {
      notify.error(t.deleteError);
    }
  }

  async function handleRemoveNote(noteId: string) {
    if (!selectedNotebook) return;
    const ok = await confirmDialog({
      title: t.removeNoteConfirmTitle,
      text: t.removeNoteConfirmText,
      confirmText: t.removeNoteConfirm,
      cancelText: t.removeNoteCancel,
      icon: "question",
    });
    if (!ok) return;
    try {
      await removeNoteFromNotebook(selectedNotebook.id, noteId);
      notify.success(t.removed);
      setDetailNotes((prev) => prev.filter((n) => n.note_id !== noteId));
      // update count in list
      setNotebooks((prev) =>
        prev.map((n) =>
          n.id === selectedNotebook.id
            ? { ...n, note_count: Math.max(0, (n.note_count ?? 1) - 1) }
            : n
        )
      );
    } catch {
      notify.error(t.removeNoteError);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      notify.error(t.nameRequired);
      return;
    }
    setCreating(true);
    try {
      const nb = await createNotebook({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setNotebooks((prev) => [nb, ...prev]);
      setShowModal(false);
      setNewName("");
      setNewDesc("");
    } catch {
      notify.error(t.createError);
    } finally {
      setCreating(false);
    }
  }

  function goToExam(notebookId: number) {
    navigate(`/tests?notebook=${notebookId}`);
  }

  // --- DETAIL VIEW ---
  if (view === "detail" && selectedNotebook) {
    return (
      <>
        <TopBar searchPlaceholder={t.searchPlaceholder} />
        <main className="flex-1 mt-16 p-4 md:p-gutter w-full max-w-container-max mx-auto ml-0 md:ml-64">
          {/* Back + header */}
          <div className="mb-md flex flex-wrap items-center gap-sm">
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors text-label-md"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              {t.back}
            </button>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-md mb-gutter">
            <div>
              <h2 className="text-headline-lg text-on-background flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[28px]">menu_book</span>
                {selectedNotebook.name}
              </h2>
              {selectedNotebook.description && (
                <p className="text-body-md text-on-surface-variant mt-xs">{selectedNotebook.description}</p>
              )}
            </div>
            <button
              onClick={() => goToExam(selectedNotebook.id)}
              className="px-md py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 transition-all flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">quiz</span>
              {t.examBtn}
            </button>
          </div>

          {detailLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-surface-container-low rounded-xl animate-pulse" />
              ))}
            </div>
          ) : detailNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2xl text-center text-outline">
              <span className="material-symbols-outlined text-[48px] mb-md opacity-30">note_stack</span>
              <p className="text-body-lg">{t.emptyNotes}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {detailNotes.map((note) => (
                <div
                  key={note.note_id}
                  className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md flex flex-col gap-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-sm">
                    <h3 className="text-label-lg text-on-surface font-semibold line-clamp-2 flex-1">
                      {note.title || note.filename}
                    </h3>
                    <button
                      onClick={() => handleRemoveNote(note.note_id)}
                      className="shrink-0 p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/15 transition-colors"
                      title={t.removeNote}
                    >
                      <span className="material-symbols-outlined text-[18px]">link_off</span>
                    </button>
                  </div>

                  {note.text_preview && (
                    <p className="text-caption text-on-surface-variant line-clamp-2">{note.text_preview}</p>
                  )}

                  <div className="flex flex-wrap gap-xs mt-auto">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-caption bg-primary-container/10 text-primary px-sm py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.has_formulas && (
                      <span className="material-symbols-outlined text-secondary text-[14px]" title="formulas">functions</span>
                    )}
                    {note.has_diagrams && (
                      <span className="material-symbols-outlined text-secondary text-[14px]" title="diagrams">image</span>
                    )}
                  </div>

                  <p className="text-caption text-outline">{note.date?.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </>
    );
  }

  // --- LIST VIEW ---
  return (
    <>
      <TopBar searchPlaceholder={t.searchPlaceholder} />
      <main className="flex-1 mt-16 p-4 md:p-gutter w-full max-w-container-max mx-auto ml-0 md:ml-64">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-md mb-gutter">
          <div>
            <h2 className="text-headline-lg text-on-background flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-[28px]">menu_book</span>
              {t.title}
            </h2>
            <p className="text-caption text-outline mt-xs">{t.subtitle}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-md py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 transition-all flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t.newBook}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-surface-container-low rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-2xl text-center text-outline">
            <span className="material-symbols-outlined text-[64px] mb-md opacity-30">menu_book</span>
            <p className="text-body-lg">{t.emptyBooks}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {notebooks.map((nb) => (
              <div
                key={nb.id}
                onClick={() => openNotebook(nb)}
                className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md flex flex-col gap-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-sm">
                  <div className="flex items-center gap-sm flex-1 min-w-0">
                    <span className="material-symbols-outlined text-primary text-[24px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      menu_book
                    </span>
                    <h3 className="text-label-lg text-on-surface font-semibold truncate">{nb.name}</h3>
                  </div>
                  <button
                    onClick={(e) => handleDelete(nb, e)}
                    className="shrink-0 p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/15 transition-colors opacity-0 group-hover:opacity-100"
                    title={t.delete}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                {nb.description && (
                  <p className="text-caption text-on-surface-variant line-clamp-2">{nb.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-caption text-outline flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">description</span>
                    {nb.note_count ?? 0} {t.notes}
                  </span>
                  <span className="text-caption text-outline">{nb.created_at?.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant/20 w-full max-w-md p-lg flex flex-col gap-md">
            <h3 className="text-headline-sm text-on-surface">{t.createModalTitle}</h3>

            <div className="flex flex-col gap-sm">
              <input
                autoFocus
                type="text"
                placeholder={t.namePlaceholder}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              />
              <textarea
                placeholder={t.descPlaceholder}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="flex gap-sm justify-end">
              <button
                onClick={() => { setShowModal(false); setNewName(""); setNewDesc(""); }}
                className="px-md py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-label-md hover:bg-surface-container-high transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-md py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-xs"
              >
                {creating ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    {t.creating}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    {t.create}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * NoteCard — compact card for the Library grid.
 * Clicking it opens a detail modal.
 */
import { useState } from "react";
import { Trash2, FlaskConical, Network, ExternalLink } from "lucide-react";
import { getNote, deleteNote, imageUrl } from "../api/client";
import Modal from "./Modal";
import NoteDetailView from "./NoteDetailView";
import Spinner from "./Spinner";
import type { NoteDetail, NoteListItem } from "../types/note";
import { useAppSettings } from "../context/AppSettings";
import { confirmDialog } from "../lib/swal";
import { notify } from "../lib/toast";

const COPY = {
  es: {
    formulas: "Fórmulas",
    diagrams: "Diagramas",
    errorLoad: "Error al cargar la nota.",
    confirmDeleteTitle: "¿Eliminar nota?",
    confirmDeleteText: (title: string) => `Se eliminará "${title}" de forma permanente.`,
    confirmDeleteBtn: "Eliminar",
    cancelBtn: "Cancelar",
    deleteSuccess: "Nota eliminada",
  },
  en: {
    formulas: "Formulas",
    diagrams: "Diagrams",
    errorLoad: "Error loading the note.",
    confirmDeleteTitle: "Delete note?",
    confirmDeleteText: (title: string) => `"${title}" will be permanently deleted.`,
    confirmDeleteBtn: "Delete",
    cancelBtn: "Cancel",
    deleteSuccess: "Note deleted",
  },
} as const;

interface Props {
  note: NoteListItem;
  onDeleted: () => void;
}

export default function NoteCard({ note, onDeleted }: Props) {
  const { lang } = useAppSettings();
  const t = COPY[lang];
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<NoteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function openDetail() {
    setOpen(true);
    if (!detail) {
      setLoadingDetail(true);
      try {
        setDetail(await getNote(note.note_id));
      } finally {
        setLoadingDetail(false);
      }
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: t.confirmDeleteTitle,
      text: t.confirmDeleteText(note.title),
      confirmText: t.confirmDeleteBtn,
      cancelText: t.cancelBtn,
      icon: "warning",
    });
    if (!ok) return;
    setDeleting(true);
    await deleteNote(note.note_id).catch(() => {});
    notify.success(t.deleteSuccess);
    onDeleted();
  }

  const dateStr = note.date ? new Date(note.date).toLocaleDateString("es", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "";

  return (
    <>
      <div
        onClick={openDetail}
        className="group relative bg-surface-container hover:bg-surface-container-high border border-outline-variant hover:border-primary/40 rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
      >
        {/* Thumbnail */}
        {note.image_ext && !imgError ? (
          <img
            src={imageUrl(note.note_id)}
            alt={note.title}
            className="w-full h-36 object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-primary-container/40 to-secondary-container/40 flex flex-col items-center justify-center gap-1 select-none">
            <span className="text-4xl font-bold text-primary/40 leading-none">
              {note.title?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-medium px-3 text-center line-clamp-1">
              {note.title}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-on-surface truncate">{note.title}</h3>
          <p className="text-xs text-on-surface-variant/60 mt-0.5 mb-2">{dateStr} · {note.filename}</p>
          <p className="text-xs text-on-surface-variant line-clamp-2">{note.text_preview}</p>

          {/* Badges */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {note.has_formulas && (
              <Badge icon={<FlaskConical size={10} />} label={t.formulas} color="secondary" />
            )}
            {note.has_diagrams && (
              <Badge icon={<Network size={10} />} label={t.diagrams} color="secondary" />
            )}
            {note.tags?.map((tag) => (
              <Badge key={tag} icon={null} label={tag} color="primary" />
            ))}
            {note.notion_url && (
              <a
                href={note.notion_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded-full border border-outline-variant/50"
              >
                <ExternalLink size={9} /> Notion
              </a>
            )}
            {note.drive_url && (
              <a
                href={note.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded-full border border-outline-variant/50"
              >
                <ExternalLink size={9} /> Drive
              </a>
            )}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-error/80 hover:bg-error text-on-error rounded-full p-1 transition-all"
        >
          {deleting ? <Spinner size={12} /> : <Trash2 size={12} />}
        </button>
      </div>

      {/* Detail modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={note.title} wide>
        {loadingDetail ? (
          <div className="flex justify-center py-10"><Spinner size={28} /></div>
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
        ) : (
          <p className="text-on-surface-variant text-sm">{t.errorLoad}</p>
        )}
      </Modal>
    </>
  );
}

function Badge({
  icon,
  label,
  color = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  color?: "primary" | "secondary";
}) {
  const cls = color === "primary"
    ? "bg-primary-container/20 text-primary"
    : "bg-secondary-container/30 text-secondary";

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${cls}`}>
      {icon} {label}
    </span>
  );
}

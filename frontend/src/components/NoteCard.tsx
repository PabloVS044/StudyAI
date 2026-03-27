/**
 * NoteCard — compact card for the Library grid.
 * Clicking it opens a detail modal.
 */
import { useState } from "react";
import { Trash2, FileText, FlaskConical, Network, ExternalLink } from "lucide-react";
import { getNote, deleteNote, imageUrl } from "../api/client";
import Modal from "./Modal";
import NoteDetailView from "./NoteDetailView";
import Spinner from "./Spinner";
import type { NoteDetail, NoteListItem } from "../types/note";

interface Props {
  note: NoteListItem;
  onDeleted: () => void;
}

export default function NoteCard({ note, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<NoteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (!confirm(`¿Eliminar "${note.title}"?`)) return;
    setDeleting(true);
    await deleteNote(note.note_id).catch(() => {});
    onDeleted();
  }

  const dateStr = note.date ? new Date(note.date).toLocaleDateString("es", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "";

  return (
    <>
      <div
        onClick={openDetail}
        className="group relative bg-[#17171f] hover:bg-[#1e1e28] border border-slate-700 hover:border-violet-500/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
      >
        {/* Thumbnail */}
        {note.image_ext ? (
          <img
            src={imageUrl(note.note_id)}
            alt={note.title}
            className="w-full h-36 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-36 bg-slate-800 flex items-center justify-center">
            <FileText className="text-slate-600" size={32} />
          </div>
        )}

        {/* Body */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-white truncate">{note.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">{dateStr} · {note.filename}</p>
          <p className="text-xs text-slate-400 line-clamp-2">{note.text_preview}</p>

          {/* Badges */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {note.has_formulas && (
              <Badge icon={<FlaskConical size={10} />} label="Fórmulas" />
            )}
            {note.has_diagrams && (
              <Badge icon={<Network size={10} />} label="Diagramas" />
            )}
            {note.notion_url && (
              <a
                href={note.notion_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full"
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
                className="inline-flex items-center gap-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full"
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
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 transition-all"
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
          <p className="text-slate-400 text-sm">Error al cargar la nota.</p>
        )}
      </Modal>
    </>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-violet-900/30 text-violet-300 px-1.5 py-0.5 rounded-full">
      {icon} {label}
    </span>
  );
}

/**
 * NoteDetailView — renders the full content of an extracted/saved note.
 * Used both in UploadPage (fresh extraction) and in the Library modal.
 */
import { imageUrl, saveNote } from "../api/client";
import FormulaBlock from "./FormulaBlock";
import IntegrationPanel from "./IntegrationPanel";
import type { NoteContent } from "../types/note";

interface Props {
  noteId: string;
  filename: string;
  imageExt?: string;
  content: NoteContent;
  error?: string;
  saved?: boolean;
  notionUrl?: string;
  driveUrl?: string;
  /** If provided, show save button; called after a successful save */
  onSaved?: () => void;
}

export default function NoteDetailView({
  noteId,
  filename,
  imageExt,
  content,
  error,
  saved = false,
  notionUrl,
  driveUrl,
  onSaved,
}: Props) {
  async function handleSave() {
    await saveNote({ note_id: noteId, filename, image_ext: imageExt, content });
    onSaved?.();
  }

  return (
    <div className="space-y-0">
      {/* Header: image + title */}
      <div className="flex items-start gap-4 mb-5">
        {imageExt && (
          <img
            src={imageUrl(noteId)}
            alt={filename}
            className="w-20 h-20 object-cover rounded-lg border border-slate-700 shrink-0"
            loading="lazy"
          />
        )}
        <div className="min-w-0">
          <h2 className="font-semibold text-white text-lg leading-tight">
            {content?.titulo || filename}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{filename}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {content && (
        <div className="space-y-5">
          {/* Texto principal */}
          {content.texto_principal && (
            <Section label="Texto Principal" icon="📝">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {content.texto_principal}
              </p>
            </Section>
          )}

          {/* Fórmulas */}
          {content.formulas?.length > 0 && (
            <Section label="Fórmulas" icon="∑">
              {content.formulas.map((f, i) => (
                <FormulaBlock
                  key={i}
                  description={f.descripcion}
                  latex={f.latex}
                  plainText={f.texto_plano}
                />
              ))}
            </Section>
          )}

          {/* Definiciones */}
          {content.definiciones?.length > 0 && (
            <Section label="Definiciones" icon="📖">
              <div className="divide-y divide-slate-700/50">
                {content.definiciones.map((d, i) => (
                  <div key={i} className="py-2 first:pt-0 last:pb-0">
                    <span className="text-sm font-semibold text-teal-400">{d.termino}</span>
                    <p className="text-sm text-slate-300 mt-0.5">{d.definicion}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Listas */}
          {content.listas?.length > 0 && (
            <Section label="Listas" icon="📋">
              {content.listas.map((lista, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  {lista.tipo === "numerada" ? (
                    <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1 pl-1">
                      {lista.items.map((item, j) => <li key={j}>{item}</li>)}
                    </ol>
                  ) : (
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 pl-1">
                      {lista.items.map((item, j) => <li key={j}>{item}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Diagramas */}
          {content.diagramas_figuras?.length > 0 && (
            <Section label="Diagramas y Figuras" icon="🖼">
              {content.diagramas_figuras.map((d, i) => (
                <div key={i} className="callout-info rounded-lg px-4 py-3 mb-2 last:mb-0 text-sm text-slate-300 leading-relaxed">
                  🖼 {d.descripcion}
                </div>
              ))}
            </Section>
          )}

          {/* Observaciones */}
          {content.observaciones && (
            <Section label="Observaciones" icon="💡">
              <div className="callout-note rounded-lg px-4 py-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {content.observaciones}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Integrations */}
      <IntegrationPanel
        noteId={noteId}
        filename={filename}
        imageExt={imageExt}
        content={content}
        saved={saved}
        notionUrl={notionUrl}
        driveUrl={driveUrl}
        onSave={!saved && onSaved ? handleSave : undefined}
      />
    </div>
  );
}

function Section({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">{icon} {label}</span>
        <div className="flex-1 h-px bg-slate-700/60" />
      </div>
      {children}
    </div>
  );
}

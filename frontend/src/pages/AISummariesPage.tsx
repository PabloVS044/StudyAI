import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import { listNotes, generateSummary } from "../api/client";
import type { NoteListItem, SummaryResponse } from "../types/note";
import { useAppSettings } from "../context/AppSettings";

const COPY = {
  es: {
    searchPlaceholder: "Buscar resumenes...",
    filterPlaceholder: "Filtrar notas...",
    notesTitle: "Notas",
    loadingNotes: "Cargando notas...",
    emptyNotes: "No hay notas disponibles.",
    selectNote: "Selecciona una nota",
    regenAriaLabel: "Regenerar resumen",
    emptyState: "Selecciona una nota para ver su resumen.",
    noSummary: "Esta nota no tiene resumen todavia.\nGenera uno con el boton de abajo.",
    generating: "Generando resumen...",
    keyConcepts: "Conceptos clave",
    btnGenerating: "Generando...",
    btnRegenerate: "Regenerar",
    btnGenerate: "Generar resumen",
    errorLoadNotes: "No se pudieron cargar las notas.",
    errorGenerate: "Error al generar resumen.",
  },
  en: {
    searchPlaceholder: "Search summaries...",
    filterPlaceholder: "Filter notes...",
    notesTitle: "Notes",
    loadingNotes: "Loading notes...",
    emptyNotes: "No notes available.",
    selectNote: "Select a note",
    regenAriaLabel: "Regenerate summary",
    emptyState: "Select a note to view its summary.",
    noSummary: "This note has no summary yet.\nGenerate one with the button below.",
    generating: "Generating summary...",
    keyConcepts: "Key concepts",
    btnGenerating: "Generating...",
    btnRegenerate: "Regenerate",
    btnGenerate: "Generate summary",
    errorLoadNotes: "Could not load notes.",
    errorGenerate: "Error generating summary.",
  },
} as const;

// Simple markdown renderer: handles #/##/### headings, **bold**, bullet lists, blank-line paragraphs
function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  function inlineFormat(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : p
    );
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^### /.test(line)) {
      nodes.push(
        <h3 key={key++} className="text-body-lg font-semibold text-on-surface mt-6 mb-2">
          {inlineFormat(line.slice(4))}
        </h3>
      );
      i++;
    } else if (/^## /.test(line)) {
      nodes.push(
        <h2 key={key++} className="text-headline-lg text-on-surface mt-10 mb-4 pb-2 border-b border-outline-variant/20">
          {inlineFormat(line.slice(3))}
        </h2>
      );
      i++;
    } else if (/^# /.test(line)) {
      nodes.push(
        <h1 key={key++} className="text-display-md text-on-surface mt-8 mb-4">
          {inlineFormat(line.slice(2))}
        </h1>
      );
      i++;
    } else if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-disc pl-6 mb-4 text-body-md text-on-surface-variant space-y-1 marker:text-primary/50">
          {items.map((it, j) => <li key={j}>{inlineFormat(it)}</li>)}
        </ul>
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !/^#{1,3} /.test(lines[i]) && !/^[-*] /.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      nodes.push(
        <p key={key++} className="text-body-md mb-4 text-on-surface-variant">
          {inlineFormat(para.join(" "))}
        </p>
      );
    }
  }

  return nodes;
}

export default function AISummariesPage() {
  const { lang } = useAppSettings();
  const t = COPY[lang];

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<NoteListItem | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);

  useEffect(() => {
    listNotes()
      .then((data) => {
        setNotes(data);
        if (data.length > 0) setSelectedNote(data[0]);
      })
      .catch(() => setError(t.errorLoadNotes))
      .finally(() => setNotesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectNote = (note: NoteListItem) => {
    setSelectedNote(note);
    setSummary(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedNote) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generateSummary({ note_ids: [selectedNote.note_id], style: "detailed" });
      setSummary(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.errorGenerate);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <TopBar searchPlaceholder={t.searchPlaceholder} />
      <main className="flex-1 mt-16 ml-0 md:ml-64 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Pane: Notes List */}
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col bg-surface overflow-hidden shrink-0 max-h-[40vh] md:max-h-none">
          <div className="p-md flex flex-col gap-3 border-b border-outline-variant/30">
            <h2 className="text-headline-md text-primary">{t.notesTitle}</h2>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 focus-within:border-primary/50 transition-colors">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60 shrink-0">search</span>
              <input
                type="text"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                placeholder={t.filterPlaceholder}
                className="flex-1 bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none min-w-0"
              />
              {noteSearch && (
                <button
                  onClick={() => setNoteSearch("")}
                  className="text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                  aria-label="Clear filter"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-2 custom-scrollbar">
            {notesLoading && (
              <div className="flex items-center gap-2 p-4 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {t.loadingNotes}
              </div>
            )}
            {!notesLoading && notes.length === 0 && (
              <p className="p-4 text-body-md text-on-surface-variant">{t.emptyNotes}</p>
            )}
            {notes.filter((n) => n.title.toLowerCase().includes(noteSearch.toLowerCase())).map((note) => {
              const isActive = selectedNote?.note_id === note.note_id;
              return (
                <div
                  key={note.note_id}
                  onClick={() => handleSelectNote(note)}
                  className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? "bg-surface-container-highest shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-primary/10 relative overflow-hidden"
                      : "bg-surface hover:bg-surface-container-low border-transparent hover:border-outline-variant/30"
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-caption px-2 py-0.5 rounded text-xs text-primary bg-primary/10 truncate max-w-[70%]">
                      {note.filename}
                    </span>
                    <span className="text-caption text-on-surface-variant/70 text-xs shrink-0 ml-1">{note.date}</span>
                  </div>
                  <h3 className="text-body-lg text-on-surface font-semibold mb-1 leading-tight line-clamp-1">{note.title}</h3>
                  <p className="text-body-md text-on-surface-variant line-clamp-2 text-sm">{note.text_preview}</p>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden relative min-h-0">
          <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-4 md:px-lg bg-surface-container-lowest/90 backdrop-blur z-10">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant min-w-0">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="font-medium text-caption">
                {selectedNote ? selectedNote.title : t.selectNote}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={!selectedNote || generating}
                className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-40"
                aria-label={t.regenAriaLabel}
              >
                <span className={`material-symbols-outlined text-[20px] ${generating ? "animate-spin" : ""}`}>sync</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-lg lg:px-xl py-lg pb-32 scroll-smooth custom-scrollbar">
            <article className="max-w-3xl mx-auto">
              {/* Note title header */}
              {selectedNote && (
                <header className="mb-lg">
                  <h1 className="text-display-lg text-on-surface mb-4 leading-tight">{selectedNote.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-body-md text-on-surface-variant">
                    <span className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[16px]">description</span>
                      {selectedNote.filename}
                    </span>
                    <span className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {selectedNote.date}
                    </span>
                  </div>
                </header>
              )}

              {/* Empty state: no note selected */}
              {!selectedNote && !notesLoading && (
                <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant gap-4">
                  <span className="material-symbols-outlined text-[48px] opacity-30">summarize</span>
                  <p className="text-body-lg">{t.emptyState}</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-error/10 border border-error/20 text-error rounded-xl px-5 py-4 mb-6 text-body-md">
                  {error}
                </div>
              )}

              {/* No summary yet */}
              {selectedNote && !generating && !summary && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-6">
                  <span className="material-symbols-outlined text-[48px] opacity-30">auto_awesome</span>
                  <p className="text-body-lg text-center">{t.noSummary.split("\n").map((line, i) => i === 0 ? line : <><br key={i} />{line}</>)}</p>
                </div>
              )}

              {/* Generating spinner */}
              {generating && (
                <div className="flex items-center gap-3 py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                  <span className="text-body-lg">{t.generating}</span>
                </div>
              )}

              {/* Summary content */}
              {summary && !generating && (
                <div>
                  {/* Summary title from API */}
                  {summary.title && (
                    <h2 className="text-headline-lg text-on-surface mb-4 pb-2 border-b border-outline-variant/20">
                      {summary.title}
                    </h2>
                  )}

                  {/* Summary body */}
                  <div className="prose prose-lg max-w-none mb-8">
                    {renderMarkdown(summary.summary)}
                  </div>

                  {/* Key concepts */}
                  {summary.key_concepts && summary.key_concepts.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-body-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-primary">label</span>
                        {t.keyConcepts}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {summary.key_concepts.map((concept, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          </div>

          {/* Floating Action Bar */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-surface-bright/90 backdrop-blur-xl border border-outline-variant/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-2 py-2 flex items-center gap-1 z-20">
            <button
              onClick={handleGenerate}
              disabled={!selectedNote || generating}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-on-surface hover:bg-surface-container transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[20px] text-primary ${generating ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}>
                {generating ? "progress_activity" : "sync"}
              </span>
              <span className="text-label-md">{generating ? t.btnGenerating : summary ? t.btnRegenerate : t.btnGenerate}</span>
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

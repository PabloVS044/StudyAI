import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import Spinner from "../components/Spinner";
import {
  generateSummary,
  listSummaryNotes,
  type SummaryNoteItem,
  type SummaryResponse,
} from "../api/client";

type SummaryStyle = "brief" | "detailed" | "bullet_points";

const styleOptions: Array<{ value: SummaryStyle; label: string; icon: string }> = [
  { value: "brief", label: "Breve", icon: "compress" },
  { value: "detailed", label: "Detallado", icon: "expand_content" },
  { value: "bullet_points", label: "Puntos clave", icon: "format_list_bulleted" },
];

function formatDate(date?: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AISummariesPage() {
  const [availableNotes, setAvailableNotes] = useState<SummaryNoteItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [style, setStyle] = useState<SummaryStyle>("detailed");
  const [generating, setGenerating] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    listSummaryNotes()
      .then(setAvailableNotes)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar las notas"))
      .finally(() => setLoadingNotes(false));
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(availableNotes.flatMap((note) => note.tags ?? []))).sort(),
    [availableNotes],
  );

  const filteredNotes = activeTag
    ? availableNotes.filter((note) => (note.tags ?? []).includes(activeTag))
    : availableNotes;

  function toggleNote(noteId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  async function handleGenerate(nextStyle = style) {
    if (selectedIds.size === 0) {
      setError("Selecciona al menos una nota para generar un resumen.");
      return;
    }

    setStyle(nextStyle);
    setGenerating(true);
    setError("");
    try {
      const result = await generateSummary({
        note_ids: Array.from(selectedIds),
        style: nextStyle,
        language: "es",
      });
      setCurrentSummary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando resumen");
    } finally {
      setGenerating(false);
    }
  }

  const selectedNotes = availableNotes.filter((note) => selectedIds.has(note.note_id));
  const selectedStyleLabel = styleOptions.find((option) => option.value === style)?.label ?? "Detallado";

  return (
    <>
      <TopBar searchPlaceholder="Search summaries..." />
      <main className="flex-1 mt-16 ml-0 md:ml-64 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col bg-surface overflow-hidden shrink-0 max-h-[48vh] md:max-h-none">
          <div className="p-md flex flex-col gap-4 border-b border-outline-variant/30">
            <div>
              <h2 className="text-headline-md text-primary">AI Summaries</h2>
              <p className="text-caption text-on-surface-variant mt-1">
                Selecciona varias notas y deja que la IA las convierta en un resumen.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {styleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStyle(option.value)}
                  className={`min-h-16 rounded-lg border px-2 py-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                    style === option.value
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                  <span className="text-caption text-center leading-tight">{option.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-3 py-1 rounded-full text-label-md whitespace-nowrap transition-colors ${
                  activeTag === null
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1 rounded-full text-label-md whitespace-nowrap transition-colors ${
                    activeTag === tag
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={selectedIds.size === 0 || generating}
              className="w-full rounded-lg bg-primary text-on-primary py-sm px-md flex items-center justify-center gap-xs hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <Spinner size={16} />
              ) : (
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              )}
              <span className="text-label-md">Generar Resumen ({selectedIds.size})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-2 custom-scrollbar">
            {loadingNotes && (
              <div className="flex justify-center py-10">
                <Spinner size={24} />
              </div>
            )}

            {!loadingNotes && availableNotes.length === 0 && (
              <div className="text-center py-10 px-4">
                <span className="material-symbols-outlined text-[40px] text-outline mb-2">note_stack</span>
                <p className="text-body-md text-on-surface font-semibold">No hay notas guardadas.</p>
                <Link to="/upload" className="text-primary text-label-md hover:underline mt-2 inline-block">
                  Subir apuntes
                </Link>
              </div>
            )}

            {!loadingNotes && filteredNotes.map((note) => {
              const checked = selectedIds.has(note.note_id);
              return (
                <label
                  key={note.note_id}
                  className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border flex gap-3 ${
                    checked
                      ? "bg-surface-container-highest shadow-sm border-primary/20 relative overflow-hidden"
                      : "bg-surface hover:bg-surface-container-low border-transparent hover:border-outline-variant/30"
                  }`}
                >
                  {checked && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleNote(note.note_id)}
                    className="mt-1 h-4 w-4 accent-primary shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-caption text-on-surface-variant/70 shrink-0">{formatDate(note.date)}</span>
                    </div>
                    <h3 className="text-body-lg text-on-surface font-semibold mb-1 leading-tight line-clamp-2">
                      {note.title}
                    </h3>
                    <p className="text-body-md text-on-surface-variant line-clamp-1 text-sm">{note.filename}</p>
                    {(note.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-caption px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden relative min-h-0">
          <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-lg bg-surface-container-lowest/90 backdrop-blur z-10">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant min-w-0">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="font-medium text-caption truncate">
                {currentSummary ? `AI Generated - ${selectedStyleLabel}` : `${selectedIds.size} nota${selectedIds.size === 1 ? "" : "s"} seleccionada${selectedIds.size === 1 ? "" : "s"}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerate()}
                disabled={selectedIds.size === 0 || generating}
                className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-40"
                aria-label="Regenerar resumen"
              >
                <span className={`material-symbols-outlined text-[20px] ${generating ? "animate-spin" : ""}`}>sync</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-lg lg:px-xl py-lg pb-32 scroll-smooth custom-scrollbar">
            <article className="max-w-3xl mx-auto">
              {error && (
                <div className="bg-error-container/70 border border-error/20 text-on-error-container px-4 py-3 rounded-lg mb-lg">
                  {error}
                </div>
              )}

              {!currentSummary && !generating && (
                <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-[56px] text-primary mb-4">summarize</span>
                  <h1 className="text-headline-lg text-on-surface mb-3">Crea un resumen con tus notas</h1>
                  <p className="text-body-md text-on-surface-variant max-w-xl">
                    Selecciona una o varias notas de la biblioteca, elige el estilo y genera una version estudiable con conceptos clave.
                  </p>
                </div>
              )}

              {generating && (
                <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
                  <Spinner size={32} />
                  <h1 className="text-headline-md text-on-surface mt-4">Generando resumen</h1>
                  <p className="text-body-md text-on-surface-variant mt-1">Analizando {selectedIds.size} nota{selectedIds.size === 1 ? "" : "s"} seleccionada{selectedIds.size === 1 ? "" : "s"}.</p>
                </div>
              )}

              {currentSummary && !generating && (
                <>
                  <header className="mb-lg">
                    <h1 className="text-display-lg text-on-surface mb-4 leading-tight">{currentSummary.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-body-md text-on-surface-variant">
                      <span className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[16px]">description</span>
                        {selectedNotes.length} nota{selectedNotes.length === 1 ? "" : "s"}
                      </span>
                      <span className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[16px]">tune</span>
                        {selectedStyleLabel}
                      </span>
                    </div>
                  </header>

                  {currentSummary.key_concepts.length > 0 && (
                    <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-xl mb-8">
                      <h3 className="text-headline-md text-primary mt-0 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined">lightbulb</span> Conceptos clave
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentSummary.key_concepts.map((concept) => (
                          <span key={concept} className="bg-surface-container-lowest border border-primary/20 text-primary px-3 py-1 rounded-full text-label-md">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="prose prose-lg max-w-none">
                    <h2 className="text-headline-lg text-on-surface mt-10 mb-4 pb-2 border-b border-outline-variant/20">
                      Resumen
                    </h2>
                    <p className="text-body-md mb-4 text-on-surface-variant whitespace-pre-wrap">
                      {currentSummary.summary}
                    </p>
                  </div>
                </>
              )}
            </article>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-bright/90 backdrop-blur-xl border border-outline-variant/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-2 py-2 flex items-center gap-1 z-20 max-w-[calc(100vw-2rem)] md:max-w-none overflow-x-auto">
            <button
              onClick={() => handleGenerate(style)}
              disabled={selectedIds.size === 0 || generating}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
            >
              <span className={`material-symbols-outlined text-[20px] text-primary ${generating ? "animate-spin" : ""}`}>sync</span>
              <span className="text-label-md">Regenerate</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/30 mx-1" />
            {styleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => currentSummary ? handleGenerate(option.value) : setStyle(option.value)}
                disabled={generating}
                className={`flex items-center gap-2 px-4 py-2 rounded-full hover:bg-surface-container transition-colors disabled:opacity-40 ${
                  style === option.value ? "text-primary" : "text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">{option.icon}</span>
                <span className="text-label-md">{option.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

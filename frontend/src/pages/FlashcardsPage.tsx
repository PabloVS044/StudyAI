import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { listNotes, generateFlashcards } from "../api/client";
import type { NoteListItem, Flashcard } from "../types/note";

type Phase = "idle" | "loading" | "ready" | "error";

export default function FlashcardsPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errMsg, setErrMsg] = useState("");

  // current card index & flip state
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    listNotes()
      .then(setNotes)
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, []);

  async function handleGenerate() {
    if (!selectedId) return;
    setPhase("loading");
    setFlipped(false);
    setCardIndex(0);
    setErrMsg("");
    try {
      const result = await generateFlashcards(selectedId);
      setFlashcards(result.flashcards);
      setPhase("ready");
    } catch (e) {
      setFlashcards([]);
      setPhase("error");
      setErrMsg(e instanceof Error ? e.message : "Error al generar flashcards.");
    }
  }

  const total = flashcards.length;
  const progressPercent = total > 0 ? ((cardIndex + 1) / total) * 100 : 0;
  const current = flashcards[cardIndex] ?? null;

  function prev() {
    setFlipped(false);
    setCardIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setFlipped(false);
    setCardIndex((i) => Math.min(total - 1, i + 1));
  }

  return (
    <>
      <TopBar searchPlaceholder="Search decks, tags, or concepts..." />
      <main className="flex-1 mt-16 p-gutter w-full max-w-container-max mx-auto ml-0 md:ml-64">

        {/* Header & note selector */}
        <div className="mb-md flex flex-col sm:flex-row sm:justify-between sm:items-end gap-md">
          <div>
            <h2 className="text-headline-lg text-on-background flex items-center gap-sm">
              Flashcards
              <span className="bg-primary-container/10 text-primary text-caption px-sm py-xs rounded-full inline-flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
                Estudio activo
              </span>
            </h2>
            <p className="text-caption text-outline mt-xs">Selecciona una nota y genera tus flashcards.</p>
          </div>
          {phase === "ready" && total > 0 && (
            <div className="text-right">
              <p className="text-caption text-outline mb-xs">Progreso</p>
              <p className="text-label-md text-on-surface-variant">Tarjeta {cardIndex + 1} de {total}</p>
            </div>
          )}
        </div>

        {/* Note selector panel */}
        <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md mb-gutter flex flex-col sm:flex-row gap-md items-end">
          <div className="flex-1">
            <label className="block text-label-md text-on-surface mb-xs">Nota</label>
            {notesLoading ? (
              <div className="h-10 bg-surface-container-low rounded-lg animate-pulse" />
            ) : (
              <select
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setPhase("idle"); setFlashcards([]); }}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">-- Elige una nota --</option>
                {notes.map((n) => (
                  <option key={n.note_id} value={n.note_id}>{n.title || n.filename}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-sm">
            <button
              onClick={handleGenerate}
              disabled={!selectedId || phase === "loading"}
              className="px-md py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-xs"
            >
              {phase === "loading" ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Generando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Generar
                </>
              )}
            </button>
          </div>
        </div>

        {/* States */}
        {phase === "idle" && (
          <div className="flex flex-col items-center justify-center py-2xl text-center text-outline">
            <span className="material-symbols-outlined text-[48px] mb-md opacity-30">style</span>
            <p className="text-body-lg">Selecciona una nota y pulsa "Generar".</p>
          </div>
        )}

        {phase === "error" && (
          <div className="bg-error-container/20 border border-error-container/40 rounded-xl p-md text-center text-on-error-container">
            <span className="material-symbols-outlined text-[32px] mb-sm block">error</span>
            <p className="text-body-md">{errMsg}</p>
            <button onClick={handleGenerate} className="mt-md px-md py-sm rounded-lg bg-primary text-on-primary text-label-md hover:opacity-90 transition-all inline-flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Generar de todas formas
            </button>
          </div>
        )}

        {phase === "ready" && total === 0 && (
          <div className="flex flex-col items-center justify-center py-2xl text-center text-outline">
            <span className="material-symbols-outlined text-[48px] mb-md opacity-30">inbox</span>
            <p className="text-body-lg">No se generaron flashcards para esta nota.</p>
          </div>
        )}

        {phase === "ready" && total > 0 && current && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Main Stage: Active Card (8 cols) */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-[0_4px_24px_-4px_rgba(21,69,57,0.05)] flex-1 min-h-[500px] flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(21,69,57,0.08)]">
                {/* Top Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-high">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>

                {/* Card Content */}
                <div
                  className="p-xl flex-1 flex flex-col justify-center items-center text-center cursor-pointer select-none"
                  onClick={() => setFlipped((f) => !f)}
                >
                  {!flipped ? (
                    <div className="mb-lg w-full">
                      <span className="text-caption text-outline tracking-wider uppercase mb-md block">Pregunta</span>
                      <h3 className="text-headline-md text-on-surface max-w-2xl mx-auto leading-snug">
                        {current.pregunta}
                      </h3>
                      <p className="text-caption text-outline mt-lg opacity-60">Toca para ver la respuesta</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-lg w-full">
                        <span className="text-caption text-outline tracking-wider uppercase mb-md block">Pregunta</span>
                        <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">{current.pregunta}</p>
                      </div>

                      {/* Divider */}
                      <div className="w-full h-px bg-outline-variant/30 my-lg relative">
                        <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-surface px-sm text-caption text-outline">Respuesta</div>
                      </div>

                      {/* Answer */}
                      <div className="w-full max-w-2xl mx-auto bg-surface-container-low p-md rounded-lg border border-outline-variant/10 text-left">
                        <p className="text-body-lg text-on-surface-variant">{current.respuesta}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Navigation */}
                <div className="bg-surface-container-lowest border-t border-outline-variant/20 p-md flex justify-between items-center gap-md">
                  <button
                    onClick={prev}
                    disabled={cardIndex === 0}
                    className="flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 transition-colors text-label-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Anterior
                  </button>

                  <button
                    onClick={() => setFlipped((f) => !f)}
                    className="flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors text-label-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">flip</span>
                    {flipped ? "Ver pregunta" : "Ver respuesta"}
                  </button>

                  <button
                    onClick={next}
                    disabled={cardIndex === total - 1}
                    className="flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary shadow-sm hover:opacity-90 disabled:opacity-30 transition-all text-label-md"
                  >
                    Siguiente
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              <div className="mt-md text-center">
                <button
                  onClick={handleGenerate}
                  className="text-label-md text-outline hover:text-primary flex items-center gap-xs mx-auto transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Regenerar flashcards
                </button>
              </div>
            </div>

            {/* Right Side: Card list (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-gutter">
              {/* Stats bento */}
              <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md">
                <h3 className="text-label-md text-on-surface mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary">monitoring</span>
                  Sesion actual
                </h3>
                <div className="mb-lg">
                  <div className="flex justify-between text-caption text-outline mb-xs">
                    <span>Progreso</span>
                    <span className="text-primary font-bold">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-sm">
                  <div className="bg-primary-container/5 rounded-lg p-sm text-center border border-primary-container/10">
                    <span className="block text-headline-md text-primary">{cardIndex + 1}</span>
                    <span className="text-caption text-outline">Actual</span>
                  </div>
                  <div className="bg-surface-container rounded-lg p-sm text-center border border-outline-variant/20">
                    <span className="block text-headline-md text-secondary">{total}</span>
                    <span className="text-caption text-outline">Total</span>
                  </div>
                </div>
              </div>

              {/* Card list */}
              <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm flex-1 p-md flex flex-col">
                <h3 className="text-label-md text-on-surface mb-md">Todas las tarjetas</h3>
                <div className="flex-1 space-y-xs overflow-y-auto pr-sm custom-scrollbar max-h-[340px]">
                  {flashcards.map((fc, i) => (
                    <button
                      key={i}
                      onClick={() => { setCardIndex(i); setFlipped(false); }}
                      className={`w-full text-left block p-sm rounded-lg border transition-all group ${
                        i === cardIndex
                          ? "border-primary bg-primary-container/10 text-primary"
                          : "border-outline-variant/20 hover:bg-surface-container-low hover:border-outline-variant/50 text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-sm">
                        <span className={`text-caption font-bold w-5 shrink-0 ${i === cardIndex ? "text-primary" : "text-outline"}`}>
                          {i + 1}
                        </span>
                        <p className="text-caption line-clamp-2 flex-1">{fc.pregunta}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

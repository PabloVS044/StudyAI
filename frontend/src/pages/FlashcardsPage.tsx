import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { listNotes, generateFlashcards } from "../api/client";
import type { NoteListItem, Flashcard } from "../types/note";
import { useAppSettings } from "../context/AppSettings";

type Phase = "idle" | "loading" | "ready" | "error";

const COPY = {
  es: {
    searchPlaceholder: "Buscar flashcards...",
    notesTitle: "Notas",
    loadingNotes: "Cargando notas...",
    emptyNotes: "No hay notas disponibles.",
    selectNote: "Selecciona una nota",
    filterPlaceholder: "Filtrar notas...",
    countLabel: "Cantidad",
    generating: "Generando...",
    generate: "Generar flashcards",
    regenerate: "Regenerar",
    idleMsg: "Selecciona una nota y pulsa Generar.",
    emptyMsg: "No se generaron flashcards para esta nota.",
    question: "Pregunta",
    tapToFlip: "Toca para ver la respuesta",
    answer: "Respuesta",
    prev: "Anterior",
    flipToQ: "Ver pregunta",
    flipToA: "Ver respuesta",
    next: "Siguiente",
    progress: "Progreso",
    card: "Tarjeta",
    of: "de",
    allCards: "Todas las tarjetas",
    errorDefault: "Error al generar flashcards.",
    errorLoadNotes: "No se pudieron cargar las notas.",
  },
  en: {
    searchPlaceholder: "Search flashcards...",
    notesTitle: "Notes",
    loadingNotes: "Loading notes...",
    emptyNotes: "No notes available.",
    selectNote: "Select a note",
    filterPlaceholder: "Filter notes...",
    countLabel: "Count",
    generating: "Generating...",
    generate: "Generate flashcards",
    regenerate: "Regenerate",
    idleMsg: 'Select a note and click Generate.',
    emptyMsg: "No flashcards were generated for this note.",
    question: "Question",
    tapToFlip: "Tap to see the answer",
    answer: "Answer",
    prev: "Previous",
    flipToQ: "See question",
    flipToA: "See answer",
    next: "Next",
    progress: "Progress",
    card: "Card",
    of: "of",
    allCards: "All cards",
    errorDefault: "Error generating flashcards.",
    errorLoadNotes: "Could not load notes.",
  },
} as const;

const COUNT_OPTIONS = [5, 10, 15, 20];

export default function FlashcardsPage() {
  const { lang } = useAppSettings();
  const t = COPY[lang];

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<NoteListItem | null>(null);

  const [count, setCount] = useState(10);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errMsg, setErrMsg] = useState("");

  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    listNotes()
      .then((data) => {
        setNotes(data);
        if (data.length > 0) setSelectedNote(data[0]);
      })
      .catch(() => setNotesError(t.errorLoadNotes))
      .finally(() => setNotesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectNote = (note: NoteListItem) => {
    setSelectedNote(note);
    setFlashcards([]);
    setPhase("idle");
    setErrMsg("");
    setCardIndex(0);
    setFlipped(false);
  };

  async function handleGenerate() {
    if (!selectedNote) return;
    setPhase("loading");
    setFlipped(false);
    setCardIndex(0);
    setErrMsg("");
    try {
      const result = await generateFlashcards(selectedNote.note_id, count);
      setFlashcards(result.flashcards);
      setPhase("ready");
    } catch (e) {
      setFlashcards([]);
      setPhase("error");
      setErrMsg(e instanceof Error ? e.message : t.errorDefault);
    }
  }

  const filteredNotes = filterQuery.trim()
    ? notes.filter((n) =>
        (n.title || n.filename).toLowerCase().includes(filterQuery.toLowerCase())
      )
    : notes;

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
      <TopBar searchPlaceholder={t.searchPlaceholder} />
      <main className="flex-1 mt-16 ml-0 md:ml-64 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">

        {/* Left Pane: Notes List */}
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col bg-surface overflow-hidden shrink-0 max-h-[40vh] md:max-h-none">
          <div className="p-4 flex flex-col gap-3 border-b border-outline-variant/30">
            <h2 className="text-headline-md text-primary">{t.notesTitle}</h2>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/60">
                search
              </span>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={t.filterPlaceholder}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg pl-9 pr-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
            {notesLoading && (
              <div className="flex items-center gap-2 p-4 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {t.loadingNotes}
              </div>
            )}
            {notesError && (
              <p className="p-4 text-body-md text-error">{notesError}</p>
            )}
            {!notesLoading && !notesError && filteredNotes.length === 0 && (
              <p className="p-4 text-body-md text-on-surface-variant">{t.emptyNotes}</p>
            )}
            {filteredNotes.map((note) => {
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

        {/* Right Pane: Generation & Flashcard Viewer */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden relative min-h-0">
          {/* Top bar */}
          <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-4 md:px-6 bg-surface-container-lowest/90 backdrop-blur z-10 shrink-0">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant min-w-0">
              <span className="material-symbols-outlined text-[18px]">style</span>
              <span className="font-medium text-caption truncate">
                {selectedNote ? selectedNote.title : t.selectNote}
              </span>
            </div>
            {phase === "ready" && total > 0 && (
              <span className="text-caption text-on-surface-variant shrink-0 ml-2">
                {t.card} {cardIndex + 1} {t.of} {total}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 pb-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto flex flex-col gap-6">

              {/* Controls: count selector + generate button */}
              <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                <div className="flex-1">
                  <label className="block text-label-md text-on-surface-variant mb-2">{t.countLabel}</label>
                  <div className="flex gap-2 flex-wrap">
                    {COUNT_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        className={`px-4 py-2 rounded-lg text-label-md border transition-colors ${
                          count === n
                            ? "bg-primary text-on-primary border-primary"
                            : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedNote || phase === "loading"}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 justify-center shrink-0"
                >
                  {phase === "loading" ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      {t.generating}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      {phase === "ready" ? t.regenerate : t.generate}
                    </>
                  )}
                </button>
              </div>

              {/* Idle state */}
              {phase === "idle" && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant gap-4">
                  <span className="material-symbols-outlined text-[48px] opacity-30">style</span>
                  <p className="text-body-lg">{t.idleMsg}</p>
                </div>
              )}

              {/* Error state */}
              {phase === "error" && (
                <div className="bg-error/10 border border-error/20 text-error rounded-xl px-5 py-4 text-center">
                  <span className="material-symbols-outlined text-[32px] mb-2 block">error</span>
                  <p className="text-body-md">{errMsg}</p>
                </div>
              )}

              {/* Empty result */}
              {phase === "ready" && total === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant gap-4">
                  <span className="material-symbols-outlined text-[48px] opacity-30">inbox</span>
                  <p className="text-body-lg">{t.emptyMsg}</p>
                </div>
              )}

              {/* Flashcard viewer */}
              {phase === "ready" && total > 0 && current && (
                <div className="flex flex-col gap-4">
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Flippable card */}
                  <div
                    className="bg-surface rounded-xl border border-outline-variant/20 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] min-h-[280px] md:min-h-[380px] flex flex-col cursor-pointer select-none transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)]"
                    onClick={() => setFlipped((f) => !f)}
                  >
                    <div className="flex-1 p-6 md:p-10 flex flex-col justify-center items-center text-center">
                      {!flipped ? (
                        <div className="w-full">
                          <span className="text-caption text-on-surface-variant/60 tracking-wider uppercase mb-4 block">{t.question}</span>
                          <h3 className="text-headline-md text-on-surface max-w-2xl mx-auto leading-snug">
                            {current.pregunta}
                          </h3>
                          <p className="text-caption text-on-surface-variant/50 mt-6">{t.tapToFlip}</p>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col items-center gap-6">
                          <div className="w-full">
                            <span className="text-caption text-on-surface-variant/60 tracking-wider uppercase mb-2 block">{t.question}</span>
                            <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">{current.pregunta}</p>
                          </div>
                          <div className="w-full h-px bg-outline-variant/30 relative">
                            <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-surface px-3 text-caption text-on-surface-variant/60">{t.answer}</div>
                          </div>
                          <div className="w-full max-w-2xl mx-auto bg-surface-container-low p-5 rounded-lg border border-outline-variant/10 text-left">
                            <p className="text-body-lg text-on-surface">{current.respuesta}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Navigation row */}
                    <div
                      className="bg-surface-container-lowest border-t border-outline-variant/20 p-3 md:p-4 flex justify-between items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={prev}
                        disabled={cardIndex === 0}
                        className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 transition-colors text-label-md"
                      >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        <span className="hidden sm:inline">{t.prev}</span>
                      </button>

                      <button
                        onClick={() => setFlipped((f) => !f)}
                        className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-colors text-label-md"
                      >
                        <span className="material-symbols-outlined text-[20px]">flip</span>
                        <span className="hidden sm:inline">{flipped ? t.flipToQ : t.flipToA}</span>
                      </button>

                      <button
                        onClick={next}
                        disabled={cardIndex === total - 1}
                        className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-primary text-on-primary shadow-sm hover:opacity-90 disabled:opacity-30 transition-all text-label-md"
                      >
                        <span className="hidden sm:inline">{t.next}</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* Card list */}
                  <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-4">
                    <h3 className="text-label-md text-on-surface mb-3">{t.allCards}</h3>
                    <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                      {flashcards.map((fc, i) => (
                        <button
                          key={i}
                          onClick={() => { setCardIndex(i); setFlipped(false); }}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            i === cardIndex
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-outline-variant/20 hover:bg-surface-container-low hover:border-outline-variant/50 text-on-surface"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-caption font-bold w-5 shrink-0 ${i === cardIndex ? "text-primary" : "text-on-surface-variant/60"}`}>
                              {i + 1}
                            </span>
                            <p className="text-caption line-clamp-2 flex-1">{fc.pregunta}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

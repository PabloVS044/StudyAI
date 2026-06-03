import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { listNotes, listNotebooks, generateQuiz, generateExam, saveQuizAttempt } from "../api/client";
import type { NoteListItem, Notebook, QuizQuestion, QuizResult, ExamResult } from "../types/note";
import { useAppSettings } from "../context/AppSettings";
import { notify } from "../lib/toast";
import { alertSuccess } from "../lib/swal";

const COPY = {
  es: {
    title: "Tests",
    subtitle: "Pon a prueba tu conocimiento con preguntas de opcion multiple.",
    source: "Origen",
    sourceNote: "Una nota",
    sourceNotebook: "Libro completo",
    sourceMulti: "Varias notas",
    note: "Nota",
    chooseNote: "-- Elige una nota --",
    chooseNotebook: "-- Elige un libro --",
    selectNotes: "Selecciona las notas",
    noNotesInSource: "No hay notas disponibles.",
    difficulty: "Dificultad",
    easy: "Facil",
    medium: "Medio",
    hard: "Dificil",
    questions: "Preguntas",
    mode: "Modo",
    normal: "Normal",
    impossible: "Imposible",
    impossibleHint: "Debes acertar el 80% de preguntas SEGUIDAS o el progreso no cuenta.",
    generate: "Generar test",
    generating: "Generando...",
    searchPlaceholder: "Buscar notas...",
    question: "Pregunta",
    of: "de",
    next: "Siguiente",
    finish: "Ver resultados",
    correct: "Correcta",
    incorrect: "Incorrecta",
    explanation: "Explicacion",
    results: "Resultados",
    score: "Puntuacion",
    maxStreak: "Racha maxima",
    passed: "Superado",
    failed: "No superado",
    streak: "racha",
    retryBtn: "Reintentar",
    newConfig: "Nueva configuracion",
    savingError: "Error al guardar el intento.",
    generateError: "Error al generar el test.",
    noNoteSelected: "Selecciona una nota primero.",
    noNotebookSelected: "Selecciona un libro primero.",
    noNotesSelected: "Selecciona al menos una nota.",
    idleMsg: 'Configura tu test y pulsa "Generar test".',
    notesTitle: "Notas",
    loadingNotes: "Cargando notas...",
    emptyNotes: "No hay notas disponibles.",
    configTitle: "Configuracion",
    impossibleFail: (needed: number) =>
      `Progreso NO valido - no lograste ${needed} seguidas.`,
    impossiblePass: "Progreso valido - racha alcanzada.",
    normalPass: "Has superado el test.",
    normalFail: "No has alcanzado el 60% necesario.",
  },
  en: {
    title: "Tests",
    subtitle: "Challenge yourself with multiple-choice questions.",
    source: "Source",
    sourceNote: "Single note",
    sourceNotebook: "Full notebook",
    sourceMulti: "Multiple notes",
    note: "Note",
    chooseNote: "-- Choose a note --",
    chooseNotebook: "-- Choose a notebook --",
    selectNotes: "Select notes",
    noNotesInSource: "No notes available.",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    questions: "Questions",
    mode: "Mode",
    normal: "Normal",
    impossible: "Impossible",
    impossibleHint: "You must get 80% of questions CONSECUTIVELY correct or the progress won't count.",
    generate: "Generate test",
    generating: "Generating...",
    searchPlaceholder: "Search notes...",
    question: "Question",
    of: "of",
    next: "Next",
    finish: "See results",
    correct: "Correct",
    incorrect: "Incorrect",
    explanation: "Explanation",
    results: "Results",
    score: "Score",
    maxStreak: "Max streak",
    passed: "Passed",
    failed: "Failed",
    streak: "streak",
    retryBtn: "Retry",
    newConfig: "New configuration",
    savingError: "Error saving attempt.",
    generateError: "Error generating test.",
    noNoteSelected: "Select a note first.",
    noNotebookSelected: "Select a notebook first.",
    noNotesSelected: "Select at least one note.",
    idleMsg: 'Configure your test and click "Generate test".',
    notesTitle: "Notes",
    loadingNotes: "Loading notes...",
    emptyNotes: "No notes available.",
    configTitle: "Configuration",
    impossibleFail: (needed: number) =>
      `Progress NOT valid - you didn't achieve ${needed} in a row.`,
    impossiblePass: "Progress valid - streak reached.",
    normalPass: "You passed the test.",
    normalFail: "You didn't reach the required 60%.",
  },
} as const;

type Phase = "idle" | "loading" | "quiz" | "results";
type Difficulty = "facil" | "medio" | "dificil";
type Mode = "normal" | "imposible";
type Source = "note" | "notebook" | "multi";

interface AnswerRecord {
  chosen: number;
  correct: number;
}

const COUNT_OPTIONS = [5, 10, 15, 20];

export default function TestsPage() {
  const { lang } = useAppSettings();
  const t = COPY[lang];
  const [searchParams] = useSearchParams();

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // config
  const [source, setSource] = useState<Source>("note");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<Mode>("normal");

  // quiz state
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [chosenOption, setChosenOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // live tracking
  const [correct, setCorrect] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // results
  const [finalCorrect, setFinalCorrect] = useState(0);
  const [finalMaxStreak, setFinalMaxStreak] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    Promise.all([listNotes(), listNotebooks()])
      .then(([n, nb]) => {
        setNotes(n);
        setNotebooks(nb);
        const nbParam = searchParams.get("notebook");
        if (nbParam) {
          const nbId = parseInt(nbParam, 10);
          if (!isNaN(nbId)) {
            setSource("notebook");
            setSelectedNotebookId(nbId);
          }
        }
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.title || "").toLowerCase().includes(q) ||
      (n.filename || "").toLowerCase().includes(q)
    );
  });

  function toggleMultiNote(noteId: string) {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  }

  async function handleGenerate() {
    if (source === "note" && !selectedNoteId) {
      notify.error(t.noNoteSelected);
      return;
    }
    if (source === "notebook" && !selectedNotebookId) {
      notify.error(t.noNotebookSelected);
      return;
    }
    if (source === "multi" && selectedNoteIds.length === 0) {
      notify.error(t.noNotesSelected);
      return;
    }

    setPhase("loading");
    setCurrentIndex(0);
    setAnswers([]);
    setChosenOption(null);
    setShowExplanation(false);
    setCorrect(0);
    setCurrentStreak(0);
    setMaxStreak(0);

    try {
      let qs: QuizQuestion[];

      if (source === "note") {
        const result: QuizResult = await generateQuiz(selectedNoteId, { count, difficulty });
        qs = result.questions;
      } else if (source === "notebook") {
        const result: ExamResult = await generateExam({
          notebook_id: selectedNotebookId!,
          count,
          difficulty,
        });
        qs = result.questions;
      } else {
        const result: ExamResult = await generateExam({
          note_ids: selectedNoteIds,
          count,
          difficulty,
        });
        qs = result.questions;
      }

      setQuestions(qs);
      setPhase("quiz");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : t.generateError);
      setPhase("idle");
    }
  }

  function handleChooseOption(optionIndex: number) {
    if (chosenOption !== null) return;
    setChosenOption(optionIndex);
    setShowExplanation(true);

    const q = questions[currentIndex];
    const isCorrect = optionIndex === q.correcta;

    const newCorrect = isCorrect ? correct + 1 : correct;
    const newStreak = isCorrect ? currentStreak + 1 : 0;
    const newMaxStreak = Math.max(maxStreak, newStreak);

    setCorrect(newCorrect);
    setCurrentStreak(newStreak);
    setMaxStreak(newMaxStreak);
    setAnswers((prev) => [...prev, { chosen: optionIndex, correct: q.correcta }]);
  }

  async function handleNext() {
    const isLast = currentIndex === questions.length - 1;

    if (isLast) {
      const total = questions.length;
      const fc = correct;
      const fms = maxStreak;

      let p: boolean;
      if (mode === "imposible") {
        const threshold = Math.ceil(0.8 * total);
        p = fms >= threshold;
      } else {
        p = fc / total >= 0.6;
      }

      setFinalCorrect(fc);
      setFinalMaxStreak(fms);
      setPassed(p);
      setPhase("results");

      if (mode === "imposible") {
        const threshold = Math.ceil(0.8 * total);
        if (!p) {
          notify.error(t.impossibleFail(threshold));
        } else {
          alertSuccess(t.impossiblePass);
        }
      } else {
        if (p) notify.success(t.normalPass);
        else notify.error(t.normalFail);
      }

      const attemptNoteId =
        source === "note"
          ? selectedNoteId
          : source === "multi"
          ? selectedNoteIds[0] ?? ""
          : "";

      try {
        await saveQuizAttempt({
          note_id: attemptNoteId,
          difficulty,
          mode,
          total,
          correct: fc,
          max_streak: fms,
          passed: p,
          notebook_id: source === "notebook" ? selectedNotebookId! : undefined,
        });
      } catch {
        notify.error(t.savingError);
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setChosenOption(null);
      setShowExplanation(false);
    }
  }

  function handleRetry() {
    setPhase("loading");
    setCurrentIndex(0);
    setAnswers([]);
    setChosenOption(null);
    setShowExplanation(false);
    setCorrect(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setTimeout(() => setPhase("quiz"), 0);
  }

  function handleNewConfig() {
    setPhase("idle");
    setQuestions([]);
    setAnswers([]);
    setChosenOption(null);
    setShowExplanation(false);
    setCorrect(0);
    setCurrentStreak(0);
    setMaxStreak(0);
  }

  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: "facil", label: t.easy },
    { value: "medio", label: t.medium },
    { value: "dificil", label: t.hard },
  ];

  const total = questions.length;
  const threshold = Math.ceil(0.8 * total);
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const currentQ = questions[currentIndex] ?? null;

  const sourceOptions: { value: Source; label: string; icon: string }[] = [
    { value: "note", label: t.sourceNote, icon: "description" },
    { value: "notebook", label: t.sourceNotebook, icon: "menu_book" },
    { value: "multi", label: t.sourceMulti, icon: "checklist" },
  ];

  const isGenerateDisabled =
    phase === "loading" ||
    (source === "note" && !selectedNoteId) ||
    (source === "notebook" && !selectedNotebookId) ||
    (source === "multi" && selectedNoteIds.length === 0);

  // Left panel: for "notebook" source show notebooks list; for "note"/"multi" show notes list
  const leftPanelIsNotebooks = source === "notebook";

  return (
    <>
      <TopBar searchPlaceholder={t.searchPlaceholder} />
      <main className="flex-1 mt-16 ml-0 md:ml-64 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">

        {/* LEFT PANEL */}
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col bg-surface overflow-hidden shrink-0 max-h-[40vh] md:max-h-none">
          {/* Header + search */}
          <div className="p-md flex flex-col gap-3 border-b border-outline-variant/30">
            <h2 className="text-headline-md text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">quiz</span>
              {t.title}
            </h2>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant/60">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {/* Source tabs */}
            <div className="flex gap-1">
              {sourceOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSource(s.value)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    source === s.value
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-1 custom-scrollbar">
            {dataLoading && (
              <div className="flex items-center gap-2 p-4 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {t.loadingNotes}
              </div>
            )}

            {/* Notebooks list */}
            {!dataLoading && leftPanelIsNotebooks && notebooks.length === 0 && (
              <p className="p-4 text-body-md text-on-surface-variant">{t.emptyNotes}</p>
            )}
            {!dataLoading && leftPanelIsNotebooks && notebooks.map((nb) => {
              const isActive = selectedNotebookId === nb.id;
              return (
                <div
                  key={nb.id}
                  onClick={() => setSelectedNotebookId(nb.id)}
                  className={`rounded-xl p-3 cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? "bg-surface-container-highest shadow-sm border-primary/10 relative overflow-hidden"
                      : "bg-surface hover:bg-surface-container-low border-transparent hover:border-outline-variant/30"
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />}
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary/70">menu_book</span>
                    <div className="min-w-0">
                      <h3 className="text-body-md text-on-surface font-semibold truncate">{nb.name}</h3>
                      {nb.note_count != null && (
                        <p className="text-caption text-on-surface-variant text-xs">{nb.note_count} notas</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Notes list (note + multi modes) */}
            {!dataLoading && !leftPanelIsNotebooks && filteredNotes.length === 0 && (
              <p className="p-4 text-body-md text-on-surface-variant">{t.emptyNotes}</p>
            )}
            {!dataLoading && !leftPanelIsNotebooks && filteredNotes.map((note) => {
              const isActiveNote = source === "note" && selectedNoteId === note.note_id;
              const isChecked = source === "multi" && selectedNoteIds.includes(note.note_id);
              const isHighlighted = isActiveNote || isChecked;
              return (
                <div
                  key={note.note_id}
                  onClick={() => {
                    if (source === "note") setSelectedNoteId(note.note_id);
                    else toggleMultiNote(note.note_id);
                  }}
                  className={`rounded-xl p-3 cursor-pointer transition-all duration-200 border ${
                    isHighlighted
                      ? "bg-surface-container-highest shadow-sm border-primary/10 relative overflow-hidden"
                      : "bg-surface hover:bg-surface-container-low border-transparent hover:border-outline-variant/30"
                  }`}
                >
                  {isHighlighted && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />}
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-caption px-2 py-0.5 rounded text-xs text-primary bg-primary/10 truncate max-w-[70%]">
                      {note.filename}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {source === "multi" && (
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? "bg-primary border-primary" : "border-outline-variant/50"}`}>
                          {isChecked && <span className="material-symbols-outlined text-on-primary text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                        </span>
                      )}
                      <span className="text-caption text-on-surface-variant/70 text-xs">{note.date}</span>
                    </div>
                  </div>
                  <h3 className="text-body-md text-on-surface font-semibold mb-0.5 leading-tight line-clamp-1">{note.title}</h3>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2 text-xs">{note.text_preview}</p>
                </div>
              );
            })}
          </div>

          {/* Multi selection badge */}
          {source === "multi" && selectedNoteIds.length > 0 && (
            <div className="p-sm border-t border-outline-variant/20 bg-primary/5">
              <p className="text-caption text-primary text-center text-xs font-medium">
                {selectedNoteIds.length} {lang === "es" ? "notas seleccionadas" : "notes selected"}
              </p>
            </div>
          )}
        </aside>

        {/* RIGHT PANEL */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden relative min-h-0">

          {/* Right panel top bar */}
          <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-4 md:px-lg bg-surface-container-lowest/90 backdrop-blur z-10 shrink-0">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant min-w-0">
              <span className="material-symbols-outlined text-[18px]">quiz</span>
              <span className="font-medium text-caption truncate">
                {source === "note" && selectedNoteId
                  ? (notes.find((n) => n.note_id === selectedNoteId)?.title ?? selectedNoteId)
                  : source === "notebook" && selectedNotebookId
                  ? (notebooks.find((nb) => nb.id === selectedNotebookId)?.name ?? "")
                  : source === "multi" && selectedNoteIds.length > 0
                  ? `${selectedNoteIds.length} ${lang === "es" ? "notas" : "notes"}`
                  : t.configTitle}
              </span>
            </div>
            {(phase === "quiz" || phase === "results") && (
              <button
                onClick={handleNewConfig}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                {t.newConfig}
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 md:px-lg lg:px-xl py-lg pb-8 max-w-4xl mx-auto">

              {/* Config panel */}
              {(phase === "idle" || phase === "loading") && (
                <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md mb-gutter">

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-md">

                    {/* Difficulty */}
                    <div>
                      <label className="block text-label-md text-on-surface mb-xs">{t.difficulty}</label>
                      <div className="flex gap-xs">
                        {difficultyOptions.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => setDifficulty(d.value)}
                            className={`flex-1 py-sm rounded-lg text-label-md border transition-all ${
                              difficulty === d.value
                                ? "bg-primary text-on-primary border-primary shadow-sm"
                                : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Count */}
                    <div>
                      <label className="block text-label-md text-on-surface mb-xs">{t.questions}</label>
                      <div className="flex gap-xs">
                        {COUNT_OPTIONS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setCount(c)}
                            className={`flex-1 py-sm rounded-lg text-label-md border transition-all ${
                              count === c
                                ? "bg-primary text-on-primary border-primary shadow-sm"
                                : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mode */}
                    <div>
                      <label className="block text-label-md text-on-surface mb-xs">{t.mode}</label>
                      <div className="flex gap-xs">
                        {(["normal", "imposible"] as Mode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`flex-1 py-sm rounded-lg text-label-md border transition-all ${
                              mode === m
                                ? m === "imposible"
                                  ? "bg-error text-on-error border-error shadow-sm"
                                  : "bg-primary text-on-primary border-primary shadow-sm"
                                : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                            }`}
                          >
                            {m === "normal" ? t.normal : t.impossible}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Impossible mode hint */}
                  {mode === "imposible" && (
                    <div className="mb-md flex items-start gap-sm bg-error-container/15 border border-error-container/30 rounded-lg p-sm">
                      <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">warning</span>
                      <p className="text-caption text-on-error-container">{t.impossibleHint}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerateDisabled}
                      className="px-md py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-xs"
                    >
                      {phase === "loading" ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          {t.generating}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                          {t.generate}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Idle state */}
              {phase === "idle" && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant gap-4">
                  <span className="material-symbols-outlined text-[56px] opacity-20">quiz</span>
                  <p className="text-body-lg">{t.idleMsg}</p>
                </div>
              )}

              {/* Quiz phase */}
              {phase === "quiz" && currentQ && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

                  {/* Main question area */}
                  <div className="lg:col-span-8 flex flex-col gap-md order-2 lg:order-1">

                    {/* Progress bar */}
                    <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md">
                      <div className="flex justify-between items-center mb-sm">
                        <span className="text-caption text-outline">{t.question} {currentIndex + 1} {t.of} {total}</span>
                        <span className="text-caption text-primary font-bold">{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>

                    {/* Question card */}
                    <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-lg flex flex-col gap-md">
                      <p className="text-headline-sm text-on-surface leading-snug">{currentQ.pregunta}</p>

                      <div className="flex flex-col gap-sm">
                        {currentQ.opciones.map((opt, i) => {
                          let cls =
                            "w-full text-left p-md rounded-xl border text-body-md transition-all duration-200 ";
                          if (chosenOption === null) {
                            cls += "border-outline-variant/30 text-on-surface bg-surface-container-low hover:border-primary/50 hover:bg-primary-container/5 cursor-pointer";
                          } else if (i === currentQ.correcta) {
                            cls += "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 cursor-default";
                          } else if (i === chosenOption && chosenOption !== currentQ.correcta) {
                            cls += "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 cursor-default";
                          } else {
                            cls += "border-outline-variant/20 text-on-surface-variant opacity-60 cursor-default";
                          }
                          return (
                            <button key={i} className={cls} onClick={() => handleChooseOption(i)}>
                              <div className="flex items-start gap-sm">
                                <span className={`shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center mt-0.5 ${
                                  chosenOption !== null && i === currentQ.correcta
                                    ? "border-green-500 text-green-600"
                                    : chosenOption !== null && i === chosenOption && chosenOption !== currentQ.correcta
                                    ? "border-red-500 text-red-600"
                                    : "border-outline-variant/50 text-outline"
                                }`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {showExplanation && (
                        <div className="mt-sm bg-surface-container-low border border-outline-variant/20 rounded-lg p-md">
                          <p className="text-caption text-outline mb-xs uppercase tracking-wider">{t.explanation}</p>
                          <p className="text-body-md text-on-surface-variant">{currentQ.explicacion}</p>
                        </div>
                      )}

                      {chosenOption !== null && (
                        <div className="flex justify-end">
                          <button
                            onClick={handleNext}
                            className="px-md py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 transition-all flex items-center gap-xs"
                          >
                            {currentIndex === total - 1 ? t.finish : t.next}
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Side stats */}
                  <div className="lg:col-span-4 flex flex-col gap-md order-1 lg:order-2">
                    <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md">
                      <h3 className="text-label-md text-on-surface mb-md flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary text-[18px]">monitoring</span>
                        Stats
                      </h3>
                      <div className="grid grid-cols-3 lg:grid-cols-2 gap-sm">
                        <div className="bg-green-500/10 rounded-lg p-sm text-center border border-green-500/20">
                          <span className="block text-headline-md text-green-600 dark:text-green-400">{correct}</span>
                          <span className="text-caption text-outline">{t.correct}</span>
                        </div>
                        <div className="bg-surface-container rounded-lg p-sm text-center border border-outline-variant/20">
                          <span className="block text-headline-md text-secondary">{answers.length - correct}</span>
                          <span className="text-caption text-outline">{t.incorrect}</span>
                        </div>
                        <div className="bg-primary-container/10 rounded-lg p-sm text-center border border-primary-container/20 lg:col-span-2">
                          <span className="block text-headline-md text-primary">{currentStreak}</span>
                          <span className="text-caption text-outline">{t.streak}</span>
                          {mode === "imposible" && (
                            <span className="text-caption text-outline block">/ {threshold} needed</span>
                          )}
                        </div>
                      </div>

                      {mode === "imposible" && (
                        <div className="mt-md">
                          <div className="flex justify-between text-caption text-outline mb-xs">
                            <span>{t.maxStreak}</span>
                            <span className="font-bold text-primary">{maxStreak} / {threshold}</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${maxStreak >= threshold ? "bg-green-500" : "bg-primary"}`}
                              style={{ width: `${Math.min(100, (maxStreak / threshold) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question map */}
                    <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md">
                      <h3 className="text-label-md text-on-surface mb-md">{t.question}s</h3>
                      <div className="flex flex-wrap gap-xs">
                        {questions.map((_, i) => {
                          const ans = answers[i];
                          let cls = "w-8 h-8 rounded-lg text-xs font-bold border flex items-center justify-center transition-colors ";
                          if (i === currentIndex) {
                            cls += "border-primary bg-primary text-on-primary";
                          } else if (ans) {
                            cls += ans.chosen === ans.correct
                              ? "border-green-500 bg-green-500/15 text-green-600"
                              : "border-red-500 bg-red-500/15 text-red-600";
                          } else {
                            cls += "border-outline-variant/30 text-outline";
                          }
                          return <div key={i} className={cls}>{i + 1}</div>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results phase */}
              {phase === "results" && (
                <div className="max-w-xl mx-auto">
                  <div className={`rounded-2xl border p-xl text-center mb-gutter ${
                    passed
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}>
                    <span
                      className={`material-symbols-outlined text-[64px] mb-md block ${passed ? "text-green-500" : "text-red-500"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {passed ? "check_circle" : "cancel"}
                    </span>
                    <h3 className="text-headline-md text-on-surface mb-xs">{t.results}</h3>
                    <p className={`text-body-lg font-semibold ${passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {passed ? t.passed : t.failed}
                    </p>
                    {mode === "imposible" && !passed && (
                      <p className="text-body-md text-on-surface-variant mt-sm">
                        {t.impossibleFail(threshold)}
                      </p>
                    )}
                  </div>

                  <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md mb-gutter">
                    <div className="grid grid-cols-3 gap-2 md:gap-md text-center overflow-hidden">
                      <div>
                        <p className="text-headline-md text-primary">{finalCorrect}/{total}</p>
                        <p className="text-caption text-outline">{t.score}</p>
                      </div>
                      <div>
                        <p className="text-headline-md text-secondary">{Math.round((finalCorrect / total) * 100)}%</p>
                        <p className="text-caption text-outline">{t.score} %</p>
                      </div>
                      <div>
                        <p className={`text-headline-md ${finalMaxStreak >= threshold && mode === "imposible" ? "text-green-500" : "text-on-surface"}`}>
                          {finalMaxStreak}
                        </p>
                        <p className="text-caption text-outline">{t.maxStreak}</p>
                      </div>
                    </div>

                    {mode === "imposible" && (
                      <div className="mt-md pt-md border-t border-outline-variant/20">
                        <div className="flex justify-between text-caption text-outline mb-xs">
                          <span>{t.maxStreak}</span>
                          <span className={`font-bold ${finalMaxStreak >= threshold ? "text-green-500" : "text-red-500"}`}>
                            {finalMaxStreak} / {threshold}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className={`h-full ${finalMaxStreak >= threshold ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(100, (finalMaxStreak / threshold) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Answer review */}
                  <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md mb-gutter">
                    <h3 className="text-label-md text-on-surface mb-md">{t.question}s</h3>
                    <div className="flex flex-col gap-sm">
                      {questions.map((q, i) => {
                        const ans = answers[i];
                        const isOk = ans && ans.chosen === ans.correct;
                        return (
                          <div key={i} className={`rounded-lg p-sm border text-left ${isOk ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                            <div className="flex items-start gap-sm">
                              <span
                                className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${isOk ? "text-green-500" : "text-red-500"}`}
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                {isOk ? "check_circle" : "cancel"}
                              </span>
                              <div>
                                <p className="text-body-sm text-on-surface">{q.pregunta}</p>
                                {!isOk && ans && (
                                  <p className="text-caption text-green-600 dark:text-green-400 mt-xs">
                                    {q.opciones[q.correcta]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-md justify-center">
                    <button
                      onClick={handleRetry}
                      className="px-md py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                      {t.retryBtn}
                    </button>
                    <button
                      onClick={handleNewConfig}
                      className="px-md py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 transition-all flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                      {t.newConfig}
                    </button>
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

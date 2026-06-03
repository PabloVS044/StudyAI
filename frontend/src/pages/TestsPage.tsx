import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { listNotes, generateQuiz, saveQuizAttempt } from "../api/client";
import type { NoteListItem, QuizQuestion, QuizResult } from "../types/note";
import { useAppSettings } from "../context/AppSettings";
import { notify } from "../lib/toast";
import { alertSuccess } from "../lib/swal";

const COPY = {
  es: {
    title: "Tests",
    subtitle: "Pon a prueba tu conocimiento con preguntas de opcion multiple.",
    note: "Nota",
    chooseNote: "-- Elige una nota --",
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
    searchPlaceholder: "Buscar...",
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
    idleMsg: 'Configura tu test y pulsa "Generar test".',
    impossibleFail: (needed: number) =>
      `Progreso NO valido - no lograste ${needed} seguidas.`,
    impossiblePass: "Progreso valido - racha alcanzada.",
    normalPass: "Has superado el test.",
    normalFail: "No has alcanzado el 60% necesario.",
  },
  en: {
    title: "Tests",
    subtitle: "Challenge yourself with multiple-choice questions.",
    note: "Note",
    chooseNote: "-- Choose a note --",
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
    searchPlaceholder: "Search...",
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
    idleMsg: 'Configure your test and click "Generate test".',
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

interface AnswerRecord {
  chosen: number;
  correct: number;
}

const COUNT_OPTIONS = [5, 10, 15, 20];

export default function TestsPage() {
  const { lang } = useAppSettings();
  const t = COPY[lang];

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);

  // config
  const [selectedNoteId, setSelectedNoteId] = useState("");
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
    listNotes()
      .then(setNotes)
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, []);

  async function handleGenerate() {
    if (!selectedNoteId) {
      notify.error(t.noNoteSelected);
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
      const result: QuizResult = await generateQuiz(selectedNoteId, { count, difficulty });
      setQuestions(result.questions);
      setPhase("quiz");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : t.generateError);
      setPhase("idle");
    }
  }

  function handleChooseOption(optionIndex: number) {
    if (chosenOption !== null) return; // already answered
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
      // compute final values using local vars since state may not flush yet
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

      // show feedback
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

      // save attempt
      try {
        await saveQuizAttempt({
          note_id: selectedNoteId,
          difficulty,
          mode,
          total,
          correct: fc,
          max_streak: fms,
          passed: p,
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
    // reuse same questions
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

  return (
    <>
      <TopBar searchPlaceholder={t.searchPlaceholder} />
      <main className="flex-1 mt-16 p-4 md:p-gutter w-full max-w-container-max mx-auto ml-0 md:ml-64">

        {/* Header */}
        <div className="mb-md">
          <h2 className="text-headline-lg text-on-background flex flex-wrap items-center gap-sm">
            {t.title}
            <span className="bg-primary-container/10 text-primary text-caption px-sm py-xs rounded-full inline-flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
              {t.mode}: {mode === "normal" ? t.normal : t.impossible}
            </span>
          </h2>
          <p className="text-caption text-outline mt-xs">{t.subtitle}</p>
        </div>

        {/* Config panel - always visible unless in quiz */}
        {(phase === "idle" || phase === "loading") && (
          <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md mb-gutter">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md items-end">

              {/* Note selector */}
              <div>
                <label className="block text-label-md text-on-surface mb-xs">{t.note}</label>
                {notesLoading ? (
                  <div className="h-10 bg-surface-container-low rounded-lg animate-pulse" />
                ) : (
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">{t.chooseNote}</option>
                    {notes.map((n) => (
                      <option key={n.note_id} value={n.note_id}>{n.title || n.filename}</option>
                    ))}
                  </select>
                )}
              </div>

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
              <div className="mt-md flex items-start gap-sm bg-error-container/15 border border-error-container/30 rounded-lg p-sm">
                <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">warning</span>
                <p className="text-caption text-on-error-container">{t.impossibleHint}</p>
              </div>
            )}

            <div className="mt-md flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={!selectedNoteId || phase === "loading"}
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
          <div className="flex flex-col items-center justify-center py-2xl text-center text-outline">
            <span className="material-symbols-outlined text-[48px] mb-md opacity-30">quiz</span>
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

                {/* Options */}
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

                {/* Explanation */}
                {showExplanation && (
                  <div className="mt-sm bg-surface-container-low border border-outline-variant/20 rounded-lg p-md">
                    <p className="text-caption text-outline mb-xs uppercase tracking-wider">{t.explanation}</p>
                    <p className="text-body-md text-on-surface-variant">{currentQ.explicacion}</p>
                  </div>
                )}

                {/* Next button */}
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

            {/* Side stats - on mobile shows above question, on lg stacks in sidebar */}
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
                    return (
                      <div key={i} className={cls}>{i + 1}</div>
                    );
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
              <span className={`material-symbols-outlined text-[64px] mb-md block ${passed ? "text-green-500" : "text-red-500"}`}
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {passed ? "check_circle" : "cancel"}
              </span>
              <h3 className="text-headline-md text-on-surface mb-xs">
                {t.results}
              </h3>
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
                        <span className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${isOk ? "text-green-500" : "text-red-500"}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}>
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
      </main>
    </>
  );
}

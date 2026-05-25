import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import Spinner from "../components/Spinner";
import { listNotes, generateFlashcards } from "../api/client";
import type { NoteListItem, Flashcard } from "../types/note";

export default function FlashcardsPage() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mastered, setMastered] = useState(0);
  const [review, setReview] = useState(0);
  const [difficult, setDifficult] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    listNotes().then(setNotes).catch(() => {});
  }, []);

  const answered = mastered + review + difficult;
  const progressPercent = flashcards.length > 0 ? (answered / flashcards.length) * 100 : 0;
  const currentCard: Flashcard | undefined = flashcards[currentIndex];
  const selectedNote = notes.find((n) => n.note_id === selectedNoteId);

  async function handleGenerate() {
    if (!selectedNoteId) return;
    setIsGenerating(true);
    setError(null);
    setFlashcards([]);
    setCurrentIndex(0);
    setMastered(0);
    setReview(0);
    setDifficult(0);
    setCompleted(false);
    setShowAnswer(false);
    try {
      const result = await generateFlashcards(selectedNoteId);
      if (result.flashcards.length === 0) {
        setError("No se generaron flashcards. Intenta con una nota que tenga más contenido.");
      } else {
        setFlashcards(result.flashcards);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar flashcards.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleResponse(type: "mastered" | "review" | "difficult") {
    if (type === "mastered") setMastered((m) => m + 1);
    else if (type === "review") setReview((r) => r + 1);
    else setDifficult((d) => d + 1);

    setShowAnswer(false);
    if (currentIndex + 1 >= flashcards.length) {
      setCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setMastered(0);
    setReview(0);
    setDifficult(0);
    setCompleted(false);
    setShowAnswer(false);
  }

  function handleNoteChange(noteId: string) {
    setSelectedNoteId(noteId);
    setFlashcards([]);
    setError(null);
    setCompleted(false);
  }

  return (
    <>
      <TopBar searchPlaceholder="Search decks, tags, or concepts..." />
      <main className="flex-1 mt-16 p-gutter w-full max-w-container-max mx-auto ml-0 md:ml-64">

        {/* Header: selector de nota + botón generar */}
        <div className="mb-md flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
          <div className="flex-1 max-w-xl">
            <p className="text-caption text-outline tracking-wider uppercase mb-xs">Flashcards con IA</p>
            <h2 className="text-headline-lg text-on-background mb-md">
              {flashcards.length > 0 && selectedNote ? selectedNote.title : "Generador de Flashcards"}
            </h2>
            <div className="flex gap-sm items-center">
              <select
                value={selectedNoteId}
                onChange={(e) => handleNoteChange(e.target.value)}
                className="flex-1 bg-surface border border-outline-variant/40 rounded-lg px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">— Selecciona una nota —</option>
                {notes.map((n) => (
                  <option key={n.note_id} value={n.note_id}>{n.title}</option>
                ))}
              </select>
              <button
                onClick={handleGenerate}
                disabled={!selectedNoteId || isGenerating}
                className="flex items-center gap-xs px-lg py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                {isGenerating ? "Generando..." : "Generar"}
              </button>
            </div>
            {notes.length === 0 && !isGenerating && (
              <p className="text-caption text-outline mt-xs">
                No tienes notas guardadas. Captura una nota primero.
              </p>
            )}
          </div>
          {flashcards.length > 0 && !completed && (
            <div className="text-right shrink-0">
              <p className="text-caption text-outline mb-xs">Progreso de sesión</p>
              <p className="text-label-md text-on-surface-variant">
                Tarjeta {Math.min(currentIndex + 1, flashcards.length)} de {flashcards.length}
              </p>
            </div>
          )}
        </div>

        {/* Estado: cargando */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-[120px] gap-lg">
            <Spinner />
            <p className="text-body-lg text-on-surface-variant">Mistral está generando tus flashcards...</p>
          </div>
        )}

        {/* Estado: error */}
        {error && !isGenerating && (
          <div className="bg-error-container/20 border border-error-container/40 rounded-xl p-lg text-center">
            <span className="material-symbols-outlined text-error text-[32px] block mb-sm">error</span>
            <p className="text-body-lg text-error">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-md text-caption text-outline hover:text-on-surface transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Estado: inicial — sin flashcards */}
        {!isGenerating && !error && flashcards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-[120px] gap-md text-center">
            <span className="material-symbols-outlined text-[64px] text-outline">style</span>
            <h3 className="text-headline-md text-on-surface">Selecciona una nota y genera tus flashcards</h3>
            <p className="text-body-lg text-on-surface-variant max-w-md">
              Elige una de tus notas guardadas y presiona "Generar" para que Mistral cree preguntas y respuestas de estudio.
            </p>
          </div>
        )}

        {/* Estado: sesión completada */}
        {completed && !isGenerating && (
          <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-xl text-center max-w-lg mx-auto">
            <span
              className="material-symbols-outlined text-[64px] text-primary block mb-md"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              celebration
            </span>
            <h3 className="text-headline-md text-on-surface mb-sm">¡Sesión completada!</h3>
            <p className="text-body-lg text-on-surface-variant mb-lg">
              Revisaste {flashcards.length} tarjetas.
            </p>
            <div className="grid grid-cols-3 gap-sm mb-lg">
              <div className="bg-primary-container/5 rounded-lg p-md text-center border border-primary-container/10">
                <span className="block text-headline-md text-primary">{mastered}</span>
                <span className="text-caption text-outline">Lo sé</span>
              </div>
              <div className="bg-surface-container rounded-lg p-md text-center border border-outline-variant/20">
                <span className="block text-headline-md text-secondary">{review}</span>
                <span className="text-caption text-outline">Repasar</span>
              </div>
              <div className="bg-error-container/20 rounded-lg p-md text-center border border-error-container/30">
                <span className="block text-headline-md text-error">{difficult}</span>
                <span className="text-caption text-outline">No lo sé</span>
              </div>
            </div>
            <div className="flex gap-sm justify-center flex-wrap">
              <button
                onClick={handleReset}
                className="flex items-center gap-xs px-lg py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                Reiniciar sesión
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedNoteId}
                className="flex items-center gap-xs px-lg py-sm rounded-lg bg-primary text-on-primary text-label-md shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Generar de nuevo
              </button>
            </div>
          </div>
        )}

        {/* Estado: repaso activo */}
        {flashcards.length > 0 && !completed && !isGenerating && currentCard && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

            {/* Tarjeta activa (8 cols) */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-[0_4px_24px_-4px_rgba(21,69,57,0.05)] flex-1 min-h-[500px] flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(21,69,57,0.08)]">

                {/* Barra de progreso */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-high">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-xl flex-1 flex flex-col justify-center items-center text-center">
                  <div className="mb-lg w-full">
                    <span className="text-caption text-outline tracking-wider uppercase mb-md block">Pregunta</span>
                    <h3 className="text-headline-md text-on-surface max-w-2xl mx-auto leading-snug">
                      {currentCard.pregunta}
                    </h3>
                  </div>

                  {showAnswer ? (
                    <>
                      <div className="w-full h-px bg-outline-variant/30 my-lg relative">
                        <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-surface px-sm text-caption text-outline">
                          Respuesta
                        </div>
                      </div>
                      <div className="w-full max-w-2xl mx-auto bg-surface-container-low p-md rounded-lg border border-outline-variant/10 text-left">
                        <p className="text-body-lg text-on-surface-variant">{currentCard.respuesta}</p>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="flex items-center gap-xs px-lg py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Mostrar respuesta
                    </button>
                  )}
                </div>

                {/* Botones de respuesta */}
                <div className="bg-surface-container-lowest border-t border-outline-variant/20 p-md flex justify-center gap-md">
                  <button
                    onClick={() => handleResponse("difficult")}
                    disabled={!showAnswer}
                    className="flex flex-col items-center justify-center gap-xs w-32 py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-error hover:bg-error-container hover:text-on-error-container hover:border-error-container transition-colors group disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">close</span>
                    <span className="text-caption">No lo sé</span>
                  </button>
                  <button
                    onClick={() => handleResponse("review")}
                    disabled={!showAnswer}
                    className="flex flex-col items-center justify-center gap-xs w-32 py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-secondary hover:bg-secondary-container hover:text-on-secondary-container hover:border-secondary-container transition-colors group disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">schedule</span>
                    <span className="text-caption">Repasar</span>
                  </button>
                  <button
                    onClick={() => handleResponse("mastered")}
                    disabled={!showAnswer}
                    className="flex flex-col items-center justify-center gap-xs w-32 py-sm rounded-lg bg-primary text-on-primary shadow-sm hover:opacity-90 hover:-translate-y-px transition-all group disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">check</span>
                    <span className="text-caption">Lo sé</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-gutter">

              {/* Stats de sesión */}
              <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md">
                <h3 className="text-label-md text-on-surface mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary">monitoring</span>
                  Progreso de la sesión
                </h3>
                <div className="mb-lg">
                  <div className="flex justify-between text-caption text-outline mb-xs">
                    <span>Completado</span>
                    <span className="text-primary font-bold">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${(mastered / flashcards.length) * 100}%` }}
                    />
                    <div
                      className="bg-secondary-fixed-dim h-full transition-all"
                      style={{ width: `${(review / flashcards.length) * 100}%` }}
                    />
                    <div
                      className="bg-error-container h-full transition-all"
                      style={{ width: `${(difficult / flashcards.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-sm">
                  <div className="bg-primary-container/5 rounded-lg p-sm text-center border border-primary-container/10">
                    <span className="block text-headline-md text-primary">{mastered}</span>
                    <span className="text-caption text-outline">Lo sé</span>
                  </div>
                  <div className="bg-surface-container rounded-lg p-sm text-center border border-outline-variant/20">
                    <span className="block text-headline-md text-secondary">{review}</span>
                    <span className="text-caption text-outline">Repasar</span>
                  </div>
                  <div className="bg-error-container/20 rounded-lg p-sm text-center border border-error-container/30">
                    <span className="block text-headline-md text-error">{difficult}</span>
                    <span className="text-caption text-outline">No lo sé</span>
                  </div>
                </div>
              </div>

              {/* Info del deck */}
              <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm flex-1 p-md flex flex-col">
                <h3 className="text-label-md text-on-surface mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">style</span>
                  {selectedNote?.title ?? "Flashcards"}
                </h3>
                <div className="flex-1 space-y-sm text-body-md text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Total de tarjetas</span>
                    <span className="font-bold text-on-surface">{flashcards.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Respondidas</span>
                    <span className="font-bold text-on-surface">{answered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restantes</span>
                    <span className="font-bold text-on-surface">{flashcards.length - currentIndex}</span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-md w-full flex items-center justify-center gap-xs py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-caption text-outline hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  Reiniciar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

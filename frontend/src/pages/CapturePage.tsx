import { useState } from "react";
import TopBar from "../components/TopBar";
import CameraModal from "../components/CameraModal";
import NoteDetailView from "../components/NoteDetailView";
import Spinner from "../components/Spinner";
import { extractImages, saveNote } from "../api/client";
import type { ExtractResult } from "../types/note";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]);

const inputTypes = [
  { icon: "document_scanner", label: "Foto de Apunte", action: "camera" },
  { icon: "draw", label: "Nota en Tablet", action: "file" },
  { icon: "picture_as_pdf", label: "Documento PDF", action: "file" },
  { icon: "description", label: "Documento Word", action: "file" },
  { icon: "mic", label: "Audio de Clase", action: null },
  { icon: "text_fields", label: "Texto Manual", action: null },
];

export default function CapturePage() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [results, setResults] = useState<ExtractResult[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  function addFiles(incoming: File[]) {
    const valid = incoming.filter((f) => ALLOWED.has(f.type));
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...valid.filter((f) => !existing.has(`${f.name}-${f.size}`))];
    });
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles([...e.dataTransfer.files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { addFiles([...e.target.files]); e.target.value = ""; }
  };

  function handleCardClick(action: string | null) {
    if (action === "camera") setShowCamera(true);
    else if (action === "file") document.getElementById("file-upload")?.click();
  }

  async function handleExtract() {
    if (!files.length) return;
    setExtracting(true);
    setError("");
    try {
      const data = await extractImages(files);
      setResults(data);

      const autoSaved = new Set<string>();
      await Promise.all(
        data
          .filter((r) => r.content && !r.error)
          .map(async (r) => {
            try {
              await saveNote({ note_id: r.note_id, filename: r.filename, image_ext: r.image_ext, content: r.content! });
              autoSaved.add(r.note_id);
            } catch {
              // fallo silencioso — usuario puede guardar manualmente
            }
          })
      );
      setSavedIds(autoSaved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conectar con el backend");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <>
      <TopBar searchPlaceholder="Search..." />
      <main className="ml-0 md:ml-64 mt-16 w-full p-lg lg:p-xl flex justify-center bg-background">
        <div className="max-w-4xl w-full flex flex-col gap-lg pb-xl">

          {/* Header */}
          <div className="flex flex-col gap-xs">
            <h2 className="text-headline-lg text-primary">Añadir Material de Estudio</h2>
            <p className="text-body-lg text-on-surface-variant">Sube tus archivos o elige un método de captura para comenzar el análisis.</p>
          </div>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`w-full border-2 border-dashed rounded-xl p-xl flex flex-col items-center justify-center gap-md cursor-pointer transition-all shadow-sm ${
              dragActive
                ? "border-primary bg-primary-container/5"
                : "bg-surface-container-lowest border-outline-variant hover:border-primary hover:bg-primary-container/5"
            }`}
          >
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.docx"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-md w-full h-full">
              <div className="w-16 h-16 rounded-full bg-secondary-container/50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
              </div>
              <div className="text-center">
                <h3 className="text-headline-md text-on-surface mb-xs">Arrastra y suelta archivos aquí</h3>
                <p className="text-body-md text-on-surface-variant">o haz clic para explorar tu dispositivo</p>
              </div>
              <p className="text-caption text-on-surface-variant/70 mt-sm">Formatos aceptados: JPG, PNG, WEBP (Máx. 100MB)</p>
            </label>
          </div>

          {/* Selected files */}
          {files.length > 0 && (
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-md">
              <h4 className="text-label-md text-on-surface mb-sm">Archivos seleccionados ({files.length})</h4>
              <ul className="space-y-xs">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-sm text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    {f.name}
                    <span className="text-caption text-outline-variant">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-md">
            <div className="h-px bg-outline-variant flex-grow" />
            <span className="text-label-md text-on-surface-variant">O selecciona una fuente</span>
            <div className="h-px bg-outline-variant flex-grow" />
          </div>

          {/* Input Types Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
            {inputTypes.map((type, i) => (
              <button
                key={i}
                onClick={() => handleCardClick(type.action)}
                disabled={type.action === null}
                className={`bg-surface-container-lowest border rounded-lg p-md flex flex-col items-center justify-center gap-sm shadow-sm transition-all
                  ${type.action === null
                    ? "border-outline-variant opacity-50 cursor-not-allowed"
                    : type.action === "camera"
                      ? "border-primary/40 hover:border-primary hover:shadow-md hover:-translate-y-1"
                      : "border-outline-variant hover:border-primary-fixed-dim hover:shadow-md hover:-translate-y-1"
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  type.action === "camera"
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-container text-secondary"
                }`}>
                  <span className="material-symbols-outlined">{type.icon}</span>
                </div>
                <span className="text-label-md text-on-surface">{type.label}</span>
                {type.action === "camera" && (
                  <span className="text-caption text-primary">Abrir cámara</span>
                )}
              </button>
            ))}
          </div>

          {/* AI info */}
          <div className="bg-secondary-container/30 border border-secondary-fixed-dim rounded-lg p-md flex items-start gap-md">
            <span className="material-symbols-outlined text-primary mt-xs">auto_awesome</span>
            <div>
              <h4 className="text-label-md text-on-surface mb-xs">Magia del flujo de estudio</h4>
              <p className="text-body-md text-on-surface-variant">La IA extraerá conceptos, limpiará el texto y organizará tus apuntes automáticamente.</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-md bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-body-md">
              {error}
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-end w-full">
            <button
              onClick={handleExtract}
              disabled={!files.length || extracting}
              className="bg-primary text-on-primary font-label-md text-label-md px-xl py-md rounded-full hover:bg-primary-container transition-colors shadow-sm flex items-center gap-sm text-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {extracting && <Spinner size={20} />}
              {extracting ? "Procesando con IA…" : "Procesar con IA"}
              {!extracting && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-lg">
              <h2 className="text-headline-md text-on-surface">Resultados ({results.length})</h2>
              {results.map((r) => (
                <div key={r.note_id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg">
                  <NoteDetailView
                    noteId={r.note_id}
                    filename={r.filename}
                    imageExt={r.image_ext}
                    content={r.content ?? { formulas: [], listas: [], diagramas_figuras: [], definiciones: [] }}
                    error={r.error}
                    saved={savedIds.has(r.note_id)}
                    onSaved={() => setSavedIds((s) => new Set([...s, r.note_id]))}
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {showCamera && (
        <CameraModal
          onCapture={(file) => addFiles([file])}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}

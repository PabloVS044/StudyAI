import { useState, useCallback } from "react";
import { Upload, Sparkles, X, Camera } from "lucide-react";
import { extractImages, imageUrl } from "../api/client";
import NoteDetailView from "../components/NoteDetailView";
import Spinner from "../components/Spinner";
import CameraModal from "../components/CameraModal";
import type { ExtractResult } from "../types/note";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"]);

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [results, setResults] = useState<ExtractResult[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => ALLOWED.has(f.type));
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...valid.filter((f) => !existing.has(`${f.name}-${f.size}`))];
    });
  }, []);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles([...e.dataTransfer.files]);
  }, [addFiles]);

  async function handleExtract() {
    if (!files.length) return;
    setExtracting(true);
    setError("");
    try {
      const data = await extractImages(files);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conectar con el backend");
    } finally {
      setExtracting(false);
    }
  }

  function handleReset() {
    setFiles([]);
    setResults([]);
    setSavedIds(new Set());
    setError("");
  }

  function handleCameraCapture(file: File) {
    addFiles([file]);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Digitalizar Apuntes</h1>
      <p className="text-slate-400 text-sm mb-6">
        Sube fotos de tus apuntes — la IA extrae texto, fórmulas, listas y diagramas
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput")?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all select-none
          ${dragOver
            ? "border-violet-500 bg-violet-500/10"
            : "border-slate-700 bg-[#17171f] hover:border-slate-500 hover:bg-[#1e1e28]"}`}
      >
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { addFiles([...e.target.files!]); e.target.value = ""; }}
        />
        <Upload className="mx-auto mb-3 text-slate-500" size={36} />
        <p className="font-semibold text-slate-300">Arrastra tus fotos aquí</p>
        <p className="text-sm text-slate-500 mt-1">o haz clic para seleccionar · PNG, JPG, WEBP · máx. 20 MB</p>
      </div>

      {/* Camera button */}
      <button
        onClick={() => setShowCamera(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-600 hover:border-violet-500 hover:bg-violet-500/5 rounded-xl text-slate-400 hover:text-violet-400 text-sm font-medium transition-all"
      >
        <Camera size={16} />
        Usar cámara del dispositivo
      </button>

      {/* Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="w-20 h-20 object-cover rounded-lg border border-slate-700"
              />
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-1 w-20 truncate">{f.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleExtract}
          disabled={!files.length || extracting}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-colors"
        >
          {extracting ? <Spinner size={16} /> : <Sparkles size={16} />}
          {extracting ? "Analizando con IA…" : "Extraer con IA"}
        </button>
        {(files.length > 0 || results.length > 0) && (
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-semibold text-white">
            Resultados ({results.length})
          </h2>
          {results.map((r) => (
            <div key={r.note_id} className="bg-[#17171f] border border-slate-700 rounded-xl p-5">
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

      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

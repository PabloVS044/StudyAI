import { useState } from "react";
import TopBar from "../components/TopBar";

const inputTypes = [
  { icon: "document_scanner", label: "Foto de Apunte" },
  { icon: "draw", label: "Nota en Tablet" },
  { icon: "picture_as_pdf", label: "Documento PDF" },
  { icon: "description", label: "Documento Word" },
  { icon: "mic", label: "Audio de Clase" },
  { icon: "text_fields", label: "Texto Manual" },
];

export default function CapturePage() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <>
      <TopBar searchPlaceholder="Search..." />
      <main className="ml-0 md:ml-64 mt-16 w-full p-lg lg:p-xl flex justify-center bg-background min-h-[calc(100vh-4rem)]">
        <div className="max-w-4xl w-full flex flex-col gap-lg">
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
              accept=".pdf,.docx,.jpg,.jpeg,.png,.mp3,.mp4"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-md w-full h-full">
              <div className="w-16 h-16 rounded-full bg-secondary-container/50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
              </div>
              <div className="text-center">
                <h3 className="text-headline-md text-on-surface mb-xs">Arrastra y suelta archivos aquí</h3>
                <p className="text-body-md text-on-surface-variant">o haz clic para explorar tu dispositivo</p>
              </div>
              <p className="text-caption text-on-surface-variant/70 mt-sm">Formatos aceptados: PDF, DOCX, JPG, PNG, MP3, MP4 (Máx. 100MB)</p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-md">
              <h4 className="text-label-md text-on-surface mb-sm">Archivos seleccionados ({files.length})</h4>
              <ul className="space-y-xs">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-sm text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    {f.name} <span className="text-caption text-outline-variant">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
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
              <button key={i} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col items-center justify-center gap-sm shadow-sm hover:shadow-md hover:border-primary-fixed-dim hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">{type.icon}</span>
                </div>
                <span className="text-label-md text-on-surface">{type.label}</span>
              </button>
            ))}
          </div>

          {/* AI Process Explanation */}
          <div className="bg-secondary-container/30 border border-secondary-fixed-dim rounded-lg p-md flex items-start gap-md mt-sm">
            <span className="material-symbols-outlined text-primary mt-xs">auto_awesome</span>
            <div>
              <h4 className="text-label-md text-on-surface mb-xs">Magia del flujo de estudio</h4>
              <p className="text-body-md text-on-surface-variant">La IA extraerá conceptos, limpiará el texto y organizará tus apuntes automáticamente.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end w-full mt-md pb-xl">
            <button className="bg-primary text-on-primary font-label-md text-label-md px-xl py-md rounded-full hover:bg-primary-container transition-colors shadow-sm flex items-center gap-sm text-lg">
              Procesar con IA
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

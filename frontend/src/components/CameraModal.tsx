import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type Stage = "streaming" | "previewing" | "error";

export default function CameraModal({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<Stage>("streaming");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let active = true;

    async function startStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "";
        if (/NotAllowed|Permission/i.test(msg)) {
          setErrorMsg("Permiso de cámara denegado. Actívalo en la configuración de tu navegador.");
        } else if (/NotFound|DevicesNotFound/i.test(msg)) {
          setErrorMsg("No se detectó cámara en este dispositivo.");
        } else {
          setErrorMsg("Error al acceder a la cámara. Intenta recargar la página.");
        }
        setStage("error");
      }
    }

    startStream();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setStage("previewing");
  }

  function handleRetake() {
    setStage("streaming");
  }

  function handleUse() {
    canvasRef.current?.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `captura-${Date.now()}.jpg`, { type: "image/jpeg" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#17171f] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-violet-400" />
            <span className="font-semibold text-white text-sm">Captura con cámara</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {stage === "error" ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Camera size={40} className="text-slate-600" />
              <p className="text-red-400 text-sm max-w-xs">{errorMsg}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${stage === "previewing" ? "hidden" : ""}`}
                />
                <canvas
                  ref={canvasRef}
                  className={`w-full h-full object-cover ${stage === "streaming" ? "hidden" : ""}`}
                />
                {stage === "previewing" && (
                  <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    Vista previa
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                {stage === "streaming" ? (
                  <>
                    <button
                      onClick={handleCapture}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold text-sm transition-colors"
                    >
                      <span className="w-3 h-3 rounded-full bg-white inline-block" />
                      Capturar foto
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleUse}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold text-sm transition-colors"
                    >
                      <Check size={16} />
                      Usar foto
                    </button>
                    <button
                      onClick={handleRetake}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm transition-colors"
                    >
                      <RotateCcw size={14} />
                      Repetir
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

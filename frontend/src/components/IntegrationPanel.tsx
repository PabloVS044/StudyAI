import { useState, useEffect } from "react";
import { Save, BookMarked, HardDrive, FileCode2, CheckCircle2, ExternalLink, Link } from "lucide-react";
import Spinner from "./Spinner";
import { getMyIntegrations, exportNotion, exportDrive, exportObsidian, saveObsidianVault } from "../api/client";
import { useConfig } from "../hooks/useConfig";
import type { NoteContent } from "../types/note";

interface Props {
  noteId: string;
  filename: string;
  imageExt?: string;
  content: NoteContent;
  saved?: boolean;
  notionUrl?: string;
  driveUrl?: string;
  onSave?: () => Promise<void>;
}

type Status = "idle" | "loading" | "done" | "error";

export default function IntegrationPanel({
  noteId,
  filename,
  content,
  saved: initialSaved = false,
  notionUrl: initialNotionUrl,
  driveUrl: initialDriveUrl,
  onSave,
}: Props) {
  const cfg = useConfig();

  const [savingNote, setSavingNote] = useState(false);
  const [saved, setSaved] = useState(initialSaved);

  // Per-user integration state loaded from backend
  const [integrations, setIntegrations] = useState<{
    notion: { connected: boolean; account: string | null; book: string | null; available: boolean };
    google: { connected: boolean; account: string | null; folder: string | null; available: boolean };
  } | null>(null);

  useEffect(() => {
    getMyIntegrations().then(setIntegrations).catch(() => {});
  }, []);

  const [notionStatus, setNotionStatus] = useState<Status>(initialNotionUrl ? "done" : "idle");
  const [notionUrl, setNotionUrl] = useState(initialNotionUrl ?? "");

  const [driveStatus, setDriveStatus] = useState<Status>(initialDriveUrl ? "done" : "idle");
  const [driveUrl, setDriveUrl] = useState(initialDriveUrl ?? "");

  const [obsExportStatus, setObsExportStatus] = useState<Status>("idle");
  const [obsVaultStatus, setObsVaultStatus] = useState<Status>("idle");
  const [obsUri, setObsUri] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  async function handleSave() {
    if (!onSave) return;
    setSavingNote(true);
    setErrorMsg("");
    try {
      await onSave();
      setSaved(true);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleNotion() {
    setNotionStatus("loading");
    setErrorMsg("");
    try {
      const res = await exportNotion(noteId);
      setNotionUrl(res.url);
      setNotionStatus("done");
    } catch (e) {
      setNotionStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Error de Notion");
    }
  }

  async function handleDrive() {
    setDriveStatus("loading");
    setErrorMsg("");
    try {
      const res = await exportDrive(noteId);
      setDriveUrl(res.url);
      setDriveStatus("done");
    } catch (e) {
      setDriveStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Error de Drive");
    }
  }

  async function handleObsidianExport() {
    setObsExportStatus("loading");
    setErrorMsg("");
    try {
      await exportObsidian(noteId);
      setObsExportStatus("done");
      setTimeout(() => setObsExportStatus("idle"), 3000);
    } catch (e) {
      setObsExportStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Error al exportar");
    }
  }

  async function handleObsidianVault() {
    setObsVaultStatus("loading");
    setErrorMsg("");
    try {
      const res = await saveObsidianVault(noteId);
      setObsUri(res.obsidian_uri);
      setObsVaultStatus("done");
    } catch (e) {
      setObsVaultStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Error al guardar en vault");
    }
  }

  function copyMarkdown() {
    const c = content;
    let md = "";
    if (c.titulo) md += `# ${c.titulo}\n\n`;
    if (c.texto_principal) md += `## Texto\n${c.texto_principal}\n\n`;
    if (c.formulas?.length) {
      md += "## Fórmulas\n";
      c.formulas.forEach((f) => {
        if (f.descripcion) md += `**${f.descripcion}**\n`;
        md += `$$${f.latex || f.texto_plano}$$\n\n`;
      });
    }
    if (c.definiciones?.length) {
      md += "## Definiciones\n";
      c.definiciones.forEach((d) => md += `**${d.termino}**: ${d.definicion}\n`);
      md += "\n";
    }
    if (c.listas?.length) {
      md += "## Listas\n";
      c.listas.forEach((l) => {
        l.items.forEach((item, i) => {
          md += l.tipo === "numerada" ? `${i + 1}. ${item}\n` : `- ${item}\n`;
        });
        md += "\n";
      });
    }
    if (c.observaciones) md += `## Observaciones\n${c.observaciones}\n`;
    navigator.clipboard.writeText(md).catch(() => {});
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Divider */}
      <div className="border-t border-slate-700/50 pt-3">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Guardar y sincronizar</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Save to StudyAI */}
        {!saved && onSave && (
          <ActionBtn
            icon={savingNote ? <Spinner size={14} /> : <Save size={14} />}
            label={savingNote ? "Guardando…" : "Guardar en StudyAI"}
            onClick={handleSave}
            disabled={savingNote}
            variant="primary"
          />
        )}
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={14} /> Guardado en StudyAI
          </span>
        )}

        {/* Copy Markdown */}
        <ActionBtn
          icon={<FileCode2 size={14} />}
          label="Copiar Markdown"
          onClick={copyMarkdown}
        />

        {/* Notion */}
        {saved && integrations?.notion.available && (
          notionStatus === "done" ? (
            <a href={notionUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-slate-200">
              <ExternalLink size={13} /> Ver en Notion
            </a>
          ) : integrations.notion.connected && integrations.notion.book ? (
            <ActionBtn
              icon={notionStatus === "loading" ? <Spinner size={14} /> : <BookMarked size={14} />}
              label={notionStatus === "loading" ? "Guardando…" : notionStatus === "error" ? "Reintentar Notion" : "Guardar en Notion"}
              onClick={handleNotion}
              disabled={notionStatus === "loading"}
              variant={notionStatus === "error" ? "danger" : "secondary"}
            />
          ) : integrations.notion.connected ? (
            <a href="/integrations"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <BookMarked size={14} /> Elige un libro en Integraciones
            </a>
          ) : (
            <a href="/integrations"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <Link size={14} /> Conecta Notion en Integraciones
            </a>
          )
        )}

        {/* Google Drive */}
        {saved && integrations?.google.available && (
          driveStatus === "done" ? (
            <a href={driveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-slate-200">
              <ExternalLink size={13} /> Ver en Drive
            </a>
          ) : integrations.google.connected && integrations.google.folder ? (
            <ActionBtn
              icon={driveStatus === "loading" ? <Spinner size={14} /> : <HardDrive size={14} />}
              label={driveStatus === "loading" ? "Subiendo…" : driveStatus === "error" ? "Reintentar Drive" : "Subir foto a Drive"}
              onClick={handleDrive}
              disabled={driveStatus === "loading"}
              variant={driveStatus === "error" ? "danger" : "secondary"}
            />
          ) : integrations.google.connected ? (
            <a href="/integrations"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <HardDrive size={14} /> Elige una carpeta en Integraciones
            </a>
          ) : (
            <a href="/integrations"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <Link size={14} /> Conecta Drive en Integraciones
            </a>
          )
        )}

        {/* Obsidian export */}
        {saved && (
          <ActionBtn
            icon={obsExportStatus === "loading" ? <Spinner size={14} /> : obsExportStatus === "done" ? <CheckCircle2 size={14} /> : <FileCode2 size={14} />}
            label={obsExportStatus === "loading" ? "Exportando…" : obsExportStatus === "done" ? "Descargado!" : "Exportar .md"}
            onClick={handleObsidianExport}
            disabled={obsExportStatus === "loading"}
            variant="secondary"
          />
        )}

        {/* Obsidian vault */}
        {cfg.obsidian && saved && (
          obsVaultStatus === "done" ? (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 size={14} /> Guardado en Vault
              </span>
              {obsUri && (
                <a href={obsUri}
                  className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-slate-200">
                  <ExternalLink size={13} /> Abrir en Obsidian
                </a>
              )}
            </span>
          ) : (
            <ActionBtn
              icon={obsVaultStatus === "loading" ? <Spinner size={14} /> : <FileCode2 size={14} />}
              label={obsVaultStatus === "loading" ? "Guardando…" : obsVaultStatus === "error" ? "Reintentar Vault" : "Guardar en Obsidian"}
              onClick={handleObsidianVault}
              disabled={obsVaultStatus === "loading"}
              variant={obsVaultStatus === "error" ? "danger" : "secondary"}
            />
          )
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

type Variant = "primary" | "secondary" | "danger";

function ActionBtn({
  icon, label, onClick, disabled, variant = "secondary",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: Variant;
}) {
  const cls: Record<Variant, string> = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600",
    danger: "bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-700/50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${cls[variant]}`}
    >
      {icon} {label}
    </button>
  );
}

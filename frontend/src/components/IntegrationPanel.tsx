import { useState, useEffect } from "react";
import { Save, BookMarked, HardDrive, FileCode2, CheckCircle2, ExternalLink, Link, FolderOpen } from "lucide-react";
import Spinner from "./Spinner";
import { getMyIntegrations, exportNotion, exportDrive, exportObsidian, getObsidianMarkdown } from "../api/client";
import { useAppSettings } from "../context/AppSettings";
import type { NoteContent } from "../types/note";
import { notify } from "../lib/toast";
import {
  isSupported,
  pickVaultFolder,
  getSavedVault,
  writeNote,
  obsidianUri,
  safeFilename,
} from "../utils/obsidianVault";

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

const COPY = {
  es: {
    syncLabel: "Guardar y sincronizar",
    saving: "Guardando…",
    saveStudyAI: "Guardar en StudyAI",
    savedStudyAI: "Guardado en StudyAI",
    copyMd: "Copiar Markdown",
    viewNotion: "Ver en Notion",
    savingNotion: "Guardando…",
    retryNotion: "Reintentar Notion",
    saveNotion: "Guardar en Notion",
    pickBookNotion: "Elige un libro en Integraciones",
    connectNotion: "Conecta Notion en Integraciones",
    viewDrive: "Ver en Drive",
    uploadingDrive: "Subiendo…",
    retryDrive: "Reintentar Drive",
    saveDrive: "Subir foto a Drive",
    pickFolderDrive: "Elige una carpeta en Integraciones",
    connectDrive: "Conecta Drive en Integraciones",
    exportMd: "Exportar .md",
    exporting: "Exportando…",
    downloaded: "Descargado!",
    noFsapi: "Tu navegador no soporta seleccionar carpeta.",
    pickFolder: "Elegir carpeta de Obsidian",
    vaultFolder: "Carpeta",
    changeFolder: "Cambiar",
    saveObsidian: "Guardar en Obsidian",
    savingObsidian: "Guardando…",
    savedVault: "Guardado en Vault",
    openObsidian: "Abrir en Obsidian",
    retryObsidian: "Reintentar",
    toastSavedNotion: "Guardado en Notion",
    toastSavedDrive: "Guardado en Drive",
    toastSavedObsidian: "Guardado en Obsidian",
    toastErrNotion: "No se pudo exportar a Notion",
    toastErrDrive: "No se pudo subir a Drive",
    toastErrObsidian: "No se pudo guardar en Obsidian",
    toastErrSave: "No se pudo guardar la nota",
  },
  en: {
    syncLabel: "Save and sync",
    saving: "Saving…",
    saveStudyAI: "Save to StudyAI",
    savedStudyAI: "Saved to StudyAI",
    copyMd: "Copy Markdown",
    viewNotion: "View in Notion",
    savingNotion: "Saving…",
    retryNotion: "Retry Notion",
    saveNotion: "Save to Notion",
    pickBookNotion: "Pick a book in Integrations",
    connectNotion: "Connect Notion in Integrations",
    viewDrive: "View in Drive",
    uploadingDrive: "Uploading…",
    retryDrive: "Retry Drive",
    saveDrive: "Upload photo to Drive",
    pickFolderDrive: "Pick a folder in Integrations",
    connectDrive: "Connect Drive in Integrations",
    exportMd: "Export .md",
    exporting: "Exporting…",
    downloaded: "Downloaded!",
    noFsapi: "Your browser does not support folder selection.",
    pickFolder: "Choose Obsidian folder",
    vaultFolder: "Folder",
    changeFolder: "Change",
    saveObsidian: "Save to Obsidian",
    savingObsidian: "Saving…",
    savedVault: "Saved to Vault",
    openObsidian: "Open in Obsidian",
    retryObsidian: "Retry",
    toastSavedNotion: "Saved to Notion",
    toastSavedDrive: "Saved to Drive",
    toastSavedObsidian: "Saved to Obsidian",
    toastErrNotion: "Could not export to Notion",
    toastErrDrive: "Could not upload to Drive",
    toastErrObsidian: "Could not save to Obsidian",
    toastErrSave: "Could not save the note",
  },
} as const;

export default function IntegrationPanel({
  noteId,
  filename,
  content,
  saved: initialSaved = false,
  notionUrl: initialNotionUrl,
  driveUrl: initialDriveUrl,
  onSave,
}: Props) {
  const { lang } = useAppSettings();
  const t = COPY[lang];

  const [savingNote, setSavingNote] = useState(false);
  const [saved, setSaved] = useState(initialSaved);

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

  // Vault state
  const fsSupported = isSupported();
  const [vaultName, setVaultName] = useState<string | null>(null);
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [obsVaultStatus, setObsVaultStatus] = useState<Status>("idle");
  const [obsUri, setObsUri] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  // Load saved vault on mount
  useEffect(() => {
    if (!fsSupported) return;
    getSavedVault().then((v) => {
      if (v) {
        setVaultName(v.name);
        setVaultHandle(v.handle);
      }
    }).catch(() => {});
  }, [fsSupported]);

  async function handleSave() {
    if (!onSave) return;
    setSavingNote(true);
    try {
      await onSave();
      setSaved(true);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : t.toastErrSave);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleNotion() {
    setNotionStatus("loading");
    try {
      const res = await exportNotion(noteId);
      setNotionUrl(res.url);
      setNotionStatus("done");
      notify.success(t.toastSavedNotion);
    } catch (e) {
      setNotionStatus("error");
      notify.error(e instanceof Error ? e.message : t.toastErrNotion);
    }
  }

  async function handleDrive() {
    setDriveStatus("loading");
    try {
      const res = await exportDrive(noteId);
      setDriveUrl(res.url);
      setDriveStatus("done");
      notify.success(t.toastSavedDrive);
    } catch (e) {
      setDriveStatus("error");
      notify.error(e instanceof Error ? e.message : t.toastErrDrive);
    }
  }

  async function handleObsidianExport() {
    setObsExportStatus("loading");
    try {
      await exportObsidian(noteId);
      setObsExportStatus("done");
      notify.success(t.toastSavedObsidian);
      setTimeout(() => setObsExportStatus("idle"), 3000);
    } catch (e) {
      setObsExportStatus("error");
      notify.error(e instanceof Error ? e.message : t.toastErrObsidian);
    }
  }

  async function handlePickFolder() {
    setErrorMsg("");
    try {
      const { name } = await pickVaultFolder();
      const vault = await getSavedVault();
      if (vault) {
        setVaultName(vault.name);
        setVaultHandle(vault.handle);
      } else {
        setVaultName(name);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        setErrorMsg(e.message);
      }
    }
  }

  async function handleObsidianVault() {
    if (!vaultHandle || !vaultName) return;
    setObsVaultStatus("loading");
    try {
      const md = await getObsidianMarkdown(noteId);
      const stem = safeFilename(content.titulo ?? filename);
      await writeNote(vaultHandle, `${stem}.md`, md);
      setObsUri(obsidianUri(vaultName, stem));
      setObsVaultStatus("done");
      notify.success(t.toastSavedObsidian);
    } catch (e) {
      setObsVaultStatus("error");
      notify.error(e instanceof Error ? e.message : t.toastErrObsidian);
    }
  }

  function copyMarkdown() {
    const c = content;
    let md = "";
    if (c.titulo) md += `# ${c.titulo}\n\n`;
    if (c.texto_principal) md += `## Texto\n${c.texto_principal}\n\n`;
    if (c.formulas?.length) {
      md += "## Formulas\n";
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
      <div className="border-t border-slate-700/50 pt-3">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">{t.syncLabel}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Save to StudyAI */}
        {!saved && onSave && (
          <ActionBtn
            icon={savingNote ? <Spinner size={14} /> : <Save size={14} />}
            label={savingNote ? t.saving : t.saveStudyAI}
            onClick={handleSave}
            disabled={savingNote}
            variant="primary"
          />
        )}
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={14} /> {t.savedStudyAI}
          </span>
        )}

        {/* Copy Markdown */}
        <ActionBtn
          icon={<FileCode2 size={14} />}
          label={t.copyMd}
          onClick={copyMarkdown}
        />

        {/* Notion */}
        {saved && integrations?.notion.available && (
          notionStatus === "done" ? (
            <a href={notionUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-slate-200">
              <ExternalLink size={13} /> {t.viewNotion}
            </a>
          ) : integrations.notion.connected && integrations.notion.book ? (
            <ActionBtn
              icon={notionStatus === "loading" ? <Spinner size={14} /> : <BookMarked size={14} />}
              label={notionStatus === "loading" ? t.savingNotion : notionStatus === "error" ? t.retryNotion : t.saveNotion}
              onClick={handleNotion}
              disabled={notionStatus === "loading"}
              variant={notionStatus === "error" ? "danger" : "secondary"}
            />
          ) : integrations.notion.connected ? (
            <a href="/integrations"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <BookMarked size={14} /> {t.pickBookNotion}
            </a>
          ) : (
            <a href="/integrations"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <Link size={14} /> {t.connectNotion}
            </a>
          )
        )}

        {/* Google Drive */}
        {saved && integrations?.google.available && (
          driveStatus === "done" ? (
            <a href={driveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-slate-200">
              <ExternalLink size={13} /> {t.viewDrive}
            </a>
          ) : integrations.google.connected && integrations.google.folder ? (
            <ActionBtn
              icon={driveStatus === "loading" ? <Spinner size={14} /> : <HardDrive size={14} />}
              label={driveStatus === "loading" ? t.uploadingDrive : driveStatus === "error" ? t.retryDrive : t.saveDrive}
              onClick={handleDrive}
              disabled={driveStatus === "loading"}
              variant={driveStatus === "error" ? "danger" : "secondary"}
            />
          ) : integrations.google.connected ? (
            <a href="/integrations"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <HardDrive size={14} /> {t.pickFolderDrive}
            </a>
          ) : (
            <a href="/integrations"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg transition-colors">
              <Link size={14} /> {t.connectDrive}
            </a>
          )
        )}

        {/* Obsidian section */}
        {saved && (
          <>
            {!fsSupported ? (
              // Fallback: download-only
              <span className="flex flex-wrap items-center gap-2">
                <ActionBtn
                  icon={obsExportStatus === "loading" ? <Spinner size={14} /> : obsExportStatus === "done" ? <CheckCircle2 size={14} /> : <FileCode2 size={14} />}
                  label={obsExportStatus === "loading" ? t.exporting : obsExportStatus === "done" ? t.downloaded : t.exportMd}
                  onClick={handleObsidianExport}
                  disabled={obsExportStatus === "loading"}
                  variant="secondary"
                />
                <span className="text-xs text-slate-500">{t.noFsapi}</span>
              </span>
            ) : !vaultHandle ? (
              // No folder chosen yet — show export fallback + pick button
              <span className="flex flex-wrap items-center gap-2">
                <ActionBtn
                  icon={obsExportStatus === "loading" ? <Spinner size={14} /> : obsExportStatus === "done" ? <CheckCircle2 size={14} /> : <FileCode2 size={14} />}
                  label={obsExportStatus === "loading" ? t.exporting : obsExportStatus === "done" ? t.downloaded : t.exportMd}
                  onClick={handleObsidianExport}
                  disabled={obsExportStatus === "loading"}
                  variant="secondary"
                />
                <ActionBtn
                  icon={<FolderOpen size={14} />}
                  label={t.pickFolder}
                  onClick={handlePickFolder}
                  variant="secondary"
                />
              </span>
            ) : (
              // Folder chosen
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 break-all">
                  {t.vaultFolder}: <span className="text-slate-200 font-medium">{vaultName}</span>
                </span>
                <button
                  onClick={handlePickFolder}
                  className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
                >
                  {t.changeFolder}
                </button>
                {obsVaultStatus === "done" ? (
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 size={14} /> {t.savedVault}
                    </span>
                    {obsUri && (
                      <a href={obsUri}
                        className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors text-slate-200">
                        <ExternalLink size={13} /> {t.openObsidian}
                      </a>
                    )}
                  </span>
                ) : (
                  <ActionBtn
                    icon={obsVaultStatus === "loading" ? <Spinner size={14} /> : <FileCode2 size={14} />}
                    label={obsVaultStatus === "loading" ? t.savingObsidian : obsVaultStatus === "error" ? t.retryObsidian : t.saveObsidian}
                    onClick={handleObsidianVault}
                    disabled={obsVaultStatus === "loading"}
                    variant={obsVaultStatus === "error" ? "danger" : "secondary"}
                  />
                )}
              </span>
            )}
          </>
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

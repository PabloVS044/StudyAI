import { useEffect, useRef, useState } from "react";
import TopBar from "../components/TopBar";
import {
  getConfig,
  getMyIntegrations,
  getObsidianMarkdown,
  disconnectIntegration,
  notionConnectUrl,
  exchangeNotion,
  googleConnectUrl,
  listNotionParents,
  listNotionBooks,
  createNotionBook,
  selectNotionBook,
  listDriveFolders,
  createDriveFolder,
  selectDriveFolder,
  type MyIntegrations,
} from "../api/client";
import { useAppSettings } from "../context/AppSettings";
import {
  isSupported,
  pickVaultFolder,
  getSavedVault,
  writeNote,
  obsidianUri,
  safeFilename,
} from "../utils/obsidianVault";
import { confirmDialog } from "../lib/swal";
import { notify } from "../lib/toast";

const COPY = {
  es: {
    pageTitle: "Centro de Conexiones",
    pageSubtitle: "Sincroniza tus materiales y exporta insights a tus herramientas favoritas.",
    activeIntegrations: "Integraciones activas",
    checkingStatuses: "Verificando estados...",
    coreStatus: "Estado del nucleo",
    coreDesc: "Estado de conexion de los motores de procesamiento en segundo plano:",
    quickExport: "Exportacion rapida",
    exportDesc: "Selecciona un formato para exportar tu sesion de estudio activa o elementos de la biblioteca.",
    exportFormats: [
      { icon: "article", title: "Documento completo", formats: "PDF, DOCX" },
      { icon: "short_text", title: "Resumen IA", formats: "Markdown, TXT" },
      { icon: "style", title: "Flashcards", formats: "Anki, CSV" },
    ],
    active: "Activo",
    offline: "Error / Offline",
    // Obsidian
    obsidianDesc: "Sincroniza notas diarias y resumenes en markdown localmente.",
    obsidianVaultLabel: "Integracion con vault local",
    noFsapi: "Tu navegador no soporta seleccionar carpeta.",
    pickFolder: "Elegir carpeta de Obsidian",
    exportMd: "Exportar .md",
    vaultFolder: "Carpeta",
    changeFolder: "Cambiar",
    saveObsidian: "Guardar en Obsidian",
    saving: "Guardando...",
    openObsidian: "Abrir en Obsidian",
    connected: "Conectado",
    // Notion
    notionNoOAuth: "Configura las llaves OAuth de Notion en el servidor.",
    notionOAuthOff: "OAuth no configurado",
    notionOAuthOn: "OAuth2 activo",
    notionAuthReq: "Requiere autenticacion",
    notionWorkspace: "Workspace:",
    notionBook: "Libro activo:",
    notionNoBook: "Sin seleccionar",
    notionDBSync: "Sincronizacion de base de datos para flashcards y conceptos.",
    notionUnavailable: "No disponible",
    notionConnect: "Conectar Notion",
    notionRedirecting: "Redirigiendo...",
    notionConnectSuccess: "Notion conectado correctamente.",
    notionConnectError: "Error al conectar Notion:",
    notionNewBook: "+ Nuevo libro",
    notionExisting: "Usar existente",
    notionDisconnect: "Desconectar",
    notionDisconnected: "Desconectado",
    notionDisconnectTitle: "Desconectar Notion",
    notionDisconnectText: "Se eliminara el acceso a tu workspace. Podras volver a conectarlo cuando quieras.",
    notionDisconnectConfirm: "Desconectar",
    notionDisconnectCancel: "Cancelar",
    notionDisconnectSuccess: "Notion desconectado.",
    notionBookCreated: "Libro creado correctamente.",
    notionBookSelected: "Libro seleccionado correctamente.",
    notionRedirectingMsg: "Redirigiendo a Notion...",
    // Drive
    driveNoOAuth: "Configura las llaves OAuth de Google en el servidor.",
    driveOAuthOff: "OAuth no configurado",
    driveOAuthOn: "OAuth2 activo",
    driveAuthReq: "Requiere autenticacion",
    driveAccount: "Cuenta:",
    driveFolder: "Carpeta activa:",
    driveNoFolder: "Sin seleccionar",
    driveImgSync: "Sube imagenes de notas a tu carpeta de Google Drive.",
    driveUnavailable: "No disponible",
    driveConnect: "Conectar Drive",
    driveRedirecting: "Redirigiendo...",
    driveNewFolder: "+ Nueva carpeta",
    driveExisting: "Usar existente",
    driveDisconnect: "Desconectar",
    driveDisconnected: "Desconectado",
    driveDisconnectTitle: "Desconectar Google Drive",
    driveDisconnectText: "Se eliminara el acceso a tu cuenta de Drive. Podras volver a conectarlo cuando quieras.",
    driveDisconnectConfirm: "Desconectar",
    driveDisconnectCancel: "Cancelar",
    driveDisconnectSuccess: "Google Drive desconectado.",
    driveFolderCreated: "Carpeta creada correctamente.",
    driveFolderSelected: "Carpeta seleccionada correctamente.",
    driveRedirectingMsg: "Redirigiendo a Google...",
    // Modals
    modalNewBook: "Nuevo libro en Notion",
    modalBookName: "Nombre del libro",
    modalBookPlaceholder: "Mis apuntes de Quimica",
    modalParentPage: "Pagina padre",
    modalCancel: "Cancelar",
    modalCreating: "Creando...",
    modalCreate: "Crear",
    modalSelectBook: "Seleccionar libro existente",
    modalBookLabel: "Libro (database)",
    modalNoBooks: "No hay databases accesibles en tu Notion.",
    modalSaving: "Guardando...",
    modalSelect: "Seleccionar",
    modalNewFolder: "Nueva carpeta en Drive",
    modalFolderName: "Nombre de la carpeta",
    modalFolderPlaceholder: "StudyAI Apuntes",
    modalSelectFolder: "Seleccionar carpeta existente",
    modalFolderLabel: "Carpeta",
    modalNoFolders: "No hay carpetas en tu Drive.",
  },
  en: {
    pageTitle: "Connection Hub",
    pageSubtitle: "Seamlessly sync your study materials and export insights to your favorite tools.",
    activeIntegrations: "Active Integrations",
    checkingStatuses: "Checking statuses...",
    coreStatus: "Core status",
    coreDesc: "Connection status for background processing engines:",
    quickExport: "Quick Export",
    exportDesc: "Select a format to export your currently active study session or library items.",
    exportFormats: [
      { icon: "article", title: "Full Document", formats: "PDF, DOCX" },
      { icon: "short_text", title: "AI Summary", formats: "Markdown, TXT" },
      { icon: "style", title: "Flashcards", formats: "Anki, CSV" },
    ],
    active: "Active",
    offline: "Error / Offline",
    // Obsidian
    obsidianDesc: "Syncs daily notes and markdown summaries locally.",
    obsidianVaultLabel: "Local vault integration",
    noFsapi: "Your browser does not support folder selection.",
    pickFolder: "Choose Obsidian folder",
    exportMd: "Export .md",
    vaultFolder: "Folder",
    changeFolder: "Change",
    saveObsidian: "Save to Obsidian",
    saving: "Saving...",
    openObsidian: "Open in Obsidian",
    connected: "Connected",
    // Notion
    notionNoOAuth: "Configure Notion OAuth keys on the server.",
    notionOAuthOff: "OAuth not configured",
    notionOAuthOn: "OAuth2 active",
    notionAuthReq: "Authentication required",
    notionWorkspace: "Workspace:",
    notionBook: "Active book:",
    notionNoBook: "Not selected",
    notionDBSync: "Database sync for flashcards and concepts.",
    notionUnavailable: "Not available",
    notionConnect: "Connect Notion",
    notionRedirecting: "Redirecting...",
    notionConnectSuccess: "Notion connected successfully.",
    notionConnectError: "Error connecting Notion:",
    notionNewBook: "+ New book",
    notionExisting: "Use existing",
    notionDisconnect: "Disconnect",
    notionDisconnected: "Disconnected",
    notionDisconnectTitle: "Disconnect Notion",
    notionDisconnectText: "Access to your workspace will be removed. You can reconnect at any time.",
    notionDisconnectConfirm: "Disconnect",
    notionDisconnectCancel: "Cancel",
    notionDisconnectSuccess: "Notion disconnected.",
    notionBookCreated: "Book created successfully.",
    notionBookSelected: "Book selected successfully.",
    notionRedirectingMsg: "Redirecting to Notion...",
    // Drive
    driveNoOAuth: "Configure Google OAuth keys on the server.",
    driveOAuthOff: "OAuth not configured",
    driveOAuthOn: "OAuth2 active",
    driveAuthReq: "Authentication required",
    driveAccount: "Account:",
    driveFolder: "Active folder:",
    driveNoFolder: "Not selected",
    driveImgSync: "Upload note images to your Google Drive folder.",
    driveUnavailable: "Not available",
    driveConnect: "Connect Drive",
    driveRedirecting: "Redirecting...",
    driveNewFolder: "+ New folder",
    driveExisting: "Use existing",
    driveDisconnect: "Disconnect",
    driveDisconnected: "Disconnected",
    driveDisconnectTitle: "Disconnect Google Drive",
    driveDisconnectText: "Access to your Drive account will be removed. You can reconnect at any time.",
    driveDisconnectConfirm: "Disconnect",
    driveDisconnectCancel: "Cancel",
    driveDisconnectSuccess: "Google Drive disconnected.",
    driveFolderCreated: "Folder created successfully.",
    driveFolderSelected: "Folder selected successfully.",
    driveRedirectingMsg: "Redirecting to Google...",
    // Modals
    modalNewBook: "New book in Notion",
    modalBookName: "Book name",
    modalBookPlaceholder: "My Chemistry Notes",
    modalParentPage: "Parent page",
    modalCancel: "Cancel",
    modalCreating: "Creating...",
    modalCreate: "Create",
    modalSelectBook: "Select existing book",
    modalBookLabel: "Book (database)",
    modalNoBooks: "No accessible databases in your Notion.",
    modalSaving: "Saving...",
    modalSelect: "Select",
    modalNewFolder: "New folder in Drive",
    modalFolderName: "Folder name",
    modalFolderPlaceholder: "StudyAI Notes",
    modalSelectFolder: "Select existing folder",
    modalFolderLabel: "Folder",
    modalNoFolders: "No folders in your Drive.",
  },
} as const;

// ── Notion modal state ─────────────────────────────────────────────────────────
type NotionModal =
  | { kind: "none" }
  | { kind: "new-book"; parents: { id: string; title: string }[]; title: string; parentId: string; busy: boolean }
  | { kind: "existing-book"; books: { id: string; title: string }[]; selectedId: string; selectedTitle: string; busy: boolean };

// ── Drive modal state ──────────────────────────────────────────────────────────
type DriveModal =
  | { kind: "none" }
  | { kind: "new-folder"; name: string; busy: boolean }
  | { kind: "existing-folder"; folders: { id: string; name: string }[]; selectedId: string; selectedName: string; busy: boolean };

export default function IntegrationsPage() {
  const { lang } = useAppSettings();
  const t = COPY[lang];

  const [integrations, setIntegrations] = useState<MyIntegrations | null>(null);
  const [coreStatus, setCoreStatus] = useState({ mistral: false, pinecone: false });
  const [loading, setLoading] = useState(true);

  // Notion modal
  const [notionModal, setNotionModal] = useState<NotionModal>({ kind: "none" });
  // Drive modal
  const [driveModal, setDriveModal] = useState<DriveModal>({ kind: "none" });

  const [actionBusy, setActionBusy] = useState<"notion" | "google" | null>(null);

  // guard: run the Notion OAuth callback exchange at most once per page load
  const notionExchangeDone = useRef(false);

  // Obsidian vault state
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [vaultName, setVaultName] = useState<string | null>(null);
  const [obsidianBusy, setObsidianBusy] = useState(false);
  const [obsidianLink, setObsidianLink] = useState<string | null>(null);

  useEffect(() => {
    if (isSupported()) {
      getSavedVault().then(v => {
        if (v) { setVaultHandle(v.handle); setVaultName(v.name); }
      });
    }
  }, []);

  const handlePickVault = async () => {
    try {
      const { name } = await pickVaultFolder();
      // Re-read handle with permission
      const v = await getSavedVault();
      if (v) { setVaultHandle(v.handle); setVaultName(v.name); }
      else setVaultName(name);
      setObsidianLink(null);
    } catch {
      // user cancelled
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [intData, cfg] = await Promise.all([getMyIntegrations(), getConfig()]);
      setIntegrations(intData);
      setCoreStatus({ mistral: !!(cfg as any).mistral, pinecone: cfg.pinecone });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Handle Notion OAuth redirect: /integrations?code=...&state=...
  useEffect(() => {
    if (notionExchangeDone.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) return;
    notionExchangeDone.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    exchangeNotion(code, state)
      .then(() => {
        notify.success(t.notionConnectSuccess);
        return load();
      })
      .catch(err => {
        notify.error(`${t.notionConnectError} ${(err as Error).message}`);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Notion actions ─────────────────────────────────────────────────────────
  const handleNotionConnect = async () => {
    try {
      setActionBusy("notion");
      const { auth_url } = await notionConnectUrl();
      notify.info(t.notionRedirectingMsg);
      window.location.href = auth_url;
    } catch (err) {
      notify.error((err as Error).message);
      setActionBusy(null);
    }
  };

  const handleNotionDisconnect = async () => {
    const ok = await confirmDialog({
      title: t.notionDisconnectTitle,
      text: t.notionDisconnectText,
      confirmText: t.notionDisconnectConfirm,
      cancelText: t.notionDisconnectCancel,
      icon: "warning",
    });
    if (!ok) return;
    try {
      setActionBusy("notion");
      await disconnectIntegration("notion");
      notify.success(t.notionDisconnectSuccess);
      await load();
    } catch (err) {
      notify.error((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const openNewBook = async () => {
    try {
      setActionBusy("notion");
      const parents = await listNotionParents();
      setNotionModal({ kind: "new-book", parents, title: "", parentId: parents[0]?.id ?? "", busy: false });
    } catch (err) {
      notify.error((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const openExistingBook = async () => {
    try {
      setActionBusy("notion");
      const books = await listNotionBooks();
      setNotionModal({ kind: "existing-book", books, selectedId: books[0]?.id ?? "", selectedTitle: books[0]?.title ?? "", busy: false });
    } catch (err) {
      notify.error((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const submitNewBook = async () => {
    if (notionModal.kind !== "new-book") return;
    if (!notionModal.title.trim()) { notify.error(lang === "es" ? "Escribe un nombre para el libro." : "Enter a name for the book."); return; }
    setNotionModal({ ...notionModal, busy: true });
    try {
      await createNotionBook({ title: notionModal.title.trim(), parent_page_id: notionModal.parentId || undefined });
      setNotionModal({ kind: "none" });
      notify.success(t.notionBookCreated);
      await load();
    } catch (err) {
      notify.error((err as Error).message);
      setNotionModal({ ...notionModal, busy: false });
    }
  };

  const submitExistingBook = async () => {
    if (notionModal.kind !== "existing-book") return;
    if (!notionModal.selectedId) { notify.error(lang === "es" ? "Selecciona un libro." : "Select a book."); return; }
    setNotionModal({ ...notionModal, busy: true });
    try {
      await selectNotionBook({ database_id: notionModal.selectedId, title: notionModal.selectedTitle });
      setNotionModal({ kind: "none" });
      notify.success(t.notionBookSelected);
      await load();
    } catch (err) {
      notify.error((err as Error).message);
      setNotionModal({ ...notionModal, busy: false });
    }
  };

  // ── Drive actions ──────────────────────────────────────────────────────────
  const handleDriveConnect = async () => {
    try {
      setActionBusy("google");
      const { auth_url } = await googleConnectUrl();
      notify.info(t.driveRedirectingMsg);
      window.location.href = auth_url;
    } catch (err) {
      notify.error((err as Error).message);
      setActionBusy(null);
    }
  };

  const handleDriveDisconnect = async () => {
    const ok = await confirmDialog({
      title: t.driveDisconnectTitle,
      text: t.driveDisconnectText,
      confirmText: t.driveDisconnectConfirm,
      cancelText: t.driveDisconnectCancel,
      icon: "warning",
    });
    if (!ok) return;
    try {
      setActionBusy("google");
      await disconnectIntegration("google");
      notify.success(t.driveDisconnectSuccess);
      await load();
    } catch (err) {
      notify.error((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const openNewFolder = () => {
    setDriveModal({ kind: "new-folder", name: "", busy: false });
  };

  const openExistingFolder = async () => {
    try {
      setActionBusy("google");
      const folders = await listDriveFolders();
      setDriveModal({ kind: "existing-folder", folders, selectedId: folders[0]?.id ?? "", selectedName: folders[0]?.name ?? "", busy: false });
    } catch (err) {
      notify.error((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const submitNewFolder = async () => {
    if (driveModal.kind !== "new-folder") return;
    if (!driveModal.name.trim()) { notify.error(lang === "es" ? "Escribe un nombre para la carpeta." : "Enter a name for the folder."); return; }
    setDriveModal({ ...driveModal, busy: true });
    try {
      await createDriveFolder({ name: driveModal.name.trim() });
      setDriveModal({ kind: "none" });
      notify.success(t.driveFolderCreated);
      await load();
    } catch (err) {
      notify.error((err as Error).message);
      setDriveModal({ ...driveModal, busy: false });
    }
  };

  const submitExistingFolder = async () => {
    if (driveModal.kind !== "existing-folder") return;
    if (!driveModal.selectedId) { notify.error(lang === "es" ? "Selecciona una carpeta." : "Select a folder."); return; }
    setDriveModal({ ...driveModal, busy: true });
    try {
      await selectDriveFolder({ folder_id: driveModal.selectedId, name: driveModal.selectedName });
      setDriveModal({ kind: "none" });
      notify.success(t.driveFolderSelected);
      await load();
    } catch (err) {
      notify.error((err as Error).message);
      setDriveModal({ ...driveModal, busy: false });
    }
  };

  const notion = integrations?.notion;
  const google = integrations?.google;

  return (
    <>
      <TopBar searchPlaceholder="Search..." />

      {/* Notion modal */}
      {notionModal.kind !== "none" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm shadow-xl border border-surface-variant flex flex-col gap-4">
            {notionModal.kind === "new-book" && (
              <>
                <h4 className="text-headline-sm text-on-surface">{t.modalNewBook}</h4>
                <div className="flex flex-col gap-2">
                  <label className="text-label-md text-on-surface-variant">{t.modalBookName}</label>
                  <input
                    className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    value={notionModal.title}
                    onChange={e => setNotionModal({ ...notionModal, title: e.target.value })}
                    placeholder={t.modalBookPlaceholder}
                    disabled={notionModal.busy}
                  />
                </div>
                {notionModal.parents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">{t.modalParentPage}</label>
                    <select
                      className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                      value={notionModal.parentId}
                      onChange={e => setNotionModal({ ...notionModal, parentId: e.target.value })}
                      disabled={notionModal.busy}
                    >
                      {notionModal.parents.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setNotionModal({ kind: "none" })}
                    disabled={notionModal.busy}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container-low"
                  >
                    {t.modalCancel}
                  </button>
                  <button
                    onClick={submitNewBook}
                    disabled={notionModal.busy}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:bg-primary/90 disabled:opacity-60"
                  >
                    {notionModal.busy ? t.modalCreating : t.modalCreate}
                  </button>
                </div>
              </>
            )}
            {notionModal.kind === "existing-book" && (
              <>
                <h4 className="text-headline-sm text-on-surface">{t.modalSelectBook}</h4>
                {notionModal.books.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">{t.modalNoBooks}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">{t.modalBookLabel}</label>
                    <select
                      className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                      value={notionModal.selectedId}
                      onChange={e => {
                        const found = notionModal.books.find(b => b.id === e.target.value);
                        setNotionModal({ ...notionModal, selectedId: e.target.value, selectedTitle: found?.title ?? "" });
                      }}
                      disabled={notionModal.busy}
                    >
                      {notionModal.books.map(b => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setNotionModal({ kind: "none" })}
                    disabled={notionModal.busy}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container-low"
                  >
                    {t.modalCancel}
                  </button>
                  {notionModal.books.length > 0 && (
                    <button
                      onClick={submitExistingBook}
                      disabled={notionModal.busy}
                      className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:bg-primary/90 disabled:opacity-60"
                    >
                      {notionModal.busy ? t.modalSaving : t.modalSelect}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Drive modal */}
      {driveModal.kind !== "none" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm shadow-xl border border-surface-variant flex flex-col gap-4">
            {driveModal.kind === "new-folder" && (
              <>
                <h4 className="text-headline-sm text-on-surface">{t.modalNewFolder}</h4>
                <div className="flex flex-col gap-2">
                  <label className="text-label-md text-on-surface-variant">{t.modalFolderName}</label>
                  <input
                    className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    value={driveModal.name}
                    onChange={e => setDriveModal({ ...driveModal, name: e.target.value })}
                    placeholder={t.modalFolderPlaceholder}
                    disabled={driveModal.busy}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setDriveModal({ kind: "none" })}
                    disabled={driveModal.busy}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container-low"
                  >
                    {t.modalCancel}
                  </button>
                  <button
                    onClick={submitNewFolder}
                    disabled={driveModal.busy}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:bg-primary/90 disabled:opacity-60"
                  >
                    {driveModal.busy ? t.modalCreating : t.modalCreate}
                  </button>
                </div>
              </>
            )}
            {driveModal.kind === "existing-folder" && (
              <>
                <h4 className="text-headline-sm text-on-surface">{t.modalSelectFolder}</h4>
                {driveModal.folders.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">{t.modalNoFolders}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">{t.modalFolderLabel}</label>
                    <select
                      className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                      value={driveModal.selectedId}
                      onChange={e => {
                        const found = driveModal.folders.find(f => f.id === e.target.value);
                        setDriveModal({ ...driveModal, selectedId: e.target.value, selectedName: found?.name ?? "" });
                      }}
                      disabled={driveModal.busy}
                    >
                      {driveModal.folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setDriveModal({ kind: "none" })}
                    disabled={driveModal.busy}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container-low"
                  >
                    {t.modalCancel}
                  </button>
                  {driveModal.folders.length > 0 && (
                    <button
                      onClick={submitExistingFolder}
                      disabled={driveModal.busy}
                      className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:bg-primary/90 disabled:opacity-60"
                    >
                      {driveModal.busy ? t.modalSaving : t.modalSelect}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 ml-0 md:ml-64 pt-24 px-gutter pb-xl flex justify-center">
        <div className="w-full max-w-container-max flex flex-col gap-lg">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-display-lg text-primary mb-2">{t.pageTitle}</h2>
              <p className="text-body-lg text-on-surface-variant max-w-2xl">{t.pageSubtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            {/* Active Integrations */}
            <div className="lg:col-span-2 flex flex-col gap-md">
              <div className="flex justify-between items-center">
                <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">sync</span>
                  {t.activeIntegrations}
                </h3>
                {loading && <span className="text-caption text-outline animate-pulse">{t.checkingStatuses}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">

                {/* Obsidian card */}
                <div className="bg-surface rounded-xl p-md border border-surface-variant shadow-[0_2px_4px_rgba(21,69,57,0.05)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#7C3AED1A" }}>
                      <span className="material-symbols-outlined text-3xl" style={{ color: "#7C3AED" }}>folder_data</span>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-caption rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> {t.connected}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-body-lg text-on-surface mb-1 font-bold">Obsidian</h4>
                    <p className="text-body-md text-on-surface-variant mb-4">{t.obsidianDesc}</p>
                    <div className="text-caption text-outline mb-4">{t.obsidianVaultLabel}</div>
                    {vaultName && (
                      <div className="text-caption text-on-surface-variant mb-2">
                        {t.vaultFolder}: <span className="text-on-surface font-medium">{vaultName}</span>
                        {" "}<button onClick={handlePickVault} className="text-primary underline text-xs ml-1">{t.changeFolder}</button>
                      </div>
                    )}
                    {obsidianLink && (
                      <a
                        href={obsidianLink}
                        className="inline-block text-caption text-primary underline mb-2"
                      >
                        {t.openObsidian}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!isSupported() ? (
                      <>
                        <p className="text-caption text-on-surface-variant">{t.noFsapi}</p>
                        <button
                          className="w-full py-2 rounded-lg text-label-md transition-colors border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                          disabled
                        >
                          {t.exportMd}
                        </button>
                      </>
                    ) : !vaultHandle ? (
                      <button
                        onClick={handlePickVault}
                        className="w-full py-2 rounded-lg text-label-md transition-colors bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container"
                      >
                        {t.pickFolder}
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!vaultHandle || !vaultName) return;
                          setObsidianBusy(true);
                          setObsidianLink(null);
                          try {
                            const md = await getObsidianMarkdown("current");
                            const stem = safeFilename(undefined);
                            await writeNote(vaultHandle, stem + ".md", md);
                            setObsidianLink(obsidianUri(vaultName, stem));
                          } catch (err) {
                            notify.error((err as Error).message);
                          } finally {
                            setObsidianBusy(false);
                          }
                        }}
                        disabled={obsidianBusy}
                        className="w-full py-2 rounded-lg text-label-md transition-colors bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-60"
                      >
                        {obsidianBusy ? t.saving : t.saveObsidian}
                      </button>
                    )}
                  </div>
                </div>

                {/* Notion card */}
                <div className={`bg-surface rounded-xl p-md border border-surface-variant shadow-[0_2px_4px_rgba(21,69,57,0.05)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 ${!notion?.connected ? "opacity-80" : ""}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-on-surface/10">
                      <span className="material-symbols-outlined text-3xl">dns</span>
                    </div>
                    {notion?.connected ? (
                      <span className="px-3 py-1 bg-primary/10 text-primary text-caption rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> {t.connected}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-secondary/10 text-secondary text-caption rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">pending</span> {t.notionDisconnected}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-body-lg text-on-surface mb-1 font-bold">Notion</h4>
                    {!notion?.available ? (
                      <p className="text-body-md text-on-surface-variant mb-4">{t.notionNoOAuth}</p>
                    ) : notion?.connected ? (
                      <>
                        <p className="text-body-md text-on-surface-variant mb-1">{t.notionWorkspace} <span className="text-on-surface font-medium">{notion.account ?? "-"}</span></p>
                        <p className="text-body-md text-on-surface-variant mb-4">{t.notionBook} <span className="text-on-surface font-medium">{notion.book ?? t.notionNoBook}</span></p>
                      </>
                    ) : (
                      <p className="text-body-md text-on-surface-variant mb-4">{t.notionDBSync}</p>
                    )}
                    <div className="text-caption text-outline mb-4">
                      {!notion?.available ? t.notionOAuthOff : notion?.connected ? t.notionOAuthOn : t.notionAuthReq}
                    </div>
                  </div>
                  {!notion?.available ? (
                    <button disabled className="w-full py-2 rounded-lg text-label-md border border-outline-variant text-outline opacity-50 cursor-not-allowed">
                      {t.notionUnavailable}
                    </button>
                  ) : !notion?.connected ? (
                    <button
                      onClick={handleNotionConnect}
                      disabled={actionBusy === "notion"}
                      className="w-full py-2 rounded-lg text-label-md transition-colors bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-60"
                    >
                      {actionBusy === "notion" ? t.notionRedirecting : t.notionConnect}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={openNewBook}
                          disabled={actionBusy === "notion"}
                          className="flex-1 py-2 rounded-lg text-label-md transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-60 text-xs"
                        >
                          {t.notionNewBook}
                        </button>
                        <button
                          onClick={openExistingBook}
                          disabled={actionBusy === "notion"}
                          className="flex-1 py-2 rounded-lg text-label-md transition-colors border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60 text-xs"
                        >
                          {t.notionExisting}
                        </button>
                      </div>
                      <button
                        onClick={handleNotionDisconnect}
                        disabled={actionBusy === "notion"}
                        className="w-full py-1.5 rounded-lg text-label-md transition-colors border border-error/30 text-error hover:bg-error/5 disabled:opacity-60 text-xs"
                      >
                        {t.notionDisconnect}
                      </button>
                    </div>
                  )}
                </div>

                {/* Google Drive card */}
                <div className={`bg-surface rounded-xl p-md border border-surface-variant shadow-[0_2px_4px_rgba(21,69,57,0.05)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 ${!google?.connected ? "opacity-80" : ""}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#4285F41A" }}>
                      <span className="material-symbols-outlined text-3xl" style={{ color: "#4285F4" }}>description</span>
                    </div>
                    {google?.connected ? (
                      <span className="px-3 py-1 bg-primary/10 text-primary text-caption rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> {t.connected}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-secondary/10 text-secondary text-caption rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">pending</span> {t.driveDisconnected}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-body-lg text-on-surface mb-1 font-bold">Google Drive</h4>
                    {!google?.available ? (
                      <p className="text-body-md text-on-surface-variant mb-4">{t.driveNoOAuth}</p>
                    ) : google?.connected ? (
                      <>
                        <p className="text-body-md text-on-surface-variant mb-1">{t.driveAccount} <span className="text-on-surface font-medium">{google.account ?? "-"}</span></p>
                        <p className="text-body-md text-on-surface-variant mb-4">{t.driveFolder} <span className="text-on-surface font-medium">{google.folder ?? t.driveNoFolder}</span></p>
                      </>
                    ) : (
                      <p className="text-body-md text-on-surface-variant mb-4">{t.driveImgSync}</p>
                    )}
                    <div className="text-caption text-outline mb-4">
                      {!google?.available ? t.driveOAuthOff : google?.connected ? t.driveOAuthOn : t.driveAuthReq}
                    </div>
                  </div>
                  {!google?.available ? (
                    <button disabled className="w-full py-2 rounded-lg text-label-md border border-outline-variant text-outline opacity-50 cursor-not-allowed">
                      {t.driveUnavailable}
                    </button>
                  ) : !google?.connected ? (
                    <button
                      onClick={handleDriveConnect}
                      disabled={actionBusy === "google"}
                      className="w-full py-2 rounded-lg text-label-md transition-colors bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-60"
                    >
                      {actionBusy === "google" ? t.driveRedirecting : t.driveConnect}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={openNewFolder}
                          disabled={actionBusy === "google"}
                          className="flex-1 py-2 rounded-lg text-label-md transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-60 text-xs"
                        >
                          {t.driveNewFolder}
                        </button>
                        <button
                          onClick={openExistingFolder}
                          disabled={actionBusy === "google"}
                          className="flex-1 py-2 rounded-lg text-label-md transition-colors border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60 text-xs"
                        >
                          {t.driveExisting}
                        </button>
                      </div>
                      <button
                        onClick={handleDriveDisconnect}
                        disabled={actionBusy === "google"}
                        className="w-full py-1.5 rounded-lg text-label-md transition-colors border border-error/30 text-error hover:bg-error/5 disabled:opacity-60 text-xs"
                      >
                        {t.driveDisconnect}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right Column: Core Status & Export */}
            <div className="flex flex-col gap-md">
              <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings_suggest</span>
                {t.coreStatus}
              </h3>

              <div className="bg-surface rounded-xl p-md border border-surface-variant shadow-[0_4px_16px_rgba(21,69,57,0.08)] mb-4">
                <p className="text-body-md text-on-surface-variant mb-4">{t.coreDesc}</p>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-surface-variant pb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                      <span className="text-label-md text-on-surface">Mistral AI (LLM & OCR)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-caption font-bold ${coreStatus.mistral ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}`}>
                      {coreStatus.mistral ? t.active : t.offline}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                      <span className="text-label-md text-on-surface">Pinecone Vector DB</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-caption font-bold ${coreStatus.pinecone ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}`}>
                      {coreStatus.pinecone ? t.active : t.offline}
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">ios_share</span>
                {t.quickExport}
              </h3>

              <div className="bg-surface rounded-xl p-md border border-surface-variant shadow-[0_4px_16px_rgba(21,69,57,0.08)] sticky top-24">
                <p className="text-body-md text-on-surface-variant mb-6">{t.exportDesc}</p>
                <div className="flex flex-col gap-3">
                  {t.exportFormats.map((fmt, i) => (
                    <button key={i} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary-container/5 transition-all group text-left w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">{fmt.icon}</span>
                        </div>
                        <div>
                          <div className="text-label-md text-on-surface group-hover:text-primary transition-colors">{fmt.title}</div>
                          <div className="text-caption text-on-surface-variant">{fmt.formats}</div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-outline-variant group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

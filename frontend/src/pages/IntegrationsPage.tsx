import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import {
  getConfig,
  getMyIntegrations,
  disconnectIntegration,
  notionConnectUrl,
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

const exportFormats = [
  { icon: "article", title: "Full Document", formats: "PDF, DOCX" },
  { icon: "short_text", title: "AI Summary", formats: "Markdown, TXT" },
  { icon: "style", title: "Flashcards", formats: "Anki, CSV" },
];

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
  const [integrations, setIntegrations] = useState<MyIntegrations | null>(null);
  const [coreStatus, setCoreStatus] = useState({ mistral: false, pinecone: false });
  const [loading, setLoading] = useState(true);

  // Notion modal
  const [notionModal, setNotionModal] = useState<NotionModal>({ kind: "none" });
  // Drive modal
  const [driveModal, setDriveModal] = useState<DriveModal>({ kind: "none" });

  const [actionBusy, setActionBusy] = useState<"notion" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(null), 5000); };

  // ── Notion actions ─────────────────────────────────────────────────────────
  const handleNotionConnect = async () => {
    try {
      setActionBusy("notion");
      const { auth_url } = await notionConnectUrl();
      window.location.href = auth_url;
    } catch (err) {
      showError("Error al obtener URL de Notion: " + (err as Error).message);
      setActionBusy(null);
    }
  };

  const handleNotionDisconnect = async () => {
    if (!confirm("Desconectar Notion?")) return;
    try {
      setActionBusy("notion");
      await disconnectIntegration("notion");
      await load();
    } catch (err) {
      showError((err as Error).message);
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
      showError((err as Error).message);
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
      showError((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const submitNewBook = async () => {
    if (notionModal.kind !== "new-book") return;
    if (!notionModal.title.trim()) { showError("Escribe un nombre para el libro."); return; }
    setNotionModal({ ...notionModal, busy: true });
    try {
      await createNotionBook({ title: notionModal.title.trim(), parent_page_id: notionModal.parentId || undefined });
      setNotionModal({ kind: "none" });
      await load();
    } catch (err) {
      showError((err as Error).message);
      setNotionModal({ ...notionModal, busy: false });
    }
  };

  const submitExistingBook = async () => {
    if (notionModal.kind !== "existing-book") return;
    if (!notionModal.selectedId) { showError("Selecciona un libro."); return; }
    setNotionModal({ ...notionModal, busy: true });
    try {
      await selectNotionBook({ database_id: notionModal.selectedId, title: notionModal.selectedTitle });
      setNotionModal({ kind: "none" });
      await load();
    } catch (err) {
      showError((err as Error).message);
      setNotionModal({ ...notionModal, busy: false });
    }
  };

  // ── Drive actions ──────────────────────────────────────────────────────────
  const handleDriveConnect = async () => {
    try {
      setActionBusy("google");
      const { auth_url } = await googleConnectUrl();
      window.location.href = auth_url;
    } catch (err) {
      showError("Error al obtener URL de Google: " + (err as Error).message);
      setActionBusy(null);
    }
  };

  const handleDriveDisconnect = async () => {
    if (!confirm("Desconectar Google Drive?")) return;
    try {
      setActionBusy("google");
      await disconnectIntegration("google");
      await load();
    } catch (err) {
      showError((err as Error).message);
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
      showError((err as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const submitNewFolder = async () => {
    if (driveModal.kind !== "new-folder") return;
    if (!driveModal.name.trim()) { showError("Escribe un nombre para la carpeta."); return; }
    setDriveModal({ ...driveModal, busy: true });
    try {
      await createDriveFolder({ name: driveModal.name.trim() });
      setDriveModal({ kind: "none" });
      await load();
    } catch (err) {
      showError((err as Error).message);
      setDriveModal({ ...driveModal, busy: false });
    }
  };

  const submitExistingFolder = async () => {
    if (driveModal.kind !== "existing-folder") return;
    if (!driveModal.selectedId) { showError("Selecciona una carpeta."); return; }
    setDriveModal({ ...driveModal, busy: true });
    try {
      await selectDriveFolder({ folder_id: driveModal.selectedId, name: driveModal.selectedName });
      setDriveModal({ kind: "none" });
      await load();
    } catch (err) {
      showError((err as Error).message);
      setDriveModal({ ...driveModal, busy: false });
    }
  };

  const notion = integrations?.notion;
  const google = integrations?.google;

  return (
    <>
      <TopBar searchPlaceholder="Search..." />

      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-error text-on-error px-4 py-2 rounded-lg text-body-md shadow-lg">
          {error}
        </div>
      )}

      {/* Notion modal */}
      {notionModal.kind !== "none" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm shadow-xl border border-surface-variant flex flex-col gap-4">
            {notionModal.kind === "new-book" && (
              <>
                <h4 className="text-headline-sm text-on-surface">Nuevo libro en Notion</h4>
                <div className="flex flex-col gap-2">
                  <label className="text-label-md text-on-surface-variant">Nombre del libro</label>
                  <input
                    className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    value={notionModal.title}
                    onChange={e => setNotionModal({ ...notionModal, title: e.target.value })}
                    placeholder="Mis apuntes de Quimica"
                    disabled={notionModal.busy}
                  />
                </div>
                {notionModal.parents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">Pagina padre</label>
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
                    Cancelar
                  </button>
                  <button
                    onClick={submitNewBook}
                    disabled={notionModal.busy}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:bg-primary/90 disabled:opacity-60"
                  >
                    {notionModal.busy ? "Creando..." : "Crear"}
                  </button>
                </div>
              </>
            )}
            {notionModal.kind === "existing-book" && (
              <>
                <h4 className="text-headline-sm text-on-surface">Seleccionar libro existente</h4>
                {notionModal.books.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">No hay databases accesibles en tu Notion.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">Libro (database)</label>
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
                    Cancelar
                  </button>
                  {notionModal.books.length > 0 && (
                    <button
                      onClick={submitExistingBook}
                      disabled={notionModal.busy}
                      className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:bg-primary/90 disabled:opacity-60"
                    >
                      {notionModal.busy ? "Guardando..." : "Seleccionar"}
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
                <h4 className="text-headline-sm text-on-surface">Nueva carpeta en Drive</h4>
                <div className="flex flex-col gap-2">
                  <label className="text-label-md text-on-surface-variant">Nombre de la carpeta</label>
                  <input
                    className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low text-on-surface focus:outline-none focus:border-primary"
                    value={driveModal.name}
                    onChange={e => setDriveModal({ ...driveModal, name: e.target.value })}
                    placeholder="StudyAI Apuntes"
                    disabled={driveModal.busy}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setDriveModal({ kind: "none" })}
                    disabled={driveModal.busy}
                    className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container-low"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitNewFolder}
                    disabled={driveModal.busy}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:bg-primary/90 disabled:opacity-60"
                  >
                    {driveModal.busy ? "Creando..." : "Crear"}
                  </button>
                </div>
              </>
            )}
            {driveModal.kind === "existing-folder" && (
              <>
                <h4 className="text-headline-sm text-on-surface">Seleccionar carpeta existente</h4>
                {driveModal.folders.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">No hay carpetas en tu Drive.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">Carpeta</label>
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
                    Cancelar
                  </button>
                  {driveModal.folders.length > 0 && (
                    <button
                      onClick={submitExistingFolder}
                      disabled={driveModal.busy}
                      className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md hover:bg-primary/90 disabled:opacity-60"
                    >
                      {driveModal.busy ? "Guardando..." : "Seleccionar"}
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
              <h2 className="text-display-lg text-primary mb-2">Connection Hub</h2>
              <p className="text-body-lg text-on-surface-variant max-w-2xl">
                Seamlessly sync your study materials and export insights to your favorite tools.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            {/* Active Integrations */}
            <div className="lg:col-span-2 flex flex-col gap-md">
              <div className="flex justify-between items-center">
                <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">sync</span>
                  Active Integrations
                </h3>
                {loading && <span className="text-caption text-outline animate-pulse">Checking statuses...</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">

                {/* Obsidian card (unchanged) */}
                <div className="bg-surface rounded-xl p-md border border-surface-variant shadow-[0_2px_4px_rgba(21,69,57,0.05)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#7C3AED1A" }}>
                      <span className="material-symbols-outlined text-3xl" style={{ color: "#7C3AED" }}>folder_data</span>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-caption rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> Connected
                    </span>
                  </div>
                  <div>
                    <h4 className="text-body-lg text-on-surface mb-1 font-bold">Obsidian</h4>
                    <p className="text-body-md text-on-surface-variant mb-4">Syncs daily notes and markdown summaries locally.</p>
                    <div className="text-caption text-outline mb-4">Local vault integration</div>
                  </div>
                  <button
                    onClick={() => alert("Configura la ruta de tu Obsidian Vault en el archivo .env (OBSIDIAN_VAULT_PATH).")}
                    className="w-full py-2 rounded-lg text-label-md transition-colors border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                  >
                    Configure
                  </button>
                </div>

                {/* Notion card */}
                <div className={`bg-surface rounded-xl p-md border border-surface-variant shadow-[0_2px_4px_rgba(21,69,57,0.05)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 ${!notion?.connected ? "opacity-80" : ""}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-on-surface/10">
                      <span className="material-symbols-outlined text-3xl">dns</span>
                    </div>
                    {notion?.connected ? (
                      <span className="px-3 py-1 bg-primary/10 text-primary text-caption rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> Connected
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-secondary/10 text-secondary text-caption rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">pending</span> Disconnected
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-body-lg text-on-surface mb-1 font-bold">Notion</h4>
                    {!notion?.available ? (
                      <p className="text-body-md text-on-surface-variant mb-4">Configura las llaves OAuth de Notion en el servidor.</p>
                    ) : notion?.connected ? (
                      <>
                        <p className="text-body-md text-on-surface-variant mb-1">Workspace: <span className="text-on-surface font-medium">{notion.account ?? "-"}</span></p>
                        <p className="text-body-md text-on-surface-variant mb-4">Libro activo: <span className="text-on-surface font-medium">{notion.book ?? "Sin seleccionar"}</span></p>
                      </>
                    ) : (
                      <p className="text-body-md text-on-surface-variant mb-4">Database sync for flashcards and concepts.</p>
                    )}
                    <div className="text-caption text-outline mb-4">
                      {!notion?.available ? "OAuth no configurado" : notion?.connected ? "OAuth2 activo" : "Requiere autenticacion"}
                    </div>
                  </div>
                  {!notion?.available ? (
                    <button disabled className="w-full py-2 rounded-lg text-label-md border border-outline-variant text-outline opacity-50 cursor-not-allowed">
                      No disponible
                    </button>
                  ) : !notion?.connected ? (
                    <button
                      onClick={handleNotionConnect}
                      disabled={actionBusy === "notion"}
                      className="w-full py-2 rounded-lg text-label-md transition-colors bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-60"
                    >
                      {actionBusy === "notion" ? "Redirigiendo..." : "Conectar Notion"}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={openNewBook}
                          disabled={actionBusy === "notion"}
                          className="flex-1 py-2 rounded-lg text-label-md transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-60 text-xs"
                        >
                          + Nuevo libro
                        </button>
                        <button
                          onClick={openExistingBook}
                          disabled={actionBusy === "notion"}
                          className="flex-1 py-2 rounded-lg text-label-md transition-colors border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60 text-xs"
                        >
                          Usar existente
                        </button>
                      </div>
                      <button
                        onClick={handleNotionDisconnect}
                        disabled={actionBusy === "notion"}
                        className="w-full py-1.5 rounded-lg text-label-md transition-colors border border-error/30 text-error hover:bg-error/5 disabled:opacity-60 text-xs"
                      >
                        Desconectar
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
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> Connected
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-secondary/10 text-secondary text-caption rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">pending</span> Disconnected
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-body-lg text-on-surface mb-1 font-bold">Google Drive</h4>
                    {!google?.available ? (
                      <p className="text-body-md text-on-surface-variant mb-4">Configura las llaves OAuth de Google en el servidor.</p>
                    ) : google?.connected ? (
                      <>
                        <p className="text-body-md text-on-surface-variant mb-1">Cuenta: <span className="text-on-surface font-medium">{google.account ?? "-"}</span></p>
                        <p className="text-body-md text-on-surface-variant mb-4">Carpeta activa: <span className="text-on-surface font-medium">{google.folder ?? "Sin seleccionar"}</span></p>
                      </>
                    ) : (
                      <p className="text-body-md text-on-surface-variant mb-4">Upload note images to your Google Drive folder.</p>
                    )}
                    <div className="text-caption text-outline mb-4">
                      {!google?.available ? "OAuth no configurado" : google?.connected ? "OAuth2 activo" : "Requiere autenticacion"}
                    </div>
                  </div>
                  {!google?.available ? (
                    <button disabled className="w-full py-2 rounded-lg text-label-md border border-outline-variant text-outline opacity-50 cursor-not-allowed">
                      No disponible
                    </button>
                  ) : !google?.connected ? (
                    <button
                      onClick={handleDriveConnect}
                      disabled={actionBusy === "google"}
                      className="w-full py-2 rounded-lg text-label-md transition-colors bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-60"
                    >
                      {actionBusy === "google" ? "Redirigiendo..." : "Conectar Drive"}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={openNewFolder}
                          disabled={actionBusy === "google"}
                          className="flex-1 py-2 rounded-lg text-label-md transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-60 text-xs"
                        >
                          + Nueva carpeta
                        </button>
                        <button
                          onClick={openExistingFolder}
                          disabled={actionBusy === "google"}
                          className="flex-1 py-2 rounded-lg text-label-md transition-colors border border-outline-variant text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60 text-xs"
                        >
                          Usar existente
                        </button>
                      </div>
                      <button
                        onClick={handleDriveDisconnect}
                        disabled={actionBusy === "google"}
                        className="w-full py-1.5 rounded-lg text-label-md transition-colors border border-error/30 text-error hover:bg-error/5 disabled:opacity-60 text-xs"
                      >
                        Desconectar
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
                Core status
              </h3>

              <div className="bg-surface rounded-xl p-md border border-surface-variant shadow-[0_4px_16px_rgba(21,69,57,0.08)] mb-4">
                <p className="text-body-md text-on-surface-variant mb-4">
                  Connection status for background processing engines:
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-surface-variant pb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                      <span className="text-label-md text-on-surface">Mistral AI (LLM & OCR)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-caption font-bold ${coreStatus.mistral ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}`}>
                      {coreStatus.mistral ? "Active" : "Error / Offline"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                      <span className="text-label-md text-on-surface">Pinecone Vector DB</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-caption font-bold ${coreStatus.pinecone ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}`}>
                      {coreStatus.pinecone ? "Active" : "Error / Offline"}
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">ios_share</span>
                Quick Export
              </h3>

              <div className="bg-surface rounded-xl p-md border border-surface-variant shadow-[0_4px_16px_rgba(21,69,57,0.08)] sticky top-24">
                <p className="text-body-md text-on-surface-variant mb-6">
                  Select a format to export your currently active study session or library items.
                </p>
                <div className="flex flex-col gap-3">
                  {exportFormats.map((fmt, i) => (
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

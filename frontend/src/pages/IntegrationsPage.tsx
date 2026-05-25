import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { getGoogleAuthUrl, validateIntegrations } from "../api/client";

const exportFormats = [
  { icon: "article", title: "Full Document", formats: "PDF, DOCX" },
  { icon: "short_text", title: "AI Summary", formats: "Markdown, TXT" },
  { icon: "style", title: "Flashcards", formats: "Anki, CSV" },
  { icon: "hub", title: "Concept Map", formats: "Image, JSON" },
];

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState({
    mistral: false,
    pinecone: false,
    notion: false,
    drive: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchStatuses = async () => {
    try {
      const data = await validateIntegrations();
      setStatuses(data);
    } catch (err) {
      console.error("Error al validar integraciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleConnectDrive = async () => {
    try {
      const { auth_url } = await getGoogleAuthUrl();
      window.location.href = auth_url;
    } catch (err) {
      alert("Error al iniciar el flujo de Google Drive: " + (err as Error).message);
    }
  };

  const integrationsList = [
    {
      name: "Obsidian",
      icon: "folder_data",
      color: "#7C3AED",
      desc: "Syncs daily notes and markdown summaries locally.",
      status: "connected",
      label: "Connected",
      statusBg: "bg-primary/10",
      statusText: "text-primary",
      lastSync: "Local vault integration",
      action: "Configure",
      actionStyle: "outline" as const,
      onAction: () => {
        alert("Configura la ruta de tu Obsidian Vault en el archivo .env (OBSIDIAN_VAULT_PATH).");
      }
    },
    {
      name: "Google Drive",
      icon: "description",
      color: "#4285F4",
      desc: "Upload note images to your Google Drive folder.",
      status: statuses.drive ? "connected" : "pending",
      label: statuses.drive ? "Connected" : "Disconnected",
      statusBg: statuses.drive ? "bg-primary/10" : "bg-secondary/10",
      statusText: statuses.drive ? "text-primary" : "text-secondary",
      lastSync: statuses.drive ? "OAuth2 connection active" : "Requires authentication",
      action: statuses.drive ? "Disconnect" : "Connect",
      actionStyle: statuses.drive ? ("outline" as const) : ("secondary" as const),
      onAction: () => {
        if (!statuses.drive) {
          handleConnectDrive();
        } else {
          alert("Para desconectar, elimina el archivo 'google_token.json' en el backend o revoca el acceso en tu cuenta de Google.");
        }
      }
    },
    {
      name: "Notion",
      icon: "dns",
      color: "currentColor",
      desc: "Database sync for flashcards and concepts.",
      status: statuses.notion ? "connected" : "pending",
      label: statuses.notion ? "Connected" : "Pending Auth",
      statusBg: statuses.notion ? "bg-primary/10" : "bg-secondary/10",
      statusText: statuses.notion ? "text-primary" : "text-secondary",
      lastSync: statuses.notion ? "API Token is valid" : "Action required to complete setup",
      action: statuses.notion ? "Connected" : "Authenticate",
      actionStyle: statuses.notion ? ("outline" as const) : ("secondary" as const),
      onAction: () => {
        if (!statuses.notion) {
          alert("Configura tu NOTION_TOKEN y NOTION_DATABASE_ID en tu archivo .env.");
        }
      }
    },
  ];

  return (
    <>
      <TopBar searchPlaceholder="Search..." />
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
                {integrationsList.map((int, i) => (
                  <div
                    key={i}
                    className={`bg-surface rounded-xl p-md border border-surface-variant shadow-[0_2px_4px_rgba(21,69,57,0.05)] flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 ${int.status === "pending" ? "opacity-80" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${int.color}1A` }}>
                        <span className="material-symbols-outlined text-3xl" style={{ color: int.color }}>{int.icon}</span>
                      </div>
                      <span className={`px-3 py-1 ${int.statusBg} ${int.statusText} text-caption rounded-full flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-[14px]">{int.status === "connected" ? "check_circle" : "pending"}</span> {int.label}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-body-lg text-on-surface mb-1 font-bold">{int.name}</h4>
                      <p className="text-body-md text-on-surface-variant mb-4">{int.desc}</p>
                      <div className="text-caption text-outline mb-4">{int.lastSync}</div>
                    </div>
                    <button
                      onClick={int.onAction}
                      className={`w-full py-2 rounded-lg text-label-md transition-colors ${
                        int.actionStyle === "outline"
                          ? "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                          : "bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container"
                      }`}
                    >
                      {int.action}
                    </button>
                  </div>
                ))}

                {/* Add Integration Card */}
                {!statuses.drive && (
                  <div className="bg-surface-container-low rounded-xl p-md border border-dashed border-outline-variant flex flex-col justify-between items-center text-center">
                    <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mb-4 mt-2">
                      <span className="material-symbols-outlined text-outline text-2xl">cloud_off</span>
                    </div>
                    <div>
                      <h4 className="text-body-lg text-on-surface mb-1 font-bold">Cloud Folders</h4>
                      <p className="text-body-md text-on-surface-variant mb-6">Backup raw PDFs and original capture files.</p>
                    </div>
                    <button
                      onClick={handleConnectDrive}
                      className="px-6 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-label-md hover:bg-surface transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span> Connect Drive
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Status & Export */}
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
                    <span className={`px-2 py-0.5 rounded text-caption font-bold ${statuses.mistral ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                      {statuses.mistral ? 'Active' : 'Error / Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                      <span className="text-label-md text-on-surface">Pinecone Vector DB</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-caption font-bold ${statuses.pinecone ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                      {statuses.pinecone ? 'Active' : 'Error / Offline'}
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

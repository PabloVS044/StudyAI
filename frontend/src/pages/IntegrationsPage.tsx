import TopBar from "../components/TopBar";
import { getGoogleAuthUrl } from "../api/client";

const connectedIntegrations = [
  {
    name: "Obsidian",
    icon: "folder_data",
    color: "#7C3AED",
    desc: "Syncs daily notes and markdown summaries.",
    status: "connected",
    label: "Connected",
    statusBg: "bg-primary/10",
    statusText: "text-primary",
    lastSync: "2 hours ago",
    action: "Configure",
    actionStyle: "outline",
  },
  {
    name: "Google Docs",
    icon: "description",
    color: "#4285F4",
    desc: "Export full documents and collaborative notes.",
    status: "connected",
    label: "Connected",
    statusBg: "bg-primary/10",
    statusText: "text-primary",
    lastSync: "Just now",
    action: "Configure",
    actionStyle: "outline",
  },
  {
    name: "Notion",
    icon: "dns",
    color: "currentColor",
    desc: "Database sync for flashcards and concepts.",
    status: "pending",
    label: "Pending Auth",
    statusBg: "bg-secondary/10",
    statusText: "text-secondary",
    lastSync: "Action required to complete setup",
    action: "Authenticate",
    actionStyle: "secondary",
  },
];

const exportFormats = [
  { icon: "article", title: "Full Document", formats: "PDF, DOCX" },
  { icon: "short_text", title: "AI Summary", formats: "Markdown, TXT" },
  { icon: "style", title: "Flashcards", formats: "Anki, CSV" },
  { icon: "hub", title: "Concept Map", formats: "Image, JSON" },
];

export default function IntegrationsPage() {
  const handleConnectDrive = async () => {
    try {
      const { auth_url } = await getGoogleAuthUrl();
      window.location.href = auth_url;
    } catch (err) {
      alert("Error al iniciar el flujo de Google Drive: " + (err as Error).message);
    }
  };

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
              <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">sync</span>
                Active Integrations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {connectedIntegrations.map((int, i) => (
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
              </div>
            </div>

            {/* Quick Export */}
            <div className="flex flex-col gap-md">
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

import TopBar from "../components/TopBar";

const pipelineSteps = [
  { label: "File Received", done: true },
  { label: "Text Extracted", done: true },
  { label: "Content Cleaned", done: true },
  { label: "Summary Ready", active: true },
  { label: "Flashcards Generated", done: false, active: false },
];

export default function ProcessingPage() {
  return (
    <>
      <TopBar searchPlaceholder="Search notes, topics..." />
      <main className="ml-0 md:ml-64 mt-16 p-gutter w-full max-w-[calc(100%-16rem)] h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="mb-md flex justify-between items-end flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-caption text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">folder</span> Biology 101
              </span>
              <span className="text-caption text-outline-variant">/</span>
              <span className="text-caption text-on-surface-variant">Cellular Respiration Notes.pdf</span>
            </div>
            <h2 className="text-headline-lg text-on-background">AI Extraction Workspace</h2>
          </div>
          <div className="flex items-center gap-sm">
            <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-caption flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span> Auto-save ON
            </span>
            <button className="flex items-center gap-1 text-label-md text-secondary border border-outline-variant px-3 py-1.5 rounded-lg hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[18px]">more_horiz</span> Options
            </button>
            <button className="bg-primary text-on-primary px-4 py-1.5 rounded-lg text-label-md hover:bg-primary-container transition-colors shadow-sm opacity-50 cursor-not-allowed flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">download</span> Export Available
            </button>
          </div>
        </div>

        {/* Pipeline Progress */}
        <div className="mb-md bg-surface-container-low rounded-xl p-4 flex-shrink-0 border border-surface-variant">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-surface-variant rounded-full z-0" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-secondary-fixed-dim rounded-full z-0" style={{ width: "60%" }} />
            {pipelineSteps.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-background shadow-sm ${
                  step.done
                    ? "bg-primary text-on-primary"
                    : step.active
                      ? "bg-primary text-on-primary relative"
                      : "bg-surface-variant text-outline-variant"
                }`}>
                  {step.done ? (
                    <span className="material-symbols-outlined text-[16px]">done</span>
                  ) : step.active ? (
                    <>
                      <span className="material-symbols-outlined text-[16px]">sync</span>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-fixed" />
                      </span>
                    </>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">quiz</span>
                  )}
                </div>
                <span className={`text-caption font-semibold ${
                  step.active ? "text-primary font-bold" : step.done ? "text-on-surface" : "text-outline-variant"
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Split Pane Workspace */}
        <div className="flex-grow flex gap-md overflow-hidden pb-4">
          {/* Left: Source Document */}
          <div className="w-1/2 flex flex-col bg-[#fdfdfb] rounded-2xl border border-[#E5E0D8] shadow-[0_4px_12px_rgba(21,69,57,0.05)] overflow-hidden">
            <div className="p-4 border-b border-[#E5E0D8] bg-surface-bright flex justify-between items-center">
              <h3 className="text-label-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">description</span>
                Source Document Preview
              </h3>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-md hover:bg-surface-variant text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <span className="text-caption text-on-surface-variant self-center">100%</span>
                <button className="p-1.5 rounded-md hover:bg-surface-variant text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-auto p-lg bg-[#e2e3e0]/20 flex justify-center items-start">
              <div className="w-full max-w-md bg-white shadow-md rounded-sm p-8 min-h-[600px] relative">
                <h4 className="font-serif text-xl mb-4 text-gray-800">Chapter 4: Cellular Respiration</h4>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-4/6" />
                  <div className="h-32 bg-gray-100 rounded w-full border border-gray-200 flex items-center justify-center text-gray-400 italic">Handwritten diagram here</div>
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
                {/* Scanning overlay */}
                <div
                  className="absolute left-0 w-full h-1 bg-primary-fixed-dim/50 shadow-[0_4px_12px_rgba(160,209,192,0.8)]"
                  style={{ animation: "scan 3s ease-in-out infinite" }}
                />
              </div>
            </div>
          </div>

          {/* Right: AI Extraction */}
          <div className="w-1/2 flex flex-col gap-sm overflow-hidden">
            {/* Status */}
            <div className="flex justify-between items-center px-2 flex-shrink-0">
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded-md bg-surface-variant text-on-surface-variant text-caption flex items-center gap-1">
                  Reviewed
                </span>
                <span className="px-2.5 py-1 rounded-md bg-primary-container/20 text-primary text-caption flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span> Processing Summary
                </span>
              </div>
              <button className="text-caption text-secondary hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">history</span> History
              </button>
            </div>

            {/* Extraction Content */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-md custom-scrollbar">
              {/* Extracted Text */}
              <div className="bg-[#fdfdfb] rounded-2xl border border-[#E5E0D8] shadow-[0_4px_12px_rgba(21,69,57,0.05)] p-md">
                <div className="flex justify-between items-center mb-sm">
                  <h3 className="text-label-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">subject</span>
                    Detected Text
                  </h3>
                  <button className="text-caption text-secondary hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                </div>
                <div className="bg-surface-container-low rounded-lg p-sm text-body-md text-on-surface-variant leading-relaxed max-h-[200px] overflow-y-auto border border-surface-variant/50 custom-scrollbar">
                  Cellular respiration is the process by which biological fuels are oxidized in the presence of an inorganic electron acceptor to produce large amounts of energy, to drive the bulk production of ATP.
                  <br /><br />
                  Key stages include: Glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation.
                  <br /><br />
                  <span className="bg-primary-fixed-dim/30 px-1 rounded text-on-background">Note on diagram: Mitochondria structure shows outer membrane, intermembrane space, inner membrane (cristae), and matrix.</span>
                </div>
              </div>

              {/* Suggested Structure */}
              <div className="bg-[#fdfdfb] rounded-2xl border border-[#E5E0D8] shadow-[0_4px_12px_rgba(21,69,57,0.05)] p-md">
                <h3 className="text-label-md text-on-surface flex items-center gap-2 mb-md">
                  <span className="material-symbols-outlined text-secondary">account_tree</span>
                  Suggested Structure & Topics
                </h3>
                <div className="space-y-sm">
                  <div className="flex gap-2 flex-wrap mb-md">
                    {["#Biology", "#CellularRespiration", "#ATP", "#KrebsCycle"].map((tag, i) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-caption border ${
                        i === 3 ? "bg-tertiary-container/30 text-tertiary border-tertiary-container/50" : "bg-secondary-container/50 text-on-secondary-container border-secondary-container"
                      }`}>{tag}</span>
                    ))}
                  </div>
                  <div className="pl-2 border-l-2 border-primary/20 space-y-3">
                    {[
                      { title: "1. Introduction to Respiration", desc: "Definition and purpose of ATP production.", done: true },
                      { title: "2. Three Main Stages", desc: "Glycolysis, Krebs Cycle, Oxidative Phosphorylation.", done: true },
                      { title: "3. Mitochondria Structure", desc: "AI Expanding...", expanding: true },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-start gap-2 ${item.expanding ? "bg-primary-container/5 p-2 rounded-lg -ml-2 border border-primary/10" : ""}`}>
                        <span className={`material-symbols-outlined text-primary text-[18px] mt-0.5 ${item.expanding ? "animate-pulse" : ""}`}>
                          {item.done ? "check_circle" : "edit_note"}
                        </span>
                        <div className="w-full">
                          <p className="text-label-md text-on-surface flex justify-between">
                            {item.title}
                            {item.expanding && <span className="text-[10px] text-primary uppercase tracking-wider">AI Expanding...</span>}
                          </p>
                          {!item.expanding && <p className="text-caption text-on-surface-variant">{item.desc}</p>}
                          {item.expanding && (
                            <div className="h-1.5 bg-surface-variant rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: "66%" }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Chat Insight */}
              <div className="bg-surface-container-low rounded-xl p-sm flex gap-3 border border-surface-variant">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-primary-container text-[16px]">psychology</span>
                </div>
                <div>
                  <p className="text-caption text-on-surface-variant">
                    I noticed handwritten notes detailing the Mitochondrial Matrix. I'm grouping this under section 3. Shall I generate a concept map for this structure once ready?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 rounded border border-outline-variant text-caption hover:bg-surface-variant transition-colors">Yes, map it</button>
                    <button className="px-3 py-1 rounded border border-outline-variant text-caption hover:bg-surface-variant transition-colors">No, thanks</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

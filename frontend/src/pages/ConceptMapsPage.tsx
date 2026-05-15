import TopBar from "../components/TopBar";

const nodes = [
  { id: 0, label: "Normal Distribution", x: 300, y: 250, main: true },
  { id: 1, label: "Expected Value", x: 500, y: 150 },
  { id: 2, label: "Variance", x: 200, y: 400 },
  { id: 3, label: "Density Function", x: 550, y: 350 },
  { id: 4, label: "Standard Deviation", x: 650, y: 200, suggested: true },
];

const edges = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  { from: 1, to: 4, dashed: true, highlighted: true },
];

export default function ConceptMapsPage() {
  return (
    <>
      <TopBar searchPlaceholder="Search concepts..." />
      <main className="ml-0 md:ml-64 h-screen md:mt-16 pt-16 md:pt-0 flex flex-col md:flex-row relative">
        {/* Interactive Graph Canvas */}
        <div className="flex-1 bg-surface-container-lowest relative overflow-hidden h-full">
          {/* Graph Controls */}
          <div className="absolute top-md left-md z-10 flex gap-2">
            <button className="bg-surface-bright p-2 rounded-lg shadow-[0_4px_12px_rgba(21,69,57,0.05)] text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">zoom_in</span>
            </button>
            <button className="bg-surface-bright p-2 rounded-lg shadow-[0_4px_12px_rgba(21,69,57,0.05)] text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">zoom_out</span>
            </button>
            <button className="bg-surface-bright p-2 rounded-lg shadow-[0_4px_12px_rgba(21,69,57,0.05)] text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">center_focus_strong</span>
            </button>
          </div>

          {/* SVG Graph Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
            {edges.map((edge, i) => {
              const from = nodes[edge.from];
              const to = nodes[edge.to];
              return (
                <path
                  key={i}
                  d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                  fill="none"
                  stroke={edge.highlighted ? "rgba(21,69,57,0.2)" : "#c0c8c4"}
                  strokeWidth={edge.highlighted ? 3 : 2}
                  strokeDasharray={edge.dashed ? "5,5" : "none"}
                />
              );
            })}
          </svg>

          {/* Graph Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 ${node.suggested ? "opacity-60 hover:opacity-100 transition-opacity" : ""}`}
              style={{ top: `${node.y}px`, left: `${node.x}px` }}
            >
              <div className={`px-4 py-2 rounded-full transition-transform ${
                node.main
                  ? "bg-primary text-on-primary font-label-md text-label-md shadow-[0_12px_24px_rgba(21,69,57,0.08)] ring-4 ring-primary/20 scale-110"
                  : node.suggested
                    ? "bg-surface-container border border-primary/30 text-primary flex items-center gap-2 font-body-md text-body-md"
                    : "bg-surface-bright border border-outline-variant text-on-surface font-body-md text-body-md shadow-[0_4px_12px_rgba(21,69,57,0.05)] hover:border-primary"
              }`}>
                {node.suggested && <span className="material-symbols-outlined text-[16px]">add_circle</span>}
                {node.label}
              </div>
            </div>
          ))}
        </div>

        {/* Side Panel */}
        <aside className="w-full md:w-[400px] bg-surface-bright border-l border-outline-variant/30 flex flex-col h-full z-30 flex-shrink-0">
          <div className="p-md border-b border-outline-variant/20 flex justify-between items-start bg-surface-container-low/50">
            <div>
              <span className="text-caption text-primary tracking-wider uppercase mb-1 block">Selected Concept</span>
              <h2 className="text-headline-md text-on-surface">Normal Distribution</h2>
            </div>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-md flex-1 overflow-y-auto space-y-lg custom-scrollbar">
            {/* Definition */}
            <section>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                A continuous probability distribution characterized by a symmetric, bell-shaped curve. It is fully defined by its mean (Expected Value) and standard deviation.
              </p>
              <div className="mt-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 flex gap-3 items-center">
                <span className="material-symbols-outlined text-secondary">functions</span>
                <span className="font-mono text-sm text-on-surface">f(x) = (1/σ√(2π)) * e^(-(x-μ)²/2σ²)</span>
              </div>
            </section>

            {/* AI Insights */}
            <section>
              <h3 className="text-label-md text-on-surface flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                StudyFlow AI Insights
              </h3>
              <div className="grid grid-cols-1 gap-sm">
                <div className="bg-secondary-container/20 border border-secondary-container rounded-xl p-4 hover:bg-secondary-container/30 transition-colors cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary mt-0.5 text-[20px]">link</span>
                    <div>
                      <h4 className="text-label-md text-on-surface mb-1 group-hover:text-primary transition-colors">This relates to...</h4>
                      <p className="text-caption text-on-surface-variant">Central Limit Theorem. Understanding how sample means converge here is crucial for your upcoming exam.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container rounded-xl p-4 hover:bg-surface-container-high transition-colors cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant mt-0.5 text-[20px]">history_edu</span>
                    <div>
                      <h4 className="text-label-md text-on-surface mb-1 group-hover:text-primary transition-colors">Review this first...</h4>
                      <p className="text-caption text-on-surface-variant">Make sure you are solid on <strong>Variance</strong> before diving deeper into Density Functions.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-error-container/20 border border-error-container/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-error mt-0.5 text-[20px]">warning</span>
                    <div>
                      <h4 className="text-label-md text-on-surface mb-1">Possible gap detected</h4>
                      <p className="text-caption text-on-surface-variant">Your recent flashcard scores on Z-scores are below average.</p>
                      <button className="mt-2 text-caption text-primary hover:underline">Generate Review Flashcards</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-md border-t border-outline-variant/20 bg-surface-bright">
            <div className="flex gap-sm">
              <button className="flex-1 bg-surface-container text-on-surface text-label-md px-4 py-2.5 rounded-lg border border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                Add Note
              </button>
              <button className="flex-1 bg-primary text-on-primary text-label-md px-4 py-2.5 rounded-lg shadow-sm hover:bg-primary-container transition-colors">
                Focus Mode
              </button>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}

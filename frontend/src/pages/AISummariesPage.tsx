import { useState } from "react";
import TopBar from "../components/TopBar";

const summaries = [
  {
    title: "Cellular Respiration & ATP Cycle",
    course: "Biology 101",
    date: "Today",
    preview: "Detailed overview of glycolysis, the Krebs cycle, and oxidative phosphorylation processes...",
    active: true,
  },
  {
    title: "French Revolution Causes",
    course: "History",
    date: "Yesterday",
    preview: "Analysis of economic hardship, Enlightenment ideas, and social inequality leading up to 1789.",
    active: false,
  },
  {
    title: "Newton's Laws of Motion",
    course: "Physics",
    date: "Oct 12",
    preview: "Summary of inertia, F=ma, and action-reaction principles with real-world applications.",
    active: false,
  },
  {
    title: "Photosynthesis Stages",
    course: "Biology 101",
    date: "Oct 10",
    preview: "Generating summary...",
    active: false,
    loading: true,
  },
];

const filters = ["All", "Biology 101", "History", "Physics"];

export default function AISummariesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedSummary, setSelectedSummary] = useState(summaries[0]);

  return (
    <>
      <TopBar searchPlaceholder="Search summaries..." />
      <main className="flex-1 mt-16 ml-0 md:ml-64 flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Pane: Summaries List */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-outline-variant/30 flex flex-col bg-surface overflow-hidden hidden md:flex shrink-0">
          <div className="p-md flex flex-col gap-4 border-b border-outline-variant/30">
            <h2 className="text-headline-md text-primary">Library</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-full text-label-md whitespace-nowrap transition-colors ${
                    activeFilter === f
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-2 custom-scrollbar">
            {summaries.map((s, i) => (
              <div
                key={i}
                onClick={() => setSelectedSummary(s)}
                className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border ${
                  s.active
                    ? "bg-surface-container-highest shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-primary/10 relative overflow-hidden"
                    : "bg-surface hover:bg-surface-container-low border-transparent hover:border-outline-variant/30"
                } ${s.loading ? "opacity-70" : ""}`}
              >
                {s.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />}
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-caption px-2 py-0.5 rounded text-xs ${
                    s.course === "Biology 101" ? "text-primary bg-primary/10" :
                    s.course === "History" ? "text-secondary bg-secondary/10" :
                    "text-tertiary bg-tertiary/10"
                  }`}>{s.course}</span>
                  <span className="text-caption text-on-surface-variant/70">{s.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {s.loading && <span className="material-symbols-outlined text-[16px] text-outline">hourglass_empty</span>}
                  <h3 className="text-body-lg text-on-surface font-semibold mb-1 leading-tight">{s.title}</h3>
                </div>
                <p className={`text-body-md text-on-surface-variant line-clamp-2 text-sm ${s.loading ? "italic" : ""}`}>{s.preview}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Pane: Reading Canvas */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden relative">
          {/* Action Bar */}
          <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-lg bg-surface-container-lowest/90 backdrop-blur z-10">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="font-medium text-caption">AI Generated • 98% Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-[20px]">ios_share</span>
              </button>
              <div className="h-4 w-px bg-outline-variant/50 mx-1" />
              <button className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
              </button>
            </div>
          </div>

          {/* Main Reading Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-lg lg:px-xl py-lg pb-32 scroll-smooth custom-scrollbar">
            <article className="max-w-3xl mx-auto">
              <header className="mb-lg">
                <h1 className="text-display-lg text-on-surface mb-4 leading-tight">{selectedSummary?.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-body-md text-on-surface-variant">
                  <span className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[16px]">folder</span> {selectedSummary?.course}
                  </span>
                  <span className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span> Oct 15, 2023
                  </span>
                  <span className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[16px]">timer</span> 5 min read
                  </span>
                </div>
              </header>

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-xl mb-8">
                  <h3 className="text-headline-md text-primary mt-0 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">lightbulb</span> Key Takeaway
                  </h3>
                  <p className="text-body-lg text-on-surface-variant m-0">
                    Cellular respiration is the metabolic process by which cells convert nutrients into energy (ATP) and release waste products. It is essential for maintaining life in all eukaryotic organisms.
                  </p>
                </div>

                <h2 className="text-headline-lg text-on-surface mt-10 mb-4 pb-2 border-b border-outline-variant/20">1. Glycolysis</h2>
                <p className="text-body-md mb-4 text-on-surface-variant">
                  Occurring in the cytoplasm, glycolysis is the first step of cellular respiration. It does not require oxygen (anaerobic). A single glucose molecule (6-carbon) is broken down into two molecules of pyruvate (3-carbon).
                </p>
                <ul className="list-disc pl-6 mb-6 text-body-md text-on-surface-variant space-y-2 marker:text-primary/50">
                  <li><strong>Input:</strong> 1 Glucose, 2 ATP, 2 NAD+</li>
                  <li><strong>Output:</strong> 2 Pyruvate, 4 ATP (net gain of 2 ATP), 2 NADH</li>
                </ul>

                <h2 className="text-headline-lg text-on-surface mt-10 mb-4 pb-2 border-b border-outline-variant/20">2. The Krebs Cycle (Citric Acid Cycle)</h2>
                <p className="text-body-md mb-4 text-on-surface-variant">
                  Takes place in the mitochondrial matrix. Pyruvate is first oxidized into Acetyl-CoA before entering the cycle. This stage requires oxygen (aerobic) to proceed, although oxygen isn't consumed directly in the cycle.
                </p>
                <div className="bg-surface border border-outline-variant/30 rounded-xl p-6 my-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                  <h4 className="text-label-md text-primary mb-2 uppercase tracking-wider">Concept Focus</h4>
                  <p className="text-body-md text-on-surface m-0">The primary purpose of the Krebs cycle is to generate high-energy electron carriers (NADH and FADH2) which will be used in the next stage to produce massive amounts of ATP.</p>
                </div>

                <h2 className="text-headline-lg text-on-surface mt-10 mb-4 pb-2 border-b border-outline-variant/20">3. Electron Transport Chain (ETC)</h2>
                <p className="text-body-md mb-4 text-on-surface-variant">
                  Located on the inner mitochondrial membrane. This is where the majority of ATP is produced. Electrons from NADH and FADH2 are passed along a series of proteins. The energy released is used to pump protons across the membrane, creating a gradient.
                </p>
                <p className="text-body-md mb-4 text-on-surface-variant">
                  Oxygen acts as the final electron acceptor, combining with electrons and protons to form water. The proton gradient drives ATP synthase to produce roughly 34 ATP molecules per glucose molecule.
                </p>
              </div>
            </article>
          </div>

          {/* Floating Action Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-bright/90 backdrop-blur-xl border border-outline-variant/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-2 py-2 flex items-center gap-1 z-20">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-on-surface hover:bg-surface-container transition-colors group">
              <span className="material-symbols-outlined text-[20px] text-primary group-hover:rotate-180 transition-transform duration-500">sync</span>
              <span className="text-label-md">Regenerate</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/30 mx-1" />
            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-on-surface hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px] text-secondary">compress</span>
              <span className="text-label-md">Shorten</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-on-surface hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[20px] text-secondary">expand_content</span>
              <span className="text-label-md">Detailed</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/30 mx-1" />
            <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm bg-gradient-to-b from-white/5 to-transparent">
              <span className="material-symbols-outlined text-[20px]">quiz</span>
              <span className="text-label-md">Make Flashcards</span>
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

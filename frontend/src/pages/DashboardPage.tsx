import TopBar from "../components/TopBar";

const statCards = [
  { label: "Processed Notes", value: "24", sublabel: "this week", trend: "+12% vs last week", icon: "document_scanner", color: "text-primary" },
  { label: "AI Summaries", value: "8", sublabel: "generated", progress: 60, icon: "psychology", color: "text-secondary" },
  { label: "Flashcards", value: "142", sublabel: "active", due: 40, mastered: 102, icon: "style", color: "text-tertiary" },
];

const courses = [
  {
    title: "Advanced Statistics",
    code: "ECON 301",
    desc: "Bayesian inference models, probability distributions, and hypothesis testing deep dive.",
    summaries: 3,
    flashcards: 45,
    gradient: "primary",
    icon: "monitoring",
  },
  {
    title: "Modern History",
    code: "HIST 204",
    desc: "Post-WWII geopolitical shifts, Cold War dynamics, and the rise of globalization.",
    summaries: 1,
    flashcards: 12,
    maps: 1,
    gradient: "tertiary",
    icon: "account_balance",
  },
];

const flowSteps = [
  { label: "1. Capture", icon: "add_a_photo" },
  { label: "2. Extract", icon: "auto_awesome" },
  { label: "3. Organize", icon: "folder_open" },
  { label: "4. Study Active", icon: "psychology", active: true },
  { label: "5. Export", icon: "ios_share" },
];

export default function DashboardPage() {
  return (
    <>
      <TopBar searchPlaceholder="Search notes, concepts, or summaries..." />
      <main className="flex-1 mt-16 p-gutter pb-xl overflow-y-auto">
        <div className="max-w-container-max mx-auto">
          {/* Welcome Header */}
          <header className="mb-lg">
            <h2 className="text-display-lg text-primary mb-2">Welcome back.</h2>
            <p className="text-body-lg text-on-surface-variant">Here is an overview of your cognitive landscape today.</p>
          </header>

          {/* Bento Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-sm mb-xl">
            {statCards.map((card, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-[16px] p-md border border-outline-variant/40 shadow-[0_4px_16px_-4px_rgba(21,69,57,0.05)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className={`material-symbols-outlined text-[64px] ${card.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                </div>
                <div className="relative z-10">
                  <p className="text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">{card.label}</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-display-lg text-primary leading-none">{card.value}</span>
                    <span className="text-caption text-secondary mb-1">{card.sublabel}</span>
                  </div>
                  {card.trend && (
                    <div className="flex items-center gap-1 text-xs text-primary-container">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      <span>{card.trend}</span>
                    </div>
                  )}
                  {card.progress !== undefined && (
                    <div className="w-full h-2 bg-surface-variant rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-primary-container w-[60%] rounded-full" />
                    </div>
                  )}
                  {card.due !== undefined && (
                    <div className="flex gap-2 mt-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase">{card.due} Due</span>
                      <span className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded-full text-[10px] font-bold uppercase">{card.mastered} Mastered</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Up Next Card */}
            <div className="bg-primary-container text-on-primary rounded-[16px] p-md shadow-[0_8px_24px_-8px_rgba(47,93,80,0.4)] hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-label-md text-primary-fixed-dim uppercase tracking-wider">Up Next</p>
                  <span className="material-symbols-outlined text-primary-fixed-dim">notifications_active</span>
                </div>
                <h3 className="text-headline-md mb-1 text-white">Modern History</h3>
                <p className="text-caption text-primary-fixed opacity-90">Review Industrial Revolution Flashcards</p>
              </div>
              <button className="relative z-10 mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-label-md transition-colors border border-white/20 flex justify-center items-center gap-2">
                Start Review
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-lg">
            {/* Continue Studying */}
            <section className="xl:col-span-2">
              <div className="flex justify-between items-end mb-md border-b border-outline-variant/30 pb-2">
                <h3 className="text-headline-md text-on-surface">Continue Studying</h3>
                <a href="/library" className="text-label-md text-primary hover:text-primary-container transition-colors flex items-center gap-1">
                  View Library <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                {courses.map((course, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-[16px] p-0 border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow">
                    <div className="h-32 bg-surface-container-low relative">
                      <div className={`absolute inset-0 ${course.gradient === "primary" ? "bg-primary/5" : "bg-tertiary/5"}`} />
                      <div className="absolute bottom-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
                        <span className={`material-symbols-outlined ${course.gradient === "primary" ? "text-primary" : "text-tertiary"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{course.icon}</span>
                      </div>
                    </div>
                    <div className="p-md flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-headline-md text-on-surface group-hover:text-primary transition-colors">{course.title}</h4>
                        <span className="text-caption text-secondary bg-secondary-container/50 px-2 py-1 rounded">{course.code}</span>
                      </div>
                      <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2 text-sm">{course.desc}</p>
                      <div className="mt-auto pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-primary-container/20 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary" title={`${course.summaries} Summaries`}>{course.summaries} S</div>
                          <div className="w-8 h-8 rounded-full bg-tertiary-container/20 border-2 border-white flex items-center justify-center text-[10px] font-bold text-tertiary" title={`${course.flashcards} Flashcards`}>{course.flashcards} F</div>
                          {course.maps && (
                            <div className="w-8 h-8 rounded-full bg-secondary-container/30 border-2 border-white flex items-center justify-center text-[10px] font-bold text-secondary" title={`${course.maps} Concept Maps`}>{course.maps} M</div>
                          )}
                        </div>
                        <span className="text-label-md text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Open <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Cognitive Flow Widget */}
            <section className="xl:col-span-1">
              <div className="bg-surface-container-low rounded-[24px] p-md border border-outline-variant/30 h-full flex flex-col">
                <h3 className="text-headline-md text-on-surface mb-2">The Cognitive Flow</h3>
                <p className="text-caption text-on-surface-variant mb-6">How your notes transform into knowledge.</p>
                <div className="flex-1 flex flex-col justify-between py-4 relative">
                  <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-outline-variant/30 z-0" />
                  {flowSteps.map((step, i) => (
                    <div key={i} className={`flex items-start gap-4 relative z-10 group cursor-pointer mt-4 ${step.active ? "" : "opacity-50 hover:opacity-100 transition-opacity"}`} style={{ marginTop: i === 0 ? "0" : "1rem" }}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        step.active
                          ? "bg-primary text-on-primary shadow-[0_4px_12px_-2px_rgba(21,69,57,0.4)]"
                          : "bg-surface-bright border border-outline-variant/50 shadow-sm"
                      }`}>
                        <span className={`material-symbols-outlined ${step.active ? "fill" : ""}`}>{step.icon}</span>
                      </div>
                      <div className="pt-3">
                        <h5 className={`text-label-md ${step.active ? "text-primary" : "text-on-surface"}`}>{step.label}</h5>
                        {step.active && <span className="text-[10px] text-primary-container font-medium uppercase tracking-wide">Current Phase</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

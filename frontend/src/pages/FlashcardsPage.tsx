import TopBar from "../components/TopBar";

const deckProgress = {
  current: 12,
  total: 45,
  mastered: 19,
  inReview: 7,
  difficult: 4,
  overall: 42,
};

const upcomingDecks = [
  {
    title: "Genetics & Inheritance",
    course: "Biology 101",
    progress: 85,
    info: "12 cards to review today",
    icon: "style",
  },
  {
    title: "Intro to Psychology",
    course: "Psych 200",
    progress: 15,
    info: "50+ new cards",
    icon: "style",
  },
  {
    title: "Statistical Methods",
    course: "Stats 301",
    progress: 0,
    info: "Starts next week",
    icon: "lock",
    locked: true,
  },
];

const currentCard = {
  question: "Describe the primary function of the electron transport chain (ETC) in aerobic respiration and identify its location.",
  answer: "The ETC creates a proton gradient across the inner mitochondrial membrane to drive ATP synthesis via ATP synthase.",
  details: [
    { label: "Location:", value: "Inner mitochondrial membrane." },
    { label: "Inputs:", value: "NADH, FADH2, O2." },
    { label: "Outputs:", value: "~34 ATP, H2O." },
  ],
};

export default function FlashcardsPage() {
  const progressPercent = (deckProgress.current / deckProgress.total) * 100;

  return (
    <>
      <TopBar searchPlaceholder="Search decks, tags, or concepts..." />
      <main className="flex-1 mt-16 p-gutter w-full max-w-container-max mx-auto ml-0 md:ml-64">
        {/* Breadcrumb & Deck Header */}
        <div className="mb-md flex justify-between items-end">
          <div>
            <div className="flex items-center gap-xs text-caption text-outline mb-xs">
              <span>Courses</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Biology 101</span>
            </div>
            <h2 className="text-headline-lg text-on-background flex items-center gap-sm">
              Cellular Respiration
              <span className="bg-primary-container/10 text-primary text-caption px-sm py-xs rounded-full inline-flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                High Priority
              </span>
            </h2>
          </div>
          <div className="text-right">
            <p className="text-caption text-outline mb-xs">Deck Progress</p>
            <p className="text-label-md text-on-surface-variant">Card {deckProgress.current} of {deckProgress.total}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Main Stage: Active Card (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-[0_4px_24px_-4px_rgba(21,69,57,0.05)] flex-1 min-h-[500px] flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(21,69,57,0.08)]">
              {/* Top Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-high">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>

              {/* Card Content */}
              <div className="p-xl flex-1 flex flex-col justify-center items-center text-center">
                <div className="mb-lg w-full">
                  <span className="text-caption text-outline tracking-wider uppercase mb-md block">Question</span>
                  <h3 className="text-headline-md text-on-surface max-w-2xl mx-auto leading-snug">
                    {currentCard.question}
                  </h3>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-outline-variant/30 my-lg relative">
                  <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-surface px-sm text-caption text-outline">Answer Revealed</div>
                </div>

                {/* Answer */}
                <div className="w-full max-w-2xl mx-auto bg-surface-container-low p-md rounded-lg border border-outline-variant/10 text-left">
                  <p className="text-body-lg text-on-surface-variant mb-sm">
                    {currentCard.answer}
                  </p>
                  <ul className="list-disc list-inside text-body-md text-on-surface-variant/80 space-y-xs ml-sm">
                    {currentCard.details.map((d, i) => (
                      <li key={i}>
                        <strong className="text-on-surface">{d.label}</strong> {d.value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Interaction Buttons */}
              <div className="bg-surface-container-lowest border-t border-outline-variant/20 p-md flex justify-center gap-md">
                <button className="flex flex-col items-center justify-center gap-xs w-32 py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-error hover:bg-error-container hover:text-on-error-container hover:border-error-container transition-colors group">
                  <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">close</span>
                  <span className="text-caption">I don't know it</span>
                  <span className="text-[10px] text-outline opacity-70">&lt; 1 min</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-xs w-32 py-sm rounded-lg bg-surface-container border border-outline-variant/30 text-secondary hover:bg-secondary-container hover:text-on-secondary-container hover:border-secondary-container transition-colors group">
                  <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">schedule</span>
                  <span className="text-caption">Review later</span>
                  <span className="text-[10px] text-outline opacity-70">10 mins</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-xs w-32 py-sm rounded-lg bg-primary text-on-primary shadow-sm hover:opacity-90 hover:-translate-y-px transition-all group">
                  <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">check</span>
                  <span className="text-caption">I know it</span>
                  <span className="text-[10px] text-primary-fixed-dim opacity-80">4 days</span>
                </button>
              </div>
            </div>

            <div className="mt-md text-center">
              <button className="text-label-md text-outline hover:text-primary flex items-center gap-xs mx-auto transition-colors">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Card
              </button>
            </div>
          </div>

          {/* Right Side: Stats & Navigation (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-gutter">
            {/* Session Stats Bento */}
            <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm p-md">
              <h3 className="text-label-md text-on-surface mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">monitoring</span>
                Current Deck Mastery
              </h3>

              <div className="mb-lg">
                <div className="flex justify-between text-caption text-outline mb-xs">
                  <span>Overall Progress</span>
                  <span className="text-primary font-bold">{deckProgress.overall}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                  <div className="bg-primary h-full" style={{ width: `${deckProgress.overall}%` }} />
                  <div className="bg-secondary-fixed-dim h-full" style={{ width: `${(deckProgress.inReview / deckProgress.total) * 100}%` }} />
                  <div className="bg-error-container h-full" style={{ width: `${(deckProgress.difficult / deckProgress.total) * 100}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-sm">
                <div className="bg-primary-container/5 rounded-lg p-sm text-center border border-primary-container/10">
                  <span className="block text-headline-md text-primary">{deckProgress.mastered}</span>
                  <span className="text-caption text-outline">Mastered</span>
                </div>
                <div className="bg-surface-container rounded-lg p-sm text-center border border-outline-variant/20">
                  <span className="block text-headline-md text-secondary">{deckProgress.inReview}</span>
                  <span className="text-caption text-outline">In Review</span>
                </div>
                <div className="bg-error-container/20 rounded-lg p-sm text-center border border-error-container/30">
                  <span className="block text-headline-md text-error">{deckProgress.difficult}</span>
                  <span className="text-caption text-outline">Difficult</span>
                </div>
              </div>
            </div>

            {/* Other Decks List */}
            <div className="bg-surface rounded-xl border border-outline-variant/20 shadow-sm flex-1 p-md flex flex-col">
              <div className="flex justify-between items-center mb-md">
                <h3 className="text-label-md text-on-surface">Up Next</h3>
                <button className="text-caption text-primary hover:underline">View All</button>
              </div>
              <div className="flex-1 space-y-sm overflow-y-auto pr-sm custom-scrollbar">
                {upcomingDecks.map((deck, i) => (
                  <a
                    key={i}
                    href="#"
                    className={`block p-sm rounded-lg border border-outline-variant/20 hover:bg-surface-container-low hover:border-outline-variant/50 transition-all group ${deck.locked ? "opacity-70" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-xs">
                      <h4 className="text-label-md text-on-surface group-hover:text-primary transition-colors">{deck.title}</h4>
                      <span className="bg-surface-container-highest text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full">{deck.course}</span>
                    </div>
                    <div className="flex items-center gap-sm">
                      <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className={`h-full ${deck.progress === 0 ? "bg-outline" : deck.progress < 50 ? "bg-secondary" : "bg-primary"}`} style={{ width: `${deck.progress}%` }} />
                      </div>
                      <span className="text-caption text-outline">{deck.progress}%</span>
                    </div>
                    <div className="mt-xs text-[10px] text-outline flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px]">{deck.icon}</span>
                      {deck.info}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

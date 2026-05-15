import TopBar from "../components/TopBar";

const keyConcepts = [
  { title: "Symmetry", desc: "The curve is perfectly symmetric around its center (the mean). 50% of values are on the left, 50% on the right." },
  { title: "Asymptotic", desc: "The tails approach the horizontal axis but never touch it, extending from negative to positive infinity." },
  { title: "Central Coincidence", desc: "In a perfect normal distribution, Mean, Median, and Mode are exactly the same value at the peak of the bell curve.", wide: true },
];

const examples = [
  { icon: "straighten", title: "Population height", desc: "Most people have a height near the average. Very few are extremely tall or extremely short." },
  { icon: "school", title: "Standardized test scores", desc: "Grades from exams like the SAT or IQ tests are designed to follow a normal distribution." },
];

const relatedTopics = ["Z-Scores", "Central Limit Theorem", "Binomial Distribution", "Statistical Inference"];

export default function OrganizedDocumentPage() {
  return (
    <>
      <TopBar searchPlaceholder="Search in document..." />
      <main className="flex-1 ml-0 md:ml-64 pt-24 pb-xl px-gutter overflow-y-auto">
        <article className="max-w-[900px] mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden relative">
          {/* Action Bar */}
          <div className="bg-surface-container-low border-b border-outline-variant/20 px-lg py-sm flex items-center justify-between sticky top-0 z-30">
            <div className="flex gap-xs overflow-x-auto">
              {[
                { icon: "summarize", label: "Create Summary" },
                { icon: "quiz", label: "Create Flashcards" },
                { icon: "exercise", label: "Practice Questions" },
                { icon: "account_tree", label: "Concept Map" },
              ].map((action, i) => (
                <button key={i} className="flex items-center gap-xs px-3 py-1.5 rounded-md bg-surface text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-colors border border-outline-variant/30 text-caption">
                  <span className="material-symbols-outlined text-[16px]">{action.icon}</span> {action.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-xs px-3 py-1.5 rounded-md text-on-surface hover:bg-surface-variant transition-colors text-caption ml-sm">
              <span className="material-symbols-outlined text-[18px]">download</span> Export
            </button>
          </div>

          <div className="p-lg lg:px-xl py-xl">
            {/* Document Header */}
            <header className="mb-xl">
              <div className="flex items-center gap-sm mb-md flex-wrap">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-caption">Statistics</span>
                <span className="text-outline text-caption flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span> Oct 24, 2023
                </span>
                <span className="text-outline px-2">•</span>
                <a className="text-primary hover:underline text-caption flex items-center gap-xs" href="#">
                  <span className="material-symbols-outlined text-[14px]">link</span> Source: Lecture_4_Slides.pdf
                </a>
              </div>
              <h1 className="text-display-lg text-on-background mb-4">Normal Distribution</h1>
              <p className="text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                Also known as the Gaussian bell curve, it is the most important continuous probability distribution model in statistics due to its ability to describe natural, social, and psychological phenomena.
              </p>
            </header>

            {/* Content Sections */}
            <div className="space-y-xl">
              {/* Key Concepts BENTO */}
              <section>
                <h2 className="text-headline-md text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  Key Concepts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {keyConcepts.map((kc, i) => (
                    <div key={i} className={`bg-surface-bright border border-outline-variant/40 p-md rounded-xl hover:shadow-sm transition-shadow ${kc.wide ? "md:col-span-2" : ""}`}>
                      <h3 className="text-label-md text-on-surface mb-xs flex items-center gap-xs">
                        {kc.wide && <span className="material-symbols-outlined text-[18px] text-secondary">center_focus_strong</span>}
                        {kc.title}
                      </h3>
                      <p className="text-body-md text-on-surface-variant text-sm">{kc.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Formulas */}
              <section>
                <h2 className="text-headline-md text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary-container">functions</span>
                  Formulas & Definitions
                </h2>
                <div className="bg-surface-container-low rounded-xl p-md border-l-4 border-primary">
                  <p className="text-on-surface-variant text-sm mb-sm">Probability Density Function (PDF):</p>
                  <div className="font-mono text-body-lg text-on-surface bg-surface-container-highest/50 p-4 rounded-lg overflow-x-auto">
                    f(x) = (1 / (σ * √(2π))) * e^(-(x - μ)² / (2σ²))
                  </div>
                  <div className="mt-sm grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {[
                      { symbol: "μ", desc: "Mean (μ) - determines the center." },
                      { symbol: "σ", desc: "Standard Deviation - determines the width." },
                      { symbol: "π", desc: "Pi constant (approx. 3.14159)" },
                      { symbol: "e", desc: "Euler's number (approx. 2.71828)" },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="font-bold text-on-surface w-6">{item.symbol}</span>
                        <span className="text-on-surface-variant">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Examples */}
              <section>
                <h2 className="text-headline-md text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary-container">lightbulb</span>
                  Real-World Examples
                </h2>
                <div className="space-y-sm">
                  {examples.map((ex, i) => (
                    <div key={i} className="flex gap-md p-md rounded-xl bg-gradient-to-r from-surface to-surface-bright border border-outline-variant/30">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary">{ex.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-label-md text-on-surface mb-1">{ex.title}</h4>
                        <p className="text-body-md text-on-surface-variant text-sm">{ex.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Detected Gaps */}
              <section>
                <h2 className="text-headline-md text-tertiary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-tertiary">search_insights</span>
                  Detected Knowledge Gaps
                </h2>
                <div className="bg-tertiary-container/10 border border-tertiary/20 p-md rounded-xl flex items-start gap-md">
                  <span className="material-symbols-outlined text-tertiary mt-1">warning</span>
                  <div>
                    <p className="text-body-md text-on-surface mb-2">The original text briefly mentions the "Empirical Rule" (68-95-99.7), but does not go in-depth on how to apply it with concrete examples.</p>
                    <button className="text-tertiary text-sm hover:underline flex items-center gap-xs">
                      Generate Empirical Rule explanation <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Related Topics */}
              <hr className="border-outline-variant/20 my-xl" />
              <section>
                <h3 className="text-on-surface-variant mb-md uppercase tracking-wider text-xs">Related Topics</h3>
                <div className="flex flex-wrap gap-sm">
                  {relatedTopics.map((topic, i) => (
                    <span key={i} className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface text-sm cursor-pointer border border-outline-variant/30 shadow-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </article>
        <div className="h-xl" />
      </main>
    </>
  );
}

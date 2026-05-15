import TopBar from "../components/TopBar";

const documents = [
  {
    title: "Cellular Biology Chapter 4: Respiration",
    course: "BIO 101 - Intro to Biology",
    type: "pdf",
    status: "processed",
    date: "Edited 2 hrs ago",
  },
  {
    title: "Whiteboard Concept Map: Thermodynamics",
    course: "PHYS 202 - Physics II",
    type: "image",
    status: "processing",
    date: "Captured yesterday",
  },
  {
    title: "Lecture 12: Cognitive Load Theory",
    course: "PSYCH 305 - Learning",
    type: "audio",
    status: "summarized",
    date: "Edited Oct 24",
  },
  {
    title: "Essay Outline: Impact of AI on Education",
    course: "ENG 400 - Seminar",
    type: "note",
    status: "draft",
    date: "Edited Oct 20",
  },
  {
    title: "Syllabus Fall 2024",
    course: "BIO 101 - Intro to Biology",
    type: "pdf",
    status: "processed",
    date: "Edited Sep 1",
  },
];

const typeIcons: Record<string, string> = {
  pdf: "picture_as_pdf",
  image: "image",
  audio: "mic",
  note: "edit_note",
};

const typeColors: Record<string, string> = {
  pdf: "bg-error-container/30 text-error",
  image: "bg-surface-container-high text-on-surface-variant",
  audio: "bg-secondary-container/50 text-on-secondary-container",
  note: "bg-surface-container-high text-on-surface-variant",
};

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  processed: { bg: "bg-primary-container/10", text: "text-primary", border: "border-primary-container/20", icon: "check_circle", label: "AI Processed" },
  processing: { bg: "bg-surface-variant", text: "text-on-surface-variant", border: "border-outline-variant/50", icon: "sync", label: "Processing..." },
  summarized: { bg: "bg-primary-container/10", text: "text-primary", border: "border-primary-container/20", icon: "psychology", label: "Summarized" },
  draft: { bg: "bg-surface-container-low", text: "text-on-surface-variant", border: "border-outline-variant/50", icon: "", label: "Draft" },
};

export default function LibraryPage() {
  return (
    <>
      <TopBar searchPlaceholder="Search your library..." />
      <main className="flex-1 ml-0 md:ml-64 pt-[112px] px-gutter pb-xl max-w-container-max w-full mx-auto">
        {/* Page Header */}
        <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-display-lg text-on-background mb-2">Library</h2>
            <p className="text-body-lg text-on-surface-variant max-w-2xl">
              Your processed documents, lecture notes, and captured materials organized for deep focus.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">sort</span>
              <span className="text-label-md">Sort by Date</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-lg bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4">
          <div className="text-label-md text-on-surface-variant flex items-center gap-2 mr-2">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filters:
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/30 text-on-secondary-container border border-secondary-container hover:bg-secondary-container/50 transition-colors cursor-pointer">
            <span className="text-caption">Course</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/30 text-on-secondary-container border border-secondary-container hover:bg-secondary-container/50 transition-colors cursor-pointer">
            <span className="text-caption">File Type</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container/10 text-primary border border-primary-container/20 hover:bg-primary-container/20 transition-colors cursor-pointer">
            <span className="text-caption font-bold">Status: Processed</span>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </div>
          <button className="ml-auto text-caption text-primary hover:underline">Clear all</button>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
          {documents.map((doc, i) => {
            const status = statusConfig[doc.status];
            return (
              <article key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-64 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[doc.type]}`}>
                    <span className="material-symbols-outlined fill">{typeIcons[doc.type]}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full ${status.bg} ${status.text} text-caption flex items-center gap-1 border ${status.border}`}>
                    {status.icon && <span className={`material-symbols-outlined text-[14px] ${doc.status === "processing" ? "animate-spin" : ""}`}>{status.icon}</span>}
                    {status.label}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-headline-md text-on-surface mb-1 line-clamp-2 group-hover:text-primary transition-colors">{doc.title}</h3>
                  <p className="text-body-md text-on-surface-variant line-clamp-1">{doc.course}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between items-center text-caption text-on-surface-variant">
                  <span>{doc.date}</span>
                  <button className="p-1 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-xl flex justify-center pb-xl">
          <button className="px-6 py-3 rounded-full border border-outline-variant bg-surface text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors shadow-sm">
            Load Older Documents
          </button>
        </div>
      </main>
    </>
  );
}

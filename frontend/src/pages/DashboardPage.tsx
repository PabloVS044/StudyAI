import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { listNotes } from "../api/client";
import type { NoteListItem } from "../types/note";

function thisWeekCount(notes: NoteListItem[]): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return notes.filter((n) => n.date && new Date(n.date).getTime() >= cutoff).length;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listNotes(100)
      .then((data) => {
        setNotes(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load notes.");
        setLoading(false);
      });
  }, []);

  const totalNotes = notes.length;
  const withFormulas = notes.filter((n) => n.has_formulas).length;
  const withDiagrams = notes.filter((n) => n.has_diagrams).length;
  const thisWeek = thisWeekCount(notes);

  const statCards = [
    { label: "Total Notes", value: String(totalNotes), sublabel: "captured", icon: "document_scanner", color: "text-primary" },
    { label: "This Week", value: String(thisWeek), sublabel: "notes added", icon: "calendar_today", color: "text-secondary" },
    { label: "With Formulas", value: String(withFormulas), sublabel: "notes", icon: "functions", color: "text-tertiary" },
    { label: "With Diagrams", value: String(withDiagrams), sublabel: "notes", icon: "schema", color: "text-primary" },
  ];

  const recentNotes = notes.slice(0, 6);

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
                    {loading ? (
                      <span className="text-display-lg text-primary leading-none">--</span>
                    ) : (
                      <span className="text-display-lg text-primary leading-none">{card.value}</span>
                    )}
                    <span className="text-caption text-secondary mb-1">{card.sublabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-lg">
            {/* Recent Notes */}
            <section className="xl:col-span-2">
              <div className="flex justify-between items-end mb-md border-b border-outline-variant/30 pb-2">
                <h3 className="text-headline-md text-on-surface">Recent Notes</h3>
                <button
                  onClick={() => navigate("/library")}
                  className="text-label-md text-primary hover:text-primary-container transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  View Library <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center h-40 text-on-surface-variant text-body-md">
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Loading notes...
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-md bg-error-container/20 rounded-[12px] text-error text-body-md">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}

              {!loading && !error && totalNotes === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-4">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-40" style={{ fontVariationSettings: "'FILL' 1" }}>note_stack</span>
                  <p className="text-body-lg text-on-surface-variant">No notes yet. Start by capturing your first note.</p>
                  <button
                    onClick={() => navigate("/capture")}
                    className="bg-primary text-on-primary px-6 py-2 rounded-full text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                    Nueva captura
                  </button>
                </div>
              )}

              {!loading && !error && totalNotes > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                  {recentNotes.map((note) => (
                    <div
                      key={note.note_id}
                      onClick={() => navigate("/library")}
                      className="bg-surface-container-lowest rounded-[16px] p-0 border border-outline-variant/40 shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="h-20 bg-surface-container-low relative">
                        <div className="absolute inset-0 bg-primary/5" />
                        <div className="absolute bottom-3 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
                          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                        </div>
                        {note.date && (
                          <div className="absolute top-3 right-3 text-[10px] text-on-surface-variant bg-surface/80 px-2 py-1 rounded backdrop-blur-sm">
                            {formatDate(note.date)}
                          </div>
                        )}
                      </div>
                      <div className="p-md flex-1 flex flex-col">
                        <h4 className="text-headline-md text-on-surface group-hover:text-primary transition-colors mb-1 line-clamp-1">{note.title}</h4>
                        {note.text_preview && (
                          <p className="text-body-md text-on-surface-variant mb-3 line-clamp-2 text-sm">{note.text_preview}</p>
                        )}
                        <div className="mt-auto flex items-center gap-2 flex-wrap">
                          {note.has_formulas && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">functions</span>Formulas
                            </span>
                          )}
                          {note.has_diagrams && (
                            <span className="px-2 py-1 bg-tertiary/10 text-tertiary rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schema</span>Diagrams
                            </span>
                          )}
                          <span className="ml-auto text-label-md text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Open <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Cognitive Flow Widget */}
            <section className="xl:col-span-1">
              <div className="bg-surface-container-low rounded-[24px] p-md border border-outline-variant/30 h-full flex flex-col">
                <h3 className="text-headline-md text-on-surface mb-2">The Cognitive Flow</h3>
                <p className="text-caption text-on-surface-variant mb-6">How your notes transform into knowledge.</p>
                <div className="flex-1 flex flex-col justify-between py-4 relative">
                  <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-outline-variant/30 z-0" />
                  {[
                    { label: "Capture", icon: "add_a_photo" },
                    { label: "Extract", icon: "auto_awesome" },
                    { label: "Organize", icon: "folder_open" },
                    { label: "Study Active", icon: "psychology", active: true },
                    { label: "Export", icon: "ios_share" },
                  ].map((step, i) => (
                    <div key={i} className={`flex items-start gap-4 relative z-10 group cursor-pointer ${i > 0 ? "mt-4" : ""} ${step.active ? "" : "opacity-50 hover:opacity-100 transition-opacity"}`}>
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

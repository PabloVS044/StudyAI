import { useState, useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import { listNotes, generateConceptMap } from "../api/client";
import type { NoteListItem, ConceptMap, ConceptMapNode, ConceptMapEdge } from "../types/note";
import { useAppSettings } from "../context/AppSettings";

const COPY = {
  es: {
    searchPlaceholder: "Buscar mapas conceptuales...",
    notesTitle: "Notas",
    loadingNotes: "Cargando notas...",
    emptyNotes: "No hay notas disponibles.",
    selectNote: "Selecciona una nota",
    emptyState: "Selecciona una nota para generar su mapa conceptual.",
    noMap: "Esta nota no tiene mapa conceptual todavia.\nGeneralo con el boton de abajo.",
    generating: "Generando mapa conceptual...",
    btnGenerating: "Generando...",
    btnRegenerate: "Regenerar",
    btnGenerate: "Generar mapa",
    errorLoadNotes: "No se pudieron cargar las notas.",
    errorGenerate: "Error al generar el mapa conceptual.",
    regenAriaLabel: "Regenerar mapa conceptual",
    nodes: "nodos",
    edges: "relaciones",
  },
  en: {
    searchPlaceholder: "Search concept maps...",
    notesTitle: "Notes",
    loadingNotes: "Loading notes...",
    emptyNotes: "No notes available.",
    selectNote: "Select a note",
    emptyState: "Select a note to generate its concept map.",
    noMap: "This note has no concept map yet.\nGenerate one with the button below.",
    generating: "Generating concept map...",
    btnGenerating: "Generating...",
    btnRegenerate: "Regenerate",
    btnGenerate: "Generate map",
    errorLoadNotes: "Could not load notes.",
    errorGenerate: "Error generating concept map.",
    regenAriaLabel: "Regenerate concept map",
    nodes: "nodes",
    edges: "relations",
  },
} as const;

// Layout: place nodes in a circle, center node (most connected) at center
function computeLayout(
  nodes: ConceptMapNode[],
  edges: ConceptMapEdge[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  // Count connections per node to find the most connected one
  const degree = new Map<string, number>();
  nodes.forEach((n) => degree.set(n.id, 0));
  edges.forEach((e) => {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  });

  const sorted = [...nodes].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0));
  const cx = width / 2;
  const cy = height / 2;

  if (nodes.length === 1) {
    positions.set(sorted[0].id, { x: cx, y: cy });
    return positions;
  }

  // Center node is the most connected one
  const centerNode = sorted[0];
  positions.set(centerNode.id, { x: cx, y: cy });

  const periphery = sorted.slice(1);
  const r = Math.min(width, height) * 0.36;
  periphery.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / periphery.length - Math.PI / 2;
    positions.set(node.id, {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  });

  return positions;
}

// Wrap label text into lines of maxChars
function wrapText(text: string, maxChars = 16): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.length ? lines : [text];
}

const NODE_RX = 56; // half-width of node box
const NODE_RY = 22; // half-height of node box
const LINE_HEIGHT = 14;

interface GraphProps {
  map: ConceptMap;
}

function ConceptGraph({ map }: GraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 540 });

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) {
        setDims({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { w, h } = dims;
  const positions = computeLayout(map.nodes, map.edges, w, h);

  // Compute edge endpoint on node border (simple: toward target/source)
  function edgePoint(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): { x1: number; y1: number; x2: number; y2: number } {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // Clip to ellipse border approx
    const t1 = Math.min(NODE_RX / Math.abs(ux || 0.001), NODE_RY / Math.abs(uy || 0.001));
    const t2 = t1;
    return {
      x1: from.x + ux * t1,
      y1: from.y + uy * t1,
      x2: to.x - ux * t2,
      y2: to.y - uy * t2,
    };
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full"
        aria-label="concept map"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" className="fill-primary/60" />
          </marker>
        </defs>

        {/* Edges */}
        {map.edges.map((edge, i) => {
          const src = positions.get(edge.source);
          const tgt = positions.get(edge.target);
          if (!src || !tgt) return null;
          const { x1, y1, x2, y2 } = edgePoint(src, tgt);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                className="stroke-outline-variant"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
              {edge.label && (
                <text
                  x={mx} y={my - 5}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-on-surface-variant"
                  style={{ fontFamily: "inherit" }}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {map.nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const lines = wrapText(node.label);
          const boxH = lines.length * LINE_HEIGHT + 12;
          const boxW = NODE_RX * 2;
          return (
            <g key={node.id} transform={`translate(${pos.x},${pos.y})`}>
              <rect
                x={-boxW / 2}
                y={-boxH / 2}
                width={boxW}
                height={boxH}
                rx={10}
                className="fill-surface-container stroke-primary/40"
                strokeWidth={1.5}
              />
              {lines.map((line, li) => (
                <text
                  key={li}
                  x={0}
                  y={(li - (lines.length - 1) / 2) * LINE_HEIGHT + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight={lines.length === 1 ? 600 : li === 0 ? 600 : 400}
                  className="fill-on-surface"
                  style={{ fontFamily: "inherit" }}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ConceptMapsPage() {
  const { lang } = useAppSettings();
  const t = COPY[lang];

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteListItem | null>(null);
  const [map, setMap] = useState<ConceptMap | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);

  useEffect(() => {
    listNotes()
      .then((data) => {
        setNotes(data);
        if (data.length > 0) setSelectedNote(data[0]);
      })
      .catch(() => setError(t.errorLoadNotes))
      .finally(() => setNotesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectNote = (note: NoteListItem) => {
    setSelectedNote(note);
    setMap(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedNote) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generateConceptMap(selectedNote.note_id);
      setMap(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.errorGenerate);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <TopBar searchPlaceholder={t.searchPlaceholder} />
      <main className="flex-1 mt-16 ml-0 md:ml-64 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Pane: Notes List */}
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col bg-surface overflow-hidden shrink-0 max-h-[40vh] md:max-h-none">
          <div className="p-md flex flex-col gap-4 border-b border-outline-variant/30">
            <h2 className="text-headline-md text-primary">{t.notesTitle}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-2 custom-scrollbar">
            {notesLoading && (
              <div className="flex items-center gap-2 p-4 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {t.loadingNotes}
              </div>
            )}
            {!notesLoading && notes.length === 0 && (
              <p className="p-4 text-body-md text-on-surface-variant">{t.emptyNotes}</p>
            )}
            {notes.map((note) => {
              const isActive = selectedNote?.note_id === note.note_id;
              return (
                <div
                  key={note.note_id}
                  onClick={() => handleSelectNote(note)}
                  className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? "bg-surface-container-highest shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-primary/10 relative overflow-hidden"
                      : "bg-surface hover:bg-surface-container-low border-transparent hover:border-outline-variant/30"
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-caption px-2 py-0.5 rounded text-xs text-primary bg-primary/10 truncate max-w-[70%]">
                      {note.filename}
                    </span>
                    <span className="text-caption text-on-surface-variant/70 text-xs shrink-0 ml-1">{note.date}</span>
                  </div>
                  <h3 className="text-body-lg text-on-surface font-semibold mb-1 leading-tight line-clamp-1">{note.title}</h3>
                  <p className="text-body-md text-on-surface-variant line-clamp-2 text-sm">{note.text_preview}</p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Pane: Graph */}
        <section className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden relative min-h-0">
          {/* Header bar */}
          <div className="h-14 border-b border-outline-variant/20 flex items-center justify-between px-4 md:px-lg bg-surface-container-lowest/90 backdrop-blur z-10 shrink-0">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant min-w-0">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              <span className="font-medium text-caption truncate">
                {selectedNote ? selectedNote.title : t.selectNote}
              </span>
            </div>
            {map && (
              <div className="flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
                <span className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">circle</span>
                  {map.nodes.length} {t.nodes}
                </span>
                <span className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  {map.edges.length} {t.edges}
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-40"
                  aria-label={t.regenAriaLabel}
                >
                  <span className={`material-symbols-outlined text-[20px] ${generating ? "animate-spin" : ""}`}>sync</span>
                </button>
              </div>
            )}
          </div>

          {/* Canvas area */}
          <div className="flex-1 overflow-hidden relative">
            {/* Empty: no note selected */}
            {!selectedNote && !notesLoading && (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-4">
                <span className="material-symbols-outlined text-[48px] opacity-30">account_tree</span>
                <p className="text-body-lg">{t.emptyState}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="absolute top-4 left-4 right-4 bg-error/10 border border-error/20 text-error rounded-xl px-5 py-4 text-body-md z-20">
                {error}
              </div>
            )}

            {/* No map yet */}
            {selectedNote && !generating && !map && !error && (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant gap-6">
                <span className="material-symbols-outlined text-[48px] opacity-30">account_tree</span>
                <p className="text-body-lg text-center">
                  {t.noMap.split("\n").map((line, i) =>
                    i === 0 ? line : <><br key={i} />{line}</>
                  )}
                </p>
              </div>
            )}

            {/* Generating */}
            {generating && (
              <div className="flex items-center justify-center h-full gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                <span className="text-body-lg">{t.generating}</span>
              </div>
            )}

            {/* Graph */}
            {map && !generating && (
              <ConceptGraph map={map} />
            )}
          </div>

          {/* Floating Action Bar */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-surface-bright/90 backdrop-blur-xl border border-outline-variant/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-2 py-2 flex items-center gap-1 z-20">
            <button
              onClick={handleGenerate}
              disabled={!selectedNote || generating}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-on-surface hover:bg-surface-container transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[20px] text-primary ${generating ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}>
                {generating ? "progress_activity" : "sync"}
              </span>
              <span className="text-label-md">{generating ? t.btnGenerating : map ? t.btnRegenerate : t.btnGenerate}</span>
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

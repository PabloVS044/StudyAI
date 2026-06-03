export interface Formula {
  descripcion?: string;
  latex?: string;
  texto_plano?: string;
}

export interface Lista {
  tipo: "numerada" | "viñetas";
  items: string[];
}

export interface DiagramaFigura {
  descripcion: string;
}

export interface Definicion {
  termino: string;
  definicion: string;
}

export interface NoteContent {
  titulo?: string;
  texto_principal?: string;
  formulas: Formula[];
  listas: Lista[];
  diagramas_figuras: DiagramaFigura[];
  definiciones: Definicion[];
  observaciones?: string;
  tags?: string[];
}

/** Returned by POST /api/extract (before saving). */
export interface ExtractResult {
  note_id: string;
  filename: string;
  image_ext?: string;
  content?: NoteContent;
  error?: string;
  created_at: string;
}

/** Returned by GET /api/notes (list). */
export interface NoteListItem {
  note_id: string;
  title: string;
  filename: string;
  image_ext?: string;
  date: string;
  text_preview: string;
  has_formulas: boolean;
  has_diagrams: boolean;
  notion_url?: string;
  drive_url?: string;
  tags: string[];
}

/** Returned by GET /api/notes/:id (detail). */
export interface NoteDetail extends NoteListItem {
  content: NoteContent;
  drive_file_id?: string;
  obsidian_path?: string;
}

/** Returned by POST /api/notes/search. */
export interface SearchResultItem extends NoteListItem {
  score: number;
}

export interface Flashcard {
  pregunta: string;
  respuesta: string;
}

export interface FlashcardSet {
  note_id: string;
  flashcards: Flashcard[];
}

export interface SummaryResponse {
  title: string;
  summary: string;
  key_concepts: string[];
  note_ids: string[];
  style: string;
}

export interface SummaryNoteItem {
  note_id: string;
  title: string;
  filename: string;
  date: string;
  tags: string[];
}

export interface AppConfig {
  notion: boolean;
  drive: boolean;
  obsidian: boolean;
  pinecone: boolean;
}

export interface QuizQuestion {
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

export interface QuizResult {
  note_id: string;
  difficulty: string;
  questions: QuizQuestion[];
}

export interface Notebook {
  id: number;
  user_id?: string;
  name: string;
  description?: string;
  created_at: string;
  note_count?: number;
}

export interface ExamResult {
  questions: QuizQuestion[];
  difficulty: string;
  source: { notebook_id?: number; note_ids?: string[] };
}

export interface ConceptMapNode {
  id: string;
  label: string;
}

export interface ConceptMapEdge {
  source: string;
  target: string;
  label?: string;
}

export interface ConceptMap {
  note_id: string;
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
}

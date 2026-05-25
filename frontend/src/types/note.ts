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

export interface AppConfig {
  notion: boolean;
  drive: boolean;
  obsidian: boolean;
  pinecone: boolean;
}

export interface Flashcard {
  pregunta: string;
  respuesta: string;
}

export interface FlashcardSet {
  note_id: string;
  flashcards: Flashcard[];
}

/// <reference types="vite/client" />
import type { AppConfig, ExtractResult, FlashcardSet, NoteDetail, NoteListItem, QuizResult, SearchResultItem, SummaryNoteItem, SummaryResponse } from "../types/note";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

type TokenProvider = () => Promise<string | null>;
let _tokenProvider: TokenProvider | null = null;

export function setTokenProvider(fn: TokenProvider) {
  _tokenProvider = fn;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (_tokenProvider) {
    const token = await _tokenProvider();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).detail ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ── Extract ───────────────────────────────────────────────────────────────────
export function extractImages(files: File[]): Promise<ExtractResult[]> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return req("/api/extract", { method: "POST", body: form });
}

// ── Notes ─────────────────────────────────────────────────────────────────────
export function saveNote(payload: {
  note_id: string;
  filename: string;
  image_ext?: string;
  content: object;
}): Promise<{ note_id: string; saved: boolean }> {
  return req("/api/notes/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function listNotes(limit = 50): Promise<NoteListItem[]> {
  return req(`/api/notes?limit=${limit}`);
}

export function getNote(noteId: string): Promise<NoteDetail> {
  return req(`/api/notes/${noteId}`);
}

export function deleteNote(noteId: string): Promise<{ deleted: boolean }> {
  return req(`/api/notes/${noteId}`, { method: "DELETE" });
}

export function searchNotes(query: string, topK = 5): Promise<SearchResultItem[]> {
  return req("/api/notes/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
  });
}

// ── Summaries ────────────────────────────────────────────────────────────────
export interface SummaryRequest {
  note_ids: string[];
  style?: "brief" | "detailed" | "bullet_points";
  language?: string;
}

// ── Integrations ──────────────────────────────────────────────────────────────
export interface MyIntegrations {
  notion: { connected: boolean; account: string | null; book: string | null; available: boolean };
  google: { connected: boolean; account: string | null; folder: string | null; available: boolean };
}

export function getMyIntegrations(): Promise<MyIntegrations> {
  return req("/api/integrations/me");
}

export function disconnectIntegration(provider: "notion" | "google"): Promise<{ disconnected: boolean }> {
  return req(`/api/integrations/${provider}`, { method: "DELETE" });
}

// Notion
export function notionConnectUrl(): Promise<{ auth_url: string }> {
  return req("/api/integrations/notion/connect");
}

export function exchangeOAuth(code: string, state: string): Promise<{ provider: "notion" | "google"; connected: boolean; account: string }> {
  return req("/api/integrations/oauth/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  });
}

export function listNotionParents(): Promise<{ id: string; title: string }[]> {
  return req("/api/integrations/notion/parents");
}

export function listNotionBooks(): Promise<{ id: string; title: string }[]> {
  return req("/api/integrations/notion/books");
}

export function createNotionBook(payload: { title: string; parent_page_id?: string }): Promise<{ id: string; title: string }> {
  return req("/api/integrations/notion/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function selectNotionBook(payload: { database_id: string; title: string }): Promise<{ id: string; title: string }> {
  return req("/api/integrations/notion/select-book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportNotion(noteId: string): Promise<{ success: boolean; url: string }> {
  return req(`/api/integrations/notion/export/${noteId}`, { method: "POST" });
}

// Google Drive
export function googleConnectUrl(): Promise<{ auth_url: string }> {
  return req("/api/integrations/google/connect");
}

export function listDriveFolders(): Promise<{ id: string; name: string }[]> {
  return req("/api/integrations/google/folders");
}

export function createDriveFolder(payload: { name: string; parent_id?: string }): Promise<{ id: string; name: string }> {
  return req("/api/integrations/google/folder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function selectDriveFolder(payload: { folder_id: string; name: string }): Promise<{ id: string; name: string }> {
  return req("/api/integrations/google/select-folder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportDrive(noteId: string): Promise<{ success: boolean; url: string }> {
  return req(`/api/integrations/drive/export/${noteId}`, { method: "POST" });
}

export async function getObsidianMarkdown(noteId: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (_tokenProvider) {
    const token = await _tokenProvider();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}/api/integrations/obsidian/${noteId}/export`, { headers });
  if (!res.ok) throw new Error("Error al obtener markdown");
  return res.text();
}

export async function exportObsidian(noteId: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (_tokenProvider) {
    const token = await _tokenProvider();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}/api/integrations/obsidian/${noteId}/export`, { headers });
  if (!res.ok) throw new Error("Error al exportar");
  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition") ?? "";
  const match = disp.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `note_${noteId}.md`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function saveObsidianVault(noteId: string): Promise<{ success: boolean; path: string; obsidian_uri: string }> {
  return req(`/api/integrations/obsidian/${noteId}/save-vault`, { method: "POST" });
}

// ── Config ────────────────────────────────────────────────────────────────────
export function getConfig(): Promise<AppConfig> {
  return req("/api/config");
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export function chatRag(question: string): Promise<{
  answer: string;
  sources: { note_id: string; title: string; score: number }[];
}> {
  return req("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}

// ── Flashcards & Summaries (Supabase stack) ───────────────────────────────────
export function generateFlashcards(noteId: string, count = 10): Promise<FlashcardSet> {
  return req(`/api/flashcards/${noteId}/generate?count=${count}`, { method: "POST" });
}

export function generateSummary(payload: SummaryRequest): Promise<SummaryResponse> {
  return req("/api/summaries/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function listSummaryNotes(): Promise<SummaryNoteItem[]> {
  return req("/api/summaries/list");
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
export function generateQuiz(
  noteId: string,
  opts: { count: number; difficulty: string }
): Promise<QuizResult> {
  return req(`/api/quiz/${noteId}/generate?count=${opts.count}&difficulty=${opts.difficulty}`, { method: "POST" });
}

export function saveQuizAttempt(payload: {
  note_id: string;
  difficulty: string;
  mode: string;
  total: number;
  correct: number;
  max_streak: number;
  passed: boolean;
}): Promise<{ saved: boolean }> {
  return req("/api/quiz/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function listQuizAttempts(noteId?: string): Promise<any[]> {
  const qs = noteId ? `?note_id=${noteId}` : "";
  return req(`/api/quiz/attempts${qs}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function imageUrl(noteId: string): string {
  return `${BASE}/api/uploads/${noteId}`;
}

/// <reference types="vite/client" />
import type { AppConfig, ExtractResult, NoteDetail, NoteListItem, SearchResultItem } from "../types/note";

const BASE = import.meta.env.VITE_API_URL ?? "";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
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

// ── Integrations ──────────────────────────────────────────────────────────────
export function syncNotion(noteId: string): Promise<{ success: boolean; url: string }> {
  return req(`/api/integrations/notion/${noteId}`, { method: "POST" });
}

export function syncDrive(noteId: string): Promise<{ success: boolean; url: string }> {
  return req(`/api/integrations/drive/${noteId}`, { method: "POST" });
}

export function getGoogleAuthUrl(): Promise<{ auth_url: string }> {
  return req("/api/integrations/google/auth-url");
}

export function validateIntegrations(): Promise<{
  mistral: boolean;
  pinecone: boolean;
  notion: boolean;
  drive: boolean;
}> {
  return req("/api/integrations/validate", { method: "POST" });
}

export async function exportObsidian(noteId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/integrations/obsidian/${noteId}/export`);
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

export function saveObsidianVault(noteId: string): Promise<{ success: boolean; path: string }> {
  return req(`/api/integrations/obsidian/${noteId}/save-vault`, { method: "POST" });
}

// ── Config ────────────────────────────────────────────────────────────────────
export function getConfig(): Promise<AppConfig> {
  return req("/api/config");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function imageUrl(noteId: string): string {
  return `${BASE}/api/uploads/${noteId}`;
}

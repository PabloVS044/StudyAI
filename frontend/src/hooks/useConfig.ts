import { useEffect, useState } from "react";
import { getConfig } from "../api/client";
import type { AppConfig } from "../types/note";

const DEFAULT: AppConfig = { notion: false, drive: false, obsidian: false, pinecone: false };

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT);

  useEffect(() => {
    getConfig().then(setConfig).catch(() => { /* silently use defaults */ });
  }, []);

  return config;
}

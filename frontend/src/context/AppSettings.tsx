import { createContext, useContext, useEffect, useState } from "react";

type Lang = "es" | "en";
type Theme = "light" | "dark";

interface AppSettingsCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const AppSettingsContext = createContext<AppSettingsCtx | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("studyai-lang") as Lang) ?? "es";
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("studyai-theme") as Theme) ?? "light";
  });

  // Apply dark class on init and on theme change
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("studyai-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("studyai-lang", lang);
  }, [lang]);

  function setLang(l: Lang) { setLangState(l); }
  function toggleLang() { setLangState((prev) => (prev === "es" ? "en" : "es")); }
  function setTheme(t: Theme) { setThemeState(t); }
  function toggleTheme() { setThemeState((prev) => (prev === "light" ? "dark" : "light")); }

  return (
    <AppSettingsContext.Provider value={{ lang, setLang, toggleLang, theme, setTheme, toggleTheme }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsCtx {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used inside AppSettingsProvider");
  return ctx;
}

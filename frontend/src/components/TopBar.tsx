import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/react";
import { useAppSettings } from "../context/AppSettings";

const COPY = {
  es: { search: "Buscar...", notifications: "Notificaciones" },
  en: { search: "Search...", notifications: "Notifications" },
} as const;

export default function TopBar({ searchPlaceholder }: { searchPlaceholder?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { lang, theme, toggleLang, toggleTheme } = useAppSettings();
  const t = COPY[lang];

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="bg-surface-bright/80 backdrop-blur-md shadow-sm fixed top-0 right-0 left-0 md:left-64 z-40 flex justify-between items-center h-16 px-gutter w-full md:max-w-[calc(100%-16rem)]">
      <div className="flex items-center gap-md flex-1">
        {/* Mobile brand - only visible when sidebar is hidden */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <img src="/logo.png" alt="StudyAI" className="w-7 h-7 rounded-md object-cover" />
          <span className="text-primary font-extrabold text-base tracking-tight">StudyAI</span>
        </div>
        <div className="relative hidden sm:block max-w-md w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-body-md focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
            placeholder={searchPlaceholder ?? t.search}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <div className="flex items-center gap-sm">
        <button
          onClick={toggleLang}
          className="text-on-surface-variant hover:bg-primary-container/10 rounded-full px-3 py-2 transition-all flex items-center justify-center text-label-sm font-semibold"
          title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
        >
          {lang.toUpperCase()}
        </button>
        <button
          onClick={toggleTheme}
          className="text-on-surface-variant hover:bg-primary-container/10 rounded-full p-2 transition-all flex items-center justify-center"
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          <span className="material-symbols-outlined">
            {theme === "light" ? "dark_mode" : "light_mode"}
          </span>
        </button>
        <button
          className="text-on-surface-variant hover:bg-primary-container/10 rounded-full p-2 transition-all flex items-center justify-center"
          title={t.notifications}
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <UserButton />
      </div>
    </header>
  );
}

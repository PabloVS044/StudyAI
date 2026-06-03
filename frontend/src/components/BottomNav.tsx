import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppSettings } from "../context/AppSettings";

// Primary slots shown in bottom bar (5 max including "More" button = 4 nav items)
const PRIMARY_ROUTES = ["/dashboard", "/capture", "/library", "/ai-summaries", "/ai-assistant"];

const NAV_ITEMS = {
  es: [
    { to: "/dashboard",    label: "Dashboard",         icon: "dashboard" },
    { to: "/notebooks",    label: "Libros",             icon: "menu_book" },
    { to: "/capture",      label: "Capturar",           icon: "add_a_photo" },
    { to: "/search",       label: "Buscar",             icon: "search" },
    { to: "/library",      label: "Biblioteca",         icon: "library_books" },
    { to: "/ai-summaries", label: "Resumenes IA",       icon: "psychology" },
    { to: "/flashcards",   label: "Flashcards",         icon: "quiz" },
    { to: "/tests",        label: "Tests",              icon: "fact_check" },
    { to: "/concept-maps", label: "Mapas",              icon: "hub" },
    { to: "/ai-assistant", label: "Asistente IA",       icon: "chat" },
    { to: "/integrations", label: "Integraciones",      icon: "extension" },
  ],
  en: [
    { to: "/dashboard",    label: "Dashboard",          icon: "dashboard" },
    { to: "/notebooks",    label: "Notebooks",          icon: "menu_book" },
    { to: "/capture",      label: "Capture",            icon: "add_a_photo" },
    { to: "/search",       label: "Search",             icon: "search" },
    { to: "/library",      label: "Library",            icon: "library_books" },
    { to: "/ai-summaries", label: "AI Summaries",       icon: "psychology" },
    { to: "/flashcards",   label: "Flashcards",         icon: "quiz" },
    { to: "/tests",        label: "Tests",              icon: "fact_check" },
    { to: "/concept-maps", label: "Maps",               icon: "hub" },
    { to: "/ai-assistant", label: "AI Assistant",       icon: "chat" },
    { to: "/integrations", label: "Integrations",       icon: "extension" },
  ],
} as const;

const MORE_COPY = {
  es: { more: "Más", lang: "Idioma", theme: { light: "Modo oscuro", dark: "Modo claro" } },
  en: { more: "More", lang: "Language", theme: { light: "Dark mode", dark: "Light mode" } },
} as const;

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, theme, toggleLang, toggleTheme } = useAppSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const allItems = NAV_ITEMS[lang];
  const t = MORE_COPY[lang];

  const primaryItems = allItems.filter((item) => PRIMARY_ROUTES.includes(item.to));
  const secondaryItems = allItems.filter((item) => !PRIMARY_ROUTES.includes(item.to));

  const isActive = (to: string) => location.pathname.startsWith(to);
  const anySecondaryActive = secondaryItems.some((item) => isActive(item.to));

  function handleNav(to: string) {
    navigate(to);
    setDrawerOpen(false);
  }

  // Close drawer on outside tap
  useEffect(() => {
    if (!drawerOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [drawerOpen]);

  return (
    <>
      {/* Bottom sheet drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" aria-modal="true" role="dialog" aria-label="More navigation">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />

          {/* Sheet */}
          <div
            ref={drawerRef}
            className="relative w-full bg-surface rounded-t-2xl pb-[env(safe-area-inset-bottom)] shadow-xl z-10"
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-outline-variant" />
            </div>

            <ul className="px-4 py-2 space-y-1">
              {secondaryItems.map((item) => {
                const active = isActive(item.to);
                return (
                  <li key={item.to}>
                    <button
                      onClick={() => handleNav(item.to)}
                      aria-label={item.label}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        active
                          ? "text-primary bg-primary-container/15 font-semibold"
                          : "text-on-surface-variant hover:text-primary hover:bg-primary-container/5"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Toggles */}
            <div className="flex gap-2 px-4 py-3 border-t border-outline-variant/30 mx-2 mb-2">
              <button
                onClick={toggleLang}
                aria-label={lang === "es" ? "Switch to English" : "Cambiar a Español"}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">language</span>
                <span className="text-sm font-semibold">{lang.toUpperCase()}</span>
              </button>
              <button
                onClick={toggleTheme}
                aria-label={t.theme[theme as "light" | "dark"]}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary-container/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {theme === "light" ? "dark_mode" : "light_mode"}
                </span>
                <span className="text-sm">{t.theme[theme as "light" | "dark"]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex md:hidden bg-surface border-t border-outline-variant pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile navigation"
      >
        {primaryItems.map((item) => {
          const active = isActive(item.to);
          return (
            <button
              key={item.to}
              onClick={() => handleNav(item.to)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                active ? "text-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="text-[10px] leading-tight truncate max-w-[56px] text-center">{item.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label={t.more}
          aria-expanded={drawerOpen}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
            anySecondaryActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">more_horiz</span>
          <span className="text-[10px] leading-tight">{t.more}</span>
        </button>
      </nav>
    </>
  );
}

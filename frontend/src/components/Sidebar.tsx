import { useNavigate, useLocation } from "react-router-dom";
import { useAppSettings } from "../context/AppSettings";

// group: "core" | "ai" | "integrations"
const NAV_ITEMS = {
  es: [
    { to: "/dashboard",    label: "Dashboard",         icon: "dashboard",    group: "core" },
    { to: "/notebooks",    label: "Libros",             icon: "menu_book",    group: "core" },
    { to: "/capture",      label: "Capturar",           icon: "add_a_photo",  group: "core" },
    { to: "/search",       label: "Buscar",             icon: "search",       group: "core" },
    { to: "/library",      label: "Biblioteca",         icon: "library_books",group: "core" },
    { to: "/ai-summaries", label: "Resumenes IA",       icon: "psychology",   group: "ai" },
    { to: "/flashcards",   label: "Flashcards",         icon: "quiz",         group: "ai" },
    { to: "/tests",        label: "Tests",              icon: "fact_check",   group: "ai" },
    { to: "/concept-maps", label: "Mapas Conceptuales", icon: "hub",          group: "ai" },
    { to: "/ai-assistant", label: "Asistente IA",       icon: "chat",         group: "ai" },
    { to: "/integrations", label: "Integraciones",      icon: "extension",    group: "integrations" },
  ],
  en: [
    { to: "/dashboard",    label: "Dashboard",          icon: "dashboard",    group: "core" },
    { to: "/notebooks",    label: "Notebooks",          icon: "menu_book",    group: "core" },
    { to: "/capture",      label: "Capture",            icon: "add_a_photo",  group: "core" },
    { to: "/search",       label: "Search",             icon: "search",       group: "core" },
    { to: "/library",      label: "Library",            icon: "library_books",group: "core" },
    { to: "/ai-summaries", label: "AI Summaries",       icon: "psychology",   group: "ai" },
    { to: "/flashcards",   label: "Flashcards",         icon: "quiz",         group: "ai" },
    { to: "/tests",        label: "Tests",              icon: "fact_check",   group: "ai" },
    { to: "/concept-maps", label: "Concept Maps",       icon: "hub",          group: "ai" },
    { to: "/ai-assistant", label: "AI Assistant",       icon: "chat",         group: "ai" },
    { to: "/integrations", label: "Integrations",       icon: "extension",    group: "integrations" },
  ],
} as const;

const COPY = {
  es: { tagline: "Hub de Estudio Personal", newCapture: "Nueva Captura" },
  en: { tagline: "Personal Study Hub", newCapture: "New Capture" },
} as const;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, theme, toggleLang, toggleTheme } = useAppSettings();

  const navItems = NAV_ITEMS[lang];
  const t = COPY[lang];

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low shadow-sm py-md px-sm z-50">
      {/* Brand */}
      <div className="mb-lg px-sm flex items-center gap-sm">
        <img src="/logo.png" alt="StudyAI" className="w-8 h-8 rounded-full object-cover" />
        <div>
          <h1 className="text-headline-md text-primary tracking-tight" style={{ fontWeight: 800 }}>StudyFlow AI</h1>
          <p className="text-caption text-on-surface-variant">{t.tagline}</p>
        </div>
      </div>

      {/* New Capture CTA */}
      <div className="px-sm mb-lg">
        <button
          onClick={() => navigate("/capture")}
          className="w-full bg-primary text-on-primary rounded-lg py-sm px-md flex items-center justify-center gap-xs hover:bg-primary-container transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="text-label-md">{t.newCapture}</span>
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Core group */}
        <ul className="space-y-xs">
          {navItems.filter((i) => i.group === "core").map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.to}>
                <button
                  onClick={() => navigate(item.to)}
                  className={`w-full flex items-center gap-sm px-md py-sm rounded-lg transition-colors duration-200 ${
                    active
                      ? "text-primary font-bold border-r-4 border-primary bg-primary-container/10 scale-[0.97]"
                      : "text-on-surface-variant hover:text-primary hover:bg-primary-container/5"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px]${active ? " fill" : ""}`}>{item.icon}</span>
                  <span className="text-label-md">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* AI tools group */}
        <div className="border-t border-outline-variant/30 my-sm" />
        <ul className="space-y-xs">
          {navItems.filter((i) => i.group === "ai").map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.to}>
                <button
                  onClick={() => navigate(item.to)}
                  className={`w-full flex items-center gap-sm px-md py-sm rounded-lg transition-colors duration-200 ${
                    active
                      ? "text-primary font-bold border-r-4 border-primary bg-primary-container/10 scale-[0.97]"
                      : "text-on-surface-variant hover:text-primary hover:bg-primary-container/5"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px]${active ? " fill" : ""}`}>{item.icon}</span>
                  <span className="text-label-md">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Integrations — pushed to bottom */}
        <div className="mt-auto">
          <div className="border-t border-outline-variant/30 my-sm" />
          <ul className="space-y-xs">
            {navItems.filter((i) => i.group === "integrations").map((item) => {
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <button
                    onClick={() => navigate(item.to)}
                    className={`w-full flex items-center gap-sm px-md py-sm rounded-lg transition-colors duration-200 ${
                      active
                        ? "text-primary font-bold border-r-4 border-primary bg-primary-container/10 scale-[0.97]"
                        : "text-on-surface-variant hover:text-primary hover:bg-primary-container/5"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px]${active ? " fill" : ""}`}>{item.icon}</span>
                    <span className="text-label-md">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Bottom toggles */}
      <div className="flex items-center gap-xs px-sm pt-sm border-t border-outline-variant/30">
        <button
          onClick={toggleLang}
          className="flex-1 flex items-center justify-center gap-xs text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-lg py-sm transition-colors"
          title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
        >
          <span className="material-symbols-outlined text-[18px]">language</span>
          <span className="text-label-sm font-semibold">{lang.toUpperCase()}</span>
        </button>
        <button
          onClick={toggleTheme}
          className="flex-1 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-lg py-sm transition-colors"
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === "light" ? "dark_mode" : "light_mode"}
          </span>
        </button>
      </div>
    </nav>
  );
}

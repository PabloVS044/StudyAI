import { NavLink, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/capture", label: "Capture", icon: "add_a_photo" },
  { to: "/library", label: "Library", icon: "library_books" },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/ai-summaries", label: "AI Summaries", icon: "psychology" },
  { to: "/flashcards", label: "Flashcards", icon: "quiz" },
  { to: "/concept-maps", label: "Concept Maps", icon: "hub" },
  { to: "/integrations", label: "Integrations", icon: "extension" },
  { to: "/ai-assistant", label: "AI Assistant", icon: "chat" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low shadow-sm py-md px-sm z-50">
      {/* Brand */}
      <div className="mb-lg px-sm flex items-center gap-sm">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined fill text-on-primary text-[18px]">psychology</span>
        </div>
        <div>
          <h1 className="text-headline-md text-primary tracking-tight" style={{ fontWeight: 800 }}>StudyFlow AI</h1>
          <p className="text-caption text-on-surface-variant">Personal Study Hub</p>
        </div>
      </div>

      {/* New Capture CTA */}
      <div className="px-sm mb-lg">
        <button
          onClick={() => navigate("/capture")}
          className="w-full bg-primary text-on-primary rounded-lg py-sm px-md flex items-center justify-center gap-xs hover:bg-primary-container transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="text-label-md">New Capture</span>
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-xs">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.to}>
                <button
                  onClick={() => navigate(item.to)}
                  className={`w-full flex items-center gap-sm px-md py-sm rounded-lg transition-colors duration-200 ${
                    active
                      ? "text-primary font-bold border-r-4 border-primary bg-primary-container/10 scale-[0.97]"
                      : "text-on-secondary-fixed-variant hover:text-primary hover:bg-primary-container/5"
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

      {/* Settings */}
      <div className="mt-auto pt-sm border-t border-outline-variant/30">
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-sm px-md py-sm rounded-lg transition-colors duration-200 text-on-secondary-fixed-variant hover:text-primary hover:bg-primary-container/5"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-label-md">Settings</span>
        </button>
      </div>
    </nav>
  );
}

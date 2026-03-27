import { useState } from "react";
import { Brain, Upload, BookOpen, Search } from "lucide-react";
import UploadPage from "./pages/UploadPage";
import LibraryPage from "./pages/LibraryPage";
import SearchPage from "./pages/SearchPage";
import { useConfig } from "./hooks/useConfig";

type Page = "upload" | "library" | "search";

export default function App() {
  const [page, setPage] = useState<Page>("upload");
  const cfg = useConfig();

  return (
    <div className="flex h-screen bg-[#0f0f13] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-14 lg:w-60 flex flex-col bg-[#17171f] border-r border-slate-800 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <Brain className="text-violet-400 shrink-0" size={22} />
          <span className="hidden lg:block font-bold text-white text-base tracking-tight">StudyAI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          <NavItem icon={<Upload size={17} />} label="Digitalizar" active={page === "upload"} onClick={() => setPage("upload")} />
          <NavItem icon={<BookOpen size={17} />} label="Biblioteca" active={page === "library"} onClick={() => setPage("library")} />
          <NavItem icon={<Search size={17} />} label="Búsqueda IA" active={page === "search"} onClick={() => setPage("search")} />
        </nav>

        {/* Integration status */}
        <div className="hidden lg:block px-4 py-4 border-t border-slate-800 space-y-1.5">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-2">Integraciones</p>
          <IntegDot label="Pinecone" active={cfg.pinecone} />
          <IntegDot label="Notion" active={cfg.notion} />
          <IntegDot label="Google Drive" active={cfg.drive} />
          <IntegDot label="Obsidian" active={cfg.obsidian} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {page === "upload"   && <UploadPage />}
        {page === "library"  && <LibraryPage />}
        {page === "search"   && <SearchPage />}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${active
          ? "bg-violet-600 text-white shadow-sm shadow-violet-900/50"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
    >
      {icon}
      <span className="hidden lg:block">{label}</span>
    </button>
  );
}

function IntegDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-emerald-400" : "bg-slate-700"}`} />
      <span className={`text-xs ${active ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
    </div>
  );
}

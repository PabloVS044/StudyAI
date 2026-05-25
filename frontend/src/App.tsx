import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import CapturePage from "./pages/CapturePage";
import LibraryPage from "./pages/LibraryStitchPage";
import AISummariesPage from "./pages/AISummariesPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import ConceptMapsPage from "./pages/ConceptMapsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import OrganizedDocumentPage from "./pages/OrganizedDocumentPage";
import ProcessingPage from "./pages/ProcessingPage";
import SearchPage from "./pages/SearchPage";

function AppShell() {
  return (
    <div className="flex h-screen bg-background text-on-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/capture"          element={<CapturePage />} />
          <Route path="/library"          element={<LibraryPage />} />
          <Route path="/ai-summaries"     element={<AISummariesPage />} />
          <Route path="/flashcards"       element={<FlashcardsPage />} />
          <Route path="/concept-maps"     element={<ConceptMapsPage />} />
          <Route path="/integrations"     element={<IntegrationsPage />} />
          <Route path="/ai-assistant"     element={<AIAssistantPage />} />
          <Route path="/document/:id"     element={<OrganizedDocumentPage />} />
          <Route path="/processing/:id"   element={<ProcessingPage />} />
          <Route path="/search"           element={<SearchPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/"   element={<LandingPage />} />
      <Route path="/*"  element={<AppShell />} />
    </Routes>
  );
}

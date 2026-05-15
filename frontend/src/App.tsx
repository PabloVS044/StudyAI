import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
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
import UploadPage from "./pages/UploadPage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  return (
    <div className="flex h-screen bg-background text-on-background overflow-hidden">
      <Sidebar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/ai-summaries" element={<AISummariesPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/concept-maps" element={<ConceptMapsPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/document/:id" element={<OrganizedDocumentPage />} />
        <Route path="/processing/:id" element={<ProcessingPage />} />

        {/* Legacy routes */}
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </div>
  );
}

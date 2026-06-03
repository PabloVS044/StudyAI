import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import AuthSync from "./components/AuthSync";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import CapturePage from "./pages/CapturePage";
import LibraryPage from "./pages/LibraryStitchPage";
import AISummariesPage from "./pages/AISummariesPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import TestsPage from "./pages/TestsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import SearchPage from "./pages/SearchPage";

function AppShell() {
  return (
    <>
      <AuthSync />
      <div className="flex h-screen bg-background text-on-background overflow-hidden">
        <Sidebar />
        <BottomNav />
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Routes>
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/capture"          element={<CapturePage />} />
            <Route path="/library"          element={<LibraryPage />} />
            <Route path="/ai-summaries"     element={<AISummariesPage />} />
            <Route path="/flashcards"       element={<FlashcardsPage />} />
            <Route path="/tests"            element={<TestsPage />} />
            <Route path="/integrations"     element={<IntegrationsPage />} />
            <Route path="/ai-assistant"     element={<AIAssistantPage />} />
            <Route path="/search"           element={<SearchPage />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function ProtectedAppShell() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"          element={<LandingPage />} />
      <Route path="/sign-in"   element={<SignInPage />} />
      <Route path="/sign-up"   element={<SignUpPage />} />
      <Route path="/*"         element={<ProtectedAppShell />} />
    </Routes>
  );
}

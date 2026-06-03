import { SignIn } from "@clerk/react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettings";

const clerkAppearance = {
  variables: {
    colorPrimary: "#154539",
    colorBackground: "#f9faf7",
    colorText: "#1a1c1b",
    colorTextSecondary: "#404945",
    colorInputBackground: "#ffffff",
    colorInputText: "#1a1c1b",
    borderRadius: "0.5rem",
    fontFamily: "Manrope, sans-serif",
  },
  elements: {
    card: "shadow-none bg-transparent",
    headerTitle: "text-on-background font-bold",
    headerSubtitle: "text-on-surface-variant",
    formButtonPrimary:
      "bg-primary hover:bg-primary-container text-on-primary font-semibold",
    footerActionLink: "text-primary hover:text-primary-container",
    identityPreviewEditButton: "text-primary",
    formFieldInput:
      "border border-outline-variant focus:border-primary rounded-lg bg-surface-container-lowest",
    dividerLine: "bg-outline-variant",
    socialButtonsBlockButton:
      "border border-outline-variant hover:bg-surface-container-low",
  },
};

export default function SignInPage() {
  const { lang } = useAppSettings();
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background">
      <Link
        to="/"
        className="absolute top-4 left-4 z-30 flex items-center gap-1.5 rounded-full bg-surface/80 backdrop-blur px-3 py-1.5 text-sm font-medium text-on-surface border border-outline-variant hover:bg-surface-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        {lang === "es" ? "Inicio" : "Home"}
      </Link>
      {/* Left column - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-secondary" />
        {/* Background image */}
        <img
          src="/sign-photo.jpeg"
          alt="StudyAI - Aprende de forma inteligente"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/40" />
        {/* Branding overlay */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-12 text-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="StudyAI" className="w-12 h-12 rounded-xl object-cover" />
            <span className="text-3xl font-extrabold text-on-primary tracking-tight">
              StudyAI
            </span>
          </div>
          <p className="text-on-primary/80 text-lg max-w-xs leading-relaxed">
            Tu asistente inteligente para estudiar, organizar y aprender mejor.
          </p>
          {/* Decorative card placeholders */}
          <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
            {["Notas con IA", "Flashcards automaticas", "Chat con tus documentos"].map(
              (label) => (
                <div
                  key={label}
                  className="rounded-xl bg-on-primary/10 backdrop-blur-sm border border-on-primary/20 px-4 py-3 text-sm text-on-primary/90 text-left font-medium"
                >
                  {label}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right column - Clerk form */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-background px-4 py-8">
        <SignIn
          forceRedirectUrl="/dashboard"
          signUpUrl="/sign-up"
          appearance={clerkAppearance}
        />
      </div>
    </div>
  );
}

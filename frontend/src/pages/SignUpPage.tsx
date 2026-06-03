import { SignUp } from "@clerk/react";

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

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left column - hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-secondary" />
        {/* Optional image - replace /images/auth-placeholder.jpg with your real image */}
        <img
          src="/images/auth-placeholder.jpg"
          alt="StudyAI - Aprende de forma inteligente"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
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
        <SignUp
          forceRedirectUrl="/dashboard"
          signInUrl="/sign-in"
          appearance={clerkAppearance}
        />
      </div>
    </div>
  );
}

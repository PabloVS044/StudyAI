import { SignUp } from "@clerk/react";

export default function SignUpPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <SignUp forceRedirectUrl="/dashboard" signInUrl="/sign-in" />
    </div>
  );
}

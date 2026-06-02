import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <SignIn forceRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </div>
  );
}

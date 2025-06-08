"use client";

import { signInWithGoogle } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signInWithGoogle(window.location.origin + "/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>
      <Button onClick={handleGoogleSignIn} variant="outline">
        Sign in with Google
      </Button>
    </div>
  );
}

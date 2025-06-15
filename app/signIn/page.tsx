"use client";

import { signInWithGoogle } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signInWithGoogle(window.location.origin + "/");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-white to-blue-200">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
        <svg className="absolute left-10 top-10 opacity-60 animate-float-slow" width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="30" rx="40" ry="20" fill="#fff"/>
          <ellipse cx="80" cy="30" rx="30" ry="15" fill="#e0f2fe"/>
        </svg>
        <svg className="absolute right-20 top-32 opacity-40 animate-float-medium" width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="30" cy="25" rx="30" ry="15" fill="#fff"/>
          <ellipse cx="70" cy="25" rx="20" ry="10" fill="#bae6fd"/>
        </svg>
        <svg className="absolute left-1/2 bottom-10 opacity-50 animate-float-fast" style={{transform: 'translateX(-50%)'}} width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="35" rx="60" ry="25" fill="#fff"/>
          <ellipse cx="110" cy="35" rx="30" ry="15" fill="#e0f2fe"/>
        </svg>
      </div>
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center bg-white/70 rounded-3xl shadow-2xl px-8 py-12 mt-10 max-w-lg w-full backdrop-blur-md border border-blue-100">
        <h1 className="text-5xl font-extrabold text-blue-500 mb-4 drop-shadow-lg">Cloudly</h1>
        <p className="text-lg text-blue-900 mb-6 text-center font-medium">
          Welcome to <span className="font-bold text-blue-400">Cloudly</span>.<br/>
          In my culture, after one passes away, their spirit journeys to the <span className="text-blue-500">cloudly land</span>—a serene place above the clouds, where they watch over their loved ones from afar. Inspired by that belief, this project is meant to be a gentle space where we can remember, feel close, and find a bit of peace.
        </p>
        <Button onClick={handleGoogleSignIn} size="lg" className="mt-4 shadow-lg bg-gradient-to-r from-blue-400 to-sky-300 text-white hover:from-blue-500 hover:to-sky-400">
          <svg className="mr-2" width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_17_40)">
              <path d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24V29.1H37.1C36.5 32.1 34.6 34.6 31.9 36.2V42H39.5C44 38 47.5 31.9 47.5 24.5Z" fill="#4285F4"/>
              <path d="M24 48C30.5 48 35.9 45.9 39.5 42L31.9 36.2C29.9 37.5 27.2 38.3 24 38.3C17.7 38.3 12.3 34.2 10.4 28.7H2.5V34.7C6.1 42.1 14.3 48 24 48Z" fill="#34A853"/>
              <path d="M10.4 28.7C9.9 27.4 9.6 25.9 9.6 24.3C9.6 22.7 9.9 21.2 10.4 19.9V13.9H2.5C0.9 16.9 0 20.4 0 24.3C0 28.2 0.9 31.7 2.5 34.7L10.4 28.7Z" fill="#FBBC05"/>
              <path d="M24 9.7C27.6 9.7 30.6 11 32.7 13L39.7 6C35.9 2.5 30.5 0 24 0C14.3 0 6.1 5.9 2.5 13.9L10.4 19.9C12.3 14.4 17.7 9.7 24 9.7Z" fill="#EA4335"/>
            </g>
            <defs>
              <clipPath id="clip0_17_40">
                <rect width="48" height="48" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          Sign in with Google
        </Button>
      </div>
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-40px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

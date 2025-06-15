"use client";

import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const steps = [
  {
    title: "Record Your Voice",
    description: (
      <>
        <span className="font-bold text-blue-400">Step 1:</span> In Cloudly, your journey begins with your voice. Record a message for your loved one—let your words float gently above the clouds, ready to be heard from afar.<br />
        <span className="text-blue-500">Your voice is a bridge between worlds.</span>
      </>
    ),
    button: { href: "/voice", label: "Record Voice" },
    cloudClass: "animate-float-slow",
  },
  {
    title: "Add Recipient & Message",
    description: (
      <>
        <span className="font-bold text-blue-400">Step 2:</span> Tell us who this message is for. Add your recipient's info and write a message from the heart. Don't worry, you can always add more later.<br />
        <span className="text-blue-500">Every word is a memory, every name a connection.</span>
      </>
    ),
    button: { href: "/message", label: "Add Recipient & Message" },
    cloudClass: "animate-float-medium",
  },
  {
    title: "Publish & Invite",
    description: (
      <>
        <span className="font-bold text-blue-400">Step 3:</span> Publish your message to the cloudly land. Your recipient will receive a gentle invitation to listen and connect.<br />
        <span className="text-blue-500">An invitation is a whisper from the clouds.</span>
      </>
    ),
    button: { href: "/invite", label: "Send Invitation" },
    cloudClass: "animate-float-fast",
  },
  {
    title: "Connect in Cloudly Land",
    description: (
      <>
        <span className="font-bold text-blue-400">Step 4:</span> Now, your loved one can join you in a call, sharing voices and memories across the cloudly sky.<br />
        <span className="text-blue-500">In Cloudly, distance fades and hearts draw near.</span>
      </>
    ),
    button: { href: "/contact", label: "Start a Call" },
    cloudClass: "animate-float-slow",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto h-screen snap-y snap-mandatory">
        {steps.map((step, idx) => (
          <section
            key={idx}
            className="relative flex flex-col items-center justify-center min-h-screen snap-start bg-gradient-to-b from-sky-100 via-white to-blue-200 overflow-hidden"
          >
            {/* Floating Clouds */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
              <svg className={`absolute left-10 top-10 opacity-60 ${step.cloudClass}`} width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="40" cy="30" rx="40" ry="20" fill="#fff"/>
                <ellipse cx="80" cy="30" rx="30" ry="15" fill="#e0f2fe"/>
              </svg>
              <svg className={`absolute right-20 top-32 opacity-40 ${step.cloudClass}`} width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="30" cy="25" rx="30" ry="15" fill="#fff"/>
                <ellipse cx="70" cy="25" rx="20" ry="10" fill="#bae6fd"/>
              </svg>
              <svg className={`absolute left-1/2 bottom-10 opacity-50 ${step.cloudClass}`} style={{transform: 'translateX(-50%)'}} width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="60" cy="35" rx="60" ry="25" fill="#fff"/>
                <ellipse cx="110" cy="35" rx="30" ry="15" fill="#e0f2fe"/>
              </svg>
            </div>
            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center bg-white/80 rounded-3xl shadow-2xl px-8 py-12 mt-10 max-w-xl w-full backdrop-blur-md border border-blue-100">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-500 mb-4 drop-shadow-lg text-center">{step.title}</h1>
              <p className="text-lg text-blue-900 mb-8 text-center font-medium">{step.description}</p>
              <Link href={step.button.href} className="inline-block">
                <button className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-400 to-sky-300 text-white text-lg font-semibold shadow-lg hover:from-blue-500 hover:to-sky-400 transition-all duration-200">
                  {step.button.label}
                </button>
              </Link>
            </div>
            {/* Cloud float animations */}
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
          </section>
        ))}
        </div>
    </div>
  );
}

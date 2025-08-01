"use client";
import Sidebar from "@/components/Sidebar";

export default function MessageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
} 
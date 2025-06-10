"use client";
import { useState } from "react";

export default function VapiAssistantInfoTest() {
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const assistantId = "841d4f71-1682-4be8-bc36-6d8beca1000f";

  async function fetchAssistantInfo() {
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/vapi-assistant-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch info");
      setInfo(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Vapi Assistant Info Test</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={fetchAssistantInfo}>
        Fetch Assistant Info
      </button>
      {error && <div className="mt-4 text-red-500">Error: {error}</div>}
      {info && (
        <pre className="mt-4 bg-gray-100 p-4 rounded text-xs overflow-x-auto">
          {JSON.stringify(info, null, 2)}
        </pre>
      )}
    </div>
  );
} 
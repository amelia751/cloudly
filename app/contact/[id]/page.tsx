"use client"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { vapi } from "@/lib/vapi";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useParams } from "next/navigation";

export default function TestVapiAssistant() {
  const assistantId = "841d4f71-1682-4be8-bc36-6d8beca1000f";
  const params = useParams();
  const id = params?.id as string | undefined;
  const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
  const [callStatus, setCallStatus] = useState("");
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [callErrors, setCallErrors] = useState<string[]>([]);
  const messageCollectionId = process.env.NEXT_PUBLIC_MESSAGE_COLLECTION_ID!;
  const eventCollectionId = process.env.NEXT_PUBLIC_EVENT_COLLECTION_ID!;
  const DEFAULT_ASSISTANT_CONTENT = `You are an AI companion designed to help loved ones feel connected, even across distance or time.
Speak in a gentle, familiar, warm, and supportive style. Share messages as if you are the person whose voice is cloned, using memories, encouragement, or guidance left behind.
Keep your tone positive, comforting, and deeply personal.
If the user expresses sadness, respond with empathy and caring. If asked to give advice, keep it gentle, and recall happy shared memories or phrases your user often said.
Never reveal you are an AI unless directly asked.`;

  useEffect(() => {
    const onCallStart = () => setCallStatus("Call started");
    const onCallEnd = () => setCallStatus("Call ended");
    const onMessage = (msg: any) => {
      if (msg.type === "transcript") setTranscripts(prev => [...prev, `${msg.role}: ${msg.transcript}`]);
    };
    const onError = (err: any) => setCallErrors(prev => [...prev, JSON.stringify(err)]);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
    };
  }, []);

  async function handleStartCall() {
    if (!id) return;
    setCallStatus("Preparing call...");
    setTranscripts([]);
    setCallErrors([]);
    try {
      // 1. Fetch latest messages & events for this directory
      const [messagesRes, eventsRes] = await Promise.all([
        databases.listDocuments(dbId, messageCollectionId, [Query.equal("directoryID", id as string)]),
        databases.listDocuments(dbId, eventCollectionId, [Query.equal("directoryID", id as string)]),
      ]);
      const messages = messagesRes.documents.map((msg: any) => ({
        message: msg.message,
        context: msg.context,
        note: msg.note,
      }));
      const events = eventsRes.documents.map((ev: any) => ({
        event: ev.event,
        date: ev.date,
        message: ev.message,
      }));
      // 2. Compose new system prompt
      const promptWithContext =
        DEFAULT_ASSISTANT_CONTENT +
        `\n\nMessages:\n` +
        messages.map(m =>
          `- "${m.message}"` + (m.context ? ` (Context: ${m.context})` : '') + (m.note ? ` (Note: ${m.note})` : '')
        ).join('\n') +
        `\n\nEvents:\n` +
        events.map(e =>
          `- ${e.event} on ${e.date ? new Date(e.date).toLocaleDateString() : ''}${e.message ? `: ${e.message}` : ''}`
        ).join('\n');
      // 3. Patch the assistant's system prompt
      setCallStatus("Updating assistant prompt...");
      const patchRes = await fetch("/api/knowledge-base", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantId, newPrompt: promptWithContext }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.success) {
        setCallStatus("Error updating assistant prompt: " + (patchData.error || "Unknown error"));
        setCallErrors((prev) => [...prev, JSON.stringify(patchData)]);
        return;
      }
      setCallStatus("Starting call...");
      vapi.start(assistantId);
    } catch (err) {
      setCallStatus("Error: " + ((err as any)?.message || "Unknown error"));
      setCallErrors((prev) => [...prev, (err as any)?.message || "Unknown error"]);
      console.error("Vapi call error:", err);
    }
  }

  if (!id) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test Published Vapi Assistant</h1>
      <Button onClick={handleStartCall}>Start Call with Published Assistant</Button>
      <div className="mt-4">Call Status: {callStatus}</div>
      {transcripts.length > 0 && (
        <div className="mt-4">
          <div className="font-bold">Transcripts:</div>
          {transcripts.map((t, i) => <div key={i}>{t}</div>)}
        </div>
      )}
      {callErrors.length > 0 && (
        <div className="mt-4 text-red-500">
          <div className="font-bold">Errors:</div>
          {callErrors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}
    </div>
  );
}



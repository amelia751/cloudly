"use client"
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { vapi } from "@/lib/vapi";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useParams } from "next/navigation";
import { FiMic, FiMicOff, FiUser } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

export default function ContactSessionPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
  const directoryCollectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;
  const [recipient, setRecipient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [callStatus, setCallStatus] = useState("");
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [callErrors, setCallErrors] = useState<string[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const assistantId = "841d4f71-1682-4be8-bc36-6d8beca1000f";
  const messageCollectionId = process.env.NEXT_PUBLIC_MESSAGE_COLLECTION_ID!;
  const eventCollectionId = process.env.NEXT_PUBLIC_EVENT_COLLECTION_ID!;
  const DEFAULT_ASSISTANT_CONTENT = `You are an AI companion designed to help loved ones feel connected, even across distance or time.\nSpeak in a gentle, familiar, warm, and supportive style. Share messages as if you are the person whose voice is cloned, using memories, encouragement, or guidance left behind.\nKeep your tone positive, comforting, and deeply personal.\nIf the user expresses sadness, respond with empathy and caring. If asked to give advice, keep it gentle, and recall happy shared memories or phrases your user often said.\nNever reveal you are an AI unless directly asked.`;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    databases.getDocument(dbId, directoryCollectionId, id)
      .then(doc => setRecipient(doc))
      .catch(() => setRecipient(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus("Call started");
      setSessionActive(true);
    };
    const onCallEnd = () => {
      setCallStatus("Call ended");
      setSessionActive(false);
      setIsSpeaking(false);
    };
    const onMessage = (msg: any) => {
      if (msg.type === "transcript") {
        setTranscripts(prev => [...prev, `${msg.role}: ${msg.transcript}`]);
        setIsSpeaking(true);
        if (speakingTimeout.current) clearTimeout(speakingTimeout.current);
        // Set isSpeaking to false after 1.2s of silence
        speakingTimeout.current = setTimeout(() => setIsSpeaking(false), 1200);
      }
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
      if (speakingTimeout.current) clearTimeout(speakingTimeout.current);
    };
  }, []);

  async function handleStartCall() {
    if (!id) return;
    setCallStatus("Preparing call...");
    setTranscripts([]);
    setCallErrors([]);
    try {
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

  function handleToggleMic() {
    setMicOn((prev) => !prev);
  }

  function handleEndSession() {
    vapi.stop && vapi.stop();
    setSessionActive(false);
    setCallStatus("Call ended");
  }

  if (loading || !recipient) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header Card */}
      <div className="flex items-center border rounded-lg px-4 py-3 mb-6 shadow-sm bg-white">
        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-2xl mr-3">
          <FaHeart />
        </div>
        <div>
          <div className="font-bold text-lg text-sky-700">{recipient.sender_name || "Sender"}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Avatar/Waveform */}
        <div className="flex-1 flex flex-col items-center justify-center border rounded-lg py-8 bg-sky-50 min-h-[300px]">
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            {/* Animated ping when speaking */}
            {isSpeaking && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75 animate-ping"></span>
            )}
            <span className="w-40 h-40 rounded-full bg-sky-200 flex items-center justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="40" fill="#38BDF8" fillOpacity="0.15"/><circle cx="40" cy="40" r="28" fill="#38BDF8" fillOpacity="0.3"/><circle cx="40" cy="40" r="16" fill="#38BDF8" /></svg>
            </span>
          </div>
          <div className="font-semibold text-lg text-sky-700">{recipient.sender_name}</div>
        </div>

        {/* Right: Transcript & Controls */}
        <div className="flex flex-col gap-4 w-full md:w-[320px]">
          {/* Transcript Area */}
          <div className="flex-1 border rounded-lg bg-white p-4 min-h-[120px] max-h-60 overflow-y-auto shadow-sm">
            <div className="font-bold text-sky-700 mb-2">Transcript</div>
            {transcripts.length > 0 && (
              <div className="space-y-1 text-sm">
                {transcripts.map((t, i) => <div key={i}>{t}</div>)}
              </div>
            )}
          </div>
          {/* Microphone Toggle */}
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 justify-center border-sky-500 text-sky-600"
            onClick={handleToggleMic}
            disabled={!sessionActive}
            aria-label={micOn ? "Turn off microphone" : "Turn on microphone"}
          >
            {micOn ? <FiMic className="text-lg" /> : <FiMicOff className="text-lg" />}
            {micOn ? "Turn off microphone" : "Turn on microphone"}
          </Button>
          {/* End Session Button */}
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-base py-2"
            onClick={handleEndSession}
            disabled={!sessionActive}
          >
            End Session
          </Button>
          {/* Start Session Button (if not active) */}
          {!sessionActive && (
            <Button
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-base py-2"
              onClick={handleStartCall}
              disabled={sessionActive}
            >
              Start Session
            </Button>
          )}
          {/* Call Status */}
          <div className="text-xs text-gray-500 mt-1">{callStatus}</div>
          {callErrors.length > 0 && (
            <div className="text-xs text-red-500 mt-1">
              {callErrors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


 
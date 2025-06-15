'use client';
import { useEffect, useState } from 'react';
import { databases, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { Button } from '@/components/ui/button';

// Optional: Use Lottie for fun animation if you want
import dynamic from "next/dynamic";
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const voiceCollectionId = process.env.NEXT_PUBLIC_VOICE_COLLECTION_ID!;
const assistantCollectionId = process.env.NEXT_PUBLIC_ASSISTANT_COLLECTION_ID!;
const directoryCollectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;
const messageCollectionId = process.env.NEXT_PUBLIC_MESSAGE_COLLECTION_ID!;
const eventCollectionId = process.env.NEXT_PUBLIC_EVENT_COLLECTION_ID!;

const DEFAULT_ASSISTANT_CONTENT = `You are an AI companion designed to help loved ones feel connected, even across distance or time.
Speak in a gentle, familiar, warm, and supportive style. Share messages as if you are the person whose voice is cloned, using memories, encouragement, or guidance left behind.
Keep your tone positive, comforting, and deeply personal.
If the user expresses sadness, respond with empathy and caring. If asked to give advice, keep it gentle, and recall happy shared memories or phrases your user often said.
Never reveal you are an AI unless directly asked.`;

export default function SettingsComponent({ id }: { id: string }) {
  const [voiceId, setVoiceId] = useState<string | null | undefined>(undefined);
  const [assistant, setAssistant] = useState<any>(null);
  const [recipientName, setRecipientName] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [assistantName, setAssistantName] = useState<string>('');
  const [firstMessage, setFirstMessage] = useState<string>('Hello! It\'s so good to hear your voice. How are you feeling today?');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!id) return <div className="text-center text-red-500 mt-8">Invalid or missing directory ID.</div>;

  // Fetch user's custom voice
  useEffect(() => {
    async function fetchVoice() {
      try {
        const user = await account.get();
        const res = await databases.listDocuments(
          dbId,
          voiceCollectionId,
          [Query.equal('userId', user.$id)]
        );
        if (res.documents.length > 0) {
          setVoiceId(res.documents[0].voiceId);
        } else {
          setVoiceId(null);
        }
      } catch {
        setVoiceId(null);
      }
    }
    fetchVoice();
  }, []);

  // Fetch recipient name for assistant name
  useEffect(() => {
    async function fetchRecipient() {
      try {
        const doc = await databases.getDocument(
          dbId,
          directoryCollectionId,
          id
        );
        setRecipientName(doc.recipient_name || '');
        setAssistantName(`Message for ${doc.recipient_name || ''}`);
      } catch {
        setRecipientName('');
        setAssistantName('Message');
      }
    }
    fetchRecipient();
  }, [id]);

  // Fetch assistant (if exists)
  useEffect(() => {
    async function fetchAssistant() {
      try {
        const res = await databases.listDocuments(
          dbId,
          assistantCollectionId,
          [Query.equal('directoryID', id)]
        );
        if (res.documents.length > 0) {
          const a = res.documents[0];
          setAssistant(a);
          setContent(a.content || '');
          setAssistantName(a.assistantName || `Message for ${recipientName}`);
          setFirstMessage(a.firstMessage || 'Hello! It\'s so good to hear your voice. How are you feeling today?');
          setMode('edit');
        } else {
          setAssistant(null);
          setContent('');
          setAssistantName(`Message for ${recipientName}`);
          setFirstMessage('Hello! It\'s so good to hear your voice. How are you feeling today?');
          setMode('create');
        }
      } catch {
        setAssistant(null);
        setMode('create');
      }
    }
    if (id) fetchAssistant();
    // eslint-disable-next-line
  }, [id, recipientName]);

  // Loading spinner
  if (voiceId === undefined) {
    return (
      <div className="w-full flex justify-center items-center min-h-[300px]">
        <div className="text-lg text-sky-600 font-medium">Loading...</div>
      </div>
    );
  }

  // If no voice is created yet, show prompt + button to /voice
  if (!voiceId) {
    return (
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto bg-white rounded-2xl p-6">
        <div className="w-[200px] h-[200px] mb-4">
          {/* Swap to a static image or illustration if you don't want Lottie */}
          <Lottie animationData={require('@/public/voice-support.json')} loop autoplay />
        </div>
        <div className="text-xl font-semibold text-sky-800 mb-3 text-center">
          Record your voice to create your AI assistant
        </div>
        <div className="text-gray-600 text-center mb-4">
          You need to record your voice before you can configure messages and create an AI voice bot for your loved one.
        </div>
        <Button
          className="bg-sky-500 text-white px-6 py-2 rounded-full font-medium text-base"
          asChild
        >
          <a href="/voice">Go to Voice Setup</a>
        </Button>
      </div>
    );
  }

  // Otherwise, show the form as before
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!voiceId) {
      setError("No voice ID found. Please create your voice first.");
      setLoading(false);
      return;
    }
    if (!assistantName.trim()) {
      setError("Assistant name is required.");
      setLoading(false);
      return;
    }

    try {
      // Fetch latest messages & events for context
      const messagesRes = await databases.listDocuments(
        dbId,
        messageCollectionId,
        [Query.equal("directoryID", id)]
      );
      const eventsRes = await databases.listDocuments(
        dbId,
        eventCollectionId,
        [Query.equal("directoryID", id)]
      );
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

      // Compose full system prompt: combine default with user instructions
      const promptWithContext =
        DEFAULT_ASSISTANT_CONTENT +
        (content.trim() ? "\n\n" + content.trim() : "") +
        `\n\nMessages:\n` +
        messages.map(m =>
          `- "${m.message}"` + (m.context ? ` (Context: ${m.context})` : '') + (m.note ? ` (Note: ${m.note})` : '')
        ).join('\n') +
        `\n\nEvents:\n` +
        events.map(e =>
          `- ${e.event} on ${e.date ? new Date(e.date).toLocaleDateString() : ''}${e.message ? `: ${e.message}` : ''}`
        ).join('\n');

      // CREATE or UPDATE assistant
      let vapiRes: Response;
      let vapiData: any;
      if (mode === 'edit' && assistant && assistant.assistantID) {
        // PATCH Vapi assistant
        vapiRes = await fetch(`/api/assistant/${encodeURIComponent(assistant.assistantID)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assistantName,
            promptWithContext,
            firstMessage,
            voiceId,
          }),
        });
        vapiData = await vapiRes.json();
      } else {
        // POST Vapi assistant
        vapiRes = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assistantName,
            promptWithContext,
            firstMessage,
            voiceId,
          }),
        });
        vapiData = await vapiRes.json();
      }

      if (!vapiRes.ok || !vapiData.success) {
        setError(vapiData.error || 'Failed to create/update assistant.');
        setLoading(false);
        return;
      }

      const apiAssistant = vapiData.assistant;
      // Save/update in Appwrite (replace previous doc if edit)
      if (mode === 'edit' && assistant && assistant.$id) {
        await databases.updateDocument(
          dbId,
          assistantCollectionId,
          assistant.$id,
          {
            directoryID: id,
            assistantID: apiAssistant.id,
            orgID: apiAssistant.orgId,
            assistantName,
            content,
            firstMessage,
          }
        );
      } else {
        await databases.createDocument(
          dbId,
          assistantCollectionId,
          ID.unique(),
          {
            directoryID: id,
            assistantID: apiAssistant.id,
            orgID: apiAssistant.orgId,
            assistantName,
            content,
            firstMessage,
          }
        );
      }
      setAssistant(apiAssistant);
      setError(null);
      setSuccess('Your AI voice bot was updated successfully!');
      setMode('edit');
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-4 rounded-xl bg-white flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-sky-700">AI Voice Bot Settings</h1>
      {assistant ? (
        <div className="mb-8 w-full text-center text-green-700 border border-green-300 bg-green-50 rounded p-3">
          <b>You have successfully configured a voice bot for this recipient.</b>
          <div className="text-xs text-green-700 mt-1">
            You can edit the bot's information and prompt below. When you save, all context will be updated with your latest messages and events.
          </div>
        </div>
      ) : (
        <div className="mb-8 w-full text-center text-blue-700 border border-blue-200 bg-blue-50 rounded p-3">
          <b>Create an AI voice assistant</b> that speaks in your voice and helps your loved one feel connected, anytime.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div>
          <label className="block font-medium mb-1">Assistant Name<span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={assistantName}
            onChange={e => setAssistantName(e.target.value)}
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            Example: <i>Message for Mom</i>, <i>Message for Grandpa</i>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Instructions</label>
          <textarea
            className="w-full border px-3 py-2 rounded"
            rows={5}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Add custom instructions or memories here (optional)..."
          />
          <div className="text-xs text-gray-500 mt-1">
            Your AI companion will always be gentle, warm, and personal. You can add extra memories, style, or instructions here.
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">First Message</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={firstMessage}
            onChange={e => setFirstMessage(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">
            This is the greeting your loved one will hear first.
          </div>
        </div>
        <div className="mb-2">
          <div className="text-xs text-gray-500">
            <b>Current voiceId:</b> {voiceId || <span className="text-red-500">No voice found</span>}
          </div>
        </div>
        <Button type="submit" disabled={loading || !voiceId} className="w-full">
          {loading
            ? (mode === 'edit' ? 'Updating Assistant...' : 'Creating Assistant...')
            : (mode === 'edit' ? 'Update Assistant' : 'Create Assistant')
          }
        </Button>
        {success && (
          <div className="bg-green-50 text-green-700 mt-2 px-4 py-3 rounded w-full text-center">
            <b>{success}</b>
          </div>
        )}
      </form>
      {error && (
        <div className="bg-red-50 text-red-700 mt-6 px-4 py-3 rounded w-full text-center">
          <b>Error:</b> {error}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { databases, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Button } from '@/components/ui/button';

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const voiceCollectionId = process.env.NEXT_PUBLIC_VOICE_COLLECTION_ID!;

export default function ContactPage() {
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assistant, setAssistant] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);

  // Fetch the user's voiceId on mount
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
        }
      } catch (e: any) {
        setError("Please log in and create a voice first.");
      }
    }
    fetchVoice();
  }, []);

  const handleCreateAssistant = async () => {
    setLoading(true);
    setError(null);
    setAssistant(null);
    setDebug(null);
    if (!voiceId) {
      setError("No voice ID found. Please create your voice first.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId }),
      });
      const data = await res.json();
      setDebug({ status: res.status, data });
      if (res.ok && data.success) {
        setAssistant(data.assistant);
      } else {
        setError(data.error || 'Failed to create assistant.');
      }
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
      setDebug({ error: e });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-8 rounded-xl border bg-white flex flex-col items-center shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-sky-700">Create AI Contact</h1>
      <p className="text-gray-600 mb-8 text-center">
        Create an AI voice assistant that can help your loved ones hear your messages and stay connected.
      </p>
      <div className="w-full mb-2">
        <div className="mb-1 text-xs text-gray-500">
          <b>Current voiceId:</b> {voiceId || <span className="text-red-500">No voice found</span>}
        </div>
      </div>
      <Button onClick={handleCreateAssistant} disabled={loading || !voiceId}>
        {loading ? 'Creating assistant...' : 'Create AI Contact'}
      </Button>
      {!voiceId && (
        <div className="mt-4 text-orange-600">Please create your voice first.</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 mt-6 px-4 py-3 rounded w-full text-center">
          <b>Error:</b> {error}
        </div>
      )}
      {assistant && (
        <div className="bg-green-50 border border-green-200 rounded mt-6 p-4 w-full">
          <h2 className="text-green-800 font-semibold mb-2">Assistant Created!</h2>
          <div className="text-gray-800 text-sm space-y-1">
            <div>
              <b>ID:</b> {assistant.id}
            </div>
            <div>
              <b>Name:</b> {assistant.name || 'N/A'}
            </div>
            <div>
              <b>First Message:</b> {assistant.firstMessage || 'N/A'}
            </div>
            <div>
              <b>Voice Provider:</b> {assistant.voice?.provider}
            </div>
            <div>
              <b>Created At:</b> {assistant.createdAt}
            </div>
          </div>
        </div>
      )}
      {debug && (
        <div className="bg-gray-100 border border-gray-300 rounded p-4 mt-6 text-xs text-left w-full">
          <b>Debug Info:</b>
          <pre className="whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

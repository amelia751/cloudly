'use client';
import { useState, useRef, useEffect } from 'react';
import Recorder from 'recorder-js';
import { databases, account } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { FaTrash } from "react-icons/fa";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_VOICE_COLLECTION_ID!;

export default function VoicePage() {
  const [name, setName] = useState('');
  const [meta, setMeta] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recorder, setRecorder] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdVoice, setCreatedVoice] = useState<any>(null); // This will show returned object
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [voices, setVoices] = useState<any[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const prepareRecorder = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const rec = new Recorder(audioContext);
      rec.init(stream);
      setRecorder(rec);
    };
    prepareRecorder();
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const fetchUserVoices = async () => {
    setVoicesLoading(true);
    try {
      const user = await account.get();
      const userId = user.$id;
      const res = await databases.listDocuments(
        dbId,
        collectionId,
        [Query.equal('userId', userId)]
      );
      setVoices(res.documents || []);
    } catch (err) {
      setVoices([]);
    }
    setVoicesLoading(false);
  };

  useEffect(() => {
    fetchUserVoices();
  }, []);

  const startRecording = async () => {
    if (!recorder) return;
    setAudioBlob(null);
    await recorder.start();
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (!recorder) return;
    const { blob } = await recorder.stop();
    setAudioBlob(blob);
    setIsRecording(false);
  };

  const saveVoiceToAppwrite = async ({
    name,
    meta,
    voiceId
  }: {
    name: string;
    meta?: string;
    voiceId: string;
  }) => {
    try {
      const user = await account.get();
      const userId = user.$id;
      const doc = await databases.createDocument(
        dbId,
        collectionId,
        ID.unique(),
        {
          userId,
          name,
          meta: meta || '',
          voiceId,
        }
      );
      return doc;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to save to Appwrite');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatedVoice(null);
    setSaveError(null);
    setFormError(null);
    if (!name && !audioBlob) {
      setFormError('Please enter a voice name and record your voice.');
      return;
    }
    if (!name) {
      setFormError('Please enter a voice name.');
      return;
    }
    if (!audioBlob) {
      setFormError('Please record your voice.');
      return;
    }
    setLoading(true);

    const form = new FormData();
    form.append('name', name);
    form.append('audio', new File([audioBlob], 'recording.wav', { type: 'audio/wav' }));
    if (meta) form.append('meta', meta);

    const res = await fetch('/api/voice', { method: 'POST', body: form });
    const data = await res.json();
    setLoading(false);

    setCreatedVoice(data); 

    // --- Use ElevenLabs "voice_id" as Appwrite voiceId ---
    const voiceId = data.voice_id;

    if (res.ok && voiceId) {
      try {
        await saveVoiceToAppwrite({ name, meta, voiceId });
        await fetchUserVoices();
        setName('');
        setMeta('');
        setAudioBlob(null);
      } catch (err: any) {
        setSaveError('Appwrite save failed: ' + (err?.message || err));
      }
    } else {
      setCreatedVoice({ error: data.error || 'Voice cloning failed', ...data });
    }
  };

  const handleDeleteVoice = async (voiceId: string, docId: string) => {
    setLoading(true);
    setSaveError(null);

    const res = await fetch('/api/voice', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceId }),
    });
    const result = await res.json();

    // If successful, delete from Appwrite
    if (res.ok && result.success) {
      try {
        await databases.deleteDocument(dbId, collectionId, docId);
        await fetchUserVoices();
      } catch (err: any) {
        setSaveError('Appwrite delete failed: ' + (err?.message || err));
      }
    } else {
      setSaveError('Delete from ElevenLabs failed: ' + (result.error || 'Unknown error'));
    }
    setLoading(false);
  };

  // The prompt to display for user recording
  const voicePrompt = (
    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
      <b>Read this aloud for best results:</b>
      <p className="mt-2 text-sm text-gray-700">
        "Hi, my name is [Your Name]. I am recording this message so my loved ones can always hear my voice. 
        I hope you are having a wonderful day. Remember, I love you and I am always with you in spirit. 
        Please take care of yourself and know that you are never alone."
      </p>
    </div>
  );

  // Meta input guidance
  const metaGuide = (
    <div className="text-xs text-gray-500 mb-2">
      <b>Meta</b> could be: <i>"Warm gentle motherly voice", "Playful and humorous", "Vietnamese accent", "Sings birthday song", "Soft and patient", "Always encourages you"</i>. <br />
      <span>
        Describe the personality, emotion, or accent you want your loved ones to remember.
      </span>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">
        {voices.length === 0 ? 'Record your voice' : 'Your Voice'}
      </h1>
      {voices.length === 0 ? (
        <>
          {voicePrompt}
          {formError && (
            <div className="bg-red-100 text-red-700 rounded px-3 py-2 mb-2">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
            <Input
              type="text"
              placeholder="Voice Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div>
              <Input
                type="text"
                placeholder="Meta (optional: e.g. warm, gentle motherly voice...)"
                value={meta}
                onChange={e => setMeta(e.target.value)}
              />
              {metaGuide}
            </div>
            <div className="flex items-center gap-2">
              {!isRecording && (
                <Button type="button" onClick={startRecording} variant="default">
                  Start Recording
                </Button>
              )}
              {isRecording && (
                <Button type="button" onClick={stopRecording} variant="destructive">
                  Stop Recording
                </Button>
              )}
              {audioBlob && (
                <>
                  <audio controls src={URL.createObjectURL(audioBlob)} className="ml-4" />
                  <Button type="button" onClick={() => setAudioBlob(null)} variant="outline" className="ml-2" aria-label="Retry">
                    <img src="/retry.png" alt="Retry" className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
            <Button type="submit" disabled={loading || !audioBlob} variant="secondary">
              {loading ? 'Creating...' : 'Create Voice'}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-700">
            Only <b>1 voice</b> can be saved at a time. To create a new one, delete the existing voice first.
          </div>
          {voices.map((v) => (
            <div key={v.$id} className="border rounded p-3 flex items-center justify-between bg-gray-50">
              <div>
                <div><b>Name:</b> {v.name}</div>
                <div><b>Voice ID:</b> {v.voiceId}</div>
                <div><b>Meta:</b> {v.meta || <span className="text-gray-400">N/A</span>}</div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    title="Delete"
                    className="ml-3 text-red-600 hover:text-red-900 p-2 rounded"
                    disabled={loading}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Voice</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Are you sure you want to delete this voice?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => handleDeleteVoice(v.voiceId, v.$id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </>
      )}

      {saveError && (
        <div className="bg-red-100 text-red-700 rounded px-3 py-2 mt-4">
          {saveError}
        </div>
      )}
    </div>
  );
}

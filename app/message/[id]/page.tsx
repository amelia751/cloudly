"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import MessageComponent from "@/components/message/MessageComponent";
import EventComponent from "@/components/message/EventComponent";
import SettingsComponent from "@/components/message/SettingsComponent";
import { databases } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Query } from "appwrite";

const TABS = [
  { key: "messages", label: "Messages" },
  { key: "events", label: "Events" },
  { key: "settings", label: "Settings" },
];

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const directoryCollectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;
const assistantCollectionId = process.env.NEXT_PUBLIC_ASSISTANT_COLLECTION_ID!;

export default function MessageDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [tab, setTab] = useState("messages");
  const [recipientName, setRecipientName] = useState<string>("");
  const [assistant, setAssistant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    async function fetchRecipientName() {
      try {
        const doc = await databases.getDocument(dbId, directoryCollectionId, id as string);
        setRecipientName(doc.recipient_name || "this person");
      } catch {
        setRecipientName("this person");
      }
    }
    fetchRecipientName();
  }, [id]);

  useEffect(() => {
    async function fetchAssistant() {
      setLoading(true);
      try {
        const res = await databases.listDocuments(
          dbId,
          assistantCollectionId,
          [Query.equal("directoryID", id as string)]
        );
        setAssistant(res.documents[0] || null);
      } catch {
        setAssistant(null);
      }
      setLoading(false);
    }
    if (id) fetchAssistant();
  }, [id]);

  async function handlePublish() {
    if (!assistant) return;
    setPublishing(true);
    try {
      await databases.updateDocument(
        dbId,
        assistantCollectionId,
        assistant.$id,
        { publish: true }
      );
      setAssistant({ ...assistant, publish: true });
    } catch (e) {
      alert("Failed to publish assistant.");
    }
    setPublishing(false);
  }

  return (
    <div className="max-w-xl mx-auto p-8 max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Message for {recipientName}</h1>
        <Button
          variant={assistant?.publish ? "secondary" : "default"}
          disabled={loading || publishing || !assistant || !!assistant?.publish}
          onClick={handlePublish}
          aria-label={assistant?.publish ? "Published" : "Publish"}
          className="min-w-[100px]"
        >
          {loading ? "Checking..." :
            publishing ? "Publishing..." :
            !assistant ? "Publish" :
            assistant.publish ? "Published" : "Publish"}
        </Button>
      </div>
      <div className="mb-6">
        <div className="flex gap-2 border-b mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${tab === t.key ? "border-sky-500 text-sky-600" : "border-transparent text-gray-500 hover:text-sky-500"}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div>
          {tab === "messages" && <MessageComponent id={id as string} />}
          {tab === "events" && <EventComponent id={id as string} />}
          {tab === "settings" && <SettingsComponent id={id as string} />}
        </div>
      </div>
    </div>
  );
} 
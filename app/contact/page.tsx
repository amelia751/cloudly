"use client";
import { useEffect, useState } from "react";
import { databases, getCurrentUser, client } from "@/lib/appwrite";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import interactiveChatJson from "@/public/interactive-chat.json";
import { FiPhone } from "react-icons/fi";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const directoryCollectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;
const assistantCollectionId = process.env.NEXT_PUBLIC_ASSISTANT_COLLECTION_ID!;

export default function ContactPage() {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [connected, setConnected] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchInvites() {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (!currentUser?.email) {
        setInvites([]);
        setConnected([]);
        setLoading(false);
        return;
      }
      // Fetch all directory docs where recipient_email matches user
      const res = await databases.listDocuments(
        dbId,
        directoryCollectionId,
        [Query.equal("recipient_email", currentUser.email)]
      );
      const docs = res.documents || [];
      // For each, check assistant and connect
      const inviteList: any[] = [];
      const connectedList: any[] = [];
      for (const doc of docs) {
        // Check for published assistant
        const assistantRes = await databases.listDocuments(
          dbId,
          assistantCollectionId,
          [Query.equal("directoryID", doc.$id), Query.equal("publish", true)]
        );
        const hasPublishedAssistant = assistantRes.documents.length > 0;
        if (doc.connect && hasPublishedAssistant) {
          connectedList.push({ ...doc, sender: doc.userID, publish: true });
        } else if (!doc.connect && hasPublishedAssistant) {
          inviteList.push({ ...doc, sender: doc.userID });
        }
      }
      setInvites(inviteList);
      setConnected(connectedList);
      setLoading(false);
    }
    fetchInvites();
  }, []);

  async function handleAccept(invite: any) {
    try {
      await databases.updateDocument(
        dbId,
        directoryCollectionId,
        invite.$id,
        { connect: true }
      );
      setInvites(invites.filter((i) => i.$id !== invite.$id));
      setConnected([...connected, { ...invite, connect: true }]);
    } catch (e) {
      alert("Failed to connect. Please try again.");
    }
  }

  async function handleDecline(invite: any) {
    try {
      // Set assistant with this directory's publish attribute to false
      const assistantRes = await databases.listDocuments(
        dbId,
        assistantCollectionId,
        [Query.equal("directoryID", invite.$id)]
      );
      if (assistantRes.documents.length > 0) {
        const assistantId = assistantRes.documents[0].$id;
        await databases.updateDocument(
          dbId,
          assistantCollectionId,
          assistantId,
          { publish: false }
        );
      }
      setInvites(invites.filter((i) => i.$id !== invite.$id));
    } catch (e) {
      alert("Failed to decline invitation. Please try again.");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <Card
        className="mb-4 h-32 pt-6 cursor-pointer border-sky-400 shadow-md hover:shadow-lg transition-shadow duration-200"
        onClick={() => router.push("/invite")}
      >
        <CardContent className="flex items-center gap-4 pt-4">
          <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-full bg-sky-200 items-center justify-center text-sky-600 text-3xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368M18 9.75a3 3 0 013 3v2.25a3 3 0 01-3 3m-12-8.25a3 3 0 00-3 3v2.25a3 3 0 003 3" /></svg>
          </div>
          <div>
            <div className="text-lg font-bold text-sky-700">
              Invitations ({invites.length})
            </div>
            <div className="text-sky-500 text-sm">Click to view all invitations</div>
          </div>
        </CardContent>
      </Card>
      <div className="mb-8 text-sky-700 font-medium text-base">Connections: {connected.length}</div>
      {loading ? (
        <div className="text-gray-400 mt-12">Loading...</div>
      ) : (
        <>
          {connected.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-12">
              <div className="w-64 h-64">
                <Lottie animationData={interactiveChatJson} loop={true} />
              </div>
              <div className="text-gray-500 mt-4 text-lg font-medium">No connections found for you</div>
            </div>
          )}
          {connected.length > 0 && (
            <div className="space-y-6">
              {connected.map((conn) => {
                const senderName = conn.sender_name || conn.sender;
                const senderEmail = conn.sender_email;
                // Only show if connect and publish are both true
                if (conn.connect && conn.publish) {
                  return (
                    <Card className="h-24" key={conn.$id}>
                      <CardContent className="pb-2">
                        <div className="flex items-center">
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-sky-700">{senderName}</span>
                            {senderEmail && (
                              <span className="text-xs text-gray-500 mb-2">{senderEmail}</span>
                            )}
                          </div>
                          <Button
                            asChild
                            size="icon"
                            className="ml-auto bg-green-500 hover:bg-green-600 text-white rounded-full shadow"
                            title="Contact"
                          >
                            <Link href={`/contact/${conn.$id}`}>
                              <FiPhone className="w-5 h-5" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                // fallback: show nothing if not both true
                return null;
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

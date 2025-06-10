"use client";
import { useEffect, useState } from "react";
import { databases, getCurrentUser, client } from "@/lib/appwrite";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Query } from "appwrite";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const directoryCollectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;
const assistantCollectionId = process.env.NEXT_PUBLIC_ASSISTANT_COLLECTION_ID!;

export default function ContactPage() {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [connected, setConnected] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [senderInfo, setSenderInfo] = useState<Record<string, { name?: string; email?: string }> >({});
  const [senderLoading, setSenderLoading] = useState<Record<string, boolean>>({});

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

  // Fetch sender info for each invite
  useEffect(() => {
    async function fetchSender(userID: string) {
      setSenderLoading((prev) => ({ ...prev, [userID]: true }));
      try {
        const user = await users.get(userID);
        setSenderInfo((prev) => ({ ...prev, [userID]: { name: user.name, email: user.email } }));
      } catch {
        setSenderInfo((prev) => ({ ...prev, [userID]: { name: userID, email: "" } }));
      }
      setSenderLoading((prev) => ({ ...prev, [userID]: false }));
    }
    invites.forEach((invite) => {
      if (invite.sender && !senderInfo[invite.sender] && !senderLoading[invite.sender]) {
        fetchSender(invite.sender);
      }
    });
  }, [invites]);

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

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Invitations & Connections</h1>
      {loading ? (
        <div className="text-gray-400 mt-12">Loading...</div>
      ) : (
        <>
          {invites.length === 0 && connected.length === 0 && (
            <div className="text-gray-500 mt-12">No invites or connections found for your email.</div>
          )}
          {invites.length > 0 && (
            <div className="space-y-6 mb-10">
              {invites.map((invite) => {
                const senderName = invite.sender_name || invite.sender;
                const senderEmail = invite.sender_email;
                return (
                  <Card key={invite.$id}>
                    <CardHeader>
                      <CardTitle>Invite to connect</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2">
                        You have been invited to connect by <b>{senderName}</b>
                        {senderEmail && (
                          <span className="ml-2 text-xs text-gray-500">({senderEmail})</span>
                        )}
                      </div>
                      <Button onClick={() => handleAccept(invite)} className="mt-2">Accept</Button>
                    </CardContent>
                  </Card>
                );
              })}
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
                    <Card key={conn.$id}>
                      <CardHeader>
                        <CardTitle>{senderName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          {senderEmail && (
                            <span className="text-xs text-gray-500">{senderEmail}</span>
                          )}
                          <Button asChild className="ml-auto" variant="outline">
                            <Link href={`/contact/${conn.$id}`}>Contact</Link>
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

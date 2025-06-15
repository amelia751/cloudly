"use client";
import { useEffect, useState } from "react";
import { databases, getCurrentUser } from "@/lib/appwrite";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Query } from "appwrite";
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
import Lottie from "lottie-react";
import emptyBoxJson from "@/public/empty-box.json";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const directoryCollectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;
const assistantCollectionId = process.env.NEXT_PUBLIC_ASSISTANT_COLLECTION_ID!;

export default function InvitePage() {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchInvites() {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (!currentUser?.email) {
        setInvites([]);
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
      for (const doc of docs) {
        // Check for published assistant
        const assistantRes = await databases.listDocuments(
          dbId,
          assistantCollectionId,
          [Query.equal("directoryID", doc.$id), Query.equal("publish", true)]
        );
        const hasPublishedAssistant = assistantRes.documents.length > 0;
        if (!doc.connect && hasPublishedAssistant) {
          inviteList.push({ ...doc, sender: doc.userID });
        }
      }
      setInvites(inviteList);
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
      <h1 className="text-2xl font-bold mb-6">Invitations & Connections</h1>
      {loading ? (
        <div className="text-gray-400 mt-12">Loading...</div>
      ) : (
        <>
          {invites.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-12">
              <div className="w-64 h-64">
                <Lottie animationData={emptyBoxJson} loop={true} />
              </div>
              <div className="text-gray-500 mt-4 text-lg font-medium">No invites or connections found at this time.</div>
            </div>
          )}
          {invites.length > 0 && (
            <div className="space-y-6 mb-10">
              {invites.map((invite) => {
                const senderName = invite.sender_name || invite.sender;
                const senderEmail = invite.sender_email;
                return (
                  <Card
                    key={invite.$id}
                    className="border-sky-400 shadow-md hover:shadow-lg transition-shadow duration-200"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-row items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-200 flex items-center justify-center text-sky-600 text-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368M18 9.75a3 3 0 013 3v2.25a3 3 0 01-3 3m-12-8.25a3 3 0 00-3 3v2.25a3 3 0 003 3" /></svg>
                          </div>
                          <div>
                            <div className="text-sky-600 font-medium">{senderName}</div>
                            {senderEmail && (
                              <div className="text-xs text-sky-400">{senderEmail}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <Button
                            onClick={() => handleAccept(invite)}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg shadow"
                          >
                            Accept
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="bg-white text-black border border-gray-300 font-semibold px-6 py-2 rounded-lg shadow hover:bg-gray-100"
                              >
                                Decline
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Decline Invitation?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to decline this invitation? <br />
                                  <span className="text-red-500 font-semibold">This action cannot be undone.</span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    await handleDecline(invite);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  Yes, Decline
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
} 
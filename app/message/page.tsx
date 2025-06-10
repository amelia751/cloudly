"use client";
import React, { useEffect, useState } from "react";
import AddRecipientDialog from "@/components/AddRecipientDialog";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UpdateRecipientDialog from "@/components/UpdateRecipientDialog";
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
import Link from "next/link";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;
const messageCollectionId = process.env.NEXT_PUBLIC_MESSAGE_COLLECTION_ID!;
const eventCollectionId = process.env.NEXT_PUBLIC_EVENT_COLLECTION_ID!;
const assistantCollectionId = process.env.NEXT_PUBLIC_ASSISTANT_COLLECTION_ID!;

// EditRecipientDialog is left as an exercise, or just add a stub/modal trigger for now
const EditRecipientDialog = ({ recipient, onEdited }: { recipient: any; onEdited: () => void }) => (
  <Button size="icon" variant="ghost" className="hover:bg-orange-100 p-1 rounded" disabled>
    <FaEdit className="text-[#FE9900]" />
  </Button>
);

export default function MessagePage() {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editRecipient, setEditRecipient] = useState<any | null>(null);
  const [deleteRecipient, setDeleteRecipient] = useState<any | null>(null);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      const userID = user.$id;
      const res = await databases.listDocuments(
        dbId,
        collectionId,
        [Query.equal("userID", userID)]
      );
      setRecipients(res.documents || []);
    } catch {
      setRecipients([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecipients();
    // eslint-disable-next-line
  }, []);

  const handleCascadeDelete = async (recipient: any) => {
    try {
      // Delete all messages with this directoryID
      const messagesRes = await databases.listDocuments(
        dbId,
        messageCollectionId,
        [Query.equal("directoryID", recipient.$id)]
      );
      for (const msg of messagesRes.documents) {
        await databases.deleteDocument(dbId, messageCollectionId, msg.$id);
      }
      // Delete all events with this directoryID
      const eventsRes = await databases.listDocuments(
        dbId,
        eventCollectionId,
        [Query.equal("directoryID", recipient.$id)]
      );
      for (const ev of eventsRes.documents) {
        await databases.deleteDocument(dbId, eventCollectionId, ev.$id);
      }
      // Delete all assistants with this directoryID
      const assistantsRes = await databases.listDocuments(
        dbId,
        assistantCollectionId,
        [Query.equal("directoryID", recipient.$id)]
      );
      for (const a of assistantsRes.documents) {
        await databases.deleteDocument(dbId, assistantCollectionId, a.$id);
      }
      // Delete the directory document itself
      await databases.deleteDocument(dbId, collectionId, recipient.$id);
      setRecipients(recipients.filter((r) => r.$id !== recipient.$id));
      setDeleteRecipient(null);
    } catch (e) {
      alert("Failed to delete recipient and related data.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-1 flex flex-col items-center justify-center h-full">
        <div className="mt-20 text-gray-400">Loading...</div>
      </div>
    );
  }
  if (recipients.length === 0) {
  return (
      <div className="max-w-xl mx-auto p-1 flex flex-col items-center justify-center h-full">
        <div className="w-64 h-64 mb-6">
          <Lottie
            loop
            animationData={emptyBoxJson}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div className="text-center mb-6 text-gray-700 text-lg font-medium">
          You currently have no connection.<br />
          <span className="text-gray-500 text-base font-normal">
            Add a recipient to start crafting messages.
                  </span>
                </div>
        <AddRecipientDialog onAdded={fetchRecipients} />
                </div>
    );
  }
  // --- If there ARE recipients ---
  return (
    <div className="max-w-xl mx-auto px-4 pt-8">
      {/* Add button top left (relative to container) */}
      <div className="flex items-center mb-6">
        <AddRecipientDialog onAdded={fetchRecipients} />
        <h2 className="text-xl font-bold ml-4">Your Connections</h2>
      </div>
      <div className="w-full space-y-3">
        {recipients.map((r) => (
          <Link key={r.$id} href={`/message/${r.$id}`} className="block">
            <div className="bg-white border rounded p-4 flex flex-col relative hover:shadow-md transition cursor-pointer">
              {/* Top right: Edit / Delete */}
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-blue-100 p-1 rounded"
                  onClick={e => { e.preventDefault(); setEditRecipient(r); }}
                >
                  <FaEdit className="text-blue-500" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-blue-100 p-1 rounded"
                  onClick={e => { e.preventDefault(); setDeleteRecipient(r); }}
                >
                  <FaTrash className="text-blue-500" />
                </Button>
              </div>
              <div><b>Name:</b> {r.recipient_name}</div>
              <div><b>Relationship:</b> {r.recipient_relationship}</div>
              <div><b>Email:</b> {r.recipient_email}</div>
              <div>
                <b>Birthday:</b>{" "}
                {r.recipient_birthday
                  ? new Date(r.recipient_birthday).toLocaleDateString()
                  : <span className="text-gray-400">N/A</span>}
              </div>
              {/* Edit dialog */}
              {editRecipient && editRecipient.$id === r.$id && (
                <UpdateRecipientDialog
                  recipient={editRecipient}
                  open={!!editRecipient}
                  setOpen={(open) => {
                    if (!open) setEditRecipient(null);
                  }}
                  onUpdated={() => {
                    setEditRecipient(null);
                    fetchRecipients();
                  }}
                />
              )}
            </div>
          </Link>
        ))}
      </div>
      {/* Single AlertDialog for delete confirmation */}
      <AlertDialog open={!!deleteRecipient} onOpenChange={open => { if (!open) setDeleteRecipient(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipient</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this recipient? <b>This will delete all messages, events, and assistants for this recipient.</b>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteRecipient(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteRecipient) await handleCascadeDelete(deleteRecipient);
              }}
            >
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

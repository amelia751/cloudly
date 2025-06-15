"use client";
import { useEffect, useState } from "react";
import AddMessageDialog from "@/components/message/AddMessageDialog";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import Lottie from "lottie-react";
import emptyBoxJson from "@/public/empty-box.json";
import { FaEdit, FaTrash } from "react-icons/fa";
import EditMessageDialog from "@/components/message/EditMessageDialog";
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
import { Button } from "@/components/ui/button";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const messageCollectionId = process.env.NEXT_PUBLIC_MESSAGE_COLLECTION_ID!;
const directoryCollectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;

export default function MessageComponent({ id }: { id: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientName, setRecipientName] = useState<string>("");
  const [editMsg, setEditMsg] = useState<any | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<any | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        dbId,
        messageCollectionId,
        [Query.equal("directoryID", id)]
      );
      setMessages(res.documents || []);
    } catch {
      setMessages([]);
    }
    setLoading(false);
  };

  const fetchRecipientName = async () => {
    try {
      const doc = await databases.getDocument(dbId, directoryCollectionId, id);
      setRecipientName(doc.recipient_name || "this person");
    } catch {
      setRecipientName("this person");
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchRecipientName();
  }, [id]);

  return (
    <div>
      <AddMessageDialog directoryID={id} onAdded={fetchMessages} />
      {loading ? (
        <div className="text-gray-400 mt-8">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <div className="w-64 h-64 mb-6">
            <Lottie
              loop
              animationData={emptyBoxJson}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="text-center mb-6 text-gray-700 text-lg font-medium">
            You have not created any message for <b>{recipientName}</b>.
          </div>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {messages.map((msg) => (
            <div key={msg.$id} className="bg-white border rounded p-4 relative">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-gray-400">ID: {msg.$id}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-blue-100 p-1 rounded"
                    onClick={() => setEditMsg(msg)}
                  >
                    <FaEdit className="text-blue-500" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-blue-100 p-1 rounded"
                        onClick={() => setDeleteMsg(msg)}
                      >
                        <FaTrash className="text-blue-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Are you sure you want to delete this message?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              await databases.deleteDocument(dbId, messageCollectionId, msg.$id);
                              setDeleteMsg(null);
                              fetchMessages();
                            } catch (e) {
                              alert("Failed to delete message.");
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="font-semibold text-sky-700 mb-1">{msg.message}</div>
              {msg.context && (
                <div className="text-xs text-gray-500 mb-1">Context: {msg.context}</div>
              )}
              {msg.note && (
                <div className="text-xs text-gray-400">Note: {msg.note}</div>
              )}
              {editMsg && editMsg.$id === msg.$id && (
                <EditMessageDialog
                  message={editMsg}
                  open={!!editMsg}
                  setOpen={(open) => {
                    if (!open) setEditMsg(null);
                  }}
                  onUpdated={() => {
                    setEditMsg(null);
                    fetchMessages();
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
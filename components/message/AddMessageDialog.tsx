"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_MESSAGE_COLLECTION_ID!;

export default function AddMessageDialog({ directoryID, onAdded }: { directoryID: string; onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await databases.createDocument(
        dbId,
        collectionId,
        ID.unique(),
        {
          directoryID,
          message,
          context,
          note,
        }
      );
      setOpen(false);
      setMessage("");
      setContext("");
      setNote("");
      onAdded?.();
    } catch (err) {
      alert("Failed to add message");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-sky-500 text-white rounded-full mb-4">Add Message</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Message</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block mb-1 font-medium">Message<span className="text-red-500">*</span></label>
            <Textarea
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your message..."
              rows={4}
            />
            <div className="text-xs text-gray-500 mt-1">
              <b>What to write:</b> This is the main message your recipient will see.<br />
              <b>e.g.</b> "I love you and I am proud of you. Remember to take care of yourself."
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Context</label>
            <Textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Context for this message (optional)"
              rows={2}
            />
            <div className="text-xs text-gray-500 mt-1">
              <b>When should this message be read?</b> (Optional)<br />
              <b>e.g.</b> "When you are stressed", "When you are sad"
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Note</label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note for this message (optional)"
              rows={2}
            />
            <div className="text-xs text-gray-500 mt-1">
              <b>Special notes about this message?</b> (Optional)<br />
              <b>e.g.</b> "Remember to take care of yourself", "Remember that you strong and capable"
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-sky-500 text-white rounded-full w-full" disabled={saving}>
              {saving ? "Saving..." : "Create Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { databases } from "@/lib/appwrite";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_MESSAGE_COLLECTION_ID!;

export default function EditMessageDialog({ message, open, setOpen, onUpdated }: {
  message: any;
  open: boolean;
  setOpen: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [msg, setMsg] = useState(message.message || "");
  const [context, setContext] = useState(message.context || "");
  const [note, setNote] = useState(message.note || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await databases.updateDocument(
        dbId,
        collectionId,
        message.$id,
        {
          message: msg,
          context,
          note,
        }
      );
      setOpen(false);
      onUpdated?.();
    } catch (err) {
      alert("Failed to update message");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block mb-1 font-medium">Message<span className="text-red-500">*</span></label>
            <Textarea
              required
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Write your message..."
              rows={4}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Context</label>
            <Textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Context for this message (optional)"
              rows={2}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Note</label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note for this message (optional)"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-sky-500 text-white rounded-full w-full" disabled={saving}>
              {saving ? "Saving..." : "Update Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
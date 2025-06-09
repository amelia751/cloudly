"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { databases } from "@/lib/appwrite";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_EVENT_COLLECTION_ID!;

const EVENT_OPTIONS = [
  "Birthday",
  "Anniversary",
  "Graduation",
  "Holiday",
  "Achievement",
  "Reunion",
  "Other",
];

export default function EditEventDialog({ eventDoc, open, setOpen, onUpdated }: {
  eventDoc: any;
  open: boolean;
  setOpen: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [event, setEvent] = useState(EVENT_OPTIONS.includes(eventDoc.event) ? eventDoc.event : "Other");
  const [customEvent, setCustomEvent] = useState(EVENT_OPTIONS.includes(eventDoc.event) ? "" : eventDoc.event || "");
  const [date, setDate] = useState<Date | undefined>(eventDoc.date ? new Date(eventDoc.date) : undefined);
  const [message, setMessage] = useState(eventDoc.message || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await databases.updateDocument(
        dbId,
        collectionId,
        eventDoc.$id,
        {
          date: date ? date.toISOString() : null,
          event: event === "Other" ? customEvent : event,
          message,
        }
      );
      setOpen(false);
      onUpdated?.();
    } catch (err) {
      alert("Failed to update event");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block mb-1 font-medium">Event<span className="text-red-500">*</span></label>
            <select
              required
              className="w-full border rounded px-2 py-2"
              value={event}
              onChange={e => setEvent(e.target.value)}
            >
              <option value="" disabled>Select an event</option>
              {EVENT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {event === "Other" && (
              <Input
                className="mt-2"
                placeholder="Enter custom event"
                value={customEvent}
                onChange={e => setCustomEvent(e.target.value)}
                required
              />
            )}
            <div className="text-xs text-gray-500 mt-1">
              <b>e.g.</b> Birthday, Anniversary, Graduation, etc.
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Date<span className="text-red-500">*</span></label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={
                    "w-full pl-3 text-left font-normal" +
                    (!date ? " text-muted-foreground" : "")
                  }
                >
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={d => !d || d < new Date("1900-01-01")}
                  captionLayout="dropdown"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="text-xs text-gray-500 mt-1">
              <b>e.g.</b> 2024-12-25
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Message</label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Message for this event (optional)"
              rows={3}
            />
            <div className="text-xs text-gray-500 mt-1">
              <b>e.g.</b> "Happy Birthday! Wishing you a wonderful year ahead."
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-sky-500 text-white rounded-full w-full" disabled={saving}>
              {saving ? "Saving..." : "Update Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
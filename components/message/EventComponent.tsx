"use client";
import { useEffect, useState } from "react";
import AddEventDialog from "@/components/message/AddEventDialog";
import EditEventDialog from "@/components/message/EditEventDialog";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import Lottie from "lottie-react";
import emptyBoxJson from "@/public/empty-box.json";
import { FaEdit, FaTrash } from "react-icons/fa";
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
const eventCollectionId = process.env.NEXT_PUBLIC_EVENT_COLLECTION_ID!;

export default function EventComponent({ id }: { id: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<any | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        dbId,
        eventCollectionId,
        [Query.equal("directoryID", id)]
      );
      setEvents(res.documents || []);
    } catch {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, [id]);

  return (
    <div>
      <AddEventDialog directoryID={id} onAdded={fetchEvents} />
      {loading ? (
        <div className="text-gray-400 mt-8">Loading...</div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <div className="w-64 h-64 mb-6">
            <Lottie
              loop
              animationData={emptyBoxJson}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="text-center mb-6 text-gray-700 text-lg font-medium">
            You have not saved any events.
          </div>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {events.map((ev) => (
            <div key={ev.$id} className="bg-white border rounded p-4 relative">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-gray-400">ID: {ev.$id}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-blue-100 p-1 rounded"
                    onClick={() => setEditEvent(ev)}
                  >
                    <FaEdit className="text-blue-500" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-blue-100 p-1 rounded"
                        onClick={() => setDeleteEvent(ev)}
                      >
                        <FaTrash className="text-blue-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Are you sure you want to delete this event?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              await databases.deleteDocument(dbId, eventCollectionId, ev.$id);
                              setDeleteEvent(null);
                              fetchEvents();
                            } catch (e) {
                              alert("Failed to delete event.");
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
              <div className="font-semibold text-sky-700 mb-1">{ev.event} <span className="text-xs text-gray-500">({ev.date ? new Date(ev.date).toLocaleDateString() : "No date"})</span></div>
              {ev.message && (
                <div className="text-xs text-gray-500 mb-1">Message: {ev.message}</div>
              )}
              {editEvent && editEvent.$id === ev.$id && (
                <EditEventDialog
                  eventDoc={editEvent}
                  open={!!editEvent}
                  setOpen={(open) => {
                    if (!open) setEditEvent(null);
                  }}
                  onUpdated={() => {
                    setEditEvent(null);
                    fetchEvents();
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
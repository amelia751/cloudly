"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { databases } from "@/lib/appwrite";

const dbId = process.env.NEXT_PUBLIC_USER_DATABASE_ID!;
const collectionId = process.env.NEXT_PUBLIC_DIRECTORY_COLLECTION_ID!;

const FormSchema = z.object({
  name: z.string().min(1, "Recipient's name is required."),
  email: z.string().email("Invalid email address."),
  relationship: z.string().min(1, "Relationship is required."),
  birthday: z.date().optional(),
});

export default function UpdateRecipientDialog({ recipient, onUpdated, open, setOpen }: {
  recipient: any;
  onUpdated: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: recipient.recipient_name || "",
      email: recipient.recipient_email || "",
      relationship: recipient.recipient_relationship || "",
      birthday: recipient.recipient_birthday ? new Date(recipient.recipient_birthday) : undefined,
    },
  });

  const [saving, setSaving] = useState(false);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setSaving(true);
    try {
      const doc = await databases.updateDocument(
        dbId,
        collectionId,
        recipient.$id,
        {
          recipient_name: data.name,
          recipient_email: data.email,
          recipient_relationship: data.relationship,
          recipient_birthday: data.birthday ? data.birthday.toISOString() : null,
        }
      );
      toast("Recipient updated!", {
        description: (
          <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
            <code className="text-white">{JSON.stringify(doc, null, 2)}</code>
          </pre>
        ),
      });
      setOpen(false);
      onUpdated?.();
    } catch (err: any) {
      toast.error("Failed to update recipient: " + (err?.message || err));
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Recipient</DialogTitle>
          <DialogDescription>
            Update the information for this recipient.<br />
            <span className="text-xs text-muted-foreground">
              The recipient will not be contacted until you publish your message.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mom, Grandpa, Jane Doe" {...field} />
                  </FormControl>
                  <FormDescription>
                    How do you call this person? This will help personalize your messages.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. mother, friend, husband" {...field} />
                  </FormControl>
                  <FormDescription>
                    What is your relationship to this person?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient's Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. janedoe@email.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The email address where your message will be sent when you publish it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Recipient's Birthday <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        captionLayout="dropdown"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Add their birthday for a special birthday wish!
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="bg-sky-500 text-white rounded-full w-full" disabled={saving}>
                {saving ? "Saving..." : "Update Recipient"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
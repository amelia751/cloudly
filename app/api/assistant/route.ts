import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const SMALLEST_API_KEY = process.env.SMALLEST_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { voiceId, assistantName, content, firstMessage, knowledge, directoryID } = await req.json();

    // Prepare context for knowledge base, e.g., as string for prompt (customize as you wish)
    let contextPrompt = "";
    if (knowledge) {
      if (knowledge.messages?.length) {
        contextPrompt += "\nMessages:\n" + knowledge.messages.map((m: { message: string }) => `- ${m.message}`).join("\n");
      }
      if (knowledge.events?.length) {
        contextPrompt += "\nEvents:\n" + knowledge.events.map((e: { event: string; date: string; message?: string }) => `- ${e.event} (${e.date}): ${e.message || ""}`).join("\n");
      }
    }

    // Build messages for Vapi
    const systemMessage = {
      role: "system",
      content: content + "\n" + contextPrompt,
    };

    // Use Vapi custom-voice provider as per docs!
    const payload = {
      name: assistantName,
      firstMessage,
      firstMessageMode: "assistant-speaks-first",
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [systemMessage],
      },
      voice: {
        provider: "custom-voice",
        server: {
          url: "https://waves-api.smallest.ai/api/v1/tts",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SMALLEST_API_KEY}`,
          },
          timeoutSeconds: 30,
        },
        cachingEnabled: true,
      },
    };

    const resp = await axios.post("https://api.vapi.ai/assistant", payload, {
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json({
      success: true,
      assistant: resp.data,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: "Failed to create Vapi assistant",
      details: err?.response?.data || err?.message || err,
    }, { status: 400 });
  }
}

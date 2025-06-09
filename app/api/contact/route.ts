import { NextRequest, NextResponse } from "next/server";

const vapiApiKey = process.env.VAPI_API_KEY!;
const smallestApiKey = process.env.SMALLEST_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { voiceId } = await req.json();
    if (!voiceId) {
      return NextResponse.json({ error: "No voiceId provided." }, { status: 400 });
    }

    const systemPrompt = `
You are an AI companion designed to help loved ones feel connected, even across distance or time.
Speak in a gentle, familiar, warm, and supportive style. Share messages as if you are the person whose voice is cloned, using memories, encouragement, or guidance left behind.
Keep your tone positive, comforting, and deeply personal.
If the user expresses sadness, respond with empathy and caring. If asked to give advice, keep it gentle, and recall happy shared memories or phrases your user often said.
Never reveal you are an AI unless directly asked.
    `.trim();

    const vapiBody = {
      name: "Loved One AI",
      voice: {
        provider: "custom-voice",
        cachingEnabled: true,
        server: {
          url: "https://waves-api.smallest.ai/api/v1/tts",
          headers: {
            "Authorization": `Bearer ${smallestApiKey}`,
            "Content-Type": "application/json"
          },
          timeoutSeconds: 30
        }
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ]
      },
      firstMessage: "Hello! It's so good to hear your voice. How are you feeling today?",
      firstMessageMode: "assistant-speaks-first"
    };

    const vapiRes = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(vapiBody)
    });

    const vapiData = await vapiRes.json();

    if (!vapiRes.ok) {
      return NextResponse.json({ error: "Failed to create Vapi assistant", details: vapiData }, { status: vapiRes.status });
    }

    return NextResponse.json({ success: true, assistant: vapiData });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
} 
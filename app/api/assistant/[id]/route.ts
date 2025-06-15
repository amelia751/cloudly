import { NextRequest, NextResponse } from "next/server";

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY!;
const vapiApiKey = process.env.VAPI_API_KEY!;

export async function PATCH(request: NextRequest) {
  // Get the id from the URL pathname
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "Missing assistant id" }, { status: 400 });
  }

  try {
    const { assistantName, promptWithContext, firstMessage, voiceId } = await request.json();

    if (!voiceId) {
      return NextResponse.json({ error: "Missing ElevenLabs voiceId" }, { status: 400 });
    }

    const payload: any = {
      name: assistantName,
      model: {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: promptWithContext,
          }
        ],
        provider: "openai"
      },
      voice: {
        provider: "custom-voice",
        server: {
          url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          headers: {
            "xi-api-key": elevenLabsApiKey,
            "Content-Type": "application/json"
          },
          timeoutSeconds: 30
        },
        cachingEnabled: true
      },
      firstMessage,
      firstMessageMode: "assistant-speaks-first",
    };

    const vapiRes = await fetch(`https://api.vapi.ai/assistant/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    let vapiData = {};
    try {
      vapiData = await vapiRes.json();
    } catch {}

    if (!vapiRes.ok) {
      return NextResponse.json({
        error: "Failed to update Vapi assistant",
        details: vapiData,
      }, { status: vapiRes.status });
    }

    return NextResponse.json({
      success: true,
      assistant: vapiData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}

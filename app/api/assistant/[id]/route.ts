import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing assistant id" }, { status: 400 });
    }

    const { assistantName, promptWithContext, firstMessage, voiceId } = await request.json();

    const payload: any = {
      name: assistantName,
      model: {
        model: "gpt-4o", // <-- Use allowed model name!
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
          url: "https://waves-api.smallest.ai/api/v1/tts",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SMALLEST_AI_API_KEY || process.env.SMALLESTAI_API_KEY}`,
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
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    let vapiData = {};
    try {
      vapiData = await vapiRes.json();
    } catch {
      // No body, error
    }

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

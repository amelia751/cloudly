import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const { assistantId, newPrompt } = await req.json();
    if (!assistantId || !newPrompt) {
      return NextResponse.json({ error: "Missing assistantId or newPrompt" }, { status: 400 });
    }
    const VAPI_SECRET_KEY = process.env.VAPI_SECRET_KEY;
    if (!VAPI_SECRET_KEY) {
      return NextResponse.json({ error: "Missing VAPI_SECRET_KEY in env" }, { status: 500 });
    }
    // Patch only the system prompt, but include required provider/model fields
    const payload = {
      model: {
        provider: "openai",
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: newPrompt,
          },
        ],
      },
    };
    const vapiRes = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VAPI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await vapiRes.json();
    if (!vapiRes.ok) {
      return NextResponse.json({ error: data.error || "Failed to patch assistant", details: data }, { status: vapiRes.status });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { assistantId, orgId } = await req.json();
    if (!assistantId) {
      return NextResponse.json({ error: "Missing assistantId" }, { status: 400 });
    }
    const VAPI_API_KEY = process.env.VAPI_API_KEY;
    if (!VAPI_API_KEY) {
      return NextResponse.json({ error: "Missing VAPI_API_KEY in env" }, { status: 500 });
    }
    const url = `https://api.vapi.ai/assistant/${assistantId}`;
    const vapiRes = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await vapiRes.json();
    // Debug log
    console.log("[VAPI] Request to:", url);
    console.log("[VAPI] Response:", data);
    if (!vapiRes.ok) {
      return NextResponse.json({ error: data.error || "Failed to fetch from Vapi" }, { status: vapiRes.status });
    }
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("[VAPI] Error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

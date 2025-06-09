import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const VAPI_API_KEY = process.env.VAPI_API_KEY!;

// Create or update chunk
export async function POST(req: NextRequest) {
  try {
    const { knowledgeBaseId, externalId, type, content, metadata } = await req.json();
    if (!knowledgeBaseId || !externalId || !content)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const chunk = {
      externalId,      // Use Appwrite doc $id
      content,         // Message/event content (main)
      type,            // "message" | "event"
      metadata: metadata || {},
    };

    // Upsert chunk
    const resp = await axios.post(
      `https://api.vapi.ai/knowledge-base/${knowledgeBaseId}/chunk`,
      chunk,
      { headers: { Authorization: `Bearer ${VAPI_API_KEY}` } }
    );

    return NextResponse.json({ success: true, chunk: resp.data });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to upsert chunk", details: err?.response?.data || err.message }, { status: 400 });
  }
}

// Delete chunk
export async function DELETE(req: NextRequest) {
  try {
    const { knowledgeBaseId, externalId } = await req.json();
    if (!knowledgeBaseId || !externalId)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const resp = await axios.delete(
      `https://api.vapi.ai/knowledge-base/${knowledgeBaseId}/chunk/${externalId}`,
      { headers: { Authorization: `Bearer ${VAPI_API_KEY}` } }
    );
    return NextResponse.json({ success: true, data: resp.data });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete chunk", details: err?.response?.data || err.message }, { status: 400 });
  }
}

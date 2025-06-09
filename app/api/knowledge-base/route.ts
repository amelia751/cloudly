// app/api/knowledge-base/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const VAPI_API_KEY = process.env.VAPI_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { name = "" } = await req.json();
    const payload = {
      provider: "trieve",
      name,
      // Optionally customize searchPlan or createPlan
    };
    const resp = await axios.post("https://api.vapi.ai/knowledge-base", payload, {
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return NextResponse.json({
      success: true,
      knowledgeBase: resp.data,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: "Failed to create knowledge base",
      details: err?.response?.data || err?.message || err,
    }, { status: 400 });
  }
}

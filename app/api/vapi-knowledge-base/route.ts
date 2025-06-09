// app/api/vapi-knowledge-base/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const VAPI_API_KEY = process.env.VAPI_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    // Optional: you can allow passing in name or options via req.json()
    const resp = await axios.post(
      "https://api.vapi.ai/knowledge-base",
      {
        provider: "trieve",
        name: "My KB", // You can make this dynamic!
      },
      {
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    return NextResponse.json({
      success: true,
      knowledgeBaseId: resp.data.id,
      knowledgeBaseOrgId: resp.data.orgId,
      data: resp.data,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: "Failed to create Vapi knowledge base",
      details: err?.response?.data || err?.message || err,
    }, { status: 400 });
  }
}

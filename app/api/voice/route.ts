import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
import axios from 'axios';

const smallestApiKey = process.env.SMALLEST_API_KEY!;

export async function POST(req: NextRequest) {
  // ... unchanged code for POST
  const form = await req.formData();
  const name = form.get('name') as string;
  const audio = form.get('audio') as File;

  if (!name || !audio) {
    return NextResponse.json({ error: 'Missing name or audio' }, { status: 400 });
  }
  if (!audio.name.endsWith('.wav')) {
    return NextResponse.json({ error: 'Please upload a .wav file for best results.' }, { status: 400 });
  }

  const arrayBuffer = await audio.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  const formData = new FormData();
  formData.append('displayName', name);
  formData.append('file', audioBuffer, {
    filename: audio.name,
    contentType: audio.type || 'audio/wav',
  });

  try {
    const res = await axios.post(
      'https://waves-api.smallest.ai/api/v1/lightning-large/add_voice',
      formData,
      {
        headers: {
          Authorization: `Bearer ${smallestApiKey}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
      }
    );
    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({
      error: 'Failed to create voice',
      details: e?.response?.data || e.message || e
    }, { status: 500 });
  }
}

// NEW: DELETE voice (called from frontend)
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const voiceId = body.voiceId;
    if (!voiceId) {
      return NextResponse.json({ error: 'Missing voiceId' }, { status: 400 });
    }
    const response = await axios.delete(
      'https://waves-api.smallest.ai/api/v1/lightning-large',
      {
        headers: {
          Authorization: `Bearer ${smallestApiKey}`,
          'Content-Type': 'application/json'
        },
        data: { voiceId }
      }
    );
    // response.data: { success: true, voiceId: "<string>" }
    return NextResponse.json(response.data);
  } catch (e: any) {
    return NextResponse.json({
      error: 'Failed to delete voice',
      details: e?.response?.data || e.message || e
    }, { status: 500 });
  }
}

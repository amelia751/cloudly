import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
import axios from 'axios';

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = form.get('name') as string;
    const audio = form.get('audio') as File;

    if (!name || !audio) {
      return NextResponse.json({ error: 'Missing name or audio' }, { status: 400 });
    }

    const allowedExt = ['.wav', '.mp3', '.m4a'];
    if (!allowedExt.some(ext => audio.name.endsWith(ext))) {
      return NextResponse.json({ error: 'Audio must be .wav, .mp3, or .m4a' }, { status: 400 });
    }

    const arrayBuffer = await audio.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('files', audioBuffer, {
      filename: audio.name,
      contentType: audio.type || 'audio/wav',
    });

    const res = await axios.post(
      'https://api.elevenlabs.io/v1/voices/add',
      formData,
      {
        headers: {
          'xi-api-key': elevenLabsApiKey,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
      }
    );

    // Success: Return ElevenLabs API data
    return NextResponse.json(res.data);
  } catch (e: any) {
    return NextResponse.json({
      error: 'Failed to create ElevenLabs voice',
      details: e?.response?.data || e.message || e
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const voiceId = body.voiceId;
    if (!voiceId) {
      return NextResponse.json({ error: 'Missing voiceId' }, { status: 400 });
    }

    // Make request to ElevenLabs to delete the voice
    const res = await axios.delete(
      `https://api.elevenlabs.io/v1/voices/${voiceId}`,
      {
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return NextResponse.json({
      success: true,
      voiceId,
      elevenLabsResponse: res.data
    });
  } catch (e: any) {
    return NextResponse.json({
      error: 'Failed to delete ElevenLabs voice',
      details: e?.response?.data || e.message || e
    }, { status: 500 });
  }
}

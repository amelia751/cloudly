import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { assistantId } = req.body;
  if (!assistantId) {
    return res.status(400).json({ error: 'Missing assistantId' });
  }
  try {
    const vapiRes = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assistantId, type: 'webCall' }),
    });
    if (!vapiRes.ok) {
      const error = await vapiRes.text();
      return res.status(500).json({ error: 'Vapi API error', details: error });
    }
    const data = await vapiRes.json();
    return res.status(200).json({ callId: data.id, call: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: (err as any)?.message });
  }
} 
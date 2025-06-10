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
    const vapiRes = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await vapiRes.json();
    if (!vapiRes.ok) {
      return res.status(vapiRes.status).json({ error: data.error || 'Failed to fetch assistant info', details: data });
    }
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unknown error' });
  }
} 
import { NextResponse } from 'next/server';

type RequestBody = {
  records?: Array<{ tokenId: number; traits: Record<string, string>; characterType?: string }>;
  bins?: Array<{ id: string; label: string; description: string }>;
};

export async function POST(request: Request) {
  const key = process.env.VENICE_API_KEY;
  if (!key) return NextResponse.json({ mode: 'preview', answers: {} });

  let body: RequestBody;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }
  if (!Array.isArray(body.records) || body.records.length > 32 || !Array.isArray(body.bins) || body.bins.length < 2) {
    return NextResponse.json({ error: 'Provide up to 32 records and at least two bins.' }, { status: 400 });
  }
  const bins = Object.fromEntries(body.bins.map((bin) => [bin.id, bin.description]));
  const questions = Object.fromEntries(body.records.map((record) => [`pirate_${record.tokenId}`, {
    type: 'choice',
    instructions: { pirate: record, question: 'Which destination pile best matches this pirate using only the supplied traits?' },
    criteria: { ...bins, review: 'The traits are missing or do not support a confident match.' },
  }]));
  const upstream = await fetch(`${process.env.VENICE_BASE_URL || 'https://api.venice.ai/api/v1'}/decisions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.JEV_MODEL || 'jev-latest', state: { task: 'Sort Pirate Nation PFP records into destination piles.', policy: 'Use only supplied metadata. Do not invent traits.' }, questions }),
    cache: 'no-store',
  });
  const data = await upstream.json().catch(() => null);
  if (!upstream.ok) return NextResponse.json({ error: 'Venice decision request failed.', detail: data }, { status: upstream.status });
  return NextResponse.json({ mode: 'live', model: data?.model, answers: data?.answers || {}, usage: data?.usage });
}

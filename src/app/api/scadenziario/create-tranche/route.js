import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const BACKEND = process.env.BACKEND_API_INTERNAL || 'http://localhost:9001';
  try {
    const body = await request.json();
    const { tranche } = body;
    const headersList = await headers();
    const authorization = headersList.get('authorization') || '';
    const res = await fetch(`${BACKEND}/v1/scadenziario/create-tranche`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify({ tranche }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Errore creazione tranche', message: error.message }, { status: 500 });
  }
}

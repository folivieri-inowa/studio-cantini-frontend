import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const BACKEND = process.env.BACKEND_API_INTERNAL || 'http://localhost:9001';
  try {
    const body = await request.json();
    const { parent_id } = body;
    const headersList = await headers();
    const authorization = headersList.get('authorization') || '';
    const res = await fetch(`${BACKEND}/v1/scadenziario/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify({ parent_id }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Errore recupero tranches', message: error.message }, { status: 500 });
  }
}

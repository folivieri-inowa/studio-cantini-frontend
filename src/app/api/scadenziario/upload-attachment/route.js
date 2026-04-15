import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_INTERNAL || process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9001';

export async function POST(request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization') || '';

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('owner_id') || 'temp';

    const formData = await request.formData();
    const fetchBody = new FormData();
    for (const [key, value] of formData.entries()) {
      fetchBody.append(key, value);
    }

    const response = await fetch(
      `${BACKEND_URL}/v1/scadenziario/upload-attachment?owner_id=${ownerId}`,
      {
        method: 'POST',
        headers: { Authorization: authorization },
        body: fetchBody,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[upload-attachment proxy] Errore:', error);
    return NextResponse.json({ error: 'Errore proxy upload', message: error.message }, { status: 500 });
  }
}

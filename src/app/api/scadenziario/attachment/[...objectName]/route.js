import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_INTERNAL || process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9001';

export async function GET(request, { params }) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization') || '';

    // params.objectName è l'array dei segmenti dopo /attachment/
    // Se l'URL originale era /attachment/temp%2F2026%2F123.pdf (slash encoded),
    // Next.js lo consegna come ["temp%2F2026%2F123.pdf"] — va passato al backend senza re-encoding.
    // Se fosse /attachment/temp/2026/123.pdf (slash reali), sarebbe ["temp","2026","123.pdf"].
    // In entrambi i casi, ricostruiamo il path come stringa e lo passiamo al backend che usa wildcard /*.
    const segments = (await params).objectName;
    const rawPath = segments.join('/');

    const response = await fetch(
      `${BACKEND_URL}/v1/scadenziario/attachment/${rawPath}`,
      {
        method: 'GET',
        headers: { Authorization: authorization },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'File non trovato' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition') || '';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || `inline; filename="${rawPath.split('/').pop()}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[attachment proxy] Errore:', error);
    return NextResponse.json({ error: 'Errore proxy attachment', message: error.message }, { status: 500 });
  }
}

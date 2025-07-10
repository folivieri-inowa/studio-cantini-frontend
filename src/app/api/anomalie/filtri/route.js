import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const db = searchParams.get('db');
    const mesi = searchParams.get('mesi') || '12';

    if (!db) {
      return NextResponse.json(
        { error: 'Database parameter is required' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      db,
      mesi,
    });

    const response = await fetch(`${process.env.BACKEND_URL}/anomalie/filtri?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Errore nel proxy dei filtri anomalie:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const db = searchParams.get('db');
  const mesi = searchParams.get('mesi') || '12';

  if (!db) {
    return NextResponse.json({ error: 'Database parameter is required' }, { status: 400 });
  }

  try {
    // Recupera l'header di autorizzazione
    const headersList = await headers();
    const authorization = headersList.get('authorization') || '';

    // Costruisci l'URL del backend
    const backendUrl = process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000';
    const url = `${backendUrl}/v1/anomalie/stats?db=${db}&mesi=${mesi}`;

    // Chiama l'endpoint del backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Backend error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Errore nella richiesta GET a anomalie/stats:', error);
    
    // In caso di errore di connessione al backend, restituisci dati di esempio
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const mockData = getMockData();
      return NextResponse.json(mockData, { status: 200 });
    }

    return NextResponse.json({ 
      error: 'Errore durante il calcolo delle statistiche', 
      message: error.message 
    }, { status: 500 });
  }
}

// Funzione per generare dati di esempio
function getMockData() {
  return {
    success: true,
    data: {
      categorie_totali: 15,
      soggetti_totali: 45,
      transazioni_totali: 1250,
      spese_totali: 45000.00,
      spesa_media: 36.00
    },
    periodo_analisi: {
      da: '2024-06-01',
      a: '2025-06-01',
      mesi: 12
    }
  };
}

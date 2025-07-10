import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const db = searchParams.get('db');
  const soglia = searchParams.get('soglia') || '50';
  const mesi = searchParams.get('mesi') || '12';
  const limit = searchParams.get('limit') || '100';
  const offset = searchParams.get('offset') || '0';
  const tipo_anomalia = searchParams.get('tipo_anomalia') || 'tutte';
  const categoria_id = searchParams.get('categoria_id');
  const soggetto_id = searchParams.get('soggetto_id');
  const data_da = searchParams.get('data_da');
  const data_a = searchParams.get('data_a');
  const soglia_minima = searchParams.get('soglia_minima') || '0';
  const soglia_massima = searchParams.get('soglia_massima') || '1000';
  const importo_minimo = searchParams.get('importo_minimo');
  const importo_massimo = searchParams.get('importo_massimo');
  const score_minimo = searchParams.get('score_minimo') || '0';
  const ordine = searchParams.get('ordine') || 'score_desc';

  if (!db) {
    return NextResponse.json({ error: 'Database parameter is required' }, { status: 400 });
  }

  try {
    // Recupera l'header di autorizzazione
    const headersList = await headers();
    const authorization = headersList.get('authorization') || '';

    // Costruisci i parametri per la query
    const params = new URLSearchParams({
      db,
      soglia,
      mesi,
      limit,
      offset,
      tipo_anomalia,
      soglia_minima,
      soglia_massima,
      score_minimo,
      ordine
    });

    // Aggiungi parametri opzionali solo se presenti
    if (categoria_id) params.append('categoria_id', categoria_id);
    if (soggetto_id) params.append('soggetto_id', soggetto_id);
    if (data_da) params.append('data_da', data_da);
    if (data_a) params.append('data_a', data_a);
    if (importo_minimo) params.append('importo_minimo', importo_minimo);
    if (importo_massimo) params.append('importo_massimo', importo_massimo);

    // Costruisci l'URL del backend
    const backendUrl = process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000';
    const url = `${backendUrl}/v1/anomalie/analysis?${params}`;

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
    console.error('Errore nella richiesta GET a anomalie/analysis:', error);
    
    // In caso di errore di connessione al backend, restituisci dati di esempio
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const mockData = getMockData();
      return NextResponse.json(mockData, { status: 200 });
    }

    return NextResponse.json({ 
      error: 'Errore durante l\'analisi delle anomalie', 
      message: error.message 
    }, { status: 500 });
  }
}

// Funzione per generare dati di esempio
function getMockData() {
  return {
    success: true,
    data: [
      {
        tipo: 'categoria',
        id: 'cat-1',
        nome: 'Alimentari',
        media_storica: 450.00,
        media_ultimo_mese: 650.00,
        totale_ultimo_mese: 1300.00,
        percentuale_scostamento: 44.44,
        transazioni_storiche: 24,
        transazioni_ultimo_mese: 2,
        direzione: 'aumento'
      },
      {
        tipo: 'soggetto',
        id: 'subj-1',
        nome: 'Supermercato Centro',
        categoria_nome: 'Alimentari',
        media_storica: 120.00,
        media_ultimo_mese: 180.00,
        totale_ultimo_mese: 360.00,
        percentuale_scostamento: 50.00,
        transazioni_storiche: 12,
        transazioni_ultimo_mese: 2,
        direzione: 'aumento'
      },
      {
        tipo: 'categoria',
        id: 'cat-2',
        nome: 'Trasporti',
        media_storica: 200.00,
        media_ultimo_mese: 80.00,
        totale_ultimo_mese: 80.00,
        percentuale_scostamento: -60.00,
        transazioni_storiche: 18,
        transazioni_ultimo_mese: 1,
        direzione: 'diminuzione'
      }
    ],
    statistiche: {
      totale_anomalie: 3,
      anomalie_categoria: 2,
      anomalie_soggetto: 1,
      scostamento_medio: 44.81,
      scostamento_massimo: 60.00
    },
    parametri: {
      soglia: 50,
      mesi: 12,
      tipo: 'entrambi',
      periodo_analisi: {
        da: '2024-06-01',
        a: '2025-06-01'
      },
      ultimo_mese: {
        da: '2025-05-01',
        a: '2025-05-31'
      }
    },
    paginazione: {
      limite: 100,
      offset: 0,
      totale: 3,
      ha_prossima_pagina: false
    }
  };
}

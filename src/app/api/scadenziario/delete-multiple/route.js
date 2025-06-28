// route.js per gestire specificamente le richieste all'endpoint /api/scadenziario/delete-multiple
import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurazione del client Axios per il backend
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000',
});

// POST: Gestisce le richieste di eliminazione multipla di scadenze
export async function POST(request) {
  console.log('Ricevuta richiesta POST a /api/scadenziario/delete-multiple');
  try {
    // Parse della richiesta JSON
    const body = await request.json();
    console.log('Body della richiesta:', body);
    
    // Estrai gli ID delle scadenze da eliminare
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Nessun ID valido specificato' }, { status: 400 });
    }
    
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    console.log('Chiamando backend:', '/v1/scadenziario/delete-multiple');
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/delete-multiple', { ids }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });
    
    console.log('Risposta dal backend ricevuta');
    
    // Restituisci i dati al client
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Errore nella richiesta POST a scadenziario/delete-multiple:', error);
    
    return NextResponse.json({ 
      error: 'Errore durante l\'eliminazione multipla delle scadenze', 
      message: error.message 
    }, { status: error.response?.status || 500 });
  }
}

// route.js per gestire specificamente le richieste all'endpoint /api/scadenziario/update-status
import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurazione del client Axios per il backend
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000',
});

// POST: Gestisce le richieste di aggiornamento automatico degli stati
export async function POST(request) {
  console.log('Ricevuta richiesta POST a /api/scadenziario/update-status');
  try {
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    console.log('Chiamando backend:', '/v1/scadenziario/update-status');
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/update-status', {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });
    
    console.log('Risposta dal backend ricevuta');
    
    // Restituisci i dati al client
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Errore nella richiesta POST a scadenziario/update-status:', error);
    
    return NextResponse.json({ 
      error: 'Errore durante l\'aggiornamento automatico degli stati', 
      message: error.message 
    }, { status: error.response?.status || 500 });
  }
}

// route.js per gestire specificamente le richieste all'endpoint /api/scadenziario/delete
import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurazione del client Axios per il backend
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000',
});

// POST: Gestisce le richieste di eliminazione di una scadenza
export async function POST(request) {
  console.log('Ricevuta richiesta POST a /api/scadenziario/delete');
  try {
    // Parse della richiesta JSON
    const body = await request.json();
    console.log('Body della richiesta:', body);
    
    // Estrai l'ID della scadenza da eliminare
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID della scadenza non specificato' }, { status: 400 });
    }
    
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    console.log('Chiamando backend:', '/v1/scadenziario/delete');
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/delete', { id }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });
    
    console.log('Risposta dal backend ricevuta');
    
    // Restituisci i dati al client
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Errore nella richiesta POST a scadenziario/delete:', error);
    
    return NextResponse.json({ 
      error: 'Errore durante l\'eliminazione della scadenza', 
      message: error.message 
    }, { status: error.response?.status || 500 });
  }
}

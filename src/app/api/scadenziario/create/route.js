// route.js per gestire specificamente le richieste all'endpoint /api/scadenziario/create
import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurazione del client Axios per il backend
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000',
});

// POST: Gestisce le richieste di creazione di una nuova scadenza
export async function POST(request) {
  console.log('Ricevuta richiesta POST a /api/scadenziario/create');
  try {
    // Parse della richiesta JSON
    const body = await request.json();
    console.log('Body della richiesta:', body);
    
    // Estrai i dati della scadenza
    const { scadenza } = body;
    
    if (!scadenza) {
      return NextResponse.json({ error: 'Dati della scadenza non specificati' }, { status: 400 });
    }
    
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    console.log('Chiamando backend:', '/v1/scadenziario/create');
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/create', { scadenza }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });
    
    console.log('Risposta dal backend ricevuta:', response.data);
    
    // Restituisci i dati al client
    return NextResponse.json(response.data, { status: 201 });
    
  } catch (error) {
    console.error('Errore nella richiesta POST a scadenziario/create:', error);
    
    return NextResponse.json({ 
      error: 'Errore durante la creazione della scadenza', 
      message: error.message 
    }, { status: error.response?.status || 500 });
  }
}

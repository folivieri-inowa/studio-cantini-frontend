// route.js per gestire specificamente le richieste all'endpoint /api/scadenziario/update-payment
import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurazione del client Axios per il backend
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000',
});

// POST: Gestisce le richieste di aggiornamento dello stato di pagamento di una scadenza
export async function POST(request) {
  console.log('Ricevuta richiesta POST a /api/scadenziario/update-payment');
  try {
    // Parse della richiesta JSON
    const body = await request.json();
    console.log('Body della richiesta:', body);
    
    // Estrai l'ID, la data di pagamento e lo stato della scadenza
    const { id, payment_date, status } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID della scadenza non specificato' }, { status: 400 });
    }
    
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    console.log('Chiamando backend:', '/v1/scadenziario/update-payment');
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/update-payment', { 
      id, 
      payment_date, 
      status 
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });
    
    console.log('Risposta dal backend ricevuta');
    
    // Restituisci i dati al client
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Errore nella richiesta POST a scadenziario/update-payment:', error);
    
    return NextResponse.json({ 
      error: 'Errore durante l\'aggiornamento dello stato di pagamento della scadenza', 
      message: error.message 
    }, { status: error.response?.status || 500 });
  }
}

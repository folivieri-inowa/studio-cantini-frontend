// route.js per gestire specificamente le richieste all'endpoint /api/scadenziario/list
import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurazione del client Axios per il backend
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000',
});
console.log('Backend API URL configurato come:', process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000');

// POST: Gestisce le richieste di elenco scadenziario
export async function POST(request) {
  console.log('Ricevuta richiesta POST a /api/scadenziario/list');
  try {
    // Parse della richiesta JSON
    const body = await request.json();
    console.log('Body della richiesta:', body);
    
    // Estrai i filtri
    const { filters = {} } = body;
    
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    console.log('Chiamando backend:', '/v1/scadenziario/list');
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/list', { filters }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });
    
    console.log('Risposta dal backend ricevuta');
    
    // Restituisci i dati al client
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Errore nella richiesta POST a scadenziario/list:', error);
    
    // In caso di errore di connessione al backend, genera dati di esempio
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const mockData = getMockData();
      return NextResponse.json({ data: mockData }, { status: 200 });
    }
    
    // Altrimenti restituisci l'errore
    return NextResponse.json({ 
      error: 'Errore durante l\'elaborazione della richiesta', 
      message: error.message 
    }, { status: error.response?.status || 500 });
  }
}

// Funzione per generare dati di esempio
function getMockData() {
  const today = new Date();
  return [
    {
      id: '1',
      subject: 'Enel',
      description: 'Bolletta luce',
      causale: 'Utenza',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString(),
      amount: 120.5,
      paymentDate: null,
      status: 'upcoming',
    },
    {
      id: '2',
      subject: 'Studio Rossi',
      description: 'Affitto ufficio',
      causale: 'Affitti',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
      amount: 800.0,
      paymentDate: null,
      status: 'overdue',
    }
  ];
}

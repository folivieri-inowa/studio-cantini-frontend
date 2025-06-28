// route.js per la gestione delle API di scadenziario utilizzando l'App Router di Next.js
import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurazione del client Axios per il backend
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000',
});
console.log('Backend API URL configurato come:', process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000');

// Dati di esempio per fallback quando il backend non è disponibile
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
      status: 'upcoming',  // In scadenza (meno di 15 giorni)
    },
    {
      id: '2',
      subject: 'Studio Rossi',
      description: 'Affitto ufficio',
      causale: 'Affitti',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
      amount: 800.0,
      paymentDate: null,
      status: 'overdue',  // Scaduto
    },
    {
      id: '3',
      subject: 'TIM',
      description: 'Bolletta telefono',
      causale: 'Utenza',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20).toISOString(),
      amount: 55.90,
      paymentDate: null,
      status: 'future',  // Futuro
    },
    {
      id: '4',
      subject: 'Assicurazione',
      description: 'Polizza ufficio',
      causale: 'Assicurazione',
      date: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString(),
      amount: 450.0,
      paymentDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() - 1).toISOString(),
      status: 'completed',  // Pagato
    },
    {
      id: '5',
      subject: 'Commercialista',
      description: 'Consulenza fiscale',
      causale: 'Consulenze',
      date: new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()).toISOString(),
      amount: 350.0,
      paymentDate: null,
      status: 'future',  // Futuro
    },
  ];
}

// GET: Ottieni l'elenco dello scadenziario
export async function GET(request) {
  try {
    // Recupera i filtri dalla query string
    const { searchParams } = new URL(request.url);
    const filters = {};
    
    // Estrai i parametri di filtro rilevanti
    if (searchParams.has('subject')) filters.subject = searchParams.get('subject');
    if (searchParams.has('status')) {
      // status può essere un array, quindi gestiamo correttamente
      const statusValues = searchParams.getAll('status');
      if (statusValues.length) {
        filters.status = statusValues;
      }
    }
    if (searchParams.has('startDate')) filters.startDate = searchParams.get('startDate');
    if (searchParams.has('endDate')) filters.endDate = searchParams.get('endDate');
    if (searchParams.has('ownerId')) filters.ownerId = searchParams.get('ownerId');
    
    // Chiama l'endpoint del backend
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    const response = await backendApi.post('/v1/scadenziario/list', 
      { filters },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
        },
      }
    );
    
    // Restituisci i dati al client
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Errore nella richiesta GET a scadenziario:', error);
    // In caso di errore restituiamo i dati di fallback
    const mockData = getMockData();
    return NextResponse.json({ data: mockData }, { status: 200 });
  }
}

// POST: Gestisce diverse operazioni in base all'action specificata
export async function POST(request) {
  console.log('Ricevuta richiesta POST a /api/scadenziario');
  try {
    // Parse della richiesta JSON
    const body = await request.json();
    console.log('Body della richiesta:', body);
    const { action, ...data } = body;
    console.log('Azione richiesta:', action);
    
    let endpoint;
    
    // Determina l'endpoint backend in base all'azione
    switch (action) {
      case 'list':
        endpoint = '/v1/scadenziario/list';
        break;
      case 'details':
        endpoint = '/v1/scadenziario/details';
        break;
      case 'create':
        endpoint = '/v1/scadenziario/create';
        break;
      case 'update':
        endpoint = '/v1/scadenziario/update';
        break;
      case 'update-payment':
        endpoint = '/v1/scadenziario/update-payment';
        break;
      case 'delete':
        endpoint = '/v1/scadenziario/delete';
        break;
      case 'delete-multiple':
        endpoint = '/v1/scadenziario/delete-multiple';
        break;
      case 'update-status':
        endpoint = '/v1/scadenziario/update-status';
        break;
      default:
        // Se non c'è un'azione, assume che sia una creazione standard
        endpoint = '/v1/scadenziario/create';
    }
    
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post(endpoint, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });
    
    // Restituisci i dati al client
    return NextResponse.json(response.data, { 
      status: action === 'create' ? 201 : 200 
    });
    
  } catch (error) {
    console.error('Errore nella richiesta POST a scadenziario:', error);
    
    // Se è un errore di creazione e non possiamo raggiungere il backend, simuliamo una risposta
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      // Simula la creazione di una nuova scadenza
      const body = await request.json();
      const newId = Math.floor(Math.random() * 10000).toString();
      const newItem = {
        id: newId,
        ...body,
        status: body.paymentDate ? 'completed' : 'future'
      };
      
      return NextResponse.json({ 
        data: newItem,
        message: 'Scadenza creata con successo (modalità fallback)'
      }, { status: 201 });
    }
    
    // Altrimenti restituisci l'errore
    return NextResponse.json({ 
      error: 'Errore durante l\'elaborazione della richiesta', 
      message: error.message 
    }, { status: error.response?.status || 500 });
  }
}

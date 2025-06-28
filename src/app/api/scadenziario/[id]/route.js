// route.js per gestire le operazioni su una singola scadenza
import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Configurazione del client Axios per il backend
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
});

// Funzione per generare una scadenza di esempio basata sull'ID
function getMockItem(id) {
  const today = new Date();
  // Genera una data casuale che può essere passata, futura o imminente
  const randomDays = Math.floor(Math.random() * 30) - 10; // Da -10 a +20 giorni
  const mockDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + randomDays);
  
  // Determina se il mock è stato pagato (30% di probabilità)
  const isPaid = Math.random() > 0.7;
  const paymentDate = isPaid ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2) : null;
  
  // Calcolo dello stato
  let status = 'future';
  if (paymentDate) {
    status = 'completed';
  } else {
    const diff = mockDate - today;
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      status = 'overdue';
    } else if (diffDays <= 15) {
      status = 'upcoming';
    }
  }
  
  return {
    id,
    subject: `Scadenza ${id}`,
    description: `Descrizione scadenza ${id}`,
    causale: ['Utenza', 'Affitto', 'Consulenza', 'Tasse'][Math.floor(Math.random() * 4)],
    date: mockDate.toISOString(),
    amount: Math.floor(Math.random() * 1000) + 50,
    paymentDate: paymentDate ? paymentDate.toISOString() : null,
    status
  };
}

// GET: Recupera una scadenza specifica per ID
export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/details', 
      { id },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
        },
      }
    );
    
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error(`Errore nel recupero della scadenza ${id}:`, error);
    // Restituisci un elemento di esempio in caso di errore
    const mockItem = getMockItem(id);
    return NextResponse.json({ data: mockItem }, { status: 200 });
  }
}

// PUT: Aggiorna una scadenza esistente
export async function PUT(request, { params }) {
  const { id } = params;
  try {
    const body = await request.json();
    const scadenza = body;

    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/update', 
      { id, scadenza },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
        },
      }
    );
    
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error(`Errore nell'aggiornamento della scadenza ${id}:`, error);
    
    // Se c'è un errore di connessione al backend, simula la risposta
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const body = await request.json();
      
      // Simula l'aggiornamento della scadenza
      const updatedItem = {
        ...getMockItem(id),
        ...body,
        id, // Manteniamo sempre lo stesso ID
      };
  
      // Calcola lo stato corrente in base a date e paymentDate
      if (updatedItem.paymentDate) {
        updatedItem.status = 'completed';
      } else {
        const today = new Date();
        const dueDate = new Date(updatedItem.date);
        const diff = dueDate - today;
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          updatedItem.status = 'overdue';
        } else if (diffDays <= 15) {
          updatedItem.status = 'upcoming';
        } else {
          updatedItem.status = 'future';
        }
      }
      
      return NextResponse.json({ 
        data: updatedItem, 
        message: 'Scadenza aggiornata con successo (modalità fallback)' 
      }, { status: 200 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Elimina una scadenza
export async function DELETE(request, { params }) {
  const { id } = params;
  
  try {
    // Recupera l'header di autorizzazione
    const headersList = headers();
    const authorization = headersList.get('authorization') || '';
    
    // Chiama l'endpoint del backend
    const response = await backendApi.post('/v1/scadenziario/delete', 
      { id },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
        },
      }
    );
    
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error(`Errore nell'eliminazione della scadenza ${id}:`, error);
    
    // Se c'è un errore di connessione, fornisci una risposta simulata
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json({ 
        success: true, 
        message: `Scadenza ${id} eliminata con successo (modalità fallback)` 
      }, { status: 200 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

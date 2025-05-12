import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function POST(request) {
  const body = await request.json()
  
  console.log('API route /api/category/edit - Ricevuto body:', body);
  
  // Verifica che tutti i campi necessari siano presenti
  if (!body.id || !body.name || !body.db) {
    console.error('API route /api/category/edit - Dati mancanti:', body);
    return NextResponse.json({ 
      error: 'Dati mancanti. Richiesti: id, name, db',
      received: body
    }, { status: 400 });
  }

  try {
    console.log('API route /api/category/edit - Invio al backend:', body);
    const response = await axios.post(`${BACKEND_API}/v1/category/edit`, body);

    const {data} = response;
    console.log('API route /api/category/edit - Risposta dal backend:', data);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('API route /api/category/edit - Errore:', error.response?.data || error.message);
    return NextResponse.json({ 
      error: 'Errore durante la modifica della categoria',
      details: error.response?.data || error.message
    }, { status: 500 });
  }
}

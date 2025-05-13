import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function POST(request) {
  const body = await request.json();

  try {
    // Valida i parametri necessari
    const { db, importId, transactionIds } = body;
    
    if (!db || (!importId && (!transactionIds || transactionIds.length === 0))) {
      return NextResponse.json({ 
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    // Inoltra la richiesta al backend
    const response = await axios.post(`${BACKEND_API}/v1/transaction/undo-import`, body);
    const { data } = response;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in undo-import API:', error);
    
    return NextResponse.json({ 
      error: 'Failed to undo import',
      message: error.message
    }, { status: 500 });
  }
}

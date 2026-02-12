/**
 * API Route: Index Transaction
 * Proxy per indicizzare singola transazione in Qdrant (apprendimento real-time)
 */

import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_HOST_BACKEND || 
                        process.env.NEXT_PUBLIC_BACKEND_API || 
                        'http://localhost:9000';

export async function POST(request) {
  try {
    const body = await request.json();
    const { db, transactionId } = body;

    if (!db || !transactionId) {
      return NextResponse.json(
        { success: false, error: 'Missing db or transactionId' },
        { status: 400 }
      );
    }

    console.log(`[Index Transaction] Indicizzazione ${transactionId} per apprendimento...`);

    // Chiama backend endpoint
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/v1/classification/index-transaction`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Aggiungere JWT token se necessario
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ db, transactionId }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('[Index Transaction] Backend error:', errorData);
      
      // Non fallire hard, log e continua
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || 'Backend indexing failed',
          skipped: true // Flag per indicare che è ok continuare
        },
        { status: 200 } // 200 per non bloccare il frontend
      );
    }

    const result = await backendResponse.json();
    console.log('[Index Transaction] ✅ Indicizzazione completata:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Index Transaction] Error:', error);
    
    // Non fallire hard
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        skipped: true 
      },
      { status: 200 }
    );
  }
}

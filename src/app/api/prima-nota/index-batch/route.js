/**
 * API Route: Index Batch Transactions
 * Proxy per indicizzare batch di transazioni in Qdrant (ottimizzato per multi-classify)
 */

import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_HOST_BACKEND || 
                        process.env.NEXT_PUBLIC_BACKEND_API || 
                        'http://localhost:9000';

export async function POST(request) {
  try {
    const body = await request.json();
    const { db, transactionIds } = body;

    if (!db || !transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing db or transactionIds array' },
        { status: 400 }
      );
    }

    if (transactionIds.length === 0) {
      return NextResponse.json({
        success: true,
        indexed_count: 0,
        skipped_count: 0,
        latency_ms: 0,
      });
    }

    if (transactionIds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 transactions per batch' },
        { status: 400 }
      );
    }

    console.log(`[Index Batch] Indicizzazione ${transactionIds.length} transazioni...`);

    // Chiama backend endpoint
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/v1/classification/index-batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Aggiungere JWT token se necessario
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ db, transactionIds }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('[Index Batch] Backend error:', errorData);
      
      // Non fallire hard, log e continua
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || 'Backend batch indexing failed',
          indexed_count: 0,
          skipped_count: transactionIds.length,
        },
        { status: 200 } // 200 per non bloccare il frontend
      );
    }

    const result = await backendResponse.json();
    console.log('[Index Batch] ✅ Completato:', {
      indexed: result.indexed_count,
      skipped: result.skipped_count,
      latency_ms: result.latency_ms,
      avg_per_txn: result.avg_latency_per_transaction_ms,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Index Batch] Error:', error);
    
    // Non fallire hard
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        indexed_count: 0,
        skipped_count: 0,
      },
      { status: 200 }
    );
  }
}

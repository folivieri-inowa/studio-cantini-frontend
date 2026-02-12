import { NextResponse } from 'next/server';

/**
 * Route API per classificazione locale (nuovo sistema basato su backend locale)
 * Sostituisce il vecchio sistema n8n con 4-stage pipeline:
 * - Stage 1: Rule-based classification (15 regole deterministiche)
 * - Stage 2: Historical exact match
 * - Stage 3: Semantic vector search (Qdrant + Ollama)
 * - Stage 4: Manual review fallback
 */

// Backend locale su porta 9000
const BACKEND_API_URL = process.env.NEXT_PUBLIC_HOST_BACKEND || process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:9000';

export async function POST(request) {
  try {
    const body = await request.json();
    const { transaction, db = 'db1' } = body;

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction data is required' },
        { status: 400 }
      );
    }

    console.log('🔵 [Local Classifier] Calling local backend:', `${BACKEND_API_URL}/v1/classification/classify`);
    console.log('📤 [Local Classifier] Transaction:', {
      id: transaction.id,
      description: transaction.description?.substring(0, 50),
      amount: transaction.amount || transaction.dare || transaction.avere,
    });

    // Prepara il payload per il backend locale
    // Il backend si aspetta: { db, transaction: { id, description, amount, date, paymentType?, ownerId? } }
    const amount = transaction.amount || 
                  (transaction.dare ? parseFloat(transaction.dare) : 0) - 
                  (transaction.avere ? parseFloat(transaction.avere) : 0);

    const localPayload = {
      db,
      transaction: {
        id: transaction.id,
        description: transaction.description || transaction.descrizione || '',
        amount,
        date: transaction.date || transaction.data || new Date().toISOString(),
        paymentType: transaction.paymentType || null,
        ownerId: transaction.ownerId || null,
      },
    };

    // Chiama il backend locale
    const response = await fetch(`${BACKEND_API_URL}/v1/classification/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authentication when ready
        // 'Authorization': `Bearer ${process.env.BACKEND_API_TOKEN}`,
      },
      body: JSON.stringify(localPayload),
    });

    console.log('📥 [Local Classifier] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Local Classifier] Backend error (${response.status}):`, errorText);
      return NextResponse.json(
        { 
          error: 'Local classification service error', 
          details: errorText,
          fallback_to_manual: true,
        },
        { status: 502 }
      );
    }

    const result = await response.json();
    console.log('✅ [Local Classifier] Response:', {
      success: result.success,
      method: result.classification?.method,
      confidence: result.classification?.confidence,
      needs_review: result.needs_review,
    });

    // Il backend restituisce:
    // {
    //   success: true,
    //   classification: {
    //     category_id: UUID,
    //     category_name: string,
    //     subject_id: UUID,
    //     subject_name: string,
    //     detail_id: UUID | null,
    //     detail_name: string | null,
    //     confidence: number (0-100),
    //     method: 'rule' | 'exact' | 'semantic' | 'manual',
    //     reasoning: string
    //   },
    //   suggestions: [...] | [],  // Array di alternative (semantic search)
    //   needs_review: boolean,
    //   latency_ms: number
    // }

    // Se needs_review è true, il sistema richiede classificazione manuale
    if (result.needs_review || !result.classification) {
      return NextResponse.json({
        success: true,
        classification: null,
        suggestions: result.suggestions || [],
        needs_review: true,
        reason: 'Nessuna classificazione automatica sufficiente. Richiede revisione manuale.',
        latency_ms: result.latency_ms,
      });
    }

    // Restituisce la classificazione con eventuali suggestions alternative
    return NextResponse.json({
      success: true,
      classification: result.classification,
      suggestions: result.suggestions || [],
      needs_review: false,
      latency_ms: result.latency_ms,
    });

  } catch (error) {
    console.error('❌ [Local Classifier] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Classification failed', 
        details: error.message,
        fallback_to_manual: true,
      },
      { status: 500 }
    );
  }
}

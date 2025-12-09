import { NextResponse } from 'next/server';

// URL del webhook n8n per la classificazione RAG
const N8N_RAG_CLASSIFY_URL = 'https://n8n-archivio.inowa.it/webhook/rag-classify';

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

    // Prepara il payload per n8n
    const n8nPayload = {
      db,
      transactions: [
        {
          id: transaction.id,
          descrizione: transaction.description || transaction.descrizione || '',
          dare: transaction.dare || transaction.debit || '',
          avere: transaction.avere || transaction.credit || '',
          data: transaction.data || transaction.date || '',
        },
      ],
    };

    // Chiama il webhook n8n
    const response = await fetch(N8N_RAG_CLASSIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', errorText);
      return NextResponse.json(
        { error: 'Classification service error', details: errorText },
        { status: 502 }
      );
    }

    const result = await response.json();

    console.log('n8n response:', JSON.stringify(result, null, 2));

    // Il workflow n8n restituisce: { transactions: [{ suggested: {...}, similar_transactions: [...] }] }
    // Estraiamo il suggerimento dalla prima transazione
    const resultTransaction = result.transactions?.[0];
    const classification = resultTransaction?.suggested;

    if (!classification) {
      return NextResponse.json(
        { error: 'No classification found in response', details: result },
        { status: 502 }
      );
    }

    // La risposta include già confidence, mappiamo il metodo basato sulla confidenza
    const normalizedClassification = {
      ...classification,
      confidence: (classification.confidence || 0) * 100, // Convertiamo da 0-1 a 0-100
      method: classification.confidence >= 0.85 ? 'rag_direct' : 'llm_analysis',
    };

    return NextResponse.json(
      {
        success: true,
        classification: normalizedClassification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auto-classify error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-classify transaction', details: error.message },
      { status: 500 }
    );
  }
}

// Endpoint per classificazione multipla
export async function PUT(request) {
  try {
    const body = await request.json();
    const { transactions, db = 'db1' } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Transactions array is required' },
        { status: 400 }
      );
    }

    // Prepara il payload per n8n
    const n8nPayload = {
      db,
      transactions: transactions.map((t) => ({
        id: t.id,
        descrizione: t.description || t.descrizione || '',
        dare: t.dare || t.debit || '',
        avere: t.avere || t.credit || '',
        data: t.data || t.date || '',
      })),
    };

    // Chiama il webhook n8n
    const response = await fetch(N8N_RAG_CLASSIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', errorText);
      return NextResponse.json(
        { error: 'Classification service error', details: errorText },
        { status: 502 }
      );
    }

    const result = await response.json();

    // Il workflow n8n restituisce: { transactions: [{ suggested: {...}, similar_transactions: [...] }] }
    // Estraiamo i suggerimenti da ogni transazione
    const classifications = result.transactions?.map((transaction) => {
      const classification = transaction?.suggested;
      if (!classification) return null;

      return {
        ...classification,
        id: transaction.original?.id || transaction.id,
        confidence: (classification.confidence || 0) * 100, // Convertiamo da 0-1 a 0-100
        method: classification.confidence >= 0.85 ? 'rag_direct' : 'llm_analysis',
      };
    }).filter(Boolean) || [];

    return NextResponse.json(
      {
        success: true,
        classifications,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auto-classify multi error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-classify transactions', details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

// URL del webhook n8n per la classificazione RAG
const N8N_RAG_CLASSIFY_URL = 'https://n8n-archivio.wavetech.it/webhook/rag-classify';

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
    console.log('🔵 Calling n8n webhook:', N8N_RAG_CLASSIFY_URL);
    console.log('📤 Payload:', JSON.stringify(n8nPayload, null, 2));

    const response = await fetch(N8N_RAG_CLASSIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ n8n webhook error (status ${response.status}):`, errorText);
      return NextResponse.json(
        { error: 'Classification service error', details: errorText },
        { status: 502 }
      );
    }

    // Verifica che la risposta contenga del contenuto prima di parsare
    const responseText = await response.text();
    console.log('📥 Response text length:', responseText?.length || 0);
    console.log('📥 Response text preview:', responseText?.substring(0, 200));

    if (!responseText || responseText.trim() === '') {
      console.error('❌ n8n webhook returned empty response');
      console.error('Response status was:', response.status);
      console.error('Response headers were:', Object.fromEntries(response.headers.entries()));
      return NextResponse.json(
        { error: 'Classification service returned empty response', details: 'Il servizio di classificazione non ha restituito dati' },
        { status: 502 }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse n8n response:', responseText);
      return NextResponse.json(
        { error: 'Invalid response from classification service', details: parseError.message },
        { status: 502 }
      );
    }

    console.log('n8n response:', JSON.stringify(result, null, 2));

    // Il workflow n8n restituisce: { transactions: [{ suggested: {...}, similar_transactions: [...] }] }
    // Estraiamo il suggerimento dalla prima transazione
    const resultTransaction = result.transactions?.[0];
    const classification = resultTransaction?.suggested;

    // Se suggested è null, significa che RAG non ha trovato match >= 85%
    // Restituiamo comunque success=true ma con needs_review=true per aprire il dialog
    if (!classification || classification === null) {
      return NextResponse.json(
        {
          success: true,
          classification: null,
          needs_review: true,
          reason: resultTransaction?.reason || 'Nessuna transazione simile trovata. Richiede classificazione manuale.',
        },
        { status: 200 }
      );
    }

    // La risposta include già confidence in percentuale (0-100)
    const normalizedClassification = {
      ...classification,
      // Se confidence è già > 1, è già in percentuale, altrimenti converti
      confidence: classification.confidence > 1 ? classification.confidence : (classification.confidence || 0) * 100,
      method: classification.method || (classification.confidence >= 85 ? 'rag_direct' : 'llm_analysis'),
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
    console.log('🔵 Calling n8n webhook (multi):', N8N_RAG_CLASSIFY_URL);
    console.log('📤 Payload (multi):', JSON.stringify(n8nPayload, null, 2));

    const response = await fetch(N8N_RAG_CLASSIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    console.log('📥 Response status (multi):', response.status);
    console.log('📥 Response headers (multi):', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ n8n webhook error (multi, status ${response.status}):`, errorText);
      return NextResponse.json(
        { error: 'Classification service error', details: errorText },
        { status: 502 }
      );
    }

    // Verifica che la risposta contenga del contenuto prima di parsare
    const responseText = await response.text();
    console.log('📥 Response text length (multi):', responseText?.length || 0);
    console.log('📥 Response text preview (multi):', responseText?.substring(0, 200));

    if (!responseText || responseText.trim() === '') {
      console.error('❌ n8n webhook returned empty response (multi)');
      console.error('Response status was:', response.status);
      console.error('Response headers were:', Object.fromEntries(response.headers.entries()));
      return NextResponse.json(
        { error: 'Classification service returned empty response', details: 'Il servizio di classificazione non ha restituito dati' },
        { status: 502 }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse n8n response (multi):', responseText);
      return NextResponse.json(
        { error: 'Invalid response from classification service', details: parseError.message },
        { status: 502 }
      );
    }

    // Il workflow n8n restituisce: { transactions: [{ suggested: {...}, similar_transactions: [...] }] }
    // Estraiamo i suggerimenti da ogni transazione
    const classifications = result.transactions?.map((transaction) => {
      const classification = transaction?.suggested;
      if (!classification) return null;

      return {
        ...classification,
        id: transaction.original?.id || transaction.id,
        // Se confidence è già > 1, è già in percentuale, altrimenti converti
        confidence: classification.confidence > 1 ? classification.confidence : (classification.confidence || 0) * 100,
        method: classification.method || (classification.confidence >= 85 ? 'rag_direct' : 'llm_analysis'),
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

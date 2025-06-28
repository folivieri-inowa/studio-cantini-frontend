import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileUrl, transactionId, db } = body;

    if (!fileUrl || !transactionId || !db) {
      return NextResponse.json(
        { error: 'FileUrl, transactionId e db sono richiesti' },
        { status: 400 }
      );
    }

    const response = await axios.post(`${BACKEND_API}/v1/file-manager/link-transaction`, {
      fileUrl,
      transactionId,
      db
    });

    return NextResponse.json({ success: true, data: response.data }, { status: 200 });
  } catch (error) {
    console.error('Errore durante l\'associazione del file alla transazione:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'associazione del file alla transazione' },
      { status: error.response?.status || 500 }
    );
  }
}

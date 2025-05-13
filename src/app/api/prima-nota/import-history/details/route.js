import { NextResponse } from 'next/server';

import axios from '../../../../../utils/axios';
import { BACKEND_API } from '../../../../../config-global';

export async function POST(request) {
  const body = await request.json();

  try {
    const response = await axios.post(`${BACKEND_API}/v1/transaction/import-history/details`, body);

    const { data } = response;

    return NextResponse.json({ 
      transactions: data.transactions || []
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch import details data',
      message: error.message
    }, { status: 500 });
  }
}

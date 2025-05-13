import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function POST(request) {
  const body = await request.json();

  try {
    const response = await axios.post(`${BACKEND_API}/v1/transaction/import-history`, body);

    const { data } = response;

    return NextResponse.json({ 
      imports: data.imports || [],
      totalCount: data.totalCount || 0
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch import history data',
      message: error.message
    }, { status: 500 });
  }
}

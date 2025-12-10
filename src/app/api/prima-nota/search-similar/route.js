import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function POST(request) {
  const body = await request.json();

  try {
    const response = await axios.post(`${BACKEND_API}/v1/transaction/search-similar`, body);

    const { data } = response;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('❌ Search similar error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data || 'Failed to search similar transactions' },
      { status: 500 }
    );
  }
}

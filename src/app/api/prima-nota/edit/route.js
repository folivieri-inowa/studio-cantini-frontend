import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function POST(request) {
  const body = await request.json()

  console.log('📝 API /prima-nota/edit received:', body);

  try {
    const response = await axios.post(`${BACKEND_API}/v1/transaction/edit`, body);

    const {data} = response;

    console.log('✅ Backend response:', data);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('❌ Backend error:', error.response?.data || error.message);
    return NextResponse.json({ error: error.response?.data || 'Failed to fetch data' }, { status: 500 });
  }
}

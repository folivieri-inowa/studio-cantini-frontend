import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await axios.post(`${BACKEND_API}/v1/transaction/toggle-stats-exclusion`, body);
    
    const { data } = response;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update stats exclusion' }, { status: 500 });
  }
}

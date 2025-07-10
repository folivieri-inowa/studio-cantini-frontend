import { NextResponse } from 'next/server';

import axios from '../../../../../../utils/axios';
import { BACKEND_API } from '../../../../../../config-global';

export async function POST( request ) {
  const body = await request.json()
  
  console.log('API route ricevuta chiamata con body:', body);

  try {
    const backendUrl = `${BACKEND_API}/v1/report/category/subject/details`;
    console.log('Chiamando backend URL:', backendUrl);
    
    const response = await axios.post(backendUrl, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const {data} = response;
    console.log('Backend response ricevuta:', data);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Errore nella chiamata al backend:', error);
    console.error('Backend response error:', error.response?.data || error.message);
    
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

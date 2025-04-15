import axios from 'axios';
import { NextResponse } from 'next/server';

import { BACKEND_API } from '../../../../config-global';


export async function POST(request) {
  const body = await request.json()
  try {
    const response = await axios.post(`${BACKEND_API}/v1/auth/login`, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return NextResponse.json({ data: response.data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}


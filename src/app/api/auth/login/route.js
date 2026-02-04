import axios from 'axios';
import { NextResponse } from 'next/server';

import { BACKEND_API_INTERNAL } from '../../config-global';


export async function POST(request) {
  const body = await request.json()
  try {
    console.log('Login attempt for:', body.email, 'to backend:', BACKEND_API_INTERNAL);
    const response = await axios.post(`${BACKEND_API_INTERNAL}/v1/auth/login`, body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // Aumentiamo il timeout a 10 secondi
    });
    // Il backend già wrappa in {data: {accessToken, user}}, non serve wrappare di nuovo
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error('Login error:', error.message);
    return NextResponse.json({ error }, { status: 500 });
  }
}


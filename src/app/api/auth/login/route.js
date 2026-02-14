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
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Errore durante il login';

    console.error('Login error:', message);
    return NextResponse.json({ message, status }, { status });
  }
}


import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { BACKEND_API_INTERNAL } from '../../config-global';


export async function GET() {
  const header = await headers()
  const authorization = header.get('authorization')

  if (!authorization) {
    return NextResponse.json({ message: 'Authorization header missing', status: 401 }, { status: 401 });
  }

  try {
    const response = await axios.get(`${BACKEND_API_INTERNAL}/v1/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Errore durante la verifica utente';

    return NextResponse.json({ message, status }, { status });
  }
}


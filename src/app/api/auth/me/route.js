import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { BACKEND_API } from '../../../../config-global';


export async function GET() {
  const header = await headers()
  const authorization = header.get('authorization')

  try {
    const response = await axios.get(`${BACKEND_API}/v1/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    return NextResponse.json({ data: response.data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function GET(request) {
  const {searchParams} = request.nextUrl
  const db = searchParams.get('db')

  try {
    const response = await axios.get(`${BACKEND_API}/v1/subject/${db}`);

    const {data} = response;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json()

  try {
    const response = await axios.post(`${BACKEND_API}/v1/subject/`, body);

    const {data} = response;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

import axios from '../../../../utils/axios';
import { BACKEND_API } from '../../../../config-global';

export async function GET(request ) {
  const {searchParams} = request.nextUrl
  const id = searchParams.get('id')

  try {
    const response = await axios.get(`${BACKEND_API}/v1/transaction/details/${id}`);

    const {data} = response;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

import axios from '../../../../../../utils/axios';
import { BACKEND_API } from '../../../../../../config-global';

export async function POST( request ) {
  const body = await request.json()

  try {
    const response = await axios.post(`${BACKEND_API}/v1/report/category/subject/details`, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const {data} = response;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

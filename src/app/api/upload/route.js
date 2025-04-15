import { NextResponse } from 'next/server';

import axios from '../../../utils/axios';
import { BACKEND_API } from '../../../config-global';

export async function POST(request) {
  const formData = await request.formData()

  try {
    const response = await axios.post(`${BACKEND_API}/v1/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const {data} = response;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

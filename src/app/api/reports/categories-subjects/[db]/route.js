import axios from 'axios';
import { NextResponse } from 'next/server';

import { BACKEND_API } from '../../../../../config-global';

export async function GET(request, { params }) {
  try {
    const { db } = await params;

    // Forward the request to the backend
    const response = await axios.get(`${BACKEND_API}/v1/report/categories-subjects/${db}`);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in categories-subjects API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}

/**
 * API Proxy - Suggested Classification Rules
 * Analizza feedback classificazioni e suggerisce nuove regole
 */

import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const db = searchParams.get('db');
    const minOccurrences = searchParams.get('min_occurrences') || '10';
    const minConsistency = searchParams.get('min_consistency') || '0.80';

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database name required' },
        { status: 400 }
      );
    }

    console.log(`[Suggested Rules] Fetching suggestions for ${db}...`);

    const backendUrl = `${BACKEND_API_URL}/v1/classification/suggested-rules?db=${db}&min_occurrences=${minOccurrences}&min_consistency=${minConsistency}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_TOKEN || 'test-token'}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Suggested Rules] Backend error:', data);
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch suggestions' },
        { status: 200 } // Return 200 to not break frontend
      );
    }

    console.log(`[Suggested Rules] ✅ Found ${data.data?.suggestions?.length || 0} suggestions`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Suggested Rules] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 }
    );
  }
}

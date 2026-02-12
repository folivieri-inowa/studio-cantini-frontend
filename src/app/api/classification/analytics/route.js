/**
 * API Proxy - Classification Analytics
 * Fornisce metriche e analytics del sistema di classificazione
 */

import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const db = searchParams.get('db');
    const days = searchParams.get('days') || '30';

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database name required' },
        { status: 400 }
      );
    }

    console.log(`[Analytics] Fetching analytics for ${db} (${days} days)...`);

    const backendUrl = `${BACKEND_API_URL}/v1/classification/analytics?db=${db}&days=${days}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_TOKEN || 'test-token'}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Analytics] Backend error:', data);
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch analytics' },
        { status: 200 }
      );
    }

    console.log(`[Analytics] ✅ Analytics fetched in ${data.latency_ms}ms`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 }
    );
  }
}

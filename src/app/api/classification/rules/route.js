/**
 * API Proxy - Classification Rules
 * Crea nuove regole di classificazione
 * 
 * SECURITY: Token gestito lato server, non esposto al frontend
 */

import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000';

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.db) {
      return NextResponse.json(
        { success: false, error: 'Database name required' },
        { status: 400 }
      );
    }

    console.log(`[Rules] Creating rule: ${body.rule_name || 'unnamed'}...`);

    const backendUrl = `${BACKEND_API_URL}/v1/classification/rules`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_TOKEN || 'dev-token-change-in-production'}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Rules] Backend error:', data);
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to create rule' },
        { status: 200 }
      );
    }

    console.log(`[Rules] ✅ Rule created successfully`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Rules] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 200 }
    );
  }
}

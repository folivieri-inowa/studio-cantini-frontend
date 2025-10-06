import axios from 'axios';
import { NextResponse } from 'next/server';

import { BACKEND_API } from '../../../../config-global';

export async function POST(request) {
  try {
    // Leggi i dati dal body della richiesta
    const body = await request.json();
    const { db, groupName, selectedCategories, selectedSubjects, selectedDetails, ownerId, year } = body;

    if (!db) {
      return NextResponse.json({ error: 'Database parameter is required' }, { status: 400 });
    }

    if ((!selectedCategories || selectedCategories.length === 0) && 
        (!selectedSubjects || selectedSubjects.length === 0)) {
      return NextResponse.json({ error: 'At least one category or subject must be selected' }, { status: 400 });
    }

    // Chiamata al backend
    const response = await axios.post(`${BACKEND_API}/v1/report/group-aggregation`, {
      db,
      groupName,
      selectedCategories,
      selectedSubjects,
      selectedDetails,
      ownerId,
      year
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in group-aggregation API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}

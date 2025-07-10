'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

export default function GroupAggregationTest({ 
  title = "Test Componente", 
  subheader = "Versione test", 
  categories = [], 
  categoriesLoading = false, 
  categoriesError = null, 
  db = "",
  ...other 
}) {
  const [selection] = useState([]);

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
      />
      <Box sx={{ p: 3 }}>
        <Typography variant="body1">
          Test componente - DB: {db}
        </Typography>
        <Typography variant="body2">
          Categorie caricate: {Array.isArray(categories) ? categories.length : 0}
        </Typography>
        <Typography variant="body2">
          Loading: {categoriesLoading ? 'Si' : 'No'}
        </Typography>
        <Typography variant="body2">
          Selezione: {selection.length} elementi
        </Typography>
        {categoriesError && (
          <Typography variant="body2" color="error">
            Errore: {categoriesError.message || 'Errore sconosciuto'}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

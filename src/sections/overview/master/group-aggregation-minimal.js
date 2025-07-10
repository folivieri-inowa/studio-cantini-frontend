'use client';

import React from 'react';
import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

export default function GroupAggregationMinimal({ 
  title = "Test Componente", 
  subheader = "Versione minimale", 
  ...other 
}) {
  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
      />
      <Typography variant="body1" sx={{ p: 2 }}>
        Componente minimale caricato correttamente
      </Typography>
    </Card>
  );
}

GroupAggregationMinimal.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
};

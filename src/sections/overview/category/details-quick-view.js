import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fCurrencyEur } from '../../../utils/format-number';
import ChartColumnMultiple from '../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------


export default function DetailsQuickView({ data, open, onClose }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (data) {
      console.log('DetailsQuickView - Dati ricevuti:', data);
      console.log('DetailsQuickView - Struttura dati:', Object.keys(data || {}));
      console.log('DetailsQuickView - data.data:', data.data);
      console.log('DetailsQuickView - data.data struttura:', Object.keys(data.data || {}));
      
      setDetails(data.data);
    }
  }, [data]);

  // Genera la serie dei dati con colori
  const getChartData = () => {
    if (!details || !details.monthlyTotals) return [];

    const currentYear = details.year || new Date().getFullYear();
    const previousYear = details.prevYear || (currentYear - 1);

    // Create arrays for income and expense data for both years
    const currentYearIncome = Array(12).fill(0);
    const currentYearExpense = Array(12).fill(0);
    const previousYearIncome = Array(12).fill(0);
    const previousYearExpense = Array(12).fill(0);

    // Populate arrays from monthlyTotals
    Object.entries(details.monthlyTotals).forEach(([month, monthData]) => {
      const monthIndex = parseInt(month, 10) - 1; // Convert to 0-based index
      if (monthIndex >= 0 && monthIndex < 12) {
        currentYearIncome[monthIndex] = parseFloat((monthData.income || 0).toFixed(2));
        currentYearExpense[monthIndex] = parseFloat((monthData.expense || 0).toFixed(2));
        previousYearIncome[monthIndex] = parseFloat((monthData.prevIncome || 0).toFixed(2));
        previousYearExpense[monthIndex] = parseFloat((monthData.prevExpense || 0).toFixed(2));
      }
    });

    return [
      {
        name: `Entrate ${currentYear}`,
        data: currentYearIncome,
      },
      {
        name: `Uscite ${currentYear}`,
        data: currentYearExpense,
      },
      {
        name: `Entrate ${previousYear}`,
        data: previousYearIncome,
      },
      {
        name: `Uscite ${previousYear}`,
        data: previousYearExpense,
      },
    ];
  };

  if (!details || !details.details) {
    console.warn('DetailsQuickView - Dati non disponibili o incompleti');
    return null;
  }

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogTitle>
        <Typography variant="h5" gutterBottom>
          Dettaglio spese {details.details?.title || 'N/A'}, per l&#39;anno {details.year || 'N/A'}
        </Typography>
        <Typography variant="h6">
          Spesa media mensile: {fCurrencyEur(details.details?.averageCost || 0)}
        </Typography>
        <Typography variant="h6">
          Totale spesa: {fCurrencyEur(details.details?.totalExpense || 0)}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ py: 3 }}>
          {details && (
            <Grid container spacing={3}>
              <Grid size={12}>
                <ChartColumnMultiple
                  title="Entrate/Uscite confrontate all'anno precedente"
                  categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
                  series={getChartData()}
                />
              </Grid>
            </Grid>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DetailsQuickView.propTypes = {
  data: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};

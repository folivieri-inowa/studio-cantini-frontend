'use client';

import { useMemo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrencyEur } from '../../../utils/format-number';

// ----------------------------------------------------------------------

export default function GroupAggregationModal({ 
  open, 
  onClose, 
  aggregationData, 
  selection = [], 
  categories = [], 
  db 
}) {
  // Prepara i dati per la visualizzazione
  const modalData = useMemo(() => {
    if (!aggregationData || !aggregationData.stats) {
      return null;
    }

    const { stats } = aggregationData;
    const selectedCategoryNames = selection.map(sel => {
      const category = categories.find(cat => cat.id === sel.categoryId);
      return category ? category.name : 'Sconosciuta';
    });

    return {
      selectedCategoryNames,
      stats,
      tableData: [] // Semplificato per ora
    };
  }, [aggregationData, selection, categories]);

  if (!modalData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={24} />
            <Typography variant="h6">Elaborazione dati...</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Sto elaborando i dati dell&apos;aggregazione...
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const { selectedCategoryNames, stats } = modalData;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" component="div">
              Analisi Aggregata
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selection.length} {selection.length === 1 ? 'categoria selezionata' : 'categorie selezionate'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {selectedCategoryNames.slice(0, 3).map((name, index) => (
              <Chip 
                key={index}
                label={name} 
                size="small" 
                variant="outlined"
                color="primary"
              />
            ))}
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Statistiche principali */}
          <Grid container spacing={2}>
            <Grid size={3}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {stats && stats.averageAmount ? fCurrencyEur(stats.averageAmount) : 'N/D'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Media per transazione
                </Typography>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats && stats.totalIncome ? fCurrencyEur(stats.totalIncome) : 'N/D'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Totale Entrate
                </Typography>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats && stats.totalExpenses ? fCurrencyEur(stats.totalExpenses) : 'N/D'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Totale Uscite
                </Typography>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography 
                  variant="h4" 
                  color={stats && (stats.totalIncome - stats.totalExpenses) >= 0 ? 'success.main' : 'error.main'}
                >
                  {stats && stats.totalIncome && stats.totalExpenses ? fCurrencyEur(stats.totalIncome - stats.totalExpenses) : 'N/D'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Delta
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Placeholder per tabella */}
          <Card sx={{ p: 2 }}>
            <Typography variant="h6">Dettaglio Transazioni</Typography>
            <Typography variant="body2" color="text.secondary">
              Tabella dettagliata sarà implementata qui
            </Typography>
          </Card>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

GroupAggregationModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  aggregationData: PropTypes.object,
  selection: PropTypes.array,
  categories: PropTypes.array,
  db: PropTypes.string,
};

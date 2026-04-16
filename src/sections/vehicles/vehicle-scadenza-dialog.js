'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid2';

import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import { RHFSelect } from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';

import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

const TYPE_OPTIONS = ['fattura', 'rata', 'bollo', 'assicurazione', 'revisione', 'altro'];

// ----------------------------------------------------------------------

export default function VehicleScadenzaDialog({ open, onClose, vehicleId, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm({
    defaultValues: {
      subject: '',
      date: '',
      amount: '',
      type: 'altro',
      description: '',
      alert_days: 15,
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await axios.post('/api/scadenziario/create', {
        scadenza: {
          ...values,
          status: 'future',
          vehicle_id: vehicleId,
          source_module: 'vehicle',
        },
      });
      enqueueSnackbar('Scadenza creata');
      onSuccess?.();
      handleClose();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Errore creazione scadenza', { variant: 'error' });
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuova scadenza per il veicolo</DialogTitle>

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid xs={12}>
              <RHFTextField name="subject" label="Soggetto *" />
            </Grid>
            <Grid xs={12} md={6}>
              <RHFTextField name="date" label="Data scadenza *" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid xs={12} md={6}>
              <RHFTextField name="amount" label="Importo (€)" type="number" />
            </Grid>
            <Grid xs={12} md={6}>
              <RHFSelect name="type" label="Tipo">
                {TYPE_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </RHFSelect>
            </Grid>
            <Grid xs={12} md={6}>
              <RHFTextField name="alert_days" label="Giorni anticipo avviso" type="number" />
            </Grid>
            <Grid xs={12}>
              <RHFTextField name="description" label="Descrizione" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Annulla</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Salvataggio...' : 'Crea Scadenza'}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

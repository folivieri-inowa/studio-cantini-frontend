'use client';

import { useEffect, useCallback } from 'react';
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

import { createVehicleIncident, updateVehicleIncident } from 'src/api/vehicles';

// ----------------------------------------------------------------------

const INCIDENT_TYPES = ['sinistro', 'furto', 'danno', 'altro'];
const INCIDENT_STATUSES = ['aperto', 'in_lavorazione', 'chiuso'];

// ----------------------------------------------------------------------

export default function VehicleIncidentDialog({ open, onClose, vehicleId, editItem, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm({
    defaultValues: {
      incident_type: 'sinistro',
      title: '',
      incident_date: '',
      description: '',
      damage_amount: '',
      insurance_claim_number: '',
      status: 'aperto',
      notes: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (editItem) {
      reset({
        incident_type: editItem.incident_type || 'sinistro',
        title: editItem.title || '',
        incident_date: editItem.incident_date || '',
        description: editItem.description || '',
        damage_amount: editItem.damage_amount || '',
        insurance_claim_number: editItem.insurance_claim_number || '',
        status: editItem.status || 'aperto',
        notes: editItem.notes || '',
      });
    } else {
      reset({ incident_type: 'sinistro', title: '', incident_date: '', description: '', damage_amount: '', insurance_claim_number: '', status: 'aperto', notes: '' });
    }
  }, [editItem, reset, open]);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editItem) {
        await updateVehicleIncident(editItem.id, values);
        enqueueSnackbar('Sinistro aggiornato');
      } else {
        await createVehicleIncident({ ...values, vehicle_id: vehicleId });
        enqueueSnackbar('Sinistro aggiunto');
      }
      onSuccess?.();
      handleClose();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Errore', { variant: 'error' });
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editItem ? 'Modifica sinistro' : 'Aggiungi sinistro / evento'}</DialogTitle>

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFSelect name="incident_type" label="Tipo">
                {INCIDENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </RHFSelect>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="incident_date" label="Data *" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={12}>
              <RHFTextField name="title" label="Titolo *" />
            </Grid>
            <Grid size={12}>
              <RHFTextField name="description" label="Descrizione" multiline rows={2} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="damage_amount" label="Danno stimato (€)" type="number" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="insurance_claim_number" label="N. sinistro assicurativo" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFSelect name="status" label="Stato">
                {INCIDENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </RHFSelect>
            </Grid>
            <Grid size={12}>
              <RHFTextField name="notes" label="Note" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Annulla</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

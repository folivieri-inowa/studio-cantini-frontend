'use client';

import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid2';

import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import { useSnackbar } from 'src/components/snackbar';

import { createVehicleMaintenance, updateVehicleMaintenance } from 'src/api/vehicles';

// ----------------------------------------------------------------------

export default function VehicleMaintenanceDialog({ open, onClose, vehicleId, editItem, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm({
    defaultValues: {
      maintenance_type: '',
      title: '',
      maintenance_date: '',
      mileage: '',
      vendor: '',
      amount: '',
      next_due_date: '',
      next_due_mileage: '',
      notes: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (editItem) {
      reset({
        maintenance_type: editItem.maintenance_type || '',
        title: editItem.title || '',
        maintenance_date: editItem.maintenance_date || '',
        mileage: editItem.mileage || '',
        vendor: editItem.vendor || '',
        amount: editItem.amount || '',
        next_due_date: editItem.next_due_date || '',
        next_due_mileage: editItem.next_due_mileage || '',
        notes: editItem.notes || '',
      });
    } else {
      reset({ maintenance_type: '', title: '', maintenance_date: '', mileage: '', vendor: '', amount: '', next_due_date: '', next_due_mileage: '', notes: '' });
    }
  }, [editItem, reset, open]);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editItem) {
        await updateVehicleMaintenance(editItem.id, values);
        enqueueSnackbar('Manutenzione aggiornata');
      } else {
        await createVehicleMaintenance({ ...values, vehicle_id: vehicleId });
        enqueueSnackbar('Manutenzione aggiunta');
      }
      onSuccess?.();
      handleClose();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Errore', { variant: 'error' });
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editItem ? 'Modifica manutenzione' : 'Aggiungi manutenzione'}</DialogTitle>

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="maintenance_type" label="Tipo *" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="title" label="Titolo *" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="maintenance_date" label="Data *" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="mileage" label="Km" type="number" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="vendor" label="Fornitore" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="amount" label="Importo (€)" type="number" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="next_due_date" label="Prossima scadenza" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <RHFTextField name="next_due_mileage" label="Prossimi km" type="number" />
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

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

import { createVehicleTire, updateVehicleTire } from 'src/api/vehicles';
import { updateVehicle } from 'src/api/vehicles';

// ----------------------------------------------------------------------

const TIRE_TYPES = ['estivi', 'invernali', '4stagioni'];
const CONDITION_OPTIONS = ['buono', 'usura', 'da_sostituire'];
const ASSIGNEE_TYPES = ['dipendente', 'collaboratore', 'ufficio', 'altro'];
const AVAILABILITY_OPTIONS = ['aziendale', 'uso_misto', 'personale'];

// ----------------------------------------------------------------------

// Multi-mode dialog: handles tires (mode='tires') and assignment (mode='assignment')
export default function VehicleAssignmentDialog({ open, onClose, vehicleId, vehicle, mode = 'assignment', editItem, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm({
    defaultValues:
      mode === 'tires'
        ? { tire_type: 'estivi', brand: '', model: '', size: '', install_date: '', mileage_at_install: '', storage_location: '', condition: '', notes: '' }
        : { assignee_type: '', assignee_name: '', assignment_notes: '', availability_type: '' },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (mode === 'tires' && editItem) {
      reset({
        tire_type: editItem.tire_type || 'estivi',
        brand: editItem.brand || '',
        model: editItem.model || '',
        size: editItem.size || '',
        install_date: editItem.install_date || '',
        mileage_at_install: editItem.mileage_at_install || '',
        storage_location: editItem.storage_location || '',
        condition: editItem.condition || '',
        notes: editItem.notes || '',
      });
    } else if (mode === 'assignment' && vehicle) {
      reset({
        assignee_type: vehicle.assignee_type || '',
        assignee_name: vehicle.assignee_name || '',
        assignment_notes: vehicle.assignment_notes || '',
        availability_type: vehicle.availability_type || '',
      });
    }
  }, [editItem, vehicle, mode, reset, open]);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (mode === 'tires') {
        if (editItem) {
          await updateVehicleTire(editItem.id, values);
          enqueueSnackbar('Pneumatici aggiornati');
        } else {
          await createVehicleTire({ ...values, vehicle_id: vehicleId });
          enqueueSnackbar('Pneumatici aggiunti');
        }
      } else {
        await updateVehicle(vehicleId || vehicle?.id, values);
        enqueueSnackbar('Assegnazione aggiornata');
      }
      onSuccess?.();
      handleClose();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Errore', { variant: 'error' });
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'tires' ? (editItem ? 'Modifica pneumatici' : 'Aggiungi pneumatici') : 'Modifica assegnazione'}
      </DialogTitle>

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {mode === 'tires' ? (
              <>
                <Grid xs={12} md={6}>
                  <RHFSelect name="tire_type" label="Tipo">
                    {TIRE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </RHFSelect>
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="size" label="Misura (es. 205/55R16)" />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="brand" label="Marca" />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="model" label="Modello" />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="install_date" label="Data montaggio" type="date" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="mileage_at_install" label="Km al montaggio" type="number" />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="storage_location" label="Deposito" />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFSelect name="condition" label="Condizione">
                    <MenuItem value="">—</MenuItem>
                    {CONDITION_OPTIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </RHFSelect>
                </Grid>
                <Grid xs={12}>
                  <RHFTextField name="notes" label="Note" multiline rows={2} />
                </Grid>
              </>
            ) : (
              <>
                <Grid xs={12} md={6}>
                  <RHFSelect name="assignee_type" label="Tipo assegnatario">
                    <MenuItem value="">—</MenuItem>
                    {ASSIGNEE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </RHFSelect>
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="assignee_name" label="Assegnatario" />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFSelect name="availability_type" label="Disponibilità">
                    <MenuItem value="">—</MenuItem>
                    {AVAILABILITY_OPTIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                  </RHFSelect>
                </Grid>
                <Grid xs={12}>
                  <RHFTextField name="assignment_notes" label="Note assegnazione" multiline rows={2} />
                </Grid>
              </>
            )}
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

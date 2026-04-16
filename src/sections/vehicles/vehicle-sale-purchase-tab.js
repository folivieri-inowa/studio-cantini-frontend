'use client';

import { useForm } from 'react-hook-form';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import { useSnackbar } from 'src/components/snackbar';

import { updateVehicle } from 'src/api/vehicles';

// ----------------------------------------------------------------------

export default function VehicleSalePurchaseTab({ vehicle, onMutate }) {
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm({
    defaultValues: {
      purchase_date: vehicle.purchase_date || '',
      purchase_vendor: vehicle.purchase_vendor || '',
      purchase_amount: vehicle.purchase_amount || '',
      purchase_notes: vehicle.purchase_notes || '',
      disposal_date: vehicle.disposal_date || '',
      disposal_buyer: vehicle.disposal_buyer || '',
      disposal_amount: vehicle.disposal_amount || '',
      disposal_reason: vehicle.disposal_reason || '',
      disposal_notes: vehicle.disposal_notes || '',
    },
  });

  const { handleSubmit, formState: { isSubmitting, isDirty } } = methods;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateVehicle(vehicle.id, values);
      enqueueSnackbar('Dati aggiornati');
      onMutate?.();
    } catch {
      enqueueSnackbar('Errore aggiornamento', { variant: 'error' });
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader title="Acquisto" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <RHFTextField name="purchase_date" label="Data acquisto" type="date" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="purchase_amount" label="Importo (€)" type="number" />
                </Grid>
                <Grid xs={12}>
                  <RHFTextField name="purchase_vendor" label="Venditore" />
                </Grid>
                <Grid xs={12}>
                  <RHFTextField name="purchase_notes" label="Note acquisto" multiline rows={2} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card>
            <CardHeader title="Dismissione / Vendita" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <RHFTextField name="disposal_date" label="Data dismissione" type="date" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid xs={12} md={6}>
                  <RHFTextField name="disposal_amount" label="Importo (€)" type="number" />
                </Grid>
                <Grid xs={12}>
                  <RHFTextField name="disposal_buyer" label="Acquirente" />
                </Grid>
                <Grid xs={12}>
                  <RHFTextField name="disposal_reason" label="Motivo dismissione" />
                </Grid>
                <Grid xs={12}>
                  <RHFTextField name="disposal_notes" label="Note dismissione" multiline rows={2} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12}>
          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

'use client';

import * as Yup from 'yup';
import { useParams } from 'next/navigation';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFSelect,
} from 'src/components/hook-form';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useGetScadenziarioItem } from 'src/api/scadenziario-services';
import { calculateScadenziarioStatus } from '../scadenziario-utils';

// ----------------------------------------------------------------------

export function ScadenziarioEditView() {
  const router = useRouter();
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();

  const { id } = params;

  const [openConfirm, setOpenConfirm] = useState(false);

  const { scadenziarioItem, scadenziarioItemLoading } = useGetScadenziarioItem(id);

  const NewScadenziarioSchema = Yup.object().shape({
    subject: Yup.string().required('Soggetto richiesto'),
    description: Yup.string().required('Descrizione richiesta'),
    causale: Yup.string().required('Causale richiesta'),
    date: Yup.date().required('Data scadenza richiesta'),
    amount: Yup.number().moreThan(0, 'Il valore deve essere maggiore di 0').required('Importo richiesto'),
    paymentDate: Yup.date().nullable(),
    status: Yup.string().required('Stato richiesto'),
  });

  const defaultValues = useMemo(
    () => ({
      subject: scadenziarioItem?.subject || '',
      description: scadenziarioItem?.description || '',
      causale: scadenziarioItem?.causale || '',
      date: scadenziarioItem?.date ? new Date(scadenziarioItem.date) : new Date(),
      amount: scadenziarioItem?.amount || 0,
      paymentDate: scadenziarioItem?.paymentDate ? new Date(scadenziarioItem.paymentDate) : null,
      status: scadenziarioItem?.status || 'future',
    }),
    [scadenziarioItem]
  );

  const methods = useForm({
    resolver: yupResolver(NewScadenziarioSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (scadenziarioItem) {
      reset(defaultValues);
    }
  }, [scadenziarioItem, defaultValues, reset]);

  const handleOpenConfirm = () => {
    setOpenConfirm(true);
  };

  const handleCloseConfirm = () => {
    setOpenConfirm(false);
  };

  const handleCancel = () => {
    router.push(paths.dashboard.scadenziario.root);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Salvataggio dei dati tramite API
      const { updateScadenziario } = await import('../../../api/scadenziario-services');
      await updateScadenziario(id, data);
      
      enqueueSnackbar('Scadenza modificata con successo!');
      router.push(paths.dashboard.scadenziario.root);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Si è verificato un errore durante il salvataggio!', { variant: 'error' });
    }
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Modifica Scadenza"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Scadenziario',
            href: paths.dashboard.scadenziario.root,
          },
          { name: scadenziarioItem?.description },
          { name: 'Modifica' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.scadenziario.root}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Torna all'elenco
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {scadenziarioItemLoading ? (
        <Typography>Caricamento in corso...</Typography>
      ) : (
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <Box
                  rowGap={3}
                  columnGap={2}
                  display="grid"
                  gridTemplateColumns={{
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                  }}
                >
                  <RHFTextField name="subject" label="Soggetto" />
                  <RHFTextField name="description" label="Descrizione" />
                  
                  <RHFTextField name="causale" label="Causale" />
                  
                  <Controller
                    name="date"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="Data scadenza"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(newValue) => {
                          field.onChange(newValue);
                          if (newValue && !values.paymentDate) {
                            // Aggiorna lo stato in base alla nuova data
                            const newStatus = calculateScadenziarioStatus(newValue, null);
                            setValue('status', newStatus);
                          }
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!error,
                            helperText: error?.message,
                          },
                        }}
                      />
                    )}
                  />
                  
                  <RHFTextField name="amount" label="Importo" type="number" />
                  
                  <Controller
                    name="paymentDate"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="Data pagamento"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(newValue) => {
                          field.onChange(newValue);
                          // Se viene inserita una data di pagamento, imposta lo stato su 'completed'
                          if (newValue) {
                            setValue('status', 'completed');
                          } else {
                            const newStatus = calculateScadenziarioStatus(values.date, null);
                            setValue('status', newStatus);
                          }
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!error,
                            helperText: error?.message,
                          },
                        }}
                      />
                    )}
                  />
                  
                  <RHFSelect name="status" label="Stato pagamento">
                    <option value="completed">Pagato</option>
                    <option value="overdue">Scaduto</option>
                    <option value="upcoming">In scadenza</option>
                    <option value="future">Da pagare</option>
                  </RHFSelect>
                </Box>

                <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                  <Stack direction="row" spacing={2}>
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      onClick={handleOpenConfirm}
                    >
                      Annulla
                    </Button>

                    <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                      Salva modifiche
                    </LoadingButton>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </FormProvider>
      )}

      <ConfirmDialog
        open={openConfirm}
        onClose={handleCloseConfirm}
        title="Annulla"
        content="Sei sicuro di voler annullare le modifiche?"
        action={
          <Button variant="contained" color="error" onClick={handleCancel}>
            Annulla modifiche
          </Button>
        }
      />
    </Container>
  );
}

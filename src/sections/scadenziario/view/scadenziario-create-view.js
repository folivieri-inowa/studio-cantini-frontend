'use client';

import * as Yup from 'yup';
import { useMemo } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSnackbar } from 'src/components/snackbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import FormProvider, {
  RHFSelect,
  RHFTextField,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function ScadenziarioCreateView() {
  const router = useRouter();

  const settings = useSettingsContext();

  const { enqueueSnackbar } = useSnackbar();

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
      subject: '',
      description: '',
      causale: '',
      date: new Date(),
      amount: 0,
      paymentDate: null,
      status: calculateDefaultStatus(new Date()),
    }),
    []
  );
  
  // Funzione per calcolare lo stato predefinito in base alla data di scadenza
  function calculateDefaultStatus(dueDate) {
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'overdue'; // Scaduto
    } if (diffDays <= 15) {
      return 'upcoming'; // In scadenza
    } 
      return 'future'; // Da pagare (futuro)
    
  }

  const methods = useForm({
    resolver: yupResolver(NewScadenziarioSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Salvataggio dei dati tramite API
      const { createScadenziario } = await import('../../../api/scadenziario-services');
      await createScadenziario(data);
      
      reset();
      enqueueSnackbar('Scadenza creata con successo!');
      router.push(paths.dashboard.scadenziario.root);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Si è verificato un errore durante il salvataggio!', { variant: 'error' });
    }
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Nuovo scadenziario"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Scadenziario',
            href: paths.dashboard.scadenziario.root,
          },
          { name: 'Nuovo' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

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
                  control={methods.control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Data scadenza"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        if (newValue) {
                          // Aggiorna lo stato in base alla nuova data
                          const newStatus = calculateDefaultStatus(newValue);
                          methods.setValue('status', newStatus);
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
                  control={methods.control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Data pagamento"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        // Se viene inserita una data di pagamento, imposta lo stato su 'completed'
                        if (newValue) {
                          methods.setValue('status', 'completed');
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
                <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                  Salva
                </LoadingButton>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </FormProvider>
    </Container>
  );
}

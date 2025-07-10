'use client';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetScadenziarioItem } from 'src/api/scadenziario-services';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFTextField,
} from 'src/components/hook-form';

import { calculateScadenziarioStatus } from './scadenziario-utils';

// ----------------------------------------------------------------------

export default function ScadenziarioEditModal({ id, open, onClose, onEdited }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

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

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Salvataggio dei dati tramite API
      const { updateScadenziario } = await import('../../api/scadenziario-services');
      await updateScadenziario(id, data);
      
      enqueueSnackbar('Scadenza modificata con successo!');
      onEdited && onEdited();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Si è verificato un errore durante il salvataggio!', { variant: 'error' });
    }
  });

  return (
    <Dialog 
      fullScreen={fullScreen}
      fullWidth 
      maxWidth="md" 
      open={open} 
      onClose={handleClose}
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: 'calc(100% - 64px)' }
      }}
    >
      <DialogTitle sx={{ p: 3 }}>
        <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <Iconify icon="solar:pen-bold" sx={{ mr: 1, width: 24, height: 24, color: 'primary.main' }} />
          Modifica Scadenza
        </Typography>
        {scadenziarioItem && (
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            {scadenziarioItem.description}
          </Typography>
        )}
      </DialogTitle>
      
      <Divider sx={{ borderStyle: 'dashed' }} />
      
      {scadenziarioItemLoading ? (
        <Box sx={{ py: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <DialogContent sx={{ p: 3 }}>
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
              
              <RHFSelect 
                name="status" 
                label="Stato pagamento" 
                disabled
                InputProps={{
                  sx: { backgroundColor: 'background.neutral', opacity: 0.8 }
                }}
                helperText="Lo stato viene aggiornato automaticamente in base alla data di pagamento"
              >
                <option value="completed">Pagato</option>
                <option value="overdue">Scaduto</option>
                <option value="upcoming">In scadenza</option>
                <option value="future">Da pagare</option>
              </RHFSelect>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2 }}>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={handleClose}
              startIcon={<Iconify icon="eva:close-fill" />}
            >
              Annulla
            </Button>
            
            <LoadingButton 
              type="submit" 
              variant="contained" 
              loading={isSubmitting}
              startIcon={<Iconify icon="eva:checkmark-fill" />}
            >
              Salva modifiche
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      )}
    </Dialog>
  );
}
